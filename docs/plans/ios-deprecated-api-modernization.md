# iOS Deprecated API Modernisierungsplan

## Überblick

Reduktion der verbleibenden 13 Build-Warnings auf 0 durch Modernisierung deprecated APIs mit voller Backwards-Kompatibilität.

**Aktueller Stand:** 13 Warnings (~96.3% Reduktion von ~350)  
**Ziel:** 0 Warnings  
**Betroffene Dateien:** TiApp.h, TopTiModule.h, TiWindowProxy.m, TiUtils.m, Webcolor.m, TiBindingRunLoop.m

---

## Phase A: Triviale Fixes (30 Min)

### A1. TiApp.h:41 — C function prototype

**Problem:** `waitForMemoryPanicCleared()` ohne `void`-Parameterliste  
**Lösung:** `waitForMemoryPanicCleared()` → `waitForMemoryPanicCleared(void)`

```objc
// ALT:
TI_INLINE void waitForMemoryPanicCleared()

// NEU:
TI_INLINE void waitForMemoryPanicCleared(void)
```

### A2. TopTiModule.h:15 — Property attribute

**Problem:** Property hat kein `nonatomic`/`retain` Attribut  
**Lösung:** `READONLY_PROPERTY` Makro um `(nonatomic)` erweitern

```objc
// ALT (ObjcProxy.h):
#define READONLY_PROPERTY(TYPE, LOWER, UPPER) \
  CONSTANT(TYPE, LOWER);

// NEU:
#define READONLY_PROPERTY(TYPE, LOWER, UPPER) \
  @property (nonatomic, readonly) TYPE LOWER;
```

### A3. TiWindowProxy.m:312 — UIStatusBarStyle → int

**Problem:** Enum-to-int Konvertierung ohne expliziten Cast  
**Lösung:** `assignStatusBarStyle`-Signatur auf `UIStatusBarStyle` ändern

```objc
// ALT:
- (void)assignStatusBarStyle:(int)style

// NEU:
- (void)assignStatusBarStyle:(UIStatusBarStyle)style
```

---

## Phase B: @available statt respondsToSelector (1 Std)

### B1. TiUtils.m:1801 — setContentInsetAdjustmentBehavior

**Problem:** `respondsToSelector:` erzeugt Warning, weil Compiler iOS 11+ API nicht kennt  
**Lösung:** `@available(iOS 11.0, *)` statt `respondsToSelector:`

```objc
// ALT:
if ([controller respondsToSelector:@selector(setContentInsetAdjustmentBehavior:)]) {
  [controller setContentInsetAdjustmentBehavior:...];
} else {
  [controller setAutomaticallyAdjustsScrollViewInsets:...];
}

// NEU:
if (@available(iOS 11.0, *)) {
  [controller setContentInsetAdjustmentBehavior:...];
} else {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  [controller setAutomaticallyAdjustsScrollViewInsets:...];
#pragma clang diagnostic pop
}
```

**Vorteile von @available:**
- Compiler kennt die Bedingung → keine "may not respond" Warnings
- Bessere Optimierung (compiler kann else-Zweig wegoptimieren)
- Klare Intent-Dokumentation

### B2. Webcolor.m:79,81 — groupTableViewBackgroundColor

**Problem:** `respondsToSelector:` für iOS 13+ API  
**Lösung:** `@available(iOS 13.0, *)`

```objc
// ALT:
@"stripped" : ([UIColor respondsToSelector:@selector(systemGroupedBackgroundColor)])
    ? UIColor.systemGroupedBackgroundColor : UIColor.groupTableViewBackgroundColor,

// NEU:
@"stripped" : (@available(iOS 13.0, *))
    ? UIColor.systemGroupedBackgroundColor : UIColor.groupTableViewBackgroundColor,
```

---

## Phase C: #pragma für bewusste Fallbacks (30 Min)

### C1. TiUtils.m:45,63,79,87 — keyWindow/statusBar APIs

**Problem:** Helper-Funktionen verwenden deprecated APIs als Fallback für Pre-iOS-13  
**Lösung:** `#pragma clang diagnostic ignored "-Wdeprecated-declarations"` um Fallback-Blöcke

