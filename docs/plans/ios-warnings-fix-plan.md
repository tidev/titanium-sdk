# iOS Build Warnings — Fix Plan

**Erstellt:** 2026-05-29  
**SDK-Version:** 13.3.0  
**Xcode SDK:** iPhoneSimulator26.2 / iPhoneOS26.2 / macOS26.2  
**Build-Status:** ✅ Erfolgreich (350+ Warnings)

---

## Übersicht

Der iOS-Build von TitaniumKit erzeugt ca. **350+ Warnings** über 3 Zielplattformen (iPhoneOS arm64, iPhoneSimulator, Mac Catalyst). Die Warnings lassen sich in 6 Kategorien einteilen:

| # | Kategorie | Anzahl | Priorität |
|---|---|---|---|
| 1 | UIKit `keyWindow` deprecated (iOS 13+) | ~6 | Hoch |
| 2 | UIKit `statusBar*` deprecated (iOS 13+) | ~10 | Hoch |
| 3 | `CC_MD5` kryptografisch gebrochen (iOS 13+) | 1 | Hoch |
| 4 | OSAtomic* deprecated (iOS 10+) | ~35 | Mittel |
| 5 | UTType APIs deprecated (iOS 15+) | ~8 | Mittel |
| 6 | Type conversions / sonstige | ~15 | Niedrig |

---

## Fix-Strategie

### Phase 1 — Hochpriorität (Security & Multi-Scene)

#### Task 1.1: `CC_MD5` → SHA256 Migration
**Datei:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiUtils.m:2011`

**Aktuell:**
```objc
CC_MD5(dataBytes, (CC_LONG)dataLength, digest);
```

**Neu:**
```objc
#include <CommonCrypto/CommonDigest.h>
// ...
uint8_t digest[CC_SHA256_DIGEST_LENGTH];
CC_SHA256(dataBytes, (CC_LONG)dataLength, digest);
```

**Betrifft:** Alle Aufrufer von `TiUtils.md5()` müssen prüfen, ob die API-Rückgabe sich ändert (32-Byte Hex-String bleibt gleich, nur interne Implementierung ändert sich).

**Abwärtskompatibilität:** ✅ Keine Änderung der API-Signatur oder des Rückgabewerts.

---

#### Task 1.2: `keyWindow` → Multi-Scene Adapter
**Dateien:**
- `TiUtils.m:1279`
- `TiViewController.m:129`
- `TiUIWindowProxy.m:1077`

**Aktuell:**
```objc
CGRect f = UIApplication.sharedApplication.keyWindow.frame;
```

**Neu:**
```objc
UIWindowScene *activeScene = nil;
for (UIWindowScene *scene in UIApplication.sharedApplication.connectedScenes) {
    if (scene.activationState == UISceneActivationStateForegroundForeground) {
        activeScene = scene;
        break;
    }
}
UIWindow *keyWindow = activeScene ? activeScene.keyWindow : nil;
```

**Empfohlene Lösung:** Eine zentrale Helper-Funktion `TiKeyWindow()` in einer neuen oder bestehenden Utility-Datei erstellen und alle Stellen damit ersetzen.

**Abwärtskompatibilität:** ✅ Fallback auf `keyWindow` bei älteren iOS-Versionen.

---

#### Task 1.3: `statusBar*` APIs → `UIWindowScene.statusBarManager`
**Dateien:**
- `TiUtils.m:1274,1275` — `isStatusBarHidden`, `statusBarFrame`
- `TiWindowProxy.m:566` — `statusBarOrientation`
- `TiUIWindow.m:39` — `statusBarOrientationAnimationDuration`
- `TiUIWindowProxy.m:1163,1188,259` — `statusBarOrientation`, `statusBarOrientationAnimationDuration`

**Aktuell:**
```objc
BOOL hidden = [UIApplication sharedApplication].isStatusBarHidden;
CGRect frame = [UIApplication sharedApplication].statusBarFrame;
UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;
```

**Neu:**
```objc
// isStatusBarHidden / statusBarFrame
UIWindowScene *scene = /* active scene */;
CGRect frame = scene.statusBarManager?.frame ?? CGRectZero;
BOOL hidden = scene.statusBarManager?.frame.size.height == 0;

