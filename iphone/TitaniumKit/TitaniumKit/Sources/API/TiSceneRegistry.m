/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiSceneRegistry.h"
#import "TiApp.h"

@implementation TiSceneRegistry

+ (instancetype)sharedRegistry
{
  static TiSceneRegistry *_sharedRegistry = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _sharedRegistry = [[TiSceneRegistry alloc] init];
  });
  return _sharedRegistry;
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _sceneMap = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)registerTiApp:(TiApp *)tiApp forSceneUUID:(NSString *)sceneUUID
{
  if (sceneUUID && tiApp) {
    _sceneMap[sceneUUID] = tiApp;
  }
}

- (void)unregisterTiAppForSceneUUID:(NSString *)sceneUUID
{
  [_sceneMap removeObjectForKey:sceneUUID];
}

- (NSDictionary<NSString *, TiApp *> *)allScenes
{
  return [_sceneMap copy];
}

- (TiApp *)sceneForUUID:(NSString *)sceneUUID
{
  return _sceneMap[sceneUUID];
}

- (TiApp *)primaryScene
{
  NSArray *allUUIDs = [_sceneMap allKeys];
  if (allUUIDs.count > 0) {
    NSString *primaryUUID = allUUIDs[0];
    return _sceneMap[primaryUUID];
  }
  return nil;
}

- (NSUInteger)sceneCount
{
  return _sceneMap.count;
}

@end
