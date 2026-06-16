# iOS True Multi-Scene Support – Implementation Plan

## Overview

Enable **true multi-scene support** for iPadOS Split View, CarPlay, and visionOS. Currently, the SDK uses a scene-based lifecycle but only supports one active scene at a time. This plan adds proper multi-scene architecture with a JavaScript API for scene management.

**Related:** PR #14195, Branch `iOSMultiScene`
**Target:** iOS 13+ (Scene API), iPadOS, CarPlay, visionOS

---

## Current State

| Aspect | Status |
|---|---|
| Scene lifecycle (native) | ✅ Implemented via `UIWindowSceneDelegate` |
| Scene manifest | ✅ Configured (single-scene for generated apps) |
| Dual-instance architecture | ✅ App delegate + scene delegate coexist |
| URL handling | ✅ Centralized via `handleURLFromScene:source:` |
| Multi-scene enabled | ✅ Default in Titanium.plist |
| JavaScript API | ✅ `Ti.App.iOS.currentScene`, `scenes`, `focusedScene`, lifecycle events |
| Scene tracking | ✅ `TiSceneRegistry` manages all active `TiApp` instances |
| Scene dismiss | ✅ `sceneDidDisconnect` / `sceneDidDismiss` handler implemented |
| Scene-aware `owningApp` | ✅ Replaces `[TiApp app]` in scene-sensitive code |
| Focus detection | ✅ `TiWindow` hitTest-based tracking via `focusedScene` and `isKey` |

## Discovered Bugs in Current Implementation

| Bug | Location | Impact | Status |
|---|---|---|---|
| **Double event firing** | App delegate + scene delegate both fire notifications | Modules receive lifecycle events twice | ✅ Fixed |
| **Boot called per scene** | `scene:willConnectToSession:options:` calls `[self boot]` unconditionally | Each new scene creates a new `KrollBridge` | ✅ Fixed |
| **Shared `launchOptions`** | Scene delegate shares mutable `launchOptions` dict | URL mutations in one scene affect another | ✅ Fixed |
| **No scene cleanup** | No `sceneDidDisconnect` handler | Dismissed scenes remain in memory | ✅ Fixed |
| **Global notifications without scene context** | Notifications fire without scene identifier | Cannot determine which scene triggered the event | ✅ Fixed |
| **`[TiApp app]` targets wrong scene** | Global singleton targets primary/last scene | Windows open in wrong scene, modals on wrong window | ✅ Fixed via `owningApp` |
| **`keyWindow` returns wrong window** | `sharedApplication.keyWindow` deprecated/unreliable | Orientation, alerts, and frames use wrong scene | ✅ Fixed via `owningApp` |
| **Infinite recursion in `owningApp`** | `[self view].window` during view creation | Crash on app launch (frameForController, appFrame loops) | ✅ Fixed via `viewAttached`/`isViewLoaded` guards |
| **Focus detection fails in Split View** | Both scenes report `isActive`, `isForeground`, `isKeyWindow=YES` | Cannot determine which scene has focus | ✅ Fixed via `TiWindow.lastActiveWindow` |
| **`isPrimary` returns wrong scene** | `primaryScene` used `allKeys[0]` (unordered) | New scene could be reported as primary | ✅ Fixed via `_primarySceneUUID` |

---

## Goals

1. ✅ Support **multiple concurrent scenes** (iPadOS Split View, Slide Over)
2. ✅ Expose a **JavaScript API** for scene discovery and management
3. ✅ Handle **scene-specific events** (URLs, activities, trait changes)
4. ✅ Enable **scene-specific windows** and UI state
5. ✅ Maintain **backwards compatibility** with existing apps
6. ⬜ Support **CarPlay** scene configuration
7. ⬜ Allow scene configuration via **tiapp.xml** (currently plist-only)

---

## Implementation Plan

### Phase 0: Bug Fixes (Prerequisites) ✅ DONE

Fix the discovered bugs before implementing multi-scene features.

#### 0.1 Eliminate Double Event Firing ✅

