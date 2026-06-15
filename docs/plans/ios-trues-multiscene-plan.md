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
| Multi-scene enabled | ⚠️ Test app only (`UIApplicationSupportsMultipleScenes = true`) |
| JavaScript API | ❌ None – scenes are transparent to JS |
| Scene tracking | ❌ Only `sharedApp` tracks one scene |
| Scene dismiss | ❌ No `sceneDidDisconnect` / `sceneDidDismiss` handler |

## Discovered Bugs in Current Implementation

| Bug | Location | Impact |
|---|---|---|
| **Double event firing** | App delegate + scene delegate both fire `kTiSuspendNotification`, `kTiResumedNotification`, `kTiPausedNotification`, `kTiResumeNotification` | Modules receive lifecycle events twice |
| **Boot called per scene** | `scene:willConnectToSession:options:` calls `[self boot]` unconditionally | Each new scene creates a new `KrollBridge` (memory leak, state conflict) |
| **Shared `launchOptions`** | Scene delegate shares mutable `launchOptions` dict with app delegate | URL mutations in one scene affect another |
| **No scene cleanup** | No `sceneDidDisconnect` handler | Dismissed scenes remain in memory, no state cleanup |
| **Global notifications without scene context** | `kTiSuspendNotification`, `kTiPausedNotification` etc. fire without scene identifier | Cannot determine which scene triggered the event |

---

## Goals

1. Support **multiple concurrent scenes** (iPadOS Split View, Slide Over)
2. Expose a **JavaScript API** for scene discovery and management
3. Handle **scene-specific events** (URLs, activities, trait changes)
4. Enable **scene-specific windows** and UI state
5. Maintain **backwards compatibility** with existing apps

---

## Implementation Plan

### Phase 0: Bug Fixes (Prerequisites)

Fix the discovered bugs before implementing multi-scene features.

#### 0.1 Eliminate Double Event Firing

**Problem:** Both app delegate and scene delegate fire the same lifecycle notifications.

**Solution:** Fire notifications only from scene delegate (single source of truth).

**File:** `iphone/TitaniumKit/.../API/TiApp.m`

```objc
// Remove notification firing from app delegate methods:
- (void)applicationWillResignActive:(UIApplication *)application {
    // Don't fire kTiSuspendNotification here – scene delegate handles it
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    // Don't fire kTiResumedNotification here
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    // Don't fire kTiPausedNotification here
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    // Don't fire kTiResumeNotification here
}
```

**Keep** app delegate firing as fallback for non-scene-based apps (check if scene delegate exists).

#### 0.2 Guard Boot Per Scene

**Problem:** Each new scene creates a `KrollBridge` instance.

**Solution:** Only boot once, share `KrollBridge` across scenes.

```objc
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session
        options:(UISceneConnectionOptions *)connectionOptions {
    // Boot only once
    if (kjsBridge == nil) {
        [self boot];
    }
}
```

#### 0.3 Add Scene Disconnect Handler

**Problem:** No cleanup when a scene is dismissed.

**Solution:** Implement `sceneDidDisconnect` and `sceneDidDismissWithTransitionOptions`.

```objc
- (void)scene:(UIScene *)scene didDisconnect:(UISceneSession *)session {
    // Cleanup scene-specific state
    [self unregisterSceneForSession:session];
    [window makeKeyAndVisible]; // if primary scene disconnects
}

- (void)scene:(UIScene *)scene didDismissWithTransitionOptions:(UISceneTransitionOptions *)transitionOptions {
    // Scene was dismissed (e.g., Slide Over closed)
    // Fire scenediddismiss event
}
```

#### 0.4 Add Scene Context to Notifications

**Problem:** Global notifications don't include which scene triggered them.

**Solution:** Add `scene` property to all lifecycle notifications.

```objc
- (void)sceneWillResignActive:(UIScene *)scene {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiSuspendNotification
                                                        object:self
                                                      userInfo:@{ @"scene" : scene.session.sceneUUID.UUIDString }];
}
```

---

### Phase 1: Native Architecture – Scene Registry

**Problem:** `sharedApp` tracks only one scene. Multiple scenes create conflicting state.

**Solution:** Centralized scene registry managing all active `TiApp` instances.

#### 1.1 Create `TiSceneRegistry`

New class to manage scene lifecycle and state:

```objc
// TiSceneRegistry.h
@interface TiSceneRegistry : NSObject
+ (instancetype)sharedRegistry;
- (void)registerScene:(TiApp *)scene forSession:(UISceneSession *)session;
- (void)unregisterSceneForSession:(UISceneSession *)session;
- (NSDictionary<NSString *, TiApp *> *)allScenes;
- (TiApp *)sceneForSession:(UISceneSession *)session;
- (TiApp *)primaryScene;
- (NSUInteger)sceneCount;
@end
```

