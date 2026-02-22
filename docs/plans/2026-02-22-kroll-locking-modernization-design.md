# Kroll Locking Modernization Design

**Date:** 2026-02-22
**Target:** iOS 16+ (all modern GCD APIs available)
**Approach:** Replace all legacy locking primitives with GCD dispatch queues

## Problem

The Kroll/TitaniumKit iOS layer uses a mix of legacy locking primitives:
- `pthread_mutex_t` (recursive) — 3 uses
- `pthread_rwlock_t` — 5 uses
- `NSLock` — 1 use
- `NSRecursiveLock` — 2 uses
- `NSCondition` — 3 uses
- `OSAtomic` (deprecated) — 2 uses

These are inconsistent, lack debuggability, and require manual lifecycle management (init/destroy). One existing bug: double-unlock in `KrollEval.invoke:` (lines 513-523 of KrollContext.m).

## Solution

Replace all locking with GCD dispatch queues, which are Apple's recommended concurrency primitive. Keep `os_unfair_lock` in KrollBridge (already modern).

## Replacement Strategy

### 1. KrollEntryLock (KrollContext.m)

**Current:** Static recursive `pthread_mutex_t` serializing all JS context access.

**New:** Serial dispatch queue with re-entrancy via `dispatch_queue_set_specific`.

```objc
static dispatch_queue_t krollEntryQueue;
static void *krollEntryQueueKey = &krollEntryQueueKey;

// +initialize
krollEntryQueue = dispatch_queue_create("org.appcelerator.kroll.entry", DISPATCH_QUEUE_SERIAL);
dispatch_queue_set_specific(krollEntryQueue, krollEntryQueueKey, krollEntryQueueKey, NULL);

// Re-entrant lock helper
static inline void KrollEntryLockPerform(dispatch_block_t block) {
    if (dispatch_get_specific(krollEntryQueueKey) == krollEntryQueueKey) {
        block();
    } else {
        dispatch_sync(krollEntryQueue, block);
    }
}
```

Also fixes the double-unlock bug in `KrollEval.invoke:`.

### 2. pthread_rwlock_t → Concurrent Dispatch Queues

**Files:** TiProxy (listenerLock, dynpropsLock), TiViewProxy (childrenLock), ObjcProxy (_listenerLock)

```objc
dispatch_queue_t queue = dispatch_queue_create("label", DISPATCH_QUEUE_CONCURRENT);

// Read: dispatch_sync(queue, ^{ ... });
// Write: dispatch_barrier_sync(queue, ^{ ... });
```

No manual init/destroy needed.

### 3. NSLock / NSRecursiveLock → Serial Dispatch Queues

**Files:** KrollCallback.m, ImageLoader.m, TiViewProxy.h

- `NSLock` → simple serial dispatch queue
- `NSRecursiveLock` → serial queue with `dispatch_queue_set_specific` for re-entrancy

### 4. NSCondition → dispatch_semaphore_t

**Files:** KrollInvocation (KrollContext.h/.m), TiUIWindowProxy.m

- `[condition signal]` → `dispatch_semaphore_signal(sem)`
- `[condition wait]` → `dispatch_semaphore_wait(sem, timeout)`

### 5. OSAtomic → stdatomic.h

**File:** TiProxy.m/h

```objc
#include <stdatomic.h>
atomic_int bridgeCount;
atomic_fetch_add(&bridgeCount, 1);
atomic_fetch_sub(&bridgeCount, 1);
```

### 6. KrollBridge — No Changes

Already uses `os_unfair_lock`. No changes needed.

## Files Affected

| File | Changes |
|------|---------|
| KrollContext.m | pthread_mutex → serial dispatch queue; fix double-unlock bug |
| KrollContext.h | NSCondition in KrollInvocation → dispatch_semaphore_t |
| KrollCallback.m | NSLock → serial dispatch queue |
| TiProxy.h | pthread_rwlock_t → dispatch_queue_t; int → atomic_int |
| TiProxy.m | rwlock calls → dispatch; OSAtomic → stdatomic |
| TiViewProxy.h | pthread_rwlock_t → dispatch_queue_t; NSRecursiveLock → dispatch queue |
| TiViewProxy.m | rwlock/NSRecursiveLock → dispatch equivalents |
| ObjcProxy.h | pthread_rwlock_t → dispatch_queue_t |
| ObjcProxy.m | rwlock calls → dispatch equivalents |
| ImageLoader.h | NSRecursiveLock → dispatch_queue_t |
| ImageLoader.m | NSRecursiveLock → dispatch queue with re-entrancy |
| TiLayoutQueue.m | pthread_mutex → serial dispatch queue |
| TiUIWindowProxy.m | NSCondition → dispatch_semaphore_t |

## Risks

- Behavioral change if any code relies on lock-ordering side effects
- Re-entrancy guard must be tested thoroughly for KrollEntryLock
- Layout timer interaction in TiLayoutQueue needs careful testing
