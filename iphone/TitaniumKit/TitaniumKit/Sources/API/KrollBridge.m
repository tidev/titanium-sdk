/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollBridge.h"
#import "APSAnalytics.h"
#import "KrollCallback.h"
#import "TiApp.h"
#import "TiConsole.h"
#import "TiExceptionHandler.h"
#import "TiHost.h"
#import "TiSharedConfig.h"
#import "TiUtils.h"
#import "TopTiModule.h"

#ifndef TI_USE_NATIVE
#define TI_USE_NATIVE 0
#endif

NSString *TitaniumModuleRequireFormat = @"(function(exports){"
                                         "var __OXP=exports;var module={'exports':exports};var __dirname=\"%@\";var __filename=\"%@\";%@;\n"
                                         "if(module.exports !== __OXP){return module.exports;}"
                                         "return exports;})({})";

//Defined private method inside TiBindingRunLoop.m (Perhaps to move to .c?)
void TiBindingRunLoopAnnounceStart(TiBindingRunLoop runLoop);

typedef NS_ENUM(NSInteger, FileStatus) {
  FileStatusDoesntExist,
  FileStatusExistsOnDisk,
  FileStatusExistsEncrypted
};

typedef NS_ENUM(NSInteger, ModuleType) {
  Native,
  JS,
  JSON,
  NativeJS
};
@interface ResolvedModule : NSObject {
  @public
  ModuleType type;
  NSString *path;
}
- (id)initWithType:(ModuleType)modType andPath:(NSString *)modPath;
@end

@implementation ResolvedModule
- (id)initWithType:(ModuleType)modType andPath:(NSString *)modPath
{
  if ((self = [super init])) {
    type = modType;
    path = [modPath retain];
  }

  return self;
}

- (void)dealloc
{
  [path release];

  [super dealloc];
}
@end

OSSpinLock krollBridgeRegistryLock = OS_SPINLOCK_INIT;
CFMutableSetRef krollBridgeRegistry = nil;

@implementation KrollBridge

+ (void)initialize
{
  if (krollBridgeRegistry == nil) {
    CFSetCallBacks doNotRetain = kCFTypeSetCallBacks;
    doNotRetain.retain = NULL;
    doNotRetain.release = NULL;
    krollBridgeRegistry = CFSetCreateMutable(NULL, 3, &doNotRetain);
  }
}
@synthesize currentURL;

- (void)registerForMemoryWarning
{
  WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didReceiveMemoryWarning:)
                                               name:UIApplicationDidReceiveMemoryWarningNotification
                                             object:nil];
}

- (void)unregisterForMemoryWarning
{
  WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
}

- (id)init
{
  if (self = [super init]) {
#if KROLLBRIDGE_MEMORY_DEBUG == 1
    NSLog(@"[DEBUG] INIT: %@", self);
#endif
    modules = [[NSMutableDictionary alloc] init];
    packageJSONMainCache = [[NSMutableDictionary alloc] init];
    proxyLock = OS_SPINLOCK_INIT;
    OSSpinLockLock(&krollBridgeRegistryLock);
    CFSetAddValue(krollBridgeRegistry, self);
    OSSpinLockUnlock(&krollBridgeRegistryLock);
    TiThreadPerformOnMainThread(^{
      [self registerForMemoryWarning];
    },
        NO);
  }
  return self;
}

- (void)didReceiveMemoryWarning:(NSNotification *)notification
{
  OSSpinLockLock(&proxyLock);
  if (registeredProxies == NULL) {
    OSSpinLockUnlock(&proxyLock);
    [self gc];
    return;
  }

  BOOL keepWarning = YES;
  signed long proxiesCount = CFDictionaryGetCount(registeredProxies);
  OSSpinLockUnlock(&proxyLock);

  // During a memory panic, we may not get the chance to copy proxies.
  while (keepWarning) {
    keepWarning = NO;

    for (id proxy in [(NSDictionary *)registeredProxies allKeys]) {
      [proxy didReceiveMemoryWarning:notification];

      OSSpinLockLock(&proxyLock);
      if (registeredProxies == NULL) {
        OSSpinLockUnlock(&proxyLock);
        break;
      }

      signed long newCount = CFDictionaryGetCount(registeredProxies);
      OSSpinLockUnlock(&proxyLock);

      if (newCount != proxiesCount) {
        proxiesCount = newCount;
        keepWarning = YES;
        break;
      }
    }
  }

  [self gc];
}

#if KROLLBRIDGE_MEMORY_DEBUG == 1
- (id)retain
{
  NSLog(@"[MEMORY DEBUG] RETAIN: %@ (%d)", self, [self retainCount] + 1);
  return [super retain];
}
- (oneway void)release
{
  NSLog(@"[MEMORY DEBUG] RELEASE: %@ (%d)", self, [self retainCount] - 1);
  [super release];
}
#endif

- (void)removeProxies
{
  OSSpinLockLock(&proxyLock);
  CFDictionaryRef oldProxies = registeredProxies;
  registeredProxies = NULL;
  OSSpinLockUnlock(&proxyLock);

  for (id thisProxy in (NSDictionary *)oldProxies) {
    KrollObject *thisKrollObject = (id)CFDictionaryGetValue(oldProxies, thisProxy);
    [thisProxy contextShutdown:self];
    [thisKrollObject unprotectJsobject];
  }

  if (oldProxies != NULL) {
    CFRelease(oldProxies);
  }

  for (NSString *thisModuleKey in modules) {
    id thisModule = [modules objectForKey:thisModuleKey];
    if ([thisModule respondsToSelector:@selector(unprotectJsobject)]) {
      [thisModule unprotectJsobject];
    }
  }
  RELEASE_TO_NIL(modules);
}

- (void)dealloc
{
#if KROLLBRIDGE_MEMORY_DEBUG == 1
  NSLog(@"[MEMORY DEBUG] DEALLOC: %@", self);
#endif

  [self removeProxies];
  RELEASE_TO_NIL(preload);
  RELEASE_TO_NIL(context);
  OSSpinLockLock(&krollBridgeRegistryLock);
  CFSetRemoveValue(krollBridgeRegistry, self);
  OSSpinLockUnlock(&krollBridgeRegistryLock);
  [super dealloc];
}

- (TiHost *)host
{
  return host;
}

- (KrollContext *)krollContext
{
  return context;
}

- (id)preloadForKey:(id)key name:(id)name
{
  if (preload != nil) {
    NSDictionary *dict = [preload objectForKey:name];
    if (dict != nil) {
      return [dict objectForKey:key];
    }
  }
  return nil;
}

- (void)boot:(id)callback url:(NSURL *)url_ preload:(NSDictionary *)preload_
{
  preload = [preload_ retain];
  [super boot:callback url:url_ preload:preload_];
  context = [[KrollContext alloc] init];
  context.delegate = self;
  [context start];
}

- (void)evalJSWithoutResult:(NSString *)code
{
  [context evalJS:code];
}

// NOTE: this must only be called on the JS thread or an exception will be raised
- (id)evalJSAndWait:(NSString *)code
{
  return [context evalJSAndWait:code];
}

- (BOOL)evaluationError
{
  return evaluationError;
}

- (void)evalFileOnThread:(NSString *)path context:(KrollContext *)context_
{
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

  NSError *error = nil;
  JSValueRef exception = NULL;

  JSContextRef jsContext = [context_ context];

  NSURL *url_ = [path hasPrefix:@"file:"] ? [NSURL URLWithString:path] : [NSURL fileURLWithPath:path];

  if (![path hasPrefix:@"/"] && ![path hasPrefix:@"file:"]) {
    url_ = [NSURL URLWithString:path relativeToURL:url];
  }

  NSString *jcode = nil;

  if ([url_ isFileURL]) {
    NSData *data = [TiUtils loadAppResource:url_];
    if (data == nil) {
      jcode = [NSString stringWithContentsOfFile:[url_ path] encoding:NSUTF8StringEncoding error:&error];
    } else {
      jcode = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
    }
  } else {
    jcode = [NSString stringWithContentsOfURL:url_ encoding:NSUTF8StringEncoding error:&error];
  }

  if (error != nil) {
    NSLog(@"[ERROR] Error loading path: %@, %@", path, error);

    evaluationError = YES;
    TiScriptError *scriptError = nil;
    // check for file not found a give a friendlier message
    if ([error code] == 260 && [error domain] == NSCocoaErrorDomain) {
      scriptError = [[TiScriptError alloc] initWithMessage:[NSString stringWithFormat:@"Could not find the file %@", [path lastPathComponent]] sourceURL:nil lineNo:0];
    } else {
      scriptError = [[TiScriptError alloc] initWithMessage:[NSString stringWithFormat:@"Error loading script %@. %@", [path lastPathComponent], [error description]] sourceURL:nil lineNo:0];
    }
    [[TiExceptionHandler defaultExceptionHandler] reportScriptError:scriptError];
    [scriptError release];
    return;
  }

  const char *urlCString = [[url_ absoluteString] UTF8String];

  JSStringRef jsCode = JSStringCreateWithCFString((CFStringRef)jcode);
  JSStringRef jsURL = JSStringCreateWithUTF8CString(urlCString);

  if (exception == NULL) {
    JSEvaluateScript(jsContext, jsCode, NULL, jsURL, 1, &exception);
    if (exception == NULL) {
      evaluationError = NO;
    } else {
      evaluationError = YES;
    }
  }
  if (exception != NULL) {
    id excm = [KrollObject toID:context value:exception];
    evaluationError = YES;
    [[TiExceptionHandler defaultExceptionHandler] reportScriptError:[TiUtils scriptErrorValue:excm]];
  }

  JSStringRelease(jsCode);
  JSStringRelease(jsURL);
  [pool release];
}

- (void)evalFile:(NSString *)path callback:(id)callback selector:(SEL)selector
{
  [context invokeOnThread:self method:@selector(evalFileOnThread:context:) withObject:path callback:callback selector:selector];
}