**Files:**
- `iphone/TitaniumKit/TitaniumKit/Sources/API/TiSceneRegistry.h` (new)
- `iphone/TitaniumKit/TitaniumKit/Sources/API/TiSceneRegistry.m` (new)

**Responsibilities:**
- Track all active `TiApp` scene instances
- Identify primary scene (first created or last active)
- Provide scene lookup by session ID
- Broadcast scene lifecycle events

#### 1.2 Update `TiApp` – Scene Identification

Each `TiApp` instance needs a unique scene identifier:

```objc
// TiApp.h additions
@property (nonatomic, readonly) NSString *sceneId;
@property (nonatomic, readonly) NSString *sceneName;
@property (nonatomic, assign) BOOL isPrimaryScene;
```

**Changes to `TiApp.m`:**
- Generate `sceneId` from `UIScene.session.sceneUUID`
- Set `sceneName` from configuration or default
- Register/unregister with `TiSceneRegistry` in scene lifecycle methods

#### 1.3 Refactor `sharedApp` Logic

Replace single `sharedApp` with registry-aware accessors:

```objc
// Before
TiApp *sharedApp;
+ (TiApp *)app { return sharedApp; }

// After
+ (TiApp *)app { return [[TiSceneRegistry sharedRegistry] primaryScene]; }
+ (TiApp *)sceneForUUID:(NSUUID *)sceneUUID;
+ (NSArray<TiApp *> *)allActiveScenes;
```

---

### Phase 2: JavaScript API – Scene Object

**Problem:** No way to query or manage scenes from JavaScript.

**Solution:** New `Ti.App.iOS.Scene` proxy with properties and events.

#### 2.1 Create Scene Proxy Module

**File:** `iphone/Classes/TiSceneProxy.m` (new)

```javascript
// JavaScript API
const scene = Ti.App.iOS.currentScene;
console.log(scene.id);           // "scene-uuid-string"
console.log(scene.name);         // "Default Configuration"
console.log(scene.isPrimary);    // true/false
console.log(scene.isActive);     // true/false
console.log(scene.window);       // Ti.UI.Window in this scene
console.log(scene.traitCollection); // { userInterfaceIdiom, sizeClass, ... }
```

**Properties:**
| Property | Type | Description |
|---|---|---|
| `id` | String | Scene UUID |
| `name` | String | Scene configuration name |
| `isPrimary` | Boolean | First/primary scene |
| `isActive` | Boolean | Currently active scene |
| `isForeground` | Boolean | Not in background |
| `window` | Ti.UI.Window | Root window for this scene |
| `traitCollection` | Object | Interface idiom, size classes, etc. |

#### 2.2 Add `Ti.App.iOS` Extensions

**File:** `iphone/Classes/TiAppiOSProxy.m` (extend)

```javascript
// Current scenes
const scenes = Ti.App.iOS.scenes; // Array<Ti.App.iOS.Scene>

// Active scene
const current = Ti.App.iOS.currentScene; // Ti.App.iOS.Scene | null

// Event listeners
Ti.App.iOS.addEventListener('scenewillconnect', e => {
    console.log('Scene connected:', e.scene.id);
});

Ti.App.iOS.addEventListener('scenedidbecomeactive', e => {
    console.log('Scene active:', e.scene.id);
});

Ti.App.iOS.addEventListener('scenewillresignactive', e => {
    console.log('Scene inactive:', e.scene.id);
});

Ti.App.iOS.addEventListener('scenedidenterbackground', e => {
    console.log('Scene backgrounded:', e.scene.id);
});

Ti.App.iOS.addEventListener('scenewillenterforeground', e => {
    console.log('Scene foreground:', e.scene.id);
});

Ti.App.iOS.addEventListener('scenediddismiss', e => {
    console.log('Scene dismissed:', e.scene.id);
});
```

**Events:**
| Event | Properties | When |
|---|---|---|
| `scenewillconnect` | `scene`, `connectionOptions` | New scene created |
| `scenedidbecomeactive` | `scene` | Scene becomes active |
| `scenewillresignactive` | `scene` | Scene loses focus |
| `scenedidenterbackground` | `scene` | Scene backgrounded |
| `scenewillenterforeground` | `scene` | Scene returning |
| `scenediddismiss` | `scene` | Scene closed/removed |

#### 2.3 Scene-Specific Window Association

Track which `Ti.UI.Window` instances belong to which scene:

```javascript
// Window now has scene reference
const win = Ti.UI.createWindow();
win.open();
console.log(win.scene); // Ti.App.iOS.Scene
```

