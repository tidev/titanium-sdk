/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
  NSString *resourcePath = [[NSBundle mainBundle] bundlePath];

#if TARGET_IPHONE_SIMULATOR
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

+ (NSURL *)resolveFilePathForAppUrl:(NSURL *)appUrl
{
  if (![[appUrl scheme] isEqualToString:@"app"]) { //Whoops! We don't need to translate!
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
  //For subclasses
  return nil;
}

- (id)moduleNamed:(NSString *)name context:(id<TiEvaluator>)context
{
  TiModule *m = [modules objectForKey:name];
  if (m == nil || [m destroyed]) // Need to re-allocate any modules which have been destroyed
  {
    @synchronized(self) {
      m = [modules objectForKey:name];
      if (m == nil || [m destroyed]) {
        Class moduleClass = NSClassFromString([NSString stringWithFormat:@"%@Module", name]);
        if (moduleClass != nil) {
          m = [[moduleClass alloc] _initWithPageContext:context];
          if ([m isKindOfClass:[TiModule class]] && ![m isJSModule]) {
            [m setHost:self];
            [modules setObject:m forKey:name];
            [m release];
          } else {
            [m release];
            m = [[self krollBridge] require:context path:name];
            if (m != nil) {
              [modules setObject:m forKey:name];
            }
          }
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
