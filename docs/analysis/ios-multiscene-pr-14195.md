 # iOS Multi-Scene Support – PR #14195

## Goal

Add support for **iOS Multi-Scene** (iPadOS Split View, CarPlay, visionOS) by adopting the [Scene Lifecycle API](https://developer.apple.com/documentation/uikit/app_and_environment/managing_your_app_s_scene_lifecycle) (since iOS 13).

**Branch:** `iOSMultiScene`
**PR:** https://github.com/tidev/titanium-sdk/pull/14195
**Original PR:** https://github.com/tidev/titanium-sdk/pull/13941
**Revert Issue:** https://github.com/tidev/titanium-sdk/issues/13997

---

## Problem

Titanium uses the classic single-window approach (`UIWindow` via `UIScreen.main.bounds`). On iPadOS with Split View, CarPlay, and visionOS, an app can have multiple scenes running simultaneously.

---

## Changed Files (6)

| File | Changes | Purpose |
|---|---|---|
| `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m` | +258/-21 | Scene delegate, lifecycle, URL handling |
| `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.h` | +1/-8 | `UIWindowSceneDelegate` protocol + cleanup |
| `iphone/Classes/TiApp+Addons.m` | +5/-24 | Extracted user activity processing |
| `iphone/Classes/TiAppiOSProxy.m` | +7/-1 | `handleurl` fix – launchOptions snapshot |
| `iphone/iphone/Titanium.plist` | +17 | Scene manifest (multi-scene enabled) |
| `support/iphone/Info.plist` | +17 | Scene manifest for generated apps (single-scene) |

---

## Key Changes

### 1. Dual-Instance Architecture

`TiApp` acts as both **App Delegate AND Scene Delegate**:

```
App Delegate (window == nil)     Scene Delegate (sharedApp, window != nil)
      │                                  │
      └───── forward to sharedApp ───────┘
```

- `registerApplicationDelegate:` and `unregisterApplicationDelegate:` forward to `sharedApp`
- `tryToInvokeSelector:`, `tryToPostNotification:`, `tryToPostBackgroundModeNotification:` all delegate to `sharedApp`

### 2. Scene Lifecycle

New methods implementing `UIWindowSceneDelegate`:

| Method | Purpose |
|---|---|
| `scene:willConnectToSession:options:` | Create window, share `launchOptions`, init controller, **boot**, process URL/user activities |
| `scene:openURLContexts:` | Handle URLs while app is running |
| `sceneWillResignActive:` | Splash, suspend, GC |
| `sceneDidBecomeActive:` | Remove splash, resumed |
| `sceneDidEnterBackground:` | Pause + background task |
| `sceneWillEnterForeground:` | URL cleanup (TIMOB-3432), resume |

### 3. Boot Logic Moved

```
Before:                After:
didFinishLaunching     didFinishLaunching  (init only)
    │                       │
    └─> boot           scene:willConnect ──> boot
```

Prevents double boot when running scene-based.

### 4. URL Handling – Centralized

New method `handleURLFromScene:source:`:
- Stores URL + source in `launchOptions`
- Snapshot via `[[launchOptions copy] autorelease]` to prevent mutation (TIMOB-3432 fix)
- Queued vs posted event depending on `appBooted` state
- After boot: restore URL/source from `queuedBootEvents` → `Ti.App.arguments.url` works correctly

### 5. User Activity Processing Extracted

`dictionaryFromUserActivity:` moved from `TiApp+Addons.m` to `TiApp.m` – shared by both app delegate and scene delegate paths.

### 6. Scene Manifest

- **Test App** (`Titanium.plist`): `UIApplicationSupportsMultipleScenes = true`
- **Generated Apps** (`Info.plist`): `UIApplicationSupportsMultipleScenes = false` (backwards compatible, but scene-based lifecycle)

---

## Fixed Issues (vs Original PR #13941)

| Issue | Symptom | Fix |
|---|---|---|
| Logs not starting | No logs when deploying to device | Boot logic moved to scene delegate |
| Push notification callbacks | Callbacks not firing | Delegate forwarding to sharedApp |
| Custom URL schemes | `handleurl` event is empty | `handleURLFromScene:` + snapshot + `queuedBootEvents` restoration |

---

## Architecture

```
                    UIApplication
                       │
        ┌──────────────┴──────────────┐
        │                             │
   App Delegate               Scene Delegate (sharedApp)
   (first instance)           (first scene)
        │                             │
        └──── forward to ─────────────┘
                             │
                    ┌────────┴────────┐
                    │   TiApp         │
                    │  - window       │
                    │  - launchOptions│
                    │  - krollBridge  │
                    │  - boot()       │
                    └─────────────────┘
```

---

## Open Points / Risks

1. **Single-Scene vs Multi-Scene:** Generated apps use `false` for multi-scene. Scene-based lifecycle but only one scene. Backwards compatible, but not true multi-scene.

2. **`launchOptions` Sharing:** Scene delegate shares `launchOptions` with app delegate via `[(TiApp *)appDel launchOptions]`. Only works if both are `TiApp` instances.

3. **Memory:** Manual `[launchOptions release]` in `TiAppiOSProxy.m` – no autorelease pool.

4. **Test App Multi-Scene:** `Titanium.plist` has `true` – may cause unexpected behavior during testing.

5. **No JS API for Scenes:** Remains internal, no exposure to JavaScript.

---

## Testing

```javascript
const win = Ti.UI.createWindow();

win.addEventListener("open", function () {
  console.log("open", Ti.App.arguments.url);
});

Ti.App.iOS.addEventListener('handleurl', event => {
    console.info("handleurl", event.launchOptions.url);
});

win.open();
```

Configure a custom URL scheme in `tiapp.xml` and invoke the app while it is in the background or closed.
