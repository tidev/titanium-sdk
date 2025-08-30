/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_USE_AUTOLAYOUT

#import "TiLayoutQueue.h"
#import "TiViewProxy.h"
#import <CoreFoundation/CoreFoundation.h>
#import <dispatch/dispatch.h>
#import <os/lock.h>

#define LAYOUT_TIMER_INTERVAL 0.05
#define LAYOUT_START_INTERVAL 0.01

static NSMutableArray *layoutArray = nil;
static dispatch_source_t layoutTimer = NULL;
static os_unfair_lock layoutLock = OS_UNFAIR_LOCK_INIT;

@implementation TiLayoutQueue

+ (void)initialize
{
  // nothing to initialize; layoutLock is static-initialized
}

+ (void)resetQueue
{
  os_unfair_lock_lock(&layoutLock);
  [layoutArray release];
  layoutArray = nil;

  if (layoutTimer != NULL) {
    dispatch_source_cancel(layoutTimer);
    layoutTimer = NULL;
  }

  os_unfair_lock_unlock(&layoutLock);
}

+ (void)layoutProxy:(TiViewProxy *)thisProxy
{
  if ([thisProxy viewAttached]) {
    [thisProxy layoutChildrenIfNeeded];
  } else {
    [thisProxy refreshView:nil];
  }
}

+ (void)addViewProxy:(TiViewProxy *)newViewProxy
{
  os_unfair_lock_lock(&layoutLock);

  if (layoutArray == nil) {
    layoutArray = [[NSMutableArray alloc] initWithObjects:newViewProxy, nil];
  } else if ([layoutArray containsObject:newViewProxy]) { // Nothing to do here. Already added.
    os_unfair_lock_unlock(&layoutLock);
    return;
  } else if ([layoutArray containsObject:[newViewProxy parent]]) { // For safety reasons, we do add this to the list. But since the parent's already here,
    // We add it to the FIRST so that children draw before parents, giving us good layout values for later!
    [layoutArray insertObject:newViewProxy atIndex:0];
  } else { // We might be someone's parent... but that means that children should draw FIRST.
    // This is because in many cases, parent size is determined by child size (e.g. auto, vert. layout, etc.)
    [layoutArray addObject:newViewProxy];
  }

  if (layoutTimer == NULL) {
    // create GCD timer on main queue to coalesce layout flushes
    dispatch_queue_t queue = dispatch_get_main_queue();
    layoutTimer = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);
    uint64_t startNsec = (uint64_t)(LAYOUT_START_INTERVAL * NSEC_PER_SEC);
    uint64_t intervalNsec = (uint64_t)(LAYOUT_TIMER_INTERVAL * NSEC_PER_SEC);
    dispatch_source_set_timer(layoutTimer,
        dispatch_time(DISPATCH_TIME_NOW, startNsec),
        intervalNsec,
        (uint64_t)(0.001 * NSEC_PER_SEC)); // 1ms leeway

    dispatch_source_set_event_handler(layoutTimer, ^{
      NSArray *localLayoutArray = nil;
      os_unfair_lock_lock(&layoutLock);
      localLayoutArray = layoutArray;
      layoutArray = nil;
      BOOL shouldStop = (localLayoutArray == nil) || ([localLayoutArray count] == 0);
      os_unfair_lock_unlock(&layoutLock);

      for (TiViewProxy *thisProxy in localLayoutArray) {
        [TiLayoutQueue layoutProxy:thisProxy];
      }
      RELEASE_TO_NIL(localLayoutArray);

      if (shouldStop) {
        // no queued work: stop timer to save cycles
        dispatch_source_cancel(layoutTimer);
        layoutTimer = NULL;
      }
    });
    dispatch_resume(layoutTimer);
  }
  os_unfair_lock_unlock(&layoutLock);
}

@end

#endif
