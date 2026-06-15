# iOS Multi-Scene Baseline – Bug Fixes & Minimal Support

## Goal

Fix current bugs and enable baseline multi-scene support **without breaking changes**. Prepare for future `sharedApp` → `sharedScene` migration.

**No new JS API, no new classes** – only internal fixes to make existing code work correctly with multiple scenes.

---

## Discovered Bugs

| # | Bug | Location | Symptom |
|---|---|---|---|
| **1** | Double event firing | `TiApp.m` lines 1060–1130 | Both app delegate AND scene delegate fire `kTiSuspendNotification`, `kTiResumedNotification`, `kTiPausedNotification`, `kTiResumeNotification` |
| **2** | Boot per scene | `TiApp.m` line 1268 | `scene:willConnectToSession:options:` calls `[self boot]` unconditionally → new `KrollBridge` per scene |
| **3** | Shared `launchOptions` | `TiApp.m` line 1253 | Mutable dict copied from app delegate → URL mutations in one scene leak to another |
| **4** | No disconnect handler | `TiApp.m` | No `sceneDidDisconnect` / `sceneDidDismiss` → dismissed scenes remain in memory |
| **5** | No scene context in notifications | `TiApp.m` lines 1060–1130 | Lifecycle notifications fire without scene identifier → cannot determine source scene |

---

## Implementation Plan

### Step 1: Fix Double Event Firing

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

**Problem:** App delegate and scene delegate both fire the same notifications.

**Fix:** Let scene delegate be the single source of truth. Keep app delegate as fallback for non-scene apps.

```objc
// In app delegate methods – only fire if no scene delegate is active:
- (void)applicationWillResignActive:(UIApplication *)application {
    // Only fire if running without scene delegate (non-scene app)
    if (![UIApplication sharedApplication].connectedScenes ||
        [UIApplication sharedApplication].connectedScenes.count == 0) {
        [[NSNotificationCenter defaultCenter] postNotificationName:kTiSuspendNotification object:self];
    }
}

// Same pattern for applicationDidBecomeActive, applicationDidEnterBackground,
// applicationWillEnterForeground
```

**Alternative (cleaner):** Check if `scene` exists for the firing instance:

```objc
- (void)applicationWillResignActive:(UIApplication *)application {
    if (application.connectedScenes.count > 0) return; // scene delegate handles it
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiSuspendNotification object:self];
}
```

---

### Step 2: Guard Boot – Single KrollBridge

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

**Problem:** Each scene calls `[self boot]` → creates a new `KrollBridge`.

**Fix:** Only boot once, share `KrollBridge` across scenes.

```objc
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session
        options:(UISceneConnectionOptions *)connectionOptions {
    // ... existing window setup ...

    // Boot only once – share KrollBridge across all scenes
    if (kjsBridge == nil) {
        [self boot];
    }

    // ... rest of scene setup ...
}
```

**Why it works:** `sharedApp` is the first scene to connect, it boots. Subsequent scenes reuse the same `kjsBridge` via `sharedApp`.

---

### Step 3: Per-Scene Launch Options

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

**Problem:** `launchOptions` dict is shared (mutable reference) between scenes.

**Fix:** Create an independent copy per scene.

```objc
- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session
        options:(UISceneConnectionOptions *)connectionOptions {
    // Create independent copy – mutations don't leak to other scenes
    if (launchOptions == nil) {
        launchOptions = [[NSMutableDictionary alloc] init];
    }

    // Copy base options from app delegate (if different instance)
    id<UIApplicationDelegate> appDel = [[UIApplication sharedApplication] delegate];
    if (appDel != self && [appDel isKindOfClass:[TiApp class]]) {
        NSDictionary *baseOptions = [(TiApp *)appDel launchOptions];
        if (baseOptions.count > 0) {
            [launchOptions setDictionary:baseOptions];
        }
    }
    // ... rest unchanged ...
}
```

---

### Step 4: Add Scene Disconnect Handler

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

