/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "Bridge.h"
#import "Module.h"
#import "TiEvaluator.h"
#import "TiProxy.h"
#import "TiStylesheet.h"

@interface TiHost : NSObject {
  NSMutableDictionary<NSString *, id<Module>> *modules;
  NSMutableDictionary<NSString *, id<TiEvaluator>> *contexts;
  NSURL *startURL;
  NSURL *baseURL;
  TiStylesheet *stylesheet;
  BOOL debugMode;
}
@property (nonatomic, assign) BOOL debugMode;
@property (nonatomic, assign) BOOL profileMode;

- (NSString *)appID;
- (NSURL *)baseURL;
- (NSURL *)startURL;
+ (NSString *)resourcePath;
/**
 * Get path relative to resources dir.
 * @param url a file URL
 */
+ (NSString *)resourceRelativePath:(NSURL *)url;

- (TiStylesheet *)stylesheet;

+ (NSURL *)resourceBasedURL:(NSString *)fn baseURL:(NSString **)base;

- (id<Module>)moduleNamed:(NSString *)name context:(id<TiEvaluator>)context;

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)remove context:(id<TiEvaluator>)context thisObject:(TiProxy *)thisObject_;
- (void)removeListener:(id)listener context:(id<TiEvaluator>)context;
- (void)evaluateJS:(NSString *)js context:(id<TiEvaluator>)context;

- (void)registerContext:(id<TiEvaluator>)context forToken:(NSString *)token;
- (void)unregisterContext:(id<TiEvaluator>)context forToken:(NSString *)token;
- (id<TiEvaluator>)contextForToken:(NSString *)token;

- (KrollBridge *)krollBridge;

@end
