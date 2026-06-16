# iOS Multi-Scene Baseline – Bug Fixes & Minimal Support

## Goal

Fix current bugs and enable baseline multi-scene support **without breaking changes**. Prepare for future `sharedApp` → `sharedScene` migration.

**No new JS API, no new classes** – only internal fixes to make existing code work correctly with multiple scenes.

---

## Discovered Bugs

| # | Bug | Location | Symptom | Status |
|---|---|---|---|---|
| **1** | Double event firing | `TiApp.m` lines 1060–1130 | Both app delegate AND scene delegate fire `kTiSuspendNotification`, `kTiResumedNotification`, `kTiPausedNotification`, `kTiResumeNotification` | ✅ Fixed |
| **2** | Boot per scene | `TiApp.m` line 1268 | `scene:willConnectToSession:options:` calls `[self boot]` unconditionally → new `KrollBridge` per scene | ✅ Fixed |
| **3** | Shared `launchOptions` | `TiApp.m` line 1253 | Mutable dict copied from app delegate → URL mutations in one scene leak to another | ✅ Fixed |
| **4** | No disconnect handler | `TiApp.m` | No `sceneDidDisconnect` / `sceneDidDismiss` → dismissed scenes remain in memory | ✅ Fixed |
| **5** | No scene context in notifications | `TiApp.m` lines 1060–1130 | Lifecycle notifications fire without scene identifier → cannot determine source scene | ✅ Fixed |

---

## Implementation Plan

### Step 1: Fix Double Event Firing ✅ DONE

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

Scene delegate is now the single source of truth. App delegate fires as fallback for non-scene apps.

### Step 2: Guard Boot – Single KrollBridge ✅ DONE

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

Boot guarded with `if (kjsBridge == nil)` check.

### Step 3: Per-Scene Launch Options ✅ DONE

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

Each scene gets its own independent copy of launchOptions.

### Step 4: Add Scene Disconnect Handler ✅ DONE

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

`sceneDidDisconnect:` and `sceneDidDismissWithTransitionOptions:` implemented. Cleanup and `kTiSceneDismissNotification` fired.

### Step 5: Add Scene Context to Notifications ✅ DONE

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

All lifecycle notifications now include `scene` key in `userInfo` with the scene's `persistentIdentifier`.

### Step 6: Add Scene Identifier to TiApp ✅ DONE

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.h/m`

`sceneId` property added, set during `scene:willConnectToSession:` from `session.persistentIdentifier`.

### Step 7: Enable Multi-Scene for Generated Apps ✅ DONE

**File:** `iphone/iphone/Titanium.plist`

`UIApplicationSceneManifest` with `UIApplicationSupportsMultipleScenes: true` and "Default Configuration" scene delegate class `TiApp` is included by default in all generated apps.

---

## File Changes Summary

| File | Changes | Status |
|---|---|---|
| `iphone/TitaniumKit/.../API/TiApp.h` | Add `sceneId` property, `kTiSceneDismissNotification` constant | ✅ Done |
| `iphone/TitaniumKit/.../API/TiApp.m` | Steps 1–6: Fix double events, boot guard, per-scene launchOptions, disconnect handler, scene context, sceneId | ✅ Done |
| `iphone/iphone/Titanium.plist` | Step 7: Enable multi-scene (`true`) with default scene configuration | ✅ Done |

---

## Testing

### Manual Test Checklist

- [x] Launch app on iPad → single scene works
- [x] Split View → both scenes functional, no crash
- [x] Close secondary scene → `scenediddismiss` fires, no memory leak
- [x] Open URL in secondary scene → routes correctly
- [x] Rotate one scene → trait collection updates independently
- [x] Lifecycle events fire once (verified in logs)
- [x] Backwards compatible: launch on iPhone → single scene works

---

## Migration Path (Future)

After baseline is stable, deprecate `sharedApp` in favor of per-scene access:

```objc
// Current (deprecated)
+ (TiApp *)app { return sharedApp; }

// Future
+ (TiApp *)sceneForUUID:(NSUUID *)sceneUUID;
+ (TiApp *)sceneForScene:(UIScene *)scene;
+ (NSArray<TiApp *> *)allActiveScenes;
+ (TiApp *)primaryScene;
```

**Deprecation timeline:**
1. **v13.3.0** – Baseline fixes (this plan) ✅
2. **v13.4.0** – Add `TiSceneRegistry` class, JS API ✅ (see multi-scene plan)
3. **v14.0.0** – Deprecate `sharedApp`, require scene-aware code (pending)

---

## Design Decision: Why `owningApp` (instance method) instead of `[TiApp owningApp]` (class method)

The `owningApp` pattern resolves the correct TiApp instance for a proxy's scene via the view hierarchy. It is implemented as an **instance method** on `TiProxy`, `TiViewProxy`, and `TiViewController` — not as a class method on `TiApp` — for three reasons:

### 1. It needs view hierarchy context

`owningApp` resolves the scene by walking the view hierarchy: `[[self view] window]` → `TiSceneRegistry.appForWindow:`. A class method `[TiApp owningApp]` has no receiver context — it wouldn't know *which* proxy or view is asking. The whole point is that `[[self owningApp] controller]` in `TiWindowProxy` opens a window controller in *this proxy's* scene, not whichever scene `[TiApp app]` happens to point to.

### 2. It cannot modify `[TiApp app]` without breaking compatibility

`[TiApp app]` is used pervasively across the SDK and third-party modules as `sharedApp` — a stable global reference. Changing its semantics would break:

- **Third-party modules** that call `[TiApp app]` expecting the global singleton behavior. These modules don't know about scenes and should continue to work unchanged, targeting the primary scene (identical to current single-scene behavior).
- **Internal code paths** where the global singleton is actually needed — e.g., `TiApp`'s own lifecycle methods, `[TiApp app]->kjsBridge` for JS evaluation, and places where any active scene is acceptable.
- **Thread safety** — `[TiApp app]` is called from background threads. Making it context-dependent (e.g., thread-local scene) would introduce race conditions when background threads have no scene context.

### 3. It's opt-in and backwards compatible

`owningApp` falls back to `[TiApp app]` when no scene is found (single-scene apps, pre-iOS 13, views not yet in a window hierarchy). Only TitaniumKit and Classes/ code that is explicitly scene-sensitive uses `owningApp`. Old modules and unchanged code paths continue to use `[TiApp app]` unchanged, targeting the primary scene — identical to legacy single-scene behavior.

---

## Success Criteria

- [x] No double event firing (verified in logs)
- [x] Single `KrollBridge` instance across all scenes
- [x] Per-scene `launchOptions` (no URL leakage)
- [x] Scene cleanup on dismiss (no memory leak)
- [x] Notifications include `scene` in `userInfo`
- [x] `TiApp.sceneId` returns correct UUID
- [x] Multi-scene enabled for generated apps
- [x] All existing tests pass (no regressions)
- [x] Manual iPad Split View test passes