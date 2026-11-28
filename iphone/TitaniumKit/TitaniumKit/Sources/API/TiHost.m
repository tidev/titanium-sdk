/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiHost.h"
#import "TiModule.h"
#import "TiProxy.h"
#import "TiSharedConfig.h"

#ifdef DEBUG
#define DEBUG_EVENTS 0
#endif

@implementation TiHost
@synthesize debugMode;
@synthesize profileMode = _profileMode;

+ (NSString *)resourcePath
{
  NSString *resourcePath = [[NSBundle mainBundle] resourcePath];

#if TARGET_OS_SIMULATOR
  NSString *resourcesDir = [[TiSharedConfig defaultConfig] applicationResourcesDirectory];

  if (resourcesDir != nil && ![resourcesDir isEqualToString:@""]) {
    // if the .local file exists and we're in the simulator, then force load from resources bundle
    NSString *localFilePath = [resourcePath stringByAppendingPathComponent:@".local"];
    if (![[NSFileManager defaultManager] fileExistsAtPath:localFilePath]) {
      // we use our app resource directory
      return resourcesDir;
    }
  }
#endif
  return resourcePath;
}

+ (NSString *)resourceRelativePath:(NSURL *)url
{
  // Get path relative to resources dir...
  // FIXME: This leaves a leading '/'
  return [[url path] stringByReplacingOccurrencesOfString:[TiHost resourcePath] withString:@""];
}

+ (NSString *)hotReloadResourcesDirectory
{
  static NSString *directory = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSString *configPath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"_hot_reload_.json"];
    NSData *configData = [NSData dataWithContentsOfFile:configPath];
    if (configData == nil) {
      return;
    }
    NSDictionary *config = [NSJSONSerialization JSONObjectWithData:configData options:0 error:nil];
    NSString *token = [config isKindOfClass:[NSDictionary class]] ? config[@"token"] : nil;
    if (![token isKindOfClass:[NSString class]]) {
      return;
    }
    NSCharacterSet *unsafeCharacters = [[NSCharacterSet alphanumericCharacterSet] invertedSet];
    token = [[token componentsSeparatedByCharactersInSet:unsafeCharacters] componentsJoinedByString:@""];

    // Must match the directory in the hot reload client (cli/lib/hot-reload/client.js).
    NSString *cacheDir = [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) objectAtIndex:0];
    NSString *rootDir = [[cacheDir stringByAppendingPathComponent:@"hot-reload"] stringByStandardizingPath];

    // The files belong to one build of the app, and iOS keeps the cache directory when the app is
    // installed again. Each build has its own token, so delete the files of another build.
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSString *installFile = [rootDir stringByAppendingPathComponent:[@"install-" stringByAppendingString:token]];
    if (![fileManager fileExistsAtPath:installFile]) {
      [fileManager removeItemAtPath:rootDir error:nil];
      if (![fileManager createDirectoryAtPath:rootDir withIntermediateDirectories:YES attributes:nil error:nil]
          || ![fileManager createFileAtPath:installFile contents:nil attributes:nil]) {
        NSLog(@"[ERROR] Failed to set up the hot reload directory: %@", rootDir);
        return;
      }
    }
    directory = [[rootDir stringByAppendingPathComponent:@"files/Resources"] retain];
    NSLog(@"[INFO] Hot reload is on: %@", directory);
  });
  return directory;
}

+ (NSString *)hotReloadPathForResource:(NSString *)relativePath
{
  NSString *directory = [TiHost hotReloadResourcesDirectory];
  if (directory == nil || relativePath.length == 0) {
    return nil;
  }
  NSString *path = [[directory stringByAppendingPathComponent:relativePath] stringByStandardizingPath];
  if (![path hasPrefix:[directory stringByAppendingString:@"/"]]) {
    return nil;
  }
  BOOL isDirectory = NO;
  if ([[NSFileManager defaultManager] fileExistsAtPath:path isDirectory:&isDirectory] && !isDirectory) {
    return path;
  }
  return nil;
}

