/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiSceneRegistry.h"
#import "KrollPromise.h"
#import "TiApp.h"
#import "TiBindingTiValue.h"
#import "TiSceneProxy.h"
#import "TiWindow.h"
#import <UIKit/UIKit.h>

NSString *const kTiSceneRequestActivityType = @"org.titanium.scene-request";

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
    _pendingSceneRequests = [[NSMutableDictionary alloc] init];
    _sceneOrder = [[NSMutableArray alloc] init];
  }
  return self;
}

- (void)registerTiApp:(TiApp *)tiApp forSceneUUID:(NSString *)sceneUUID
{
  if (sceneUUID && tiApp) {
    if (_sceneMap[sceneUUID] == nil) {
      [_sceneOrder addObject:sceneUUID];
    }
    _sceneMap[sceneUUID] = tiApp;
    if (_primarySceneUUID == nil) {
      _primarySceneUUID = [sceneUUID copy];
    }
  }
}

- (void)unregisterTiAppForSceneUUID:(NSString *)sceneUUID
{
  [self unregisterSceneProxyForUUID:sceneUUID];
  [_sceneOrder removeObject:sceneUUID];
  [_sceneMap removeObjectForKey:sceneUUID];
  [_sceneActiveState removeObjectForKey:sceneUUID];
  [_sceneForegroundState removeObjectForKey:sceneUUID];
  [_sceneNames removeObjectForKey:sceneUUID];
  if ([sceneUUID isEqualToString:_primarySceneUUID]) {
    [_primarySceneUUID release];
    _primarySceneUUID = [[_sceneOrder firstObject] copy];
  }
}

- (NSDictionary<NSString *, TiApp *> *)allScenes
{
  return [[_sceneMap copy] autorelease];
}

- (TiApp *)sceneForUUID:(NSString *)sceneUUID
{
  return sceneUUID == nil ? nil : _sceneMap[sceneUUID];
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
  if (sceneUUID == nil || [self isSceneActiveForUUID:sceneUUID] == active) {
    return;
  }
  _sceneActiveState[sceneUUID] = @(active);
  TiSceneProxy *proxy = [self sceneProxyForUUID:sceneUUID];
  if (proxy != nil) {
    [proxy fireEvent:active ? @"focus" : @"blur" withObject:@{ @"sceneId" : sceneUUID, @"scene" : proxy }];
  }
}

- (void)setSceneForeground:(BOOL)foreground forUUID:(NSString *)sceneUUID
{
  if (sceneUUID == nil || [self isSceneForegroundForUUID:sceneUUID] == foreground) {
    return;
  }
  _sceneForegroundState[sceneUUID] = @(foreground);
  TiSceneProxy *proxy = [self sceneProxyForUUID:sceneUUID];
  if (proxy != nil) {
    [proxy fireEvent:foreground ? @"resumed" : @"paused" withObject:@{ @"sceneId" : sceneUUID, @"scene" : proxy }];
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

#pragma mark - Scene activation requests

- (NSString *)registerSceneRequest:(KrollPromise *)promise owner:(TiApp *)owner
{
  NSString *requestId = [[NSUUID UUID] UUIDString];
  _pendingSceneRequests[requestId] = @{ @"promise" : promise, @"owner" : owner };
  return requestId;
}

- (NSDictionary *)takeSceneRequest:(NSString *)requestId
{
  if (requestId == nil) {
    return nil;
  }
  NSDictionary *request = [[_pendingSceneRequests[requestId] retain] autorelease];
  [_pendingSceneRequests removeObjectForKey:requestId];
  return request;
}

- (void)completeSceneRequest:(NSString *)requestId scene:(TiSceneProxy *)scene
{
  KrollPromise *promise = [[self takeSceneRequest:requestId] objectForKey:@"promise"];
  if (promise == nil || scene == nil) {
    return;
  }
  JSContext *context = promise.JSValue.context;
  JSValueRef value = TiBindingTiValueFromNSObject(context.JSGlobalContextRef, scene);
  JSValue *boundScene = [JSValue valueWithJSValueRef:value inContext:context];
  [promise resolve:@[ @{ @"scene" : boundScene } ]];
}

- (void)rejectSceneRequest:(NSString *)requestId message:(NSString *)message
{
  KrollPromise *promise = [[self takeSceneRequest:requestId] objectForKey:@"promise"];
  [promise rejectWithErrorMessage:message];
}

- (void)cancelSceneRequestsForOwner:(TiApp *)owner
{
  for (NSString *requestId in [[[_pendingSceneRequests allKeys] copy] autorelease]) {
    if (_pendingSceneRequests[requestId][@"owner"] == owner) {
      [self rejectSceneRequest:requestId message:@"The requesting scene disconnected"];
    }
  }
}

- (NSUInteger)pendingSceneRequestCount
{
  return _pendingSceneRequests.count;
}

- (BOOL)hasActiveScenes
{
  return [[_sceneActiveState allValues] containsObject:@YES];
}

- (void)dealloc
{
  [_sceneMap release];
  [_sceneActiveState release];
  [_sceneForegroundState release];
  [_sceneNames release];
  [_primarySceneUUID release];
  [_sceneProxyMap release];
  [_pendingSceneRequests release];
  [_sceneOrder release];
  [super dealloc];
}

@end
