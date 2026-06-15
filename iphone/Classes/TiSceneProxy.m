/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiSceneProxy.h"
#import "TiApp.h"
#import "TiUtils.h"

@implementation TiSceneProxy

- (instancetype)initWithSceneUUID:(NSString *)sceneUUID tiApp:(TiApp *)tiApp
{
  self = [super initWithTitaniumObject:nil];
  if (self) {
    _sceneUUID = [sceneUUID copy];
    _tiApp = tiApp;
  }
  return self;
}

#pragma mark - TiViewProxy overrides

- (TiView *)createTiView
{
  return nil;
}

- (TiUIView *)createProxy
{
  return nil;
}

#pragma mark - Property getters

- (id)sceneId
{
  return _sceneUUID;
}

- (id)sceneName
{
  // Scene name from configuration or default
  NSString *name = _tiApp.sceneName;
  return name ?: @"Default Configuration";
}

- (id)isPrimary
{
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  TiApp *primary = [registry primaryScene];
  return [TiUtils boolValue:[primary isEqual:_tiApp]];
}

- (id)isActive
{
  // Scene is active if it's the primary scene
  return [self isPrimary];
}

- (id)isForeground
{
  // Scene is in foreground if it's active
  return [self isActive];
}

- (id)window
{
  // Return the root window proxy for this scene
  UIWindow *window = _tiApp.window;
  if (window) {
    // Find the window proxy
    TiUIView *view = [window viewWithTag:1000];
    if (view) {
      return [view proxy];
    }
  }
  return nil;
}

- (id)traitCollection
{
  UIWindow *window = _tiApp.window;
  if (window && window.traitCollection) {
    return @{
      @"userInterfaceIdiom" : @(window.traitCollection.userInterfaceIdiom),
      @"horizontalSizeClass" : @(window.traitCollection.horizontalSizeClass),
      @"verticalSizeClass" : @(window.traitCollection.verticalSizeClass)
    };
  }
  return [NSNull null];
}

#pragma mark - Proxy registration

+ (void)registerWithRegistry:(TiRegistry *)registry
{
  [registry registerProxy:[TiSceneProxy class] forType:@"TiAppiOSScene"];
}

@end