+ (NSURL *)resolveFilePathForAppUrl:(NSURL *)appUrl
{
  if (![[appUrl scheme] isEqualToString:@"app"]) { // Whoops! We don't need to translate!
    return appUrl;
  }

  NSString *result = [[self resourcePath] stringByAppendingPathComponent:[appUrl path]];
  return [NSURL fileURLWithPath:result];
}

+ (NSURL *)resourceBasedURL:(NSString *)fn baseURL:(NSString **)base
{
  NSString *fullpath = [[self resourcePath] stringByAppendingPathComponent:fn];
  if (base != NULL) {
    *base = [[fullpath stringByDeletingLastPathComponent] stringByAppendingPathComponent:@"."];
  }
  return [NSURL fileURLWithPath:fullpath];
}

- (id)init
{
  if (self = [super init]) {
    modules = [[NSMutableDictionary alloc] init];
    contexts = TiCreateNonRetainingDictionary();

    // The Titanium "ti.main.js" script is shared by all platforms.
    // It will run the app developer's "app.js" script after loading all JS extensions.
    // Script Location: titanium_mobile/common/Resources
    NSString *fn = @"ti.main.js";
    const char *start = getenv("TI_STARTPAGE");
    if (start != NULL) {
      fn = [NSString stringWithCString:start encoding:NSUTF8StringEncoding];
    }
    NSString *base;
    NSURL *url = [TiHost resourceBasedURL:fn baseURL:&base];
    startURL = [url retain];
    baseURL = [[NSURL fileURLWithPath:base] retain];
    stylesheet = [[TiStylesheet alloc] init];
    debugMode = NO;
    _profileMode = NO;
  }
  return self;
}

- (NSString *)appID
{
  return [[TiSharedConfig defaultConfig] applicationID];
}

- (NSURL *)baseURL
{
  return baseURL;
}

- (NSURL *)startURL
{
  return startURL;
}

- (TiStylesheet *)stylesheet
{
  return stylesheet;
}

- (void)dealloc
{
  RELEASE_TO_NIL(modules);
  RELEASE_TO_NIL(contexts);
  RELEASE_TO_NIL(baseURL);
  RELEASE_TO_NIL(startURL);
  RELEASE_TO_NIL(stylesheet);
  [super dealloc];
}

- (id<TiEvaluator>)contextForToken:(NSString *)token
{
  return [contexts objectForKey:token];
}

- (void)registerContext:(id<TiEvaluator>)context forToken:(NSString *)token
{
  [contexts setValue:context forKey:token];
}

- (void)unregisterContext:(id<TiEvaluator>)context forToken:(NSString *)token
{
  [contexts removeObjectForKey:token];
}

- (KrollBridge *)krollBridge
{
  // For subclasses
  return nil;
}

- (id<Module>)moduleNamed:(NSString *)name context:(id<TiEvaluator>)context
{
  // May be be a TiModule* or an ObjcProxy*
  id<Module> m = [modules objectForKey:name];
  if (m == nil || [m destroyed]) // Need to re-allocate any modules which have been destroyed
  {
    @synchronized(self) {
      m = [modules objectForKey:name];
      if (m == nil || [m destroyed]) {
        Class moduleClass = NSClassFromString(name);
        if (moduleClass != nil) {
          if ([moduleClass isSubclassOfClass:[TiModule class]]) {
            m = [[moduleClass alloc] _initWithPageContext:context];
          } else {
            // assume new obj-c style ObjcProxy
            m = [[moduleClass alloc] init];
          }
          [m setHost:self];
          [modules setObject:m forKey:name];
          [m release];
        }
      }
    }
  }

  return m;
}

- (void)evaluateJS:(NSString *)js context:(id<TiEvaluator>)evaluator
{
  [evaluator evalJSWithoutResult:js];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn context:(id<TiEvaluator>)evaluator thisObject:(TiProxy *)thisObject_
{
#if DEBUG_EVENTS == 1
  NSLog(@"[DEBUG] fireEvent: %@, object: %@", listener, obj);
#endif
  [evaluator fireEvent:listener
            withObject:obj
                remove:yn
            thisObject:thisObject_];
}

- (void)removeListener:(id)listener context:(id<TiEvaluator>)context
{
}

@end