Scene delegate is now the single source of truth. App delegate fires as fallback for non-scene apps.

#### 0.2 Guard Boot Per Scene ✅

Boot guarded with `if (kjsBridge == nil)` — single KrollBridge across all scenes.

#### 0.3 Add Scene Disconnect Handler ✅

`sceneDidDisconnect:` and `sceneDidDismissWithTransitionOptions:` implemented with cleanup and notification.

#### 0.4 Add Scene Context to Notifications ✅

All lifecycle notifications now include `scene` key in `userInfo` with `persistentIdentifier`.

---

### Phase 1: Native Architecture – Scene Registry ✅ DONE

#### 1.1 Create `TiSceneRegistry` ✅

**Files:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiSceneRegistry.h/m`

Centralized registry managing all active `TiApp` instances:
- `registerTiApp:forSceneUUID:` / `unregisterTiAppForSceneUUID:`
- `allScenes` — all registered TiApp instances keyed by scene UUID
- `sceneForUUID:` — lookup by UUID
- `primaryScene` — first-registered scene (tracked via `_primarySceneUUID`)
- `appForWindow:` — find TiApp that owns a UIWindow (via windowScene)
- `focusedSceneUUID` — scene UUID of last-interacted window (via `TiWindow.lastActiveWindow`)
- `setSceneActive:forUUID:` / `setSceneForeground:forUUID:` — state tracking
- `isSceneActiveForUUID:` / `isSceneForegroundForUUID:` — state queries

#### 1.2 Create `TiWindow` (UIWindow Subclass) ✅

**Files:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiWindow.h/m`

Custom UIWindow subclass that overrides `hitTest:withEvent:` to track which window was last touched. This is the recommended approach for multi-scene focus detection — `isKeyWindow` and `activationState` are unreliable in Split View (both scenes report foregroundActive).

- `TiWindow.lastActiveWindow` — static property returning the last-interacted UIWindow
- Used by `TiSceneRegistry.focusedSceneUUID` and `TiSceneProxy.isKey`

#### 1.3 Update `TiApp` – Scene Identification ✅

- `sceneId` property set from `session.persistentIdentifier`
- Scene registration with `TiSceneRegistry` in `scene:willConnectToSession:`
- Scene unregistration in `sceneDidDisconnect:`
- Window creation uses `TiWindow` instead of `UIWindow`

#### 1.4 Scene Lifecycle Events ✅

New notification constants in `TiBase.h/m`:
- `kTiSceneWillConnectNotification`
- `kTiSceneDidBecomeActiveNotification`
- `kTiSceneWillResignActiveNotification`
- `kTiSceneDidEnterBackgroundNotification`
- `kTiSceneWillEnterForegroundNotification`
- `kTiSceneDismissNotification`

All include `scene` UUID in `userInfo`.

#### 1.5 Focus Detection ✅

- `UIWindowDidBecomeKeyNotification` observer in `TiApp.m` for Slide Over mode
- `UIWindowDidBecomeVisibleNotification` observer for foreground detection
- `TiWindow.lastActiveWindow` via `hitTest:withEvent:` for all multitasking modes
- `TiSceneRegistry.focusedSceneUUID` resolves last-active window to scene UUID

---

### Phase 2: JavaScript API – Scene Object ✅ DONE

#### 2.1 Create Scene Proxy ✅

**Files:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiSceneProxy.h/m`

`TiSceneProxy` (inherits `TiViewProxy`) exposes:
| Property | Type | Description | Status |
|---|---|---|---|
| `id` | String | Alias for sceneId | ✅ |
| `sceneId` | String | Scene UUID (persistentIdentifier) | ✅ |
| `sceneName` | String | Configuration name | ✅ |
| `isActive` | Boolean | Scene is active and receiving input | ✅ |
| `isForeground` | Boolean | Scene is visible (may not be active) | ✅ |
| `isPrimary` | Boolean | First-registered scene | ✅ |
| `isKey` | Boolean | Scene has focus (via hitTest, NOT isKeyWindow) | ✅ |
| `window` | Ti.UI.Window | Root window proxy for this scene | ✅ |
| `traitCollection` | Object | UIUserInterfaceStyle, size classes, display scale | ✅ |

#### 2.2 Add `Ti.App.iOS` Extensions ✅

**File:** `iphone/Classes/TiAppiOSProxy.m`

```javascript
// Current scene for this JS context
Ti.App.iOS.currentScene   // Ti.App.iOS.SceneProxy | null