**Problem:** No cleanup when a scene is dismissed.

**Fix:** Implement `sceneDidDisconnect` and `sceneDidDismissWithTransitionOptions`.

```objc
- (void)scene:(UIScene *)scene didDisconnect:(UISceneSession *)session {
    NSUUID *sceneUUID = session.sceneUUID;
    [TiLogD(@"TiApp Scene did disconnect: %@", sceneUUID.UUIDString)];

    // If this is the primary scene (sharedApp), transfer ownership
    if (self == sharedApp) {
        // Try to find another active scene to become sharedApp
        for (UIScene *otherScene in [UIApplication sharedApplication].connectedScenes) {
            if ([otherScene isKindOfClass:[UIWindowScene class]]) {
                // Find the TiApp instance for this scene
                TiApp *otherApp = (TiApp *)otherScene.delegate;
                if (otherApp && otherApp != self) {
                    sharedApp = otherApp;
                    [TiLogD(@"Transferred sharedApp to scene: %@", otherApp.sceneId)];
                    break;
                }
            }
        }
        if (!sharedApp) {
            sharedApp = nil;
        }
    }

    // Cleanup
    [window setDelegate:nil];
    window = nil;
}

- (void)scene:(UIScene *)scene didDismissWithTransitionOptions:(UISceneTransitionOptions *)transitionOptions {
    NSUUID *sceneUUID = session.sceneUUID;
    [TiLogD(@"TiApp Scene did dismiss: %@", sceneUUID.UUIDString)];

    // Fire dismiss notification (for future JS API)
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiSceneDismissNotification
                                                        object:self
                                                      userInfo:@{ @"scene" : sceneUUID.UUIDString }];
}
```

Add notification constant to `TiApp.h`:

```objc
extern NSString *const kTiSceneDismissNotification;
```

---

### Step 5: Add Scene Context to Notifications

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.m`

**Problem:** Lifecycle notifications don't include which scene triggered them.

**Fix:** Add `scene` property to all notification `userInfo` dicts.

```objc
- (void)sceneWillResignActive:(UIScene *)scene {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiSuspendNotification
                                                        object:self
                                                      userInfo:@{ @"scene" : scene.session.sceneUUID.UUIDString }];
}

- (void)sceneDidBecomeActive:(UIScene *)scene {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiResumedNotification
                                                        object:self
                                                      userInfo:@{ @"scene" : scene.session.sceneUUID.UUIDString }];
}

- (void)sceneDidEnterBackground:(UIScene *)scene {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiPausedNotification
                                                        object:self
                                                      userInfo:@{ @"scene" : scene.session.sceneUUID.UUIDString }];
}

- (void)sceneWillEnterForeground:(UIScene *)scene {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiResumeNotification
                                                        object:self
                                                      userInfo:@{ @"scene" : scene.session.sceneUUID.UUIDString }];
}
```

**Backwards compatible:** Existing listeners ignore `userInfo`. Future code can read `scene` key.

---

### Step 6: Add Scene Identifier to TiApp

**File:** `iphone/TitaniumKit/TitaniumKit/Sources/API/TiApp.h`

**Problem:** No way to identify which scene a `TiApp` instance belongs to.

**Fix:** Add `sceneId` property, set during scene connection.

```objc
// TiApp.h
@property (nonatomic, readonly, strong) NSString *sceneId NS_AVAILABLE_IOS(13_0);
```

```objc
// TiApp.m
static NSString *const TiAppSceneIdKey = @"TiAppSceneIdKey";

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session
        options:(UISceneConnectionOptions *)connectionOptions {
    // Set scene identifier
    if (!self.sceneId) {
        self.sceneId = session.sceneUUID.UUIDString;
    }
    // ...
}
```

---

### Step 7: Enable Multi-Scene for Generated Apps

**File:** `support/iphone/Info.plist`

**Fix:** Change `UIApplicationSupportsMultipleScenes` to `true`.

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

---

## File Changes Summary

| File | Changes |
|---|---|
| `iphone/TitaniumKit/.../API/TiApp.h` | Add `sceneId` property, `kTiSceneDismissNotification` constant |
| `iphone/TitaniumKit/.../API/TiApp.m` | Steps 1–5, 6: Fix double events, boot guard, per-scene launchOptions, disconnect handler, scene context, sceneId |
| `support/iphone/Info.plist` | Step 7: Enable multi-scene (`true`) |

**Total:** 3 files, ~40 lines changed/added.

---

## Testing

### Unit Tests

```objc
// Verify single KrollBridge
- (void)testSingleKrollBridgeAcrossScenes {
    [self connectScene:@"scene-1"];
    [self connectScene:@"scene-2"];
    [self connectScene:@"scene-3"];
    XCTAssertEqual([self sceneCount], 3);
    XCTAssertEqual([self krollBridgeCount], 1);
}

