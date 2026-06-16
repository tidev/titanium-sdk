/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiProxy.h>
#import <TitaniumKit/TiViewProxy.h>

/**
 * JavaScript proxy for a Ti.App.iOS.Scene object.
 * Exposes scene properties (id, name, isPrimary) to JavaScript.
 */
@interface TiSceneProxy : TiViewProxy

/**
 * The scene UUID (persistentIdentifier).
 */
@property (nonatomic, readonly) NSString *sceneUUID;

/**
 * The TiApp instance for this scene.
 */
@property (nonatomic, readonly) TiApp *tiApp;

/**
 * Convenience accessor — same as sceneId.
 * Provides a natural JS API: scene.id
 */
- (id)id;

/**
 * Initialize with scene UUID and TiApp instance.
 */
- (instancetype)initWithSceneUUID:(NSString *)sceneUUID tiApp:(TiApp *)tiApp;

@end
