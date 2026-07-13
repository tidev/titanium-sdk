/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiSceneRegistry.h"
#import "TiApp.h"
#import "TiSceneProxy.h"
#import "TiWindow.h"
#import <UIKit/UIKit.h>

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
    _sceneActiveState = [[NSMutableDictionary alloc] init];
    _sceneForegroundState = [[NSMutableDictionary alloc] init];
    _sceneNames = [[NSMutableDictionary alloc] init];
    _sceneProxyMap = [[NSMutableDictionary alloc] init];
    _pendingSceneCallbacks = [[NSMutableArray alloc] init];
    _pendingSceneRequestCount = 0;
  }
  return self;
}

- (void)registerTiApp:(TiApp *)tiApp forSceneUUID:(NSString *)sceneUUID
{
  if (sceneUUID && tiApp) {
    _sceneMap[sceneUUID] = tiApp;
    if (_primarySceneUUID == nil) {
      _primarySceneUUID = [sceneUUID copy];
    }
  }
}

- (void)unregisterTiAppForSceneUUID:(NSString *)sceneUUID
{
  [_sceneMap removeObjectForKey:sceneUUID];
  [_sceneActiveState removeObjectForKey:sceneUUID];
  [_sceneForegroundState removeObjectForKey:sceneUUID];
  [_sceneNames removeObjectForKey:sceneUUID];
  if ([sceneUUID isEqualToString:_primarySceneUUID]) {
    _primarySceneUUID = nil;
  }
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
  if (_primarySceneUUID != nil) {
    return _sceneMap[_primarySceneUUID];
  }
  return nil;
}

- (NSUInteger)sceneCount
{
  return _sceneMap.count;
}

- (TiApp *)appForWindow:(UIWindow *)window
{
  if (window == nil) {
    return nil;
  }

  if (@available(iOS 13.0, *)) {
    UIWindowScene *windowScene = window.windowScene;
    if (windowScene != nil) {
      NSString *sceneUUID = windowScene.session.persistentIdentifier;
      TiApp *tiApp = [self sceneForUUID:sceneUUID];
      if (tiApp != nil) {
        return tiApp;
      }
    }
  }

  // Fallback: check if window is directly owned by any registered TiApp
  for (NSString *uuid in _sceneMap) {
    TiApp *tiApp = _sceneMap[uuid];
    if ([tiApp window] == window) {
      return tiApp;
    }
  }

  return nil;
}

- (NSString *)focusedSceneUUID
{
  if (@available(iOS 13.0, *)) {
    UIWindow *lastActive = [TiWindow lastActiveWindow];
    if (lastActive != nil) {
      UIWindowScene *windowScene = lastActive.windowScene;
      if (windowScene != nil) {
        NSString *sceneUUID = windowScene.session.persistentIdentifier;
        if ([self sceneForUUID:sceneUUID] != nil) {
          return sceneUUID;
        }
      }
    }
  }
  return nil;
}

- (void)setSceneActive:(BOOL)active forUUID:(NSString *)sceneUUID
{
  if (sceneUUID) {
    _sceneActiveState[sceneUUID] = @(active);
  }
}

- (void)setSceneForeground:(BOOL)foreground forUUID:(NSString *)sceneUUID
{
  if (sceneUUID) {
    _sceneForegroundState[sceneUUID] = @(foreground);
  }
}

- (void)setSceneName:(NSString *)name forUUID:(NSString *)sceneUUID
{
  if (sceneUUID && name) {
    _sceneNames[sceneUUID] = name;
  }
}

- (BOOL)isSceneActiveForUUID:(NSString *)sceneUUID
{
  if (sceneUUID == nil) {
    return NO;
  }
  NSNumber *val = _sceneActiveState[sceneUUID];
  return val ? [val boolValue] : NO;
}

- (BOOL)isSceneForegroundForUUID:(NSString *)sceneUUID
{
  if (sceneUUID == nil) {
    return NO;
  }
  NSNumber *val = _sceneForegroundState[sceneUUID];
  return val ? [val boolValue] : NO;
}

- (NSString *)sceneNameForUUID:(NSString *)sceneUUID
{
  if (sceneUUID == nil) {
    return nil;
  }
  return _sceneNames[sceneUUID];
}

#pragma mark - Scene Proxy Registry

- (void)registerSceneProxy:(TiSceneProxy *)proxy forUUID:(NSString *)sceneUUID
{
  if (proxy == nil || sceneUUID == nil) {
    return;
  }
  @synchronized(_sceneProxyMap) {
    _sceneProxyMap[sceneUUID] = proxy;
  }
}

- (void)unregisterSceneProxyForUUID:(NSString *)sceneUUID
{
  if (sceneUUID == nil) {
    return;
  }
  @synchronized(_sceneProxyMap) {
    [_sceneProxyMap removeObjectForKey:sceneUUID];
  }
}

- (TiSceneProxy *)sceneProxyForUUID:(NSString *)sceneUUID
{
  if (sceneUUID == nil) {
    return nil;
  }
  @synchronized(_sceneProxyMap) {
    return _sceneProxyMap[sceneUUID];
  }
}

- (TiSceneProxy *)ensureSceneProxyForUUID:(NSString *)sceneUUID tiApp:(TiApp *)tiApp
{
  if (sceneUUID == nil) {
    return nil;
  }
  @synchronized(_sceneProxyMap) {
    TiSceneProxy *existing = _sceneProxyMap[sceneUUID];
    if (existing != nil) {
      return existing;
    }
    TiSceneProxy *proxy = [[TiSceneProxy alloc] initWithSceneUUID:sceneUUID tiApp:tiApp];
    _sceneProxyMap[sceneUUID] = proxy;
    return [proxy autorelease];
  }
}

#pragma mark - Pending requestScene Callback Queue

- (void)enqueuePendingSceneCallback:(NSDictionary *)pending
{
  if (pending == nil) {
    return;
  }
  [_pendingSceneCallbacks addObject:pending];
  _pendingSceneRequestCount++;
}

- (NSDictionary *)dequeuePendingSceneCallback
{
  if (_pendingSceneCallbacks.count == 0) {
    return nil;
  }
  NSDictionary *head = [[_pendingSceneCallbacks[0] retain] autorelease];
  [_pendingSceneCallbacks removeObjectAtIndex:0];
  if (_pendingSceneRequestCount > 0) {
    _pendingSceneRequestCount--;
  }
  return head;
}

- (NSInteger)pendingSceneRequestCount
{
  return _pendingSceneRequestCount;
}

@end