// Verify no double events
- (void)testNoDoubleLifecycleEvents {
    __block int suspendCount = 0;
    [[NSNotificationCenter defaultCenter] addObserverForName:kTiSuspendNotification
                                                      object:nil
                                                       queue:nil
                                                  usingBlock:^(NSNotification *note) {
        suspendCount++;
    }];
    [self resignActive];
    XCTAssertEqual(suspendCount, 1);
}

// Verify scene disconnect
- (void)testSceneDisconnectCleanup {
    [self connectScene:@"scene-1"];
    [self disconnectScene:@"scene-1"];
    XCTAssertEqual([self sceneCount], 0);
}
```

### Integration Tests

```javascript
// tests/Resources/ti.app.ios.scene.test.js
describe('Ti.App.iOS Scene Baseline', function () {
    it('should not fire lifecycle events twice', function (done) {
        var count = 0;
        var handler = function () { count++; };
        Ti.App.addEventListener('pause', handler);
        Ti.App.addEventListener('resume', function () {
            Ti.App.removeEventListener('pause', handler);
            if (count === 1) done();
            else done(new Error('pause fired ' + count + ' times, expected 1'));
        });
    });

    it('should have scene context in notifications', function (done) {
        Ti.App.iOS.addEventListener('pause', function (e) {
            // Future: e.scene should exist
            done();
        });
    });
});
```

### Manual Test Checklist

- [ ] Launch app on iPad → single scene works
- [ ] Split View → both scenes functional, no crash
- [ ] Close secondary scene → no memory leak (Instruments)
- [ ] Open URL in secondary scene → routes correctly
- [ ] Rotate one scene → trait collection updates independently
- [ ] Lifecycle events fire once (check console logs)
- [ ] Backwards compatible: launch on iPhone → single scene works

---

## Migration Path (Future)

After baseline is stable, deprecate `sharedApp` in favor of per-scene access:

```objc
// Current (deprecated)
+ (TiApp *)app { return sharedApp; }

// Future
+ (TiApp *)sceneForUUID:(NSUUID *)sceneUUID;
+ (TiApp *)sceneForScene:(UIScene *)scene;
+ (NSArray<TiApp *> *)allScenes;
+ (TiApp *)primaryScene;
```

**Deprecation timeline:**
1. **v13.3.0** – Baseline fixes (this plan)
2. **v13.4.0** – Add `TiSceneRegistry` class, JS API
3. **v14.0.0** – Deprecate `sharedApp`, require scene-aware code

---

## Success Criteria

- [ ] No double event firing (verified in logs)
- [ ] Single `KrollBridge` instance across all scenes
- [ ] Per-scene `launchOptions` (no URL leakage)
- [ ] Scene cleanup on dismiss (Instruments: no leak)
- [ ] Notifications include `scene` in `userInfo`
- [ ] `TiApp.sceneId` returns correct UUID
- [ ] Multi-scene enabled for generated apps
- [ ] All existing tests pass (no regressions)
- [ ] Manual iPad Split View test passes