```objc
static UIWindow *TiKeyWindow(void)
{
  for (UIWindowScene *scene in [UIApplication sharedApplication].connectedScenes) {
    if (scene.activationState == UISceneActivationStateForegroundActive) {
      if (scene.keyWindow) { return scene.keyWindow; }
    }
  }
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
  return [UIApplication sharedApplication].keyWindow; // bewachter Fallback
#pragma clang diagnostic pop
}
```

**Begründung:** Multi-Scene-Logik ist bereits vorhanden, Fallback ist bewusst und dokumentiert.

### C2. TiUtils.m:2079 — CC_MD5

**Problem:** `CC_MD5` wird als deprecated gemeldet (bekannter Xcode-Warnfehler)  
**Lösung:** `#pragma clang diagnostic ignored "-Wdeprecated-declarations"` um die Funktion

```objc
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
CC_MD5([data bytes], (CC_LONG)[data length], result);
#pragma clang diagnostic pop
```

---

## Phase D: OSAtomicComplete (1 Std)

### D1. TiBindingRunLoop.m:69 — OSAtomicCompareAndSwapPtrBarrier

**Problem:** `OSAtomicCompareAndSwapPtrBarrier` seit iOS 10 deprecated  
**Lösung:** `_Atomic TiCallbackPayloadNode` + `atomic_compare_exchange_strong`

```objc
// Header (TiBindingRunLoop.h):
_Atomic TiCallbackPayloadNode RunLoopCallOnStartQueue;

// Implementation:
void TiCallbackPayloadAppendList(TiCallbackPayloadNode *queue, TiCallbackPayloadNode newPair)
{
  TiCallbackPayloadNode oldHead;
  do {
    oldHead = atomic_load((atomic_load_explicit)((volatile void*)queue, memory_order_relaxed));
    newPair->next = oldHead;
  } while (!atomic_compare_exchange_strong(queue, &oldHead, newPair));
}
```

---

## Strategie-Empfehlungen

### @available vs respondsToSelector

| Kriterium | @available | respondsToSelector |
|-----------|-----------|-------------------|
| Compiler-Warnings | ✅ Keine | ❌ Kann warnings erzeugen |
| Runtime-Overhead | ✅ Null (compile-time) | ❌ Method call |
| iOS < Zielversion | ✅ Kompilierzeit-Check | ✅ Runtime-Check |
| Lesbarkeit | ✅ Klarer Intent | ⚠️ Weniger eindeutig |

**Empfehlung:** `@available` bevorzugen, wo Deployment Target es erlaubt.

### #pragma für Fallbacks

Wo ein Fallback auf deprecated APIs bewusst und dokumentiert ist (keyWindow, statusBarFrame, CC_MD5), reicht `#pragma clang diagnostic push/ignored/pop`.

### @available für neue APIs

Für `setContentInsetAdjustmentBehavior` und `systemGroupedBackgroundColor` ist `@available` die sauberere Lösung als `respondsToSelector:`.

---

## Erwartetes Ergebnis

| Phase | Warnings vor | Warnings nach | Reduktion |
|-------|-------------|---------------|-----------|
| Start | 13 | — | — |
| Phase A | 13 | 7 | -6 |
| Phase B | 7 | 3 | -4 |
| Phase C | 3 | 1 | -2 |
| Phase D | 1 | 0 | -1 |
| **Ende** | **13** | **0** | **100%** |

---

## Abhängigkeiten

- Phase A kann parallel durchgeführt werden
- Phase B hängt von Phase A ab (TiWindowProxy.m Changes)
- Phase C ist unabhängig
- Phase D ist unabhängig

## Offene Fragen

1. **Deployment Target:** Welches minimale iOS wird unterstützt? (`@available` benötigt korrektes Deployment Target)
2. **CC_MD5 Migration:** Soll `CC_MD5` langfristig durch `CC_SHA256` ersetzt werden? (API-breaking change)
3. **TiRootViewController.m:** 10+ statusBar/kind Warnings nicht im Plan — bewusst ausser Scope oder später behandeln?
