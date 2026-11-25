/**
 * Titanium SDK
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

/**
 * The directory that the hot reload client writes changed resources to, or nil when hot reload is off.
 * Hot reload is on only when the app bundle contains "_hot_reload_.json". Only a build with the
 * "--hot-reload" flag writes that file.
 */
+ (NSString *)hotReloadResourcesDirectory;
/**
 * Get the file that the hot reload client wrote for a resource.
 * @param relativePath path relative to resources dir, for example "/app.js"
 * @return the path of the file, or nil when no such file exists or hot reload is off
 */
+ (NSString *)hotReloadPathForResource:(NSString *)relativePath;

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
