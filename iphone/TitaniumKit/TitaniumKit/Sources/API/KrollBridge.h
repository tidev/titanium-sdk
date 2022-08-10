/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Bridge.h"
#import "TiEvaluator.h"
#import <os/lock.h>

@import Foundation;
@import JavaScriptCore;
#include <libkern/OSAtomic.h>

extern NSString *TitaniumModuleRequireFormat;

@class KrollObject;
@class krollContext;
@class TiProxy;

@interface KrollBridge : Bridge <TiEvaluator, KrollDelegate> {
  @private
  NSURL *currentURL;

  KrollContext *context;
  NSDictionary *preload;
  BOOL shutdown;
  BOOL evaluationError;
  //NOTE: Do NOT treat registeredProxies like a mutableDictionary; mutable dictionaries copy keys,
  //CFMutableDictionaryRefs only retain keys, which lets them work with proxies properly.
  CFMutableDictionaryRef registeredProxies;
  NSCondition *shutdownCondition;
  os_unfair_lock proxyLock;
}
- (void)boot:(id)callback url:(NSURL *)url_ preload:(NSDictionary *)preload_;
- (void)evalJSWithoutResult:(NSString *)code;
- (id)evalJSAndWait:(NSString *)code;
- (BOOL)evaluationError;
- (void)setEvaluationError:(BOOL)value;
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