// All active scenes
Ti.App.iOS.scenes         // Array<Ti.App.iOS.SceneProxy>

// Scene the user last interacted with (hitTest-based)
Ti.App.iOS.focusedScene   // Ti.App.iOS.SceneProxy | null

// Scene lifecycle events
Ti.App.iOS.addEventListener('scenewillconnect', handler);
Ti.App.iOS.addEventListener('scenedidbecomeactive', handler);
Ti.App.iOS.addEventListener('scenewillresignactive', handler);
Ti.App.iOS.addEventListener('scenedidenterbackground', handler);
Ti.App.iOS.addEventListener('scenewillenterforeground', handler);
Ti.App.iOS.addEventListener('scenediddismiss', handler);
```

All events include `sceneId` (String) and `scene` (TiSceneProxy) in event data.

#### 2.3 Scene-Specific Window Association ✅

`Ti.UI.Window` now has a `scene` property that returns the `TiSceneProxy` for the window's scene.

#### 2.4 API Documentation ✅

**Files:**
- `apidoc/Titanium/App/iOS/SceneProxy.yml` — SceneProxy properties including `isKey` and tiapp.xml configuration
- `apidoc/Titanium/App/iOS/iOS.yml` — `currentScene`, `scenes`, `focusedScene` properties and scene lifecycle events

---

### Phase 3: Scene-Aware `[TiApp app]` Replacements ✅ DONE

**Problem:** `[TiApp app]` returns the global singleton (`sharedApp`), which points to whichever scene most recently called `initController`. In multi-scene mode, this causes windows to open in the wrong scene, modals on the wrong window, orientation changes on the wrong scene, and `appFrame` returning wrong dimensions.

**Solution:** Add `owningApp` method that resolves the correct TiApp instance for the current view hierarchy, falling back to `[TiApp app]` for single-scene and backwards compatibility.

#### 3.1 TiProxy.owningApp (base class) ✅

Uses `executionContext.host` (the TiApp instance for this JS context) to resolve the owning TiApp. Falls back to `[TiApp app]`.

#### 3.2 TiViewProxy.owningApp ✅

Overrides to use `TiSceneRegistry.appForWindow:` via the view's window. Guarded with `viewAttached` to prevent infinite recursion during view creation.

#### 3.3 TiWindowProxy ✅

Inherits `owningApp` from TiViewProxy. All 20 `[TiApp app]` call sites replaced with `[[self owningApp] ...]`.

#### 3.4 TiViewController.owningApp ✅

Uses `isViewLoaded` guard + `appForWindow:` lookup, with `_proxy.owningApp` fallback.

#### 3.5 TiRootViewController ✅

All `[self view].window` accesses guarded with `isViewLoaded` to prevent crashes during view creation.

#### 3.6 TiUINavigationWindowProxy ✅

Inherits `owningApp` from TiWindowProxy → TiViewProxy. 2 call sites replaced.

#### 3.7 TiUITabProxy ✅

Inherits `owningApp` from TiViewProxy. 2 call sites replaced.

#### 3.8 TiUIAlertDialogProxy ✅

`owningTiApp` guarded with `viewAttached` on `owningWindowProxy`.

**Backwards Compatibility:** `[TiApp app]` unchanged — returns `sharedApp` singleton. Old modules continue to target the primary scene. `owningApp` falls back to `[TiApp app]` when no scene is found.

---

### Phase 4: Configuration and Backwards Compatibility ⬜ PENDING

#### 4.1 Multi-Scene in Generated Apps ✅ DONE

**File:** `iphone/iphone/Titanium.plist`

`UIApplicationSceneManifest` with `UIApplicationSupportsMultipleScenes: true` and "Default Configuration" scene delegate class `TiApp` is included by default.

#### 4.2 Allow Scene Configuration via `tiapp.xml` ⬜ PENDING

Currently scene manifest can only be customized by editing `Info.plist` directly or using `<ios><plist><dict>` in tiapp.xml. A dedicated `<multi-scene>` element is planned but not yet implemented.

Proposed tiapp.xml syntax:
```xml
<ios>
    <multi-scene>
        <enabled>true</enabled>
        <configurations>
            <configuration>
                <name>Default Configuration</name>
                <role>UIWindowSceneSessionRoleApplication</role>
            </configuration>
            <configuration>
                <name>CarPlay Configuration</name>
                <role>UICarWindowSceneSessionRoleApplication</role>
            </configuration>
        </configurations>
    </multi-scene>