// statusBarOrientation
UIInterfaceOrientation orientation = scene.interfaceOrientation;
```

**Empfohlene Lösung:** Helper-Funktionen erstellen:
- `TiStatusBarFrame()` — return `UIWindowScene.statusBarManager.frame`
- `TiIsStatusBarHidden()` — return `statusBarManager.frame.size.height == 0`
- `TiStatusBarOrientation()` — return `UIWindowScene.interfaceOrientation`

**Abwärtskompatibilität:** ✅ `UIWindowScene` ist ab iOS 13 verfügbar, Fallback auf alte APIs für iOS < 13.

---

### Phase 2 — Mittlere Priorität

#### Task 2.1: OSAtomic* → `<stdatomic.h>`
**Datei:** `TiViewProxy.m` (~35 Vorkommnisse), `TiBindingRunLoop.m` (1 Vorkommnis)

**Mapping:**

| Alt (OSAtomic) | Neu (stdatomic.h) |
|---|---|
| `OSAtomicTestAndSetBarrier(ptr, barrier)` | `atomic_fetch_or(ptr, 1 << barrier)` |
| `OSAtomicTestAndClearBarrier(ptr, barrier)` | `atomic_fetch_and(ptr, ~(1 << barrier))` |
| `OSAtomicCompareAndSwapPtrBarrier(old, new, ptr)` | `atomic_compare_exchange_strong(ptr, &old, new)` |

**Beispiel-Refactoring `TiViewProxy.m`:**
```objc
// Alt: OSAtomicTestAndSetBarrier(&flags, flagIndex);
// Neu:
atomic_fetch_or(&flags, 1U << flagIndex);

// Alt: OSAtomicTestAndClearBarrier(&flags, flagIndex);
// Neu:
atomic_fetch_and(&flags, ~(1U << flagIndex));
```

**Hinweis:** `TiViewProxy.m` verwendet Bit-Flags in einem `int32_t`. Die Umstellung erfordert das Ersetzen aller `OSAtomic`-Calls durch `atomic_fetch_or`/`atomic_fetch_and` mit korrekter Bit-Position.

**Abwärtskompatibilität:** ✅ `<stdatomic.h>` ist ab iOS 5 verfügbar.

---

#### Task 2.2: UTType APIs → Moderne Ersatz-APIs
**Datei:** `Mimetypes.m:32,33,59,60`

**Aktuell:**
```objc
CFStringRef mimeTag = kUTTagClassMIMEType;
CFStringRef extTag = kUTTagClassFilenameExtension;
UTTypeCreatePreferredIdentifierForTag(mimeTag, mimeStr, NULL);
UTTypeCopyPreferredTagWithClass(typeRef, extTag, NULL);
```

**Neu (iOS 15+):**
```objc
UTType *mimeUTType = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (__bridge CFStringRef)mimeType, NULL);
NSString *ext = [mimeUTType preferredFilenameExtension];
```

**Bedingte Kompilierung:**
```objc
#if __IPHONE_OS_VERSION_MIN_REQUIRED >= __IPHONE_15_0
    // Neue UTType-APIs
#else
    // Alte CFStringRef-APIs mit #pragma clang diagnostic ignored
#endif
```

**Abwärtskompatibilität:** ✅ Bedingte Kompilierung mit Fallback für iOS < 15.

---

### Phase 3 — Niedrige Priorität

#### Task 3.1: Enum → Int Type Conversions
**Dateien:**
- `TiAnimation.m:211` — `UIViewAnimationTransition` → `int`
- `TiWindowProxy.m:288,311,313` — `UIStatusBarStyle` → `int`
- `TiWindowProxy.m:566` — `UIInterfaceOrientation` → `int`
- `UIImage+Alpha.m:34` — `CGImageAlphaInfo` → `CGBitmapInfo`

**Lösung:** Explizite Casts oder Typanpassung der Zielvariablen.

**Beispiel `TiAnimation.m:211`:**
```objc
// Alt:
int transition = (int)transitionType;
// Neu:
UIViewAnimationTransition transition = (UIViewAnimationTransition)transitionType;
```

**Beispiel `UIImage+Alpha.m:34`:**
```objc
// Alt:
CGBitmapInfo bitmapInfo = alphaInfo;
// Neu:
CGBitmapInfo bitmapInfo = CGBitmapInfo(alphaInfo);
```

---

#### Task 3.2: `setAutomaticallyAdjustsScrollViewInsets:` → `contentInsetAdjustmentBehavior`
**Datei:** `TiUtils.m:1739`

**Aktuell:**
```objc
[controller setAutomaticallyAdjustsScrollViewInsets:[self boolValue:autoAdjust def:NO]];
```

**Neu:**
```objc
if (@available(iOS 11.0, *)) {
    controller.scrollView.contentInsetAdjustmentBehavior = autoAdjust ?
        UIScrollViewContentInsetAdjustmentAutomatic :
        UIScrollViewContentInsetAdjustmentNever;
} else {
    [controller setAutomaticallyAdjustsScrollViewInsets:[self boolValue:autoAdjust def:NO]];
}
```

---

#### Task 3.3: `groupTableViewBackgroundColor` → Moderne Farbe
**Datei:** `Webcolor.m:79,81`

**Aktuell:**
```objc
return [UIColor groupTableViewBackgroundColor];
```

**Neu:**
```objc
if (@available(iOS 13.0, *)) {
    return [UIColor systemGroupedBackgroundColor];
} else {
    return [UIColor groupTableViewBackgroundColor];
}
```

---

#### Task 3.4: Method-not-found Warnings
**Dateien:**
- `KrollModule.m:84` — `'-JSValueInContext:' not found`
- `ScriptModule.m:29` — `TiHost` forward class; `'+resourceBasedURL:baseURL:' not found`

**Lösung:**
- `KrollModule.m`: `JSValueInContext:` ist eine JSContext/Methode — Import der richtigen Header oder `@try/@catch`-Wrapper.
- `ScriptModule.m`: `#import "TiHost.h"` statt Forward-Declaration; `+resourceBasedURL:baseURL:` exists auf `TiHost` — Header prüfen.

---

#### Task 3.5: Property Attribute
**Datei:** `TopTiModule.h:15`

**Aktuell:**
```objc
@property (nonatomic) id someProperty;  // implizit 'assign'
```

**Neu:**
```objc
@property (nonatomic, weak) id someProperty;  // oder 'strong' je nach Semantic
```

---

#### Task 3.6: Deprecated Implementations in TiViewController
**Datei:** `TiViewController.m:29,73,78,83`

**Lösung:** Prüfen welche deprecated Methoden implementiert werden und auf die modernen Entsprechungen updaten (z.B. `viewWillAppear:` mit Scene-Updates).

---

## Implementierungsreihenfolge

```
Phase 1 (Hoch)                    Phase 2 (Mittel)                Phase 3 (Niedrig)
┌─────────────────────┐          ┌─────────────────────┐         ┌─────────────────────┐
│ 1.1 CC_MD5 → SHA256 │─────────▶│ 2.1 OSAtomic →      │────────▶│ 3.1 Type Conversions│
│     (TiUtils.m)     │          │     stdatomic.h     │         │     (4 Dateien)     │
├─────────────────────┤          ├─────────────────────┤         ├─────────────────────┤
│ 1.2 keyWindow →     │─────────▶│ 2.2 UTType →        │────────▶│ 3.2 ScrollView      │
│     Multi-Scene     │          │     UTType-Klassen  │         │     Insets          │
│     (3 Dateien)     │          │     (Mimetypes.m)   │         │     (TiUtils.m)     │
├─────────────────────┤          ├─────────────────────┤         ├─────────────────────┤
│ 1.3 statusBar* →    │          │                     │         │ 3.3 groupTableView  │
│     UIWindowScene   │          │                     │         │     color           │
│     (4 Dateien)     │          │                     │         │     (Webcolor.m)    │
└─────────────────────┘          └─────────────────────┘         ├─────────────────────┤
                                                                 │ 3.4 Method-not-     │
                                                                 │     found           │
                                                                 ├─────────────────────┤
                                                                 │ 3.5 Property attr.  │
                                                                 ├─────────────────────┤
                                                                 │ 3.6 Deprecated impl │
                                                                 └─────────────────────┘
```

---

## Validation

Nach jedem Phase-Commit:
```bash
# Full cleanbuild und Warnings zählen
npm run cleanbuild -- ios 2>&1 | grep -c "warning:"

# Ziel: < 20 Warnings (nur noch appintentsmetadataprocessor + eventuelle Restfälle)
```

---

## Risikobewertung

| Task | Risiko | Mitigation |
|---|---|---|
| 1.1 CC_MD5 → SHA256 | Niedrig | Gleiche API, nur interne Änderung |
| 1.2 keyWindow | Mittel | Fallback auf alte API für iOS < 13 |
| 1.3 statusBar* | Mittel | Fallback auf alte API für iOS < 13 |
| 2.1 OSAtomic | Mittel | Threading-Semantik muss identisch bleiben; Tests! |
| 2.2 UTType | Niedrig | Bedingte Kompilierung ab iOS 15 |
| 3.1 Type conversions | Niedrig | Einfache Casts |
| 3.2 ScrollView | Niedrig | @available Check |
| 3.3 groupTableView | Niedrig | @available Check |
| 3.4-3.6 | Niedrig | Kleine, isolierte Changes |

---

## Zusammenfassung der zu ändernden Dateien

| Datei | Warnings | Tasks |
|---|---|---|
| `TiUtils.m` | 8 | 1.1, 1.2, 1.3, 3.2 |
| `TiViewController.m` | 5 | 1.2, 1.3, 3.6 |
| `TiUIWindowProxy.m` | 8 | 1.2, 1.3 |
| `TiWindowProxy.m` | 7 | 1.3 |
| `TiUIWindow.m` | 2 | 1.3 |
| `TiViewProxy.m` | 35 | 2.1 |
| `TiBindingRunLoop.m` | 1 | 2.1 |
| `Mimetypes.m` | 8 | 2.2 |
| `TiAnimation.m` | 1 | 3.1 |
| `UIImage+Alpha.m` | 1 | 3.1 |
| `Webcolor.m` | 4 | 3.3 |
| `KrollModule.m` | 1 | 3.4 |
| `ScriptModule.m` | 2 | 3.4 |
| `TopTiModule.h` | 2 | 3.5 |

**Gesamt:** 14 Dateien, ~83 unique Warning-Quellen (350+ Vorkommnisse über 3 Plattformen)
