/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

@class TiApp;

/**
 * Central registry for managing all active TiApp scene instances.
 * Each scene gets its own TiApp instance, and this registry tracks them
 * so JavaScript can access scene-specific information.
 */
@interface TiSceneRegistry : NSObject

{
  @private
  NSMutableDictionary *_sceneMap;
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

@end