**Changes:**
- `TiUIWindowProxy.m`: Associate window with creating scene
- `TiUIViewProxy.m`: Inherit scene from parent view
- `Ti.App.iOS.currentScene` returns scene of active window

---

### Phase 3: Scene-Specific State Management

**Problem:** Shared state (`launchOptions`, `session`, `krollBridge`) conflicts across scenes.

#### 3.1 Per-Scene Launch Options

Each scene should have its own `launchOptions` for URL/activity context:

```objc
// TiApp.m
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session 
        options:(UISceneConnectionOptions *)connectionOptions {
    // Don't share launchOptions – create scene-specific copy
    launchOptions = [[NSMutableDictionary alloc] init];
    
    // Copy base options from app delegate
    id<UIApplicationDelegate> appDel = [[UIApplication sharedApplication] delegate];
    if (appDel != self && [appDel isKindOfClass:[TiApp class]]) {
        [launchOptions setDictionary:[(TiApp *)appDel launchOptions]];
    }
    
    // Override with scene-specific URL/activity
    // ...
}
```

#### 3.2 Per-Scene Kroll Bridge (Optional)

For true isolation, each scene could have its own JS context:

```objc
// Share contextGroup but allow separate bridges
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session 
        options:(UISceneConnectionOptions *)connectionOptions {
    // Boot only once per app, not per scene
    if (kjsBridge == nil) {
        [self boot];
    }
}
```

**Decision:** Keep single `KrollBridge` for shared state, but track per-scene UI state.

#### 3.3 Trait Collection Changes

Expose size class and idiom changes per scene:

```objc
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session 
        options:(UISceneConnectionOptions *)connectionOptions {
    // Listen for trait changes
    [window setNeedsUpdateOfSupportedInterfaceOrientations];
}

- (void)traitCollectionDidChange:(UITraitCollection *)previousCollection {
    // Fire traitcollectionchange event with scene context
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiTraitCollectionChange 
                                                        object:self 
                                                      userInfo:@{ @"scene" : sceneId, 
                                                                  @"traitCollection" : ... }];
}
```

---

### Phase 4: Configuration and Backwards Compatibility

#### 4.1 Enable Multi-Scene for Generated Apps

**File:** `support/iphone/Info.plist`

```xml
<key>UIApplicationSceneManifest</key>
<dict>
    <key>UIApplicationSupportsMultipleScenes</key>
    <true/>
    <key>UISceneConfigurations</key>
    <dict>
        <key>UIWindowSceneSessionRoleApplication</key>
        <array>
            <dict>
                <key>UISceneConfigurationName</key>
                <string>Default Configuration</string>
                <key>UISceneDelegateClassName</key>
                <string>TiApp</string>
            </dict>
        </array>
    </dict>
</dict>
```

**Also add:** CarPlay scene configuration (optional):
```xml
<key>UICarWindowSceneSessionRoleApplication</key>
<array>
    <dict>
        <key>UISceneConfigurationName</key>
        <string>CarPlay Configuration</string>
        <key>UISceneDelegateClassName</key>
        <string>TiApp</string>
    </dict>
</array>
```

#### 4.2 Allow Scene Configuration via `tiapp.xml`

Add optional config block:

```xml
<ti:app xmlns:ti="http://ti.app_config/ns">
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
</ti:app>
```

**Implementation:**
- `iphone/cli/hooks/` – Parse `tiapp.xml` and inject scene manifest
- Fallback to single-scene if not configured

---

### Phase 5: Testing

#### 5.1 Native Unit Tests

**File:** `iphone/TitaniumKit/TitaniumKit/Tests/TiSceneRegistryTests.m` (new)

- Test scene registration/unregistration
- Test primary scene selection
- Test concurrent scene count
- Test scene lookup by UUID

#### 5.2 Integration Tests

**File:** `tests/Resources/ti.app.ios.scenes.test.js` (new)

```javascript
describe('Ti.App.iOS Scenes', function () {
    it('should return current scene', function () {
        should(Ti.App.iOS.currentScene).be.Object();
        should(Ti.App.iOS.currentScene.id).be.String();
    });

    it('should list all active scenes', function () {
        const scenes = Ti.App.iOS.scenes;
        should(scenes).be.Array();
        should(scenes.length).be.Number();
    });

    it('should fire scenewillconnect on new scene', function (done) {
        Ti.App.iOS.addEventListener('scenewillconnect', function (e) {
            should(e.scene).be.Object();
            done();
        });
        // Trigger via iPad Split View (manual test on device)
    });

    it('should have scene-specific launch options', function () {
        const scene = Ti.App.iOS.currentScene;
        should(scene.launchOptions).be.Object();
    });
});
```

#### 5.3 Manual Test Checklist

- [ ] Launch app on iPad in Split View
- [ ] Verify both scenes have independent windows
- [ ] Open URL in secondary scene → `handleurl` fires with correct scene
- [ ] Rotate one scene → trait collection update per scene
- [ ] Close secondary scene → `scenediddismiss` fires
- [ ] Verify `Ti.App.iOS.scenes` updates dynamically
- [ ] Verify backwards compatibility with single-scene apps

---

## File Changes Summary

| File | Action | Description |
|---|---|---|
| `iphone/TitaniumKit/.../API/TiSceneRegistry.h` | **New** | Scene registry header |
| `iphone/TitaniumKit/.../API/TiSceneRegistry.m` | **New** | Scene registry implementation |
| `iphone/TitaniumKit/.../API/TiApp.h` | Modify | Add scene properties, class methods, sceneId |
| `iphone/TitaniumKit/.../API/TiApp.m` | Modify | **Phase 0:** Fix double events, boot guard, disconnect handler. **Phase 1:** Registry integration. **Phase 3:** Per-scene state. |
| `iphone/Classes/TiSceneProxy.m` | **New** | JavaScript scene proxy (`Ti.App.iOS.Scene`) |
| `iphone/Classes/TiSceneProxy.h` | **New** | JavaScript scene proxy header |
| `iphone/Classes/TiAppiOSProxy.m` | Modify | Add `scenes`, `currentScene`, scene events |
| `iphone/Classes/TiAppiOSProxy.h` | Modify | Add scene properties |
| `iphone/Classes/TiUIWindowProxy.m` | Modify | Associate window with creating scene |
| `iphone/Classes/TiUIViewProxy.m` | Modify | Inherit scene from parent view |
| `iphone/Classes/TiModule.m` | Modify | Update notification handlers to accept scene context |
| `support/iphone/Info.plist` | Modify | Enable multi-scene, add CarPlay config |
| `tests/Resources/ti.app.ios.scenes.test.js` | **New** | Integration tests |
| `iphone/TitaniumKit/.../Tests/TiSceneRegistryTests.m` | **New** | Native unit tests |
| `apidoc/Titanium/Modules/iOS.yml` | Modify | Document scene API |

---

## Dependencies and Risks

| Dependency | Risk | Mitigation |
|---|---|---|
| iOS 13+ Scene API | None (already minimum iOS 15) | ✅ |
| Single KrollBridge | Shared state conflicts | Per-scene UI state tracking, guard boot |
| Backwards compatibility | Existing apps break | Configurable via `tiapp.xml`, app delegate fallback |
| Memory management | Multiple scene instances | Proper cleanup on `scenediddismiss`, registry tracking |
| iPad-only feature | iPhone testing gap | Graceful degradation on iPhone (single scene) |
| **Double event firing** | **Modules receive events twice** | **Phase 0: Fix – single source from scene delegate** |
| **Boot per scene** | **Multiple KrollBridge instances** | **Phase 0: Fix – guard with `if (kjsBridge == nil)`** |
| **No disconnect handler** | **Memory leaks, stale state** | **Phase 0: Fix – implement `sceneDidDisconnect`** |

---

## Implementation Order

1. **Phase 0** – Bug fixes (prerequisites: double events, boot guard, disconnect handler)
2. **Phase 1** – Scene registry and native architecture (foundation)
3. **Phase 2** – JavaScript API (developer visibility)
4. **Phase 3** – Per-scene state (correctness)
5. **Phase 4** – Configuration and multi-scene enablement
6. **Phase 5** – Tests and validation

---

## Success Criteria

### Phase 0 (Bug Fixes)
- [ ] No double event firing (verified: modules receive lifecycle events once)
- [ ] Single `KrollBridge` instance across all scenes
- [ ] Scene cleanup on dismiss (no memory leaks)
- [ ] Notifications include scene identifier

### Phase 1-2 (Core Features)
- [ ] Multiple scenes run concurrently on iPadOS Split View
- [ ] `Ti.App.iOS.currentScene` returns active scene
- [ ] `Ti.App.iOS.scenes` lists all active scenes
- [ ] Scene lifecycle events fire with scene context
- [ ] Scene proxy exposes correct properties (id, name, isPrimary, isActive)

### Phase 3-4 (State & Config)
- [ ] URLs/activities route to correct scene
- [ ] Trait collection changes per scene
- [ ] Windows associate with creating scene
- [ ] Multi-scene configurable via `tiapp.xml`
- [ ] Backwards compatible with single-scene apps

### Phase 5 (Testing)
- [ ] All existing tests pass (no regressions)
- [ ] New scene tests pass
- [ ] Manual iPad Split View test passes
