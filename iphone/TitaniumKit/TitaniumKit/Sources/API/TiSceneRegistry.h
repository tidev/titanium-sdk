/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

@class TiApp;
@class UIWindow;

/**
 * Central registry for managing all active TiApp scene instances.
 * Each scene gets its own TiApp instance, and this registry tracks them
 * so JavaScript can access scene-specific information.
 */
@interface TiSceneRegistry : NSObject

{
  @private
  NSMutableDictionary *_sceneMap;
  NSMutableDictionary *_sceneActiveState;
  NSMutableDictionary *_sceneForegroundState;
  NSMutableDictionary *_sceneNames;
  NSString *_primarySceneUUID;
}

+ (instancetype)sharedRegistry;

/**
 * Register a TiApp instance for a scene.
 */
- (void)registerTiApp:(TiApp *)tiApp forSceneUUID:(NSString *)sceneUUID;

/**
 * Unregister a TiApp instance for a scene.
 */
- (void)unregisterTiAppForSceneUUID:(NSString *)sceneUUID;

/**
 * Get all registered TiApp instances, keyed by scene UUID.
 */
- (NSDictionary<NSString *, TiApp *> *)allScenes;

/**
 * Get the TiApp instance for a specific scene UUID.
 */
- (TiApp *)sceneForUUID:(NSString *)sceneUUID;

/**
 * Get the primary scene (first connected TiApp instance).
 */
- (TiApp *)primaryScene;

/**
 * Get the number of active scenes.
 */
- (NSUInteger)sceneCount;

/**
 * Find the TiApp instance that owns the given UIWindow.
 * Uses the window's windowScene to look up the registered scene.
 * Returns nil if no matching scene is found.
 */
- (TiApp *)appForWindow:(UIWindow *)window API_AVAILABLE(ios(13_0));

/**
 * Return the scene UUID of the currently focused scene.
 * Uses TiWindow.lastActiveWindow to determine which scene the user
 * last interacted with. This works in Split View, Slide Over, and
 * full-screen modes, unlike isKeyWindow which returns YES for all
 * foreground scenes in Split View.
 * Returns nil if no scene has been interacted with yet.
 */
- (NSString *)focusedSceneUUID API_AVAILABLE(ios(13_0));

/**
 * Set whether a scene is active (foreground and receiving input).
 */
- (void)setSceneActive:(BOOL)active forUUID:(NSString *)sceneUUID;

/**
 * Set whether a scene is in the foreground (visible but may not be active).
 */
- (void)setSceneForeground:(BOOL)foreground forUUID:(NSString *)sceneUUID;

/**
 * Set the configuration name for a scene.
 */
- (void)setSceneName:(NSString *)name forUUID:(NSString *)sceneUUID;

/**
 * Check whether a scene is active.
 */
- (BOOL)isSceneActiveForUUID:(NSString *)sceneUUID;

/**
 * Check whether a scene is in the foreground.
 */
- (BOOL)isSceneForegroundForUUID:(NSString *)sceneUUID;

/**
 * Get the configuration name for a scene.
 */
- (NSString *)sceneNameForUUID:(NSString *)sceneUUID;

@end