</ios>
```

---

### Phase 5: Testing ⬜ PENDING

#### 5.1 Test App ✅ (Manual)

A test app exists at `/Users/marcbender/multiscene/multiscenetest/` that tests:
- Scene lifecycle events
- Scene proxy properties (isActive, isForeground, isPrimary, isKey, traitCollection)
- Window scene association
- Focus detection (FOCUSED / VISIBLE / BACKGROUND states)
- Scene-aware AlertDialog
- Inter-scene communication via Ti.App.Properties

#### 5.2 Integration Tests ⬜ PENDING

**File:** `tests/Resources/ti.app.ios.scenes.test.js` (not yet created)

#### 5.3 Manual Test Checklist

- [x] Launch app on iPad → single scene works
- [x] Split View → both scenes functional, no crash
- [x] Slide Over → focus detection works correctly
- [x] Close secondary scene → `scenediddismiss` fires
- [x] Open URL in secondary scene → routes correctly
- [x] Rotate one scene → trait collection updates independently
- [x] Lifecycle events fire once per scene
- [x] Backwards compatible: launch on iPhone → single scene works
- [x] Non-multi-scene apps work without crashes (Keyboardcontroldemo regression test)
- [x] `owningApp` falls back to `[TiApp app]` in single-scene mode

---

## File Changes Summary

| File | Action | Description | Status |
|---|---|---|---|
| `TitaniumKit/.../API/TiSceneRegistry.h` | **New** | Scene registry header | ✅ |
| `TitaniumKit/.../API/TiSceneRegistry.m` | **New** | Scene registry implementation | ✅ |
| `TitaniumKit/.../API/TiSceneProxy.h` | **New** | Scene proxy header (moved from Classes/) | ✅ |
| `TitaniumKit/.../API/TiSceneProxy.m` | **New** | Scene proxy implementation (moved from Classes/) | ✅ |
| `TitaniumKit/.../API/TiWindow.h` | **New** | UIWindow subclass with hitTest focus tracking | ✅ |
| `TitaniumKit/.../API/TiWindow.m` | **New** | UIWindow subclass implementation | ✅ |
| `TitaniumKit/.../API/TiApp.h` | Modify | sceneId, scene lifecycle, notification constants | ✅ |
| `TitaniumKit/.../API/TiApp.m` | Modify | All Phase 0-2 changes | ✅ |
| `TitaniumKit/.../API/TiProxy.h/m` | Modify | Base `owningApp` method | ✅ |
| `TitaniumKit/.../API/TiViewProxy.m` | Modify | `owningApp` override with `viewAttached` guard, `appFrame` fix | ✅ |
| `TitaniumKit/.../API/TiViewController.h/m` | Modify | `owningApp` with `isViewLoaded` guard | ✅ |
| `TitaniumKit/.../API/TiRootViewController.m` | Modify | `isViewLoaded` guards on `[self view].window` accesses | ✅ |
| `TitaniumKit/.../API/TiWindowProxy.m` | Modify | `isRootViewAttached` guard, `owningApp` replacements | ✅ |
| `TitaniumKit/.../API/TiBase.h/m` | Modify | Scene notification constants | ✅ |
| `TitaniumKit/TitaniumKit.h` | Modify | Add TiSceneProxy, TiSceneRegistry, TiWindow headers | ✅ |
| `TitaniumKit.xcodeproj/project.pbxproj` | Modify | Add new files | ✅ |
| `iphone/Classes/TiAppiOSProxy.m` | Modify | `currentScene`, `scenes`, `focusedScene`, scene events | ✅ |
| `iphone/Classes/TiUIAlertDialogProxy.m` | Modify | `owningTiApp` with `viewAttached` guard | ✅ |
| `iphone/TitaniumKit/TitaniumKit/TitaniumKit.h` | Modify | Umbrella header updates | ✅ |
| `iphone/iphone/Titanium.plist` | Modify | UIApplicationSceneManifest | ✅ |
| `apidoc/Titanium/App/iOS/SceneProxy.yml` | **New** | SceneProxy API docs | ✅ |
| `apidoc/Titanium/App/iOS/iOS.yml` | Modify | currentScene, scenes, focusedScene, scene events | ✅ |
| `support/iphone/Info.plist` | ⬜ | Multi-scene enablement (via Titanium.plist instead) | N/A |

---

## Dependencies and Risks

| Dependency | Risk | Mitigation | Status |
|---|---|---|---|
| iOS 13+ Scene API | None (already minimum iOS 15) | ✅ | ✅ |
| Single KrollBridge | Shared state conflicts | Per-scene UI state tracking, guard boot | ✅ |
| Backwards compatibility | Existing apps break | `owningApp` falls back to `[TiApp app]` | ✅ Verified |
| Memory management | Multiple scene instances | Cleanup on `scenediddismiss`, registry tracking | ✅ |
| iPad-only feature | iPhone testing gap | Graceful degradation on iPhone (single scene) | ✅ |
| Focus detection | `isKeyWindow`/`activationState` unreliable in Split View | `TiWindow.lastActiveWindow` hitTest tracking | ✅ |
| Infinite recursion | `[self view].window` during view creation | `viewAttached`/`isViewLoaded` guards | ✅ |

---

## Implementation Order

1. **Phase 0** – Bug fixes (prerequisites) ✅
2. **Phase 1** – Scene registry and native architecture ✅
3. **Phase 2** – JavaScript API ✅
4. **Phase 3** – Scene-aware `owningApp` replacements ✅
5. **Phase 4** – Configuration and multi-scene enablement (partially done, tiapp.xml pending)
6. **Phase 5** – Tests and validation (manual testing done, integration tests pending)

---

## Success Criteria

### Phase 0 (Bug Fixes) ✅
- [x] No double event firing
- [x] Single `KrollBridge` instance across all scenes
- [x] Scene cleanup on dismiss
- [x] Notifications include scene identifier

### Phase 1-2 (Core Features) ✅
- [x] Multiple scenes run concurrently on iPadOS Split View
- [x] `Ti.App.iOS.currentScene` returns active scene
- [x] `Ti.App.iOS.scenes` lists all active scenes
- [x] `Ti.App.iOS.focusedScene` returns last-interacted scene
- [x] Scene lifecycle events fire with scene context
- [x] Scene proxy exposes correct properties (id, name, isPrimary, isActive, isKey)

### Phase 3 (Scene-Aware State) ✅
- [x] `[TiApp app]` replaced with `owningApp` in scene-sensitive code
- [x] Windows open in correct scene
- [x] Alerts appear in correct scene
- [x] Orientation follows correct scene
- [x] `appFrame` returns correct dimensions per scene
- [x] No infinite recursion crashes (viewAttached/isViewLoaded guards)

### Phase 4 (Configuration) ⬜
- [ ] Multi-scene configurable via `tiapp.xml`
- [ ] CarPlay scene configuration support

### Phase 5 (Testing) ⬜
- [ ] Integration tests written and passing
- [ ] All existing tests pass (no regressions)