/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2020 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollBridge.h"
#import "APSAnalytics.h"
#import "JSValue+Addons.h"
#import "KrollCallback.h"
#import "KrollModule.h"
#import "TiApp.h"
#import "TiExceptionHandler.h"
#import "TiHost.h"
#import "TiSharedConfig.h"
#import "TiUtils.h"
#import "TopTiModule.h"

#ifndef TI_USE_NATIVE
#define TI_USE_NATIVE 0
#endif

NSString *TitaniumModuleRequireFormat = @"(function(exports){"
                                         "var __OXP=exports;var module={'exports':exports,'paths':[]};var __dirname=\"%@\";var __filename=\"%@\";%@;\n"
                                         "if(module.exports !== __OXP){return module.exports;}"
                                         "return exports;})({})";

//Defined private method inside TiBindingRunLoop.m (Perhaps to move to .c?)
void TiBindingRunLoopAnnounceStart(TiBindingRunLoop runLoop);

os_unfair_lock krollBridgeRegistryLock = OS_UNFAIR_LOCK_INIT;
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

    proxyLock = OS_UNFAIR_LOCK_INIT;
    os_unfair_lock_lock(&krollBridgeRegistryLock);
    CFSetAddValue(krollBridgeRegistry, self);
    os_unfair_lock_unlock(&krollBridgeRegistryLock);
    TiThreadPerformOnMainThread(
        ^{
          [self registerForMemoryWarning];
        },
        NO);
  }
  return self;
}

- (void)didReceiveMemoryWarning:(NSNotification *)notification
{
  os_unfair_lock_lock(&proxyLock);
  if (registeredProxies == NULL) {
    os_unfair_lock_unlock(&proxyLock);
    [self gc];
    return;
  }

  BOOL keepWarning = YES;
  signed long proxiesCount = CFDictionaryGetCount(registeredProxies);
  os_unfair_lock_unlock(&proxyLock);

  // During a memory panic, we may not get the chance to copy proxies.
  while (keepWarning) {
    keepWarning = NO;

    for (id proxy in [(NSDictionary *)registeredProxies allKeys]) {
      [proxy didReceiveMemoryWarning:notification];

      os_unfair_lock_lock(&proxyLock);
      if (registeredProxies == NULL) {
        os_unfair_lock_unlock(&proxyLock);
        break;
      }

      signed long newCount = CFDictionaryGetCount(registeredProxies);
      os_unfair_lock_unlock(&proxyLock);

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
  os_unfair_lock_lock(&proxyLock);
  CFDictionaryRef oldProxies = registeredProxies;
  registeredProxies = NULL;
  os_unfair_lock_unlock(&proxyLock);

  for (id thisProxy in (NSDictionary *)oldProxies) {
    KrollObject *thisKrollObject = (id)CFDictionaryGetValue(oldProxies, thisProxy);
    [thisProxy contextShutdown:self];
    [thisKrollObject unprotectJsobject];
  }

  if (oldProxies != NULL) {
    CFRelease(oldProxies);
  }
}

- (void)dealloc
{
#if KROLLBRIDGE_MEMORY_DEBUG == 1
  NSLog(@"[MEMORY DEBUG] DEALLOC: %@", self);
#endif

  [self removeProxies];
  RELEASE_TO_NIL(preload);
  RELEASE_TO_NIL(context);
  os_unfair_lock_lock(&krollBridgeRegistryLock);
  CFSetRemoveValue(krollBridgeRegistry, self);
  os_unfair_lock_unlock(&krollBridgeRegistryLock);
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

- (void)setEvaluationError:(BOOL)value
{
  evaluationError = value;
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
    evaluationError = YES;
    [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inKrollContext:context];
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
  [global defineReadOnlyProperty:@"global" withValue:global];

  // define a "kroll" module
  [global defineReadOnlyProperty:@"kroll" withValue:[[KrollModule alloc] init]];

  // TODO: Move to real paths for __dirname/__filename, but that affects Android and may break users/debugging?
  //  NSString *dirname = [[TiHost resourcePath] stringByStandardizingPath];
  // Set the __dirname and __filename for the app.js.
  // For other files, it will be injected via the `TitaniumModuleRequireFormat` property
  [global defineReadOnlyProperty:@"__dirname" withValue:@"/"];
  //  NSString *filename = [dirname stringByAppendingString:@"/app.js"];
  [global defineReadOnlyProperty:@"__filename" withValue:@"/app.js"];

  // TODO: Move all this logic into JS code to set up lazy bindings?
  // We should be able to create a lazy global.Ti/global.Titanium using global.kroll.binding()

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
      // TODO: Replace with KrollModule.binding()? Does same thing!
      JSContext *currentContext = JSContext.currentContext;
      id<Module> mod = [KrollModule loadCoreModule:name inContext:currentContext];
      if (mod != nil) {
        KrollObject *ko = [self registerProxy:mod]; // This basically retains the module for the lifetime of the bridge
        result = [JSValue valueWithJSValueRef:[ko jsobject] inContext:currentContext];
      } else {
        result = [JSValue valueWithUndefinedInContext:currentContext];
      }
      [JSContext.currentThis defineReadOnlyProperty:name
                                          withValue:result];
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
      // TODO: Align with and replace with kroll.binding()
      // Note that with legacy moduels we call registerProxy, while with new we do not...
      // We've forced a retain cycle between proxies and event listeners in ObjcProxy, so maybe that's the better route to go anyways?
      JSContext *currentContext = JSContext.currentContext;
      id<Module> mod = [KrollModule loadCoreModule:name inContext:currentContext];
      JSValue *result;
      if (mod != nil) {
        result = [JSValue valueWithObject:mod inContext:currentContext];
      } else {
        result = [JSValue valueWithUndefinedInContext:currentContext];
      }
      [JSContext.currentThis defineReadOnlyProperty:name
                                          withValue:result];
      return result;
    };
    [titanium defineProperty:name
                  descriptor:@{
                    JSPropertyDescriptorConfigurableKey : @YES,
                    JSPropertyDescriptorGetKey : [[lazyLoad copy] autorelease]
                  }];
  }

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

  // FIXME: Android does a "bootstrap" which effectively loads some JS code up, and *then* it uses Module.runModule() to execute ti.main.js
  // But we're defining Module.runModule in ti.main.js
  // How can we hijack the requires to go through Module.runModule?

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
  TiThreadPerformOnMainThread(
      ^{
        [self unregisterForMemoryWarning];
      },
      NO);
  [self removeProxies];
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
  os_unfair_lock_lock(&proxyLock);
  if (registeredProxies == NULL) {
    registeredProxies = CFDictionaryCreateMutable(NULL, 10, &kCFTypeDictionaryKeyCallBacks, &kCFTypeDictionaryValueCallBacks);
  }
  //NOTE: Do NOT treat registeredProxies like a mutableDictionary; mutable dictionaries copy keys,
  //CFMutableDictionaryRefs only retain keys, which lets them work with proxies properly.

  CFDictionaryAddValue(registeredProxies, proxy, ourKrollObject);
  os_unfair_lock_unlock(&proxyLock);
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
  os_unfair_lock_lock(&proxyLock);
  if (registeredProxies != NULL) {
    CFDictionaryRemoveValue(registeredProxies, proxy);
    //Don't bother with removing the empty registry. It's small and leaves on dealloc anyways.
  }
  os_unfair_lock_unlock(&proxyLock);
  [proxy unboundBridge:self];
}

- (BOOL)usesProxy:(id)proxy
{
  if (proxy == nil) {
    return NO;
  }
  BOOL result = NO;
  os_unfair_lock_lock(&proxyLock);

  if (registeredProxies != NULL) {
    result = (CFDictionaryGetCountOfKey(registeredProxies, proxy) != 0);
  }
  os_unfair_lock_unlock(&proxyLock);
  return result;
}

- (id)krollObjectForProxy:(id)proxy
{
  id result = nil;
  os_unfair_lock_lock(&proxyLock);
  if (registeredProxies != NULL) {
    result = (id)CFDictionaryGetValue(registeredProxies, proxy);
  }
  os_unfair_lock_unlock(&proxyLock);
  return result;
}

+ (NSArray *)krollBridgesUsingProxy:(id)proxy
{
  NSMutableArray *results = nil;

  os_unfair_lock_lock(&krollBridgeRegistryLock);
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
  os_unfair_lock_unlock(&krollBridgeRegistryLock);
  return results;
}

+ (NSArray *)krollContexts
{
  os_unfair_lock_lock(&krollBridgeRegistryLock);
  signed long bridgeCount = CFSetGetCount(krollBridgeRegistry);
  KrollBridge *registryObjects[bridgeCount];
  CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);

  NSMutableArray *results = [[NSMutableArray alloc] initWithCapacity:0];
  for (NSUInteger currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; ++currentBridgeIndex) {
    KrollBridge *bridge = registryObjects[currentBridgeIndex];
    [results addObject:bridge.krollContext];
  }

  os_unfair_lock_unlock(&krollBridgeRegistryLock);
  return [results autorelease];
}

+ (BOOL)krollBridgeExists:(KrollBridge *)bridge
{
  if (bridge == nil) {
    return NO;
  }

  bool result = NO;
  os_unfair_lock_lock(&krollBridgeRegistryLock);
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
  os_unfair_lock_unlock(&krollBridgeRegistryLock);

  return result;
}

+ (KrollBridge *)krollBridgeForThreadName:(NSString *)threadName;
{
  if (threadName == nil) {
    return nil;
  }

  KrollBridge *result = nil;
  os_unfair_lock_lock(&krollBridgeRegistryLock);
  signed long bridgeCount = CFSetGetCount(krollBridgeRegistry);
  KrollBridge *registryObjects[bridgeCount];
  CFSetGetValues(krollBridgeRegistry, (const void **)registryObjects);
  for (int currentBridgeIndex = 0; currentBridgeIndex < bridgeCount; currentBridgeIndex++) {
  }
  os_unfair_lock_unlock(&krollBridgeRegistryLock);

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
