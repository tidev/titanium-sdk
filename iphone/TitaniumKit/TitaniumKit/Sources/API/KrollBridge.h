/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Bridge.h"
#import "KrollContext.h"
#import "KrollObject.h"
#import "TiEvaluator.h"
#import "TiModule.h"
#import "TiProxy.h"

@import Foundation;
@import JavaScriptCore;
#include <libkern/OSAtomic.h>

extern NSString *TitaniumModuleRequireFormat;

@interface KrollBridge : Bridge <TiEvaluator, KrollDelegate> {
  @private
  NSURL *currentURL;

  KrollContext *context;
  NSDictionary *preload;
  NSMutableDictionary *modules;
  NSMutableDictionary *packageJSONMainCache;
  NSMutableDictionary *pathCache;
  KrollObject *console;
  BOOL shutdown;
  BOOL evaluationError;
  //NOTE: Do NOT treat registeredProxies like a mutableDictionary; mutable dictionaries copy keys,
  //CFMutableDictionaryRefs only retain keys, which lets them work with proxies properly.
  CFMutableDictionaryRef registeredProxies;
  NSCondition *shutdownCondition;
  OSSpinLock proxyLock;
}
- (void)boot:(id)callback url:(NSURL *)url_ preload:(NSDictionary *)preload_;
- (void)evalJSWithoutResult:(NSString *)code;
- (id)evalJSAndWait:(NSString *)code;
- (BOOL)evaluationError;
- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(TiProxy *)thisObject;
- (id)preloadForKey:(id)key name:(id)name;
- (KrollContext *)krollContext;

+ (NSArray *)krollBridgesUsingProxy:(id)proxy;
+ (BOOL)krollBridgeExists:(KrollBridge *)bridge;
+ (KrollBridge *)krollBridgeForThreadName:(NSString *)threadName;
+ (NSArray *)krollContexts;

- (void)enqueueEvent:(NSString *)type forProxy:(TiProxy *)proxy withObject:(id)obj;
- (void)registerProxy:(id)proxy krollObject:(KrollObject *)ourKrollObject;
- (int)forceGarbageCollectNow;

@end