- (void)evalFile:(NSString *)file
{
  [context invokeOnThread:self method:@selector(evalFileOnThread:context:) withObject:file condition:nil];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(TiProxy *)thisObject_
{
  if (![listener isKindOfClass:[KrollCallback class]]) {
    DebugLog(@"[ERROR] Listener callback is of a non-supported type: %@", [listener class]);
    return;
  }

  KrollEvent *event = [[KrollEvent alloc] initWithCallback:listener eventObject:obj thisObject:thisObject_];
  [context enqueue:event];
  [event release];
}

- (void)enqueueEvent:(NSString *)type forProxy:(TiProxy *)proxy withObject:(id)obj
{
  KrollObject *eventKrollObject = [self krollObjectForProxy:proxy];

  KrollEvent *newEvent = [[KrollEvent alloc]
        initWithType:type
      ForKrollObject:eventKrollObject
         eventObject:obj
          thisObject:eventKrollObject];

  [context enqueue:newEvent];
  [newEvent release];
}

- (void)shutdown:(NSCondition *)condition
{
#if KROLLBRIDGE_MEMORY_DEBUG == 1
  NSLog(@"[MEMORY DEBUG] DESTROY: %@", self);
#endif

  if (!shutdown) {
    shutdownCondition = [condition retain];
    shutdown = YES;
    // fire a notification event to our listeners
    WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
    NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
    [[NSNotificationCenter defaultCenter] postNotification:notification];

    [context stop];
  } else {
    [condition lock];
    [condition signal];
    [condition unlock];
  }
}

- (void)gc
{
  [context gc];
}

#pragma mark Delegate

- (void)willStartNewContext:(KrollContext *)kroll
{
  if (TiUtils.isHyperloopAvailable) {
    Class cls = NSClassFromString(@"Hyperloop");
    [cls performSelector:@selector(willStartNewContext:bridge:) withObject:kroll withObject:self];
  }

  [self retain]; // Hold onto ourselves as long as the context needs us
}

- (void)didStartNewContext:(KrollContext *)kroll
{
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

  JSGlobalContextRef jsContext = [kroll context];
  JSContext *objcJSContext = [JSContext contextWithJSGlobalContextRef:jsContext];
  JSValue *global = [objcJSContext globalObject];
  // Make the global object itself available under the name "global"
  [global defineProperty:@"global"
              descriptor:@{
                JSPropertyDescriptorEnumerableKey : @NO,
                JSPropertyDescriptorWritableKey : @NO,
                JSPropertyDescriptorConfigurableKey : @NO,
                JSPropertyDescriptorValueKey : global
              }];
  // Set the __dirname and __filename for the app.js.
  // For other files, it will be injected via the `TitaniumModuleRequireFormat` property
  [global defineProperty:@"__dirname"
              descriptor:@{
                JSPropertyDescriptorEnumerableKey : @NO,
                JSPropertyDescriptorWritableKey : @NO,
                JSPropertyDescriptorConfigurableKey : @NO,
                JSPropertyDescriptorValueKey : @"/"
              }];
  [global defineProperty:@"__filename"
              descriptor:@{
                JSPropertyDescriptorEnumerableKey : @NO,
                JSPropertyDescriptorWritableKey : @NO,
                JSPropertyDescriptorConfigurableKey : @NO,
                JSPropertyDescriptorValueKey : @"/app.js"
              }];
  // Now define "Ti" and "Titanium" on the global
  TopTiModule *module = [[TopTiModule alloc] init];
  JSValue *titanium = [JSValue valueWithObject:module inContext:objcJSContext];
  NSDictionary *dictionary = @{
    JSPropertyDescriptorEnumerableKey : @NO,
    JSPropertyDescriptorWritableKey : @YES,
    JSPropertyDescriptorConfigurableKey : @NO,
    JSPropertyDescriptorValueKey : titanium
  };
  [global defineProperty:@"Titanium" descriptor:dictionary];
  [global defineProperty:@"Ti" descriptor:dictionary];

  // Hack the old-school way of doing a module here
  NSArray *legacyModuleNames = @[ @"App",
    @"Contacts",
    @"Media",
    @"Network",
    @"Stream",
    @"UI",
    @"WatchSession",
    @"XML" ];
  for (NSString *name in legacyModuleNames) {
    // We must generate the block and copy it to put it into heap or else every instance of the block shares
    // the same "name" value. See https://stackoverflow.com/questions/7750907/blocks-loops-and-local-variables
    JSValue * (^lazyLoad)(void) = ^() {
      JSValue *result;
      TiModule *mod = [host moduleNamed:name context:self];
      if (mod != nil) {
        KrollObject *ko = [self registerProxy:mod];
        result = [JSValue valueWithJSValueRef:[ko jsobject] inContext:[JSContext currentContext]];
      } else {
        result = [JSValue valueWithUndefinedInContext:[JSContext currentContext]];
      }
      [[JSContext currentThis] defineProperty:name
                                   descriptor:@{
                                     JSPropertyDescriptorValueKey : result,
                                     JSPropertyDescriptorWritableKey : @NO,
                                     JSPropertyDescriptorEnumerableKey : @NO,
                                     JSPropertyDescriptorConfigurableKey : @NO
                                   }];
      return result;
    };
    [titanium defineProperty:name
                  descriptor:@{
                    JSPropertyDescriptorConfigurableKey : @YES,
                    JSPropertyDescriptorGetKey : [[lazyLoad copy] autorelease]
                  }];
  }

  // New JSExport based modules
  // Basically a whitelist of Ti.* modules to load lazily
  NSArray *moduleNames = @[ @"Accelerometer", @"Analytics", @"API", @"Calendar", @"Codec", @"Database", @"Filesystem", @"Geolocation", @"Gesture", @"Locale", @"Platform", @"Utils" ];
  for (NSString *name in moduleNames) {
    // We must generate the block and copy it to put it into heap or else every instance of the block shares
    // the same "name" value. See https://stackoverflow.com/questions/7750907/blocks-loops-and-local-variables
    JSValue * (^lazyLoad)(void) = ^() {
      JSValue *result;
      Class moduleClass = NSClassFromString([NSString stringWithFormat:@"%@Module", name]);
      if (moduleClass != nil) {
        result = [JSValue valueWithObject:[[moduleClass alloc] init] inContext:[JSContext currentContext]];
      } else {
        result = [JSValue valueWithUndefinedInContext:[JSContext currentContext]];
      }
      [[JSContext currentThis] defineProperty:name
                                   descriptor:@{
                                     JSPropertyDescriptorValueKey : result,
                                     JSPropertyDescriptorWritableKey : @NO,
                                     JSPropertyDescriptorEnumerableKey : @NO,
                                     JSPropertyDescriptorConfigurableKey : @NO
                                   }];
      return result;
    };
    [titanium defineProperty:name
                  descriptor:@{
                    JSPropertyDescriptorConfigurableKey : @YES,
                    JSPropertyDescriptorGetKey : [[lazyLoad copy] autorelease]
                  }];
  }

  // FIXME Re-enable analytics setters here
  if ([[TiSharedConfig defaultConfig] isAnalyticsEnabled]) {
    APSAnalytics *sharedAnalytics = [APSAnalytics sharedInstance];
    NSString *buildType = [[TiSharedConfig defaultConfig] applicationBuildType];
    NSString *deployType = [[TiSharedConfig defaultConfig] applicationDeployType];
    NSString *guid = [[TiSharedConfig defaultConfig] applicationGUID];
    if (buildType != nil || buildType.length > 0) {
      [sharedAnalytics performSelector:@selector(setBuildType:) withObject:buildType];
    }
    [sharedAnalytics performSelector:@selector(setSDKVersion:) withObject:[module performSelector:@selector(version)]];
    [sharedAnalytics enableWithAppKey:guid andDeployType:deployType];
  }

  // Load the "console" object into the global scope
  objcJSContext[@"console"] = [[TiConsole alloc] init];

  //if we have a preload dictionary, register those static key/values into our namespace
  if (preload != nil) {
    for (NSString *name in preload) {
      JSValue *moduleJSObject = titanium[name];
      KrollObject *ti = (KrollObject *)JSObjectGetPrivate(JSValueToObject(jsContext, moduleJSObject.JSValueRef, NULL));
      NSDictionary *values = preload[name];
      for (id key in values) {
        id target = values[key];
        KrollObject *ko = [self krollObjectForProxy:target];
        if (ko == nil) {
          ko = [self registerProxy:target];
        }
        [ti noteKrollObject:ko forKey:key];
        [ti setStaticValue:ko forKey:key purgable:NO];
      }
    }
    // We need to run this before the app.js, which means it has to be here.
    TiBindingRunLoopAnnounceStart(kroll);
    [self evalFile:[url path] callback:self selector:@selector(booted)];
  } else {
    // now load the app.js file and get started
    NSURL *startURL = [host startURL];
    // We need to run this before the app.js, which means it has to be here.
    TiBindingRunLoopAnnounceStart(kroll);
    [self evalFile:[startURL absoluteString] callback:self selector:@selector(booted)];
  }

  if (TiUtils.isHyperloopAvailable) {
    Class cls = NSClassFromString(@"Hyperloop");
    [cls performSelector:@selector(didStartNewContext:bridge:) withObject:kroll withObject:self];
  }

  [pool release];
}

- (void)willStopNewContext:(KrollContext *)kroll
{
  if (TiUtils.isHyperloopAvailable) {
    Class cls = NSClassFromString(@"Hyperloop");
    [cls performSelector:@selector(willStopNewContext:bridge:) withObject:kroll withObject:self];
  }

  if (!shutdown) {
    shutdown = YES;
    // fire a notification event to our listeners
    WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
    NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
    [[NSNotificationCenter defaultCenter] postNotification:notification];
  }

  if (shutdownCondition) {
    [shutdownCondition lock];
    [shutdownCondition signal];
    [shutdownCondition unlock];
    RELEASE_TO_NIL(shutdownCondition);
  }
}

- (void)didStopNewContext:(KrollContext *)kroll
{
  TiThreadPerformOnMainThread(^{
    [self unregisterForMemoryWarning];
  },
      NO);
  [self removeProxies];
  RELEASE_TO_NIL(console);
  RELEASE_TO_NIL(context);
  RELEASE_TO_NIL(preload);

  if (TiUtils.isHyperloopAvailable) {
    Class cls = NSClassFromString(@"Hyperloop");
    [cls performSelector:@selector(didStopNewContext:bridge:) withObject:kroll withObject:self];
  }
  [self autorelease]; // Safe to release now that the context is done
}

- (void)registerProxy:(id)proxy krollObject:(KrollObject *)ourKrollObject
{
  OSSpinLockLock(&proxyLock);
  if (registeredProxies == NULL) {
    registeredProxies = CFDictionaryCreateMutable(NULL, 10, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
  }
  //NOTE: Do NOT treat registeredProxies like a mutableDictionary; mutable dictionaries copy keys,
  //CFMutableDictionaryRefs only retain keys, which lets them work with proxies properly.

  CFDictionaryAddValue(registeredProxies, proxy, ourKrollObject);
  OSSpinLockUnlock(&proxyLock);
  [proxy boundBridge:self withKrollObject:ourKrollObject];
}

- (id)registerProxy:(id)proxy
{
  KrollObject *ourKrollObject = [self krollObjectForProxy:proxy];

  if (ourKrollObject != nil) {
    return ourKrollObject;
  }

  if (![context isKJSThread]) {
    return nil;
  }

  ourKrollObject = [[KrollObject alloc] initWithTarget:proxy context:context];
  [ourKrollObject applyGarbageCollectionSafeguard];

  [self registerProxy:proxy
          krollObject:ourKrollObject];
  return [ourKrollObject autorelease];
}

- (void)unregisterProxy:(id)proxy
{
  OSSpinLockLock(&proxyLock);
  if (registeredProxies != NULL) {
    CFDictionaryRemoveValue(registeredProxies, proxy);
    //Don't bother with removing the empty registry. It's small and leaves on dealloc anyways.
  }
  OSSpinLockUnlock(&proxyLock);
  [proxy unboundBridge:self];
}

- (BOOL)usesProxy:(id)proxy
{
  if (proxy == nil) {
    return NO;
  }
  BOOL result = NO;
  OSSpinLockLock(&proxyLock);

  if (registeredProxies != NULL) {
    result = (CFDictionaryGetCountOfKey(registeredProxies, proxy) != 0);
  }
  OSSpinLockUnlock(&proxyLock);
  return result;
}

- (id)krollObjectForProxy:(id)proxy
{
  id result = nil;
  OSSpinLockLock(&proxyLock);
  if (registeredProxies != NULL) {
    result = (id)CFDictionaryGetValue(registeredProxies, proxy);
  }
  OSSpinLockUnlock(&proxyLock);
  return result;
}

- (KrollWrapper *)loadCommonJSModule:(NSString *)code withSourceURL:(NSURL *)sourceURL
{
  // FIXME: Can we skip all of this now? Doesn't we already properly resolve paths?
  // This takes care of resolving paths like `../../foo.js`
  sourceURL = [NSURL fileURLWithPath:[[sourceURL path] stringByStandardizingPath]];

  // Get the relative path to the Resources directory
  NSString *filename = [[sourceURL path] stringByReplacingOccurrencesOfString:[[[NSBundle mainBundle] resourceURL] path] withString:@""];
  NSString *dirname = [filename stringByDeletingLastPathComponent];

  NSString *js = [[NSString alloc] initWithFormat:TitaniumModuleRequireFormat, dirname, filename, code];

  /* This most likely should be integrated with normal code flow, but to
	 * minimize impact until a in-depth reconsideration of KrollContext can be
	 * done, we should have as little footprint
	 */
  KrollEval *eval = [[KrollEval alloc] initWithCode:js sourceURL:sourceURL startingLineNo:1];
  JSValueRef exception = NULL;
  JSValueRef resultRef = [eval jsInvokeInContext:context exception:&exception];
  [js release];
  [eval release];

  if (exception != NULL) {
    id excm = [KrollObject toID:context value:exception];
    [[TiExceptionHandler defaultExceptionHandler] reportScriptError:[TiUtils scriptErrorValue:excm]];
    return nil;
  }
  /*
	 *	In order to work around the underlying issue of TIMOB-2392, we must
	 *	use KrollWrapper as a JS wrapper instead of converting it to a proxy
	 */

  KrollWrapper *result = [[KrollWrapper alloc] init];
  [result setBridge:self];
  [result setJsobject:(JSObjectRef)resultRef];
  [result protectJsobject];

  return [result autorelease];
}

- (NSString *)pathToModuleClassName:(NSString *)path
{
  //TODO: switch to use ApplicationMods

  NSArray *tokens = [path componentsSeparatedByString:@"."];
  NSMutableString *modulename = [NSMutableString string];
  for (NSString *token in tokens) {
    [modulename appendFormat:@"%@%@", [[token substringToIndex:1] uppercaseString], [token substringFromIndex:1]];
  }
  [modulename appendString:@"Module"];
  return modulename;
}

- (TiModule *)loadCoreModule:(NSString *)moduleID withContext:(KrollContext *)kroll
{
  NSString *moduleClassName = [self pathToModuleClassName:moduleID];
  Class moduleClass = NSClassFromString(moduleClassName);
  // If no such module exists, bail out!
  if (moduleClass == nil) {
    return nil;
  }

  // If there is a JS file that collides with the given path,
  // warn the user of the collision, but prefer the native/core module
  NSURL *jsPath = [NSURL URLWithString:[NSString stringWithFormat:@"%@/%@.js", [[NSURL fileURLWithPath:[TiHost resourcePath] isDirectory:YES] path], moduleID]];
  if ([[NSFileManager defaultManager] fileExistsAtPath:[jsPath absoluteString]]) {
    NSLog(@"[WARN] The requested path '%@' has a collison between a native Ti%@um API/module and a JS file.", moduleID, @"tani");
    NSLog(@"[WARN] The native Ti%@um API/module will be loaded in preference.", @"tani");
    NSLog(@"[WARN] If you intended to address the JS file, please require the path using a prefixed string such as require('./%@') or require('/%@') instead.", moduleID, moduleID);
  }

  // Ok, we have a native module, make sure instantiate and cache it
  TiModule *module = [modules objectForKey:moduleID];
  if (module == nil) {
    module = [[moduleClass alloc] _initWithPageContext:self];
    [module setHost:host];
    [module _setName:moduleClassName];
    [modules setObject:module forKey:moduleID];
    [module autorelease];
  }

  // does it have JS? No, then nothing else to do...
  if (![module isJSModule]) {
    return module;
  }

  NSData *data = [module moduleJS];
  if (data == nil) {
    // Uh oh, no actual data. Let's just punt and return the native module as-is
    return module;
  }

  NSString *contents = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  NSURL *url_ = [TiHost resourceBasedURL:moduleID baseURL:NULL];
  KrollWrapper *wrapper = [self loadCommonJSModule:contents withSourceURL:url_];

  // For right now, we need to mix any compiled JS on top of a compiled module, so that both components
  // are accessible. We store the exports object and then put references to its properties on the toplevel
  // object.

  JSContextRef jsContext = [[self krollContext] context];
  JSObjectRef jsObject = [wrapper jsobject];
  KrollObject *moduleObject = [module krollObjectForContext:[self krollContext]];
  [moduleObject noteObject:jsObject forTiString:kTiStringExportsKey context:jsContext];

  JSPropertyNameArrayRef properties = JSObjectCopyPropertyNames(jsContext, jsObject);
  size_t count = JSPropertyNameArrayGetCount(properties);
  for (size_t i = 0; i < count; i++) {
    // Mixin the property onto the module JS object if it's not already there
    JSStringRef propertyName = JSPropertyNameArrayGetNameAtIndex(properties, i);
    if (!JSObjectHasProperty(jsContext, [moduleObject jsobject], propertyName)) {
      JSValueRef property = JSObjectGetProperty(jsContext, jsObject, propertyName, NULL);
      JSObjectSetProperty([[self krollContext] context], [moduleObject jsobject], propertyName, property, kJSPropertyAttributeReadOnly, NULL);
    }
  }
  JSPropertyNameArrayRelease(properties);

  return module;
}

- (KrollWrapper *)loadCoreModuleAsset:(NSString *)path withContext:(KrollContext *)kroll
{
  NSArray<NSString *> *pathComponents = [path pathComponents];
  NSString *moduleID = [pathComponents objectAtIndex:0];

  NSRange separatorLocation = [path rangeOfString:@"/"];
  // check rest of path FIXME: Just rejoin pathComponents?
  NSString *assetPath = [path substringFromIndex:separatorLocation.location + 1];

  TiModule *module = [self loadCoreModule:moduleID withContext:kroll];

  // Try to load the file as module asset!
  NSString *filepath = [assetPath stringByAppendingString:@".js"];
  NSData *data = [module loadModuleAsset:filepath];
  // does it exist in module?
  if (data == nil) {
    return nil;
  }
  NSString *contents = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  // This is an asset inside the native module. Load it like a "normal" common js file
  return [self loadJavascriptText:contents fromFile:filepath withContext:kroll];
}

- (NSString *)loadFile:(NSString *)path
{
  // check if file exists by using cheat index.json which tells us if on disk or encrypted.
  FileStatus status = [self fileStatus:path];
  NSURL *url_ = [NSURL URLWithString:path relativeToURL:[[self host] baseURL]];
  NSData *data;
  switch (status) {
  case FileStatusExistsOnDisk:
    data = [NSData dataWithContentsOfURL:url_]; // load from disk
    break;

  case FileStatusExistsEncrypted:
    data = [TiUtils loadAppResource:url_]; // try to load encrypted file
    break;

  case FileStatusDoesntExist:
  default:
    return nil;
  }

  if (data != nil) {
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  }
  return nil;
}

- (KrollWrapper *)loadJavascriptObject:(NSString *)data fromFile:(NSString *)filename withContext:(KrollContext *)kroll
{
  NSError *jsonParseError = nil;

  // 1. Parse JSON
  __unused NSDictionary *parsedJSON = [TiUtils jsonParse:data error:&jsonParseError];

  // 2. Validate parsed JSON
  if (jsonParseError != nil) {
    DebugLog(@"[ERROR] Unable to parse JSON input!");
    return nil;
  }

  // 3. Assign valid JSON to module.exports
  data = [NSString stringWithFormat:@"module.exports = %@;", data];

  return [self loadJavascriptText:data fromFile:filename withContext:kroll];
}

- (KrollWrapper *)loadJavascriptText:(NSString *)data fromFile:(NSString *)filename withContext:(KrollContext *)kroll
{
  NSURL *url_ = [TiHost resourceBasedURL:filename baseURL:NULL];
  KrollWrapper *module = [self loadCommonJSModule:data withSourceURL:url_];

  if (![module respondsToSelector:@selector(replaceValue:forKey:notification:)]) {
    @throw [NSException exceptionWithName:@"org.appcelerator.kroll"
                                   reason:[NSString stringWithFormat:@"Module \"%@\" failed to leave a valid exports object", filename]
                                 userInfo:nil];
  }

  if (filename != nil && module != nil) {
    // uri is optional but we point it to where we loaded it
    [module replaceValue:[NSString stringWithFormat:@"app://%@", filename] forKey:@"uri" notification:NO];
    [module replaceValue:filename forKey:@"id" notification:NO]; // set id to full path, originally this was the path from require call
  }

  return module;
}

- (KrollWrapper *)loadAsFile:(NSString *)path withContext:(KrollContext *)kroll
{
  NSString *filename = path;
  NSString *data;

  // 1. If X is a file, load X as JavaScript text.  STOP
  // Note: I modified the algorithm here to handle .json files as JSON, everything else as JS
  NSString *ext = [filename pathExtension];
  BOOL json = (ext != nil && [ext isEqual:@"json"]);
  data = [self loadFile:filename];
  if (data != nil) {
    if (json) {
      return [self loadJavascriptObject:data fromFile:filename withContext:context];
    } else {
      return [self loadJavascriptText:data fromFile:filename withContext:context];
    }
  }

  // 2. If X.js is a file, load X.js as JavaScript text.  STOP
  filename = [path stringByAppendingString:@".js"];
  data = [self loadFile:filename];
  if (data != nil) {
    return [self loadJavascriptText:data fromFile:filename withContext:context];
  }

  // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  filename = [path stringByAppendingString:@".json"];
  data = [self loadFile:filename];
  if (data != nil) {
    return [self loadJavascriptObject:data fromFile:filename withContext:context];
  }

  // failed to load anything!
  return nil;
}

/* changes current URL to keep track when requiring to know our working path to resolve from */
- (void)updateCurrentURLFromPath:(NSString *)path
{
  [self setCurrentURL:[NSURL URLWithString:[path stringByDeletingLastPathComponent] relativeToURL:[[self host] baseURL]]];
}

/* returns full path to main file declared in given package json, only if it exists! */
- (NSString *)packageJSONMain:(NSString *)packageJsonPath
{
  // check special package.json cache
  NSString *m = packageJSONMainCache[packageJsonPath];
  if (m != nil) {
    return m;
  }

  NSString *data = [self loadFile:packageJsonPath];
  if (data == nil) {
    return nil;
  }

  // a. Parse X/package.json, and look for "main" field.
  // Just cheat and use TiUtils.jsonParse here, rather than loading the package.json as a JS object...
  NSDictionary *json = [TiUtils jsonParse:data];
  if (json == nil) {
    return nil;
  }

  id main = [json objectForKey:@"main"];
  if ([main isKindOfClass:[NSString class]]) {
    NSString *mainString = (NSString *)main;
    NSString *x = [packageJsonPath stringByDeletingLastPathComponent]; // parent dir of package.json
    // b. let M = X + (json main field)
    m = [x stringByAppendingPathComponent:mainString];
    m = [self pathByStandarizingPath:m];
    ResolvedModule *resolved = [self tryFileOrDirectory:m];
    if (resolved) {
      packageJSONMainCache[packageJsonPath] = resolved->path; // cache from package.json to main value
      return resolved->path;
    }
  }
  return nil;
}

- (KrollWrapper *)loadAsDirectory:(NSString *)path withContext:(KrollContext *)kroll
{
  // 1. If X/package.json is a file,
  NSString *filename = [path stringByAppendingPathComponent:@"package.json"];
  NSString *resolvedFile = [self packageJSONMain:filename];
  if (resolvedFile != nil) {
    // c. LOAD_AS_FILE(M)
    return [self loadAsFile:resolvedFile withContext:context];
  }

  NSString *data;
  // 2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
  filename = [path stringByAppendingPathComponent:@"index.js"];
  data = [self loadFile:filename];
  if (data != nil) {
    return [self loadJavascriptText:data fromFile:filename withContext:context];
  }

  // 3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
  filename = [path stringByAppendingPathComponent:@"index.json"];
  data = [self loadFile:filename];
  if (data != nil) {
    return [self loadJavascriptObject:data fromFile:filename withContext:context];
  }

  return nil;
}

- (KrollWrapper *)loadAsFileOrDirectory:(NSString *)path withContext:(KrollContext *)kroll
{
  // a. LOAD_AS_FILE(Y + X)
  KrollWrapper *module = [self loadAsFile:path withContext:context];
  if (module) {
    return module;
  }
  // b. LOAD_AS_DIRECTORY(Y + X)
  return [self loadAsDirectory:path withContext:context];
}

- (NSArray *)nodeModulesPaths:(NSString *)path
{
  // Note that in this function paths must be returned with no leading slash
  // i.e "node_modules" rather than "/node_modules" (like Android does)

  NSMutableArray *dirs = [NSMutableArray arrayWithCapacity:0];
  // Return early if we are at root, this avoids doing a pointless loop
  // and also returning an array with duplicate entries
  // e.g. ["node_modules", "node_modules"]
  if (path == nil) {
    [dirs addObject:@"node_modules"];
    return dirs;
  }
  // 1. let PARTS = path split(START)
  NSArray *parts = [path componentsSeparatedByString:@"/"];
  // 2. let I = count of PARTS - 1
  NSInteger i = [parts count] - 1;
  // 3. let DIRS = []
  // 4. while I >= 0,
  while (i >= 0) {
    // a. if PARTS[I] = "node_modules" CONTINUE
    if ([[parts objectAtIndex:i] isEqual:@"node_modules"] || [[parts objectAtIndex:i] isEqual:@""]) {
      i = i - 1;
      continue;
    }
    // b. DIR = path join(PARTS[0 .. I] + "node_modules")
    NSString *dir = [[[parts subarrayWithRange:NSMakeRange(0, i + 1)] componentsJoinedByString:@"/"] stringByAppendingPathComponent:@"node_modules"];
    // c. DIRS = DIRS + DIR
    [dirs addObject:dir];
    // d. let I = I - 1
    i = i - 1;
  }
  // Always add /node_modules to the search path
  [dirs addObject:@"node_modules"];
  return dirs;
}

- (KrollWrapper *)loadNodeModules:(NSString *)path withDir:(NSString *)start withContext:(KrollContext *)kroll
{
  KrollWrapper *module = nil;

  // 1. let DIRS=NODE_MODULES_PATHS(START)
  NSArray *dirs = [self nodeModulesPaths:start];
  // 2. for each DIR in DIRS:
  for (NSString *dir in dirs) {
    // a. LOAD_AS_FILE(DIR/X)
    // b. LOAD_AS_DIRECTORY(DIR/X)
    module = [self loadAsFileOrDirectory:[dir stringByAppendingPathComponent:path] withContext:context];
    if (module) {
      return module;
    }
  }
  return nil;
}

+ (NSDictionary *)loadIndexJSON
{
  static NSDictionary *props;

  if (props == nil) {

    NSString *indexJsonPath = [[TiHost resourcePath] stringByAppendingPathComponent:@"_index_.json"];
    // check for encrypted copy first
    NSData *jsonData = [TiUtils loadAppResource:[NSURL fileURLWithPath:indexJsonPath]];
    if (jsonData == nil) {
      // Not found in encrypted file, this means we're in development mode, get it from the filesystem
      jsonData = [NSData dataWithContentsOfFile:indexJsonPath];
    }

    NSString *errorString = nil;
    // Get the JSON data and create the NSDictionary.
    if (jsonData) {
      NSError *error = nil;
      props = [[NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error] retain];
      errorString = [error localizedDescription];
    } else {
      // If we have no data...
      // This should never happen on a Titanium app using the node.js CLI
      errorString = @"File not found";
    }
    if (errorString != nil) {
      DebugLog(@"[ERROR] Could not load _index_.json require index, error was %@", errorString);
      // Create an empty dictioary to avoid running this code over and over again.
      props = [[NSDictionary dictionary] retain];
    }
  }
  return props;
}

- (FileStatus)fileStatus:(NSString *)path
{
  NSDictionary *files = [KrollBridge loadIndexJSON];
  NSNumber *type = files[[@"Resources/" stringByAppendingString:path]];
  if (type == nil) {
    return FileStatusDoesntExist;
  }
  NSInteger intType = [type integerValue];
  return (FileStatus)intType;
}

- (BOOL)fileExists:(NSString *)path
{
  return [self fileStatus:path] != FileStatusDoesntExist;
}

- (ResolvedModule *)tryFile:(NSString *)path
{
  // 1. If X is a file, load X as JavaScript text.  STOP
  if ([self fileExists:path]) {
    NSString *ext = [path pathExtension];
    BOOL json = (ext != nil && [ext isEqual:@"json"]);
    enum ModuleType type = JS;
    if (json) {
      type = JSON;
    }
    return [[[ResolvedModule alloc] initWithType:type andPath:path] autorelease];
  }

  // 2. If X.js is a file, load X.js as JavaScript text.  STOP
  NSString *asJS = [path stringByAppendingString:@".js"];
  if ([self fileExists:asJS]) {
    return [[[ResolvedModule alloc] initWithType:JS andPath:asJS] autorelease];
  }

  // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  NSString *asJSON = [path stringByAppendingString:@".json"];
  if ([self fileExists:asJSON]) {
    return [[[ResolvedModule alloc] initWithType:JSON andPath:asJSON] autorelease];
  }

  return nil;
}

- (ResolvedModule *)tryDirectory:(NSString *)path
{
  NSString *packageJSON = [path stringByAppendingPathComponent:@"package.json"];
  NSString *resolved = [self packageJSONMain:packageJSON];
  if (resolved != nil) {
    return [self tryFile:resolved];
  }

  NSString *indexJS = [path stringByAppendingPathComponent:@"index.js"];
  if ([self fileExists:indexJS]) {
    return [[[ResolvedModule alloc] initWithType:JS andPath:indexJS] autorelease];
  }

  NSString *indexJSON = [path stringByAppendingPathComponent:@"index.json"];
  if ([self fileExists:indexJSON]) {
    return [[[ResolvedModule alloc] initWithType:JSON andPath:indexJSON] autorelease];
  }
  return nil;
}

- (ResolvedModule *)tryFileOrDirectory:(NSString *)path
{
  ResolvedModule *resolved = [self tryFile:path];
  if (resolved) {
    return resolved;
  }
  return [self tryDirectory:path];
}

- (ResolvedModule *)tryNativeModule:(NSString *)path
{
  // FIXME: Why doesn't iOS have a nice registry of external module ids like Android? Can't modules register
  // to some dictionary?

  // moduleId then is the first path component
  // try to load up the native module's class...
  NSArray<NSString *> *pathComponents = [path pathComponents];
  NSString *moduleID = [pathComponents objectAtIndex:0];
  NSString *moduleClassName = [self pathToModuleClassName:moduleID];
  Class moduleClass = NSClassFromString(moduleClassName);
  // If no such module exists, bail out!
  if (moduleClass == nil) {
    return nil;
  }

  // Are they just trying to load the top-level module? If so, return that as our path
  NSRange separatorLocation = [path rangeOfString:@"/"];
  if (separatorLocation.location == NSNotFound) {
    return [[[ResolvedModule alloc] initWithType:Native andPath:moduleID] autorelease];
  }

  // check rest of path
  NSString *assetPath = [path substringFromIndex:separatorLocation.location + 1];
  // Treat require('module.id/module.id') == require('module.id')
  if ([assetPath isEqualToString:moduleID]) {
    return [[[ResolvedModule alloc] initWithType:Native andPath:moduleID] autorelease];
  }

  // we need to load the actual module to determine beyond this...

  // Ok, we have a native module, make sure instantiate and cache it
  TiModule *module = [modules objectForKey:moduleID];
  if (module == nil) {
    module = [[moduleClass alloc] _initWithPageContext:self];
    [module setHost:host];
    [module _setName:moduleClassName];
    [modules setObject:module forKey:moduleID];
    [module autorelease];
  }

  // not top-level module!
  NSString *filepath = [assetPath stringByAppendingString:@".js"];
  NSData *data = [module loadModuleAsset:filepath];
  // does it exist in module?
  if (data == nil) {
    // nope, return nil so we can try to fall back to resource in user's app
    return nil;
  }
  // asset inside module
  return [[[ResolvedModule alloc] initWithType:NativeJS andPath:filepath] autorelease];
}

- (NSString *)pathByStandarizingPath:(NSString *)relativePath
{
  // Calling [relativePath stringByStandardizingPath]; does not resolve '..' segments because the path isn't absolute!
  // so we hack around it here by making an URL that does point to absolute location...
  NSURL *url_ = [NSURL URLWithString:relativePath relativeToURL:[[self host] baseURL]];
  // "standardizing" it (i.e. removing '.' and '..' segments properly...
  NSURL *standardizedURL = [url_ standardizedURL];
  // Then asking for the relative path again
  return [[standardizedURL relativePath] stringByStandardizingPath];
}

- (ResolvedModule *)resolveRequire:(NSString *)path withWorkingPath:(NSString *)workingPath
{
  // if starts with '/', treat as "absolute" already!
  if ([path hasPrefix:@"/"]) {
    // drop leading '/' to actually make relative to base url/root dir
    return [self tryFileOrDirectory:[self pathByStandarizingPath:[path substringFromIndex:1]]];
  }
  // if starts with '.', resolve relatively (to working dir)
  if ([path hasPrefix:@"."]) {
    NSString *relativePath = (workingPath == nil) ? path : [workingPath stringByAppendingPathComponent:path];
    // FIXME: Blow up if workingPath == nil && [path hasPrefix:@".."]? (i.e. they try to go outside the "root" dir)
    return [self tryFileOrDirectory:[self pathByStandarizingPath:relativePath]];
  }

  // check for core/native module
  ResolvedModule *nativeModuleOrAsset = [self tryNativeModule:path];
  if (nativeModuleOrAsset != nil) {
    return nativeModuleOrAsset;
  }

  // check for Titanium CommonJS module
  if (![path containsString:@"/"]) {
    // For CommonJS we need to look for module.id/module.id.js first...
    NSString *filename = [[path stringByAppendingPathComponent:path] stringByAppendingPathExtension:@"js"];
    if ([self fileExists:filename]) {
      return [[[ResolvedModule alloc] initWithType:JS andPath:filename] autorelease];
    }

    // Then try module.id as directory
    ResolvedModule *resolved = [self tryDirectory:path];
    if (resolved != nil) {
      return resolved;
    }
  }

  // Check for node_modules
  NSArray *dirs = [self nodeModulesPaths:workingPath];
  for (NSString *dir in dirs) {
    ResolvedModule *resolved = [self tryFileOrDirectory:[dir stringByAppendingPathComponent:path]];
    if (resolved) {
      return resolved;
    }
  }

  // Fall back to treating as absolute path missing leading'/'
  return [self tryFileOrDirectory:[self pathByStandarizingPath:path]];
}

// Returns (TiModule *) or (KrollWrapper *)
- (id)require:(KrollContext *)kroll path:(NSString *)path
{
  NSURL *oldURL = [self currentURL];
  NSString *workingPath = [oldURL relativePath];
  ResolvedModule *resolved = [self resolveRequire:path withWorkingPath:workingPath];
  // failed to resolve it!
  if (resolved == nil) {
    NSString *arch = [TiUtils currentArchitecture];
    @throw [NSException exceptionWithName:@"org.test.kroll" reason:[NSString stringWithFormat:@"Couldn't find module: %@ for architecture: %@", path, arch] userInfo:nil]; // TODO Set 'code' property to 'MODULE_NOT_FOUND' to match Node?
  }

  ModuleType type = resolved->type;
  NSString *resolvedFilename = resolved->path;

  [self updateCurrentURLFromPath:resolvedFilename]; // for future requires, use this resolved filepath as the base working dir/URL

  id module;
  @try {
    if (modules != nil) {
      module = [modules objectForKey:resolvedFilename];
      if (module != nil) {
        return module;
      }
    }

    NSString *data;
    switch (type) {
    case Native:
      module = [self loadCoreModule:resolvedFilename withContext:kroll];
      break;
    case JS:
      data = [self loadFile:resolvedFilename];
      if (data != nil) {
        module = [self loadJavascriptText:data fromFile:resolvedFilename withContext:context];
      }
      break;
    case JSON:
      data = [self loadFile:resolvedFilename];
      if (data != nil) {
        module = [self loadJavascriptObject:data fromFile:resolvedFilename withContext:context];
      }
      break;
    case NativeJS:
      module = [self loadCoreModuleAsset:resolvedFilename withContext:context];
      break;

    default:
      break;
    }
  }
  @finally {
    [self setCurrentURL:oldURL];
    // Cache the resolved path for this request if we got a module
    if (module != nil && resolvedFilename != nil) {
      [modules setObject:module forKey:resolvedFilename];
      return module;
    }
  }

  // should never happen!
  // 4. THROW "not found"
  NSString *arch = [TiUtils currentArchitecture];
  @throw [NSException exceptionWithName:@"org.test.kroll" reason:[NSString stringWithFormat:@"Couldn't find module: %@ for architecture: %@", path, arch] userInfo:nil]; // TODO Set 'code' property to 'MODULE_NOT_FOUND' to match Node?
}

+ (NSArray *)krollBridgesUsingProxy:(id)proxy
{
  NSMutableArray *results = nil;

  OSSpinLockLock(&krollBridgeRegistryLock);
  signed long bridgeCount = CFSetGetCount(krollBridgeRegistry);
  KrollBridge *registryObjects[bridgeCount];
  CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);

  for (int currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; currentBridgeIndex++) {
    KrollBridge *currentBridge = registryObjects[currentBridgeIndex];
    if (![currentBridge usesProxy:proxy]) {
      continue;
    }
    if (results == nil) {
      results = [NSMutableArray arrayWithObject:currentBridge];
      continue;
    }
    [results addObject:currentBridge];
  }

  //Why do we wait so long? In case someone tries to dealloc the krollBridge while we're looking at it.
  //registryObjects nor the registry does a retain here!
  OSSpinLockUnlock(&krollBridgeRegistryLock);
  return results;
}

+ (NSArray *)krollContexts
{
  OSSpinLockLock(&krollBridgeRegistryLock);
  signed long bridgeCount = CFSetGetCount(krollBridgeRegistry);
  KrollBridge *registryObjects[bridgeCount];
  CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);

  NSMutableArray *results = [[NSMutableArray alloc] initWithCapacity:0];
  for (NSUInteger currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; ++currentBridgeIndex) {
    KrollBridge *bridge = registryObjects[currentBridgeIndex];
    [results addObject:bridge.krollContext];
  }

  OSSpinLockUnlock(&krollBridgeRegistryLock);
  return [results autorelease];
}

+ (BOOL)krollBridgeExists:(KrollBridge *)bridge
{
  if (bridge == nil) {
    return NO;
  }

  bool result = NO;
  OSSpinLockLock(&krollBridgeRegistryLock);
  signed long bridgeCount = CFSetGetCount(krollBridgeRegistry);
  KrollBridge *registryObjects[bridgeCount];
  CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);
  for (int currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; currentBridgeIndex++) {
    KrollBridge *currentBridge = registryObjects[currentBridgeIndex];
    if (currentBridge == bridge) {
      result = YES;
      break;
    }
  }
  //Why not CFSetContainsValue? Because bridge may not be a valid pointer, and SetContainsValue
  //will ask it for a hash!
  OSSpinLockUnlock(&krollBridgeRegistryLock);

  return result;
}

+ (KrollBridge *)krollBridgeForThreadName:(NSString *)threadName;
{
  if (threadName == nil) {
    return nil;
  }

  KrollBridge *result = nil;
  OSSpinLockLock(&krollBridgeRegistryLock);
  signed long bridgeCount = CFSetGetCount(krollBridgeRegistry);
  KrollBridge *registryObjects[bridgeCount];
  CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);
  for (int currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; currentBridgeIndex++) {
  }
  OSSpinLockUnlock(&krollBridgeRegistryLock);

  return result;
}

- (int)forceGarbageCollectNow;
{
  [context gc];
  //Actually forcing garbage collect now will cause a deadlock.
  return 0;
}

- (BOOL)shouldDebugContext
{
  return [[self host] debugMode];
}

- (BOOL)shouldProfileContext
{
  return [[self host] profileMode];
}

@end
