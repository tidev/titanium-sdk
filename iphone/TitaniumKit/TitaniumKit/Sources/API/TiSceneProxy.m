/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiSceneProxy.h"
#import "TiRootViewController.h"
#import "TiSceneRegistry.h"
#import "TiUtils.h"
#import "TiWindow.h"
#import "TiWindowProxy.h"

@implementation TiSceneProxy

@synthesize sceneUUID = _sceneUUID;
@synthesize tiApp = _tiApp;

- (instancetype)initWithSceneUUID:(NSString *)sceneUUID tiApp:(TiApp *)tiApp
{
  self = [super init];
  if (self) {
    _sceneUUID = [sceneUUID copy];
    _tiApp = tiApp;
  }
  return self;
}

#pragma mark - Property getters

- (id)sceneId
{
  return _sceneUUID;
}

- (id)id
{
  return [self sceneId];
}

- (id)sceneName
{
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  NSString *name = [registry sceneNameForUUID:_sceneUUID];
  return name ?: @"Default Configuration";
}

- (id)isPrimary
{
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  TiApp *primary = [registry primaryScene];
  return NUMBOOL([primary isEqual:_tiApp]);
}

- (id)isActive
{
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  return NUMBOOL([registry isSceneActiveForUUID:_sceneUUID]);
}

- (id)isForeground
{
  TiSceneRegistry *registry = [TiSceneRegistry sharedRegistry];
  return NUMBOOL([registry isSceneForegroundForUUID:_sceneUUID]);
}

- (id)isKey
{
  // In multi-scene mode, isKeyWindow returns YES for all foreground scenes
  // and activationState == ForegroundActive is true for all visible scenes.
  // Instead, use TiWindow.lastActiveWindow which tracks which window was
  // last touched, giving a reliable focus indicator in all multitasking modes.
  if (@available(iOS 13.0, *)) {
    UIWindow *lastActive = [TiWindow lastActiveWindow];
    UIWindow *myWindow = [_tiApp window];
    if (lastActive != nil && myWindow != nil && lastActive == myWindow) {
      return NUMBOOL(YES);
    }
  }
  return NUMBOOL(NO);
}

- (id)window
{
  if (_tiApp != nil && [_tiApp controller] != nil) {
    // The root view controller's proxy is the root window for this scene
    id rootProxy = [[_tiApp controller] proxy];
    if ([rootProxy isKindOfClass:[TiWindowProxy class]]) {
      return rootProxy;
    }
  }
  return [NSNull null];
}

- (id)traitCollection
{
  if (@available(iOS 13.0, *)) {
    if (_tiApp != nil && [_tiApp window] != nil) {
      UIWindowScene *windowScene = [[_tiApp window] windowScene];
      if (windowScene != nil) {
        UITraitCollection *traits = [windowScene traitCollection];
        return @{
          @"userInterfaceStyle" : @((NSInteger)traits.userInterfaceStyle),
          @"horizontalSizeClass" : @((NSInteger)traits.horizontalSizeClass),
          @"verticalSizeClass" : @((NSInteger)traits.verticalSizeClass),
          @"displayScale" : @(traits.displayScale),
          @"layoutDirection" : @((NSInteger)traits.layoutDirection)
        };
      }
    }
  }
  return [NSNull null];
}

@end