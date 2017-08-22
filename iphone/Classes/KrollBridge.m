/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollBridge.h"
#import "APSAnalytics.h"
#import "ApplicationMods.h"
#import "KrollCallback.h"
#import "KrollContext.h"
#import "KrollObject.h"
#import "TiApp.h"
#import "TiConsole.h"
#import "TiExceptionHandler.h"
#import "TiHost.h"
#import "TiToJS.h"
#import "TiUtils.h"
#import "TopTiModule.h"
#import <libkern/OSAtomic.h>

#ifdef KROLL_COVERAGE
#include "KrollCoverage.h"
#endif
#ifndef USE_JSCORE_FRAMEWORK
#import "TiDebugger.h"
#endif
extern BOOL const TI_APPLICATION_ANALYTICS;
extern NSString *const TI_APPLICATION_DEPLOYTYPE;
extern NSString *const TI_APPLICATION_GUID;
extern NSString *const TI_APPLICATION_BUILD_TYPE;

NSString *TitaniumModuleRequireFormat = @"(function(exports){"
                                         "var __OXP=exports;var module={'exports':exports};var __dirname=\"%@\";var __filename=\"%@\";%@;\n"
                                         "if(module.exports !== __OXP){return module.exports;}"
                                         "return exports;})({})";

//Defined private method inside TiBindingRunLoop.m (Perhaps to move to .c?)
void TiBindingRunLoopAnnounceStart(TiBindingRunLoop runLoop);

@implementation TitaniumObject

- (NSDictionary *)modules
{
  return modules;
}

- (id)initWithContext:(KrollContext *)context_ host:(TiHost *)host_ context:(id<TiEvaluator>)pageContext_ baseURL:(NSURL *)baseURL_
{
  TopTiModule *module = [[[TopTiModule alloc] _initWithPageContext:pageContext_] autorelease];
  [module setHost:host_];
  [module _setBaseURL:baseURL_];

  if (self = [super initWithTarget:module context:context_]) {
    pageContext = pageContext_;
    modules = [[NSMutableDictionary alloc] init];
    host = [host_ retain];
    [(KrollBridge *)pageContext_ registerProxy:module krollObject:self];

    // pre-cache a few modules we always use
    TiModule *ui = [host moduleNamed:@"UI" context:pageContext_];
    [self addModule:@"UI" module:ui];
    TiModule *api = [host moduleNamed:@"API" context:pageContext_];
    [self addModule:@"API" module:api];

    if (TI_APPLICATION_ANALYTICS) {
      APSAnalytics *sharedAnalytics = [APSAnalytics sharedInstance];
      if (TI_APPLICATION_BUILD_TYPE != nil || (TI_APPLICATION_BUILD_TYPE.length > 0)) {
        [sharedAnalytics performSelector:@selector(setBuildType:) withObject:TI_APPLICATION_BUILD_TYPE];
      }
      [sharedAnalytics performSelector:@selector(setSDKVersion:) withObject:[NSString stringWithFormat:@"ti.%@", [module performSelector:@selector(version)]]];
      [sharedAnalytics enableWithAppKey:TI_APPLICATION_GUID andDeployType:TI_APPLICATION_DEPLOYTYPE];
    }
  }
  return self;
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

- (void)dealloc
{
  RELEASE_TO_NIL(host);
  RELEASE_TO_NIL(modules);
  RELEASE_TO_NIL(dynprops);
  [super dealloc];
}

- (void)gc
{
}

- (id)valueForKey:(NSString *)key
{
  // allow dynprops to override built-in modules
  // in case you want to re-define them
  if (dynprops != nil) {
    id result = [dynprops objectForKey:key];
    if (result != nil) {
      if (result == [NSNull null]) {
        return nil;
      }
      return result;
    }
  }
  id module = [modules objectForKey:key];
  if (module != nil) {
    return module;
  }
  module = [host moduleNamed:key context:pageContext];
  if (module != nil) {
    return [self addModule:key module:module];
  }
  //go against module
  return [super valueForKey:key];
}

- (void)setValue:(id)value forKey:(NSString *)key
{
  if (dynprops == nil) {
    dynprops = [[NSMutableDictionary dictionary] retain];
  }
  if (value == nil) {
    value = [NSNull null];
  }
  [dynprops setValue:value forKey:key];
}

- (id)valueForUndefinedKey:(NSString *)key
{
  if ([key isEqualToString:@"toString"] || [key isEqualToString:@"valueOf"]) {
    return [self description];
  }
  if (dynprops != nil) {
    return [dynprops objectForKey:key];
  }
  //NOTE: we need to return nil here since in JS you can ask for properties
  //that don't exist and it should return undefined, not an exception
  return nil;
}

- (id)addModule:(NSString *)name module:(TiModule *)module
{
  // Have we received a JS Module?
  if (![module respondsToSelector:@selector(unboundBridge:)]) {
    [modules setObject:module forKey:name];
    return module;
  }
  KrollObject *ko = [pageContext registerProxy:module];
  if (ko == nil) {
    return nil;
  }
  [self noteKrollObject:ko forKey:name];
  [modules setObject:ko forKey:name];
  return ko;
}

- (TiModule *)moduleNamed:(NSString *)name context:(id<TiEvaluator>)context
{
  return [modules objectForKey:name];
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
    pathCache = [[NSMutableDictionary alloc] init];
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

  //During a memory panic, we may not get the chance to copy proxies.
  while (keepWarning) {
    keepWarning = NO;

    for (id proxy in (NSDictionary *)registeredProxies) {
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
  RELEASE_TO_NIL(titanium);
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
  TiValueRef exception = NULL;

  TiContextRef jsContext = [context_ context];

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

  TiStringRef jsCode = TiStringCreateWithCFString((CFStringRef)jcode);
  TiStringRef jsURL = TiStringCreateWithUTF8CString(urlCString);

  if (exception == NULL) {
#ifndef USE_JSCORE_FRAMEWORK
    if ([[self host] debugMode]) {
      TiDebuggerBeginScript(context_, urlCString);
    }
#endif

    TiEvalScript(jsContext, jsCode, NULL, jsURL, 1, &exception);

#ifndef USE_JSCORE_FRAMEWORK
    if ([[self host] debugMode]) {
      TiDebuggerEndScript(context_);
    }
#endif
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

  TiStringRelease(jsCode);
  TiStringRelease(jsURL);
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

  if (shutdown == NO) {
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
  [titanium gc];
}

#pragma mark Delegate

- (void)willStartNewContext:(KrollContext *)kroll
{
#ifdef HYPERLOOP
  // Start Hyperloop engine if present
  Class cls = NSClassFromString(@"Hyperloop");
  if (cls) {
    [cls performSelector:@selector(willStartNewContext:bridge:) withObject:kroll withObject:self];
  }
#endif
  [self retain]; // Hold onto ourselves as long as the context needs us
}

- (void)didStartNewContext:(KrollContext *)kroll
{
  // create Titanium global object
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

  // Load the "Titanium" object into the global scope
  NSString *basePath = (url == nil) ? [TiHost resourcePath] : [[[url path] stringByDeletingLastPathComponent] stringByAppendingPathComponent:@"."];
  titanium = [[TitaniumObject alloc] initWithContext:kroll host:host context:self baseURL:[NSURL fileURLWithPath:basePath]];

  TiContextRef jsContext = [kroll context];
  TiValueRef tiRef = [KrollObject toValue:kroll value:titanium];

  NSString *titaniumNS = [NSString stringWithFormat:@"T%sanium", "it"];
  TiStringRef prop = TiStringCreateWithCFString((CFStringRef)titaniumNS);
  TiStringRef prop2 = TiStringCreateWithCFString((CFStringRef)[NSString stringWithFormat:@"%si", "T"]);
  TiObjectRef globalRef = TiContextGetGlobalObject(jsContext);
  TiObjectSetProperty(jsContext, globalRef, prop, tiRef,
      kTiPropertyAttributeDontDelete | kTiPropertyAttributeDontEnum,
      NULL);
  TiObjectSetProperty(jsContext, globalRef, prop2, tiRef,
      kTiPropertyAttributeDontDelete | kTiPropertyAttributeDontEnum,
      NULL);
  TiStringRelease(prop);
  TiStringRelease(prop2);

  // Load the "console" object into the global scope
  console = [[KrollObject alloc] initWithTarget:[[[TiConsole alloc] _initWithPageContext:self] autorelease] context:kroll];
  prop = TiStringCreateWithCFString((CFStringRef) @"console");
  TiObjectSetProperty(jsContext, globalRef, prop, [KrollObject toValue:kroll value:console], kTiPropertyAttributeNone, NULL);

  //if we have a preload dictionary, register those static key/values into our namespace
  if (preload != nil) {
    for (NSString *name in preload) {
      KrollObject *ti = (KrollObject *)[titanium valueForKey:name];
      NSDictionary *values = [preload valueForKey:name];
      for (id key in values) {
        id target = [values objectForKey:key];
        KrollObject *ko = [self krollObjectForProxy:target];
        if (ko == nil) {
          ko = [self registerProxy:target];
        }
        [ti noteKrollObject:ko forKey:key];
        [ti setStaticValue:ko forKey:key purgable:NO];
      }
    }
    //We need to run this before the app.js, which means it has to be here.
    TiBindingRunLoopAnnounceStart(kroll);
    [self evalFile:[url path] callback:self selector:@selector(booted)];
  } else {
    // now load the app.js file and get started
    NSURL *startURL = [host startURL];
    //We need to run this before the app.js, which means it has to be here.
    TiBindingRunLoopAnnounceStart(kroll);
    [self evalFile:[startURL absoluteString] callback:self selector:@selector(booted)];
  }

#ifdef HYPERLOOP
  Class cls = NSClassFromString(@"Hyperloop");
  if (cls) {
    [cls performSelector:@selector(didStartNewContext:bridge:) withObject:kroll withObject:self];
  }
#endif

  [pool release];
}

- (void)willStopNewContext:(KrollContext *)kroll
{
#ifdef HYPERLOOP
  // Stop Hyperloop engine if present
  Class cls = NSClassFromString(@"Hyperloop");
  if (cls) {
    [cls performSelector:@selector(willStopNewContext:bridge:) withObject:kroll withObject:self];
  }
#endif
  if (shutdown == NO) {
    shutdown = YES;
    // fire a notification event to our listeners
    WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
    NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
    [[NSNotificationCenter defaultCenter] postNotification:notification];
  }
  [titanium gc];

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
  RELEASE_TO_NIL(titanium);
  RELEASE_TO_NIL(console);
  RELEASE_TO_NIL(context);
  RELEASE_TO_NIL(preload);
#ifdef HYPERLOOP
  Class cls = NSClassFromString(@"Hyperloop");
  if (cls) {
    [cls performSelector:@selector(didStopNewContext:bridge:) withObject:kroll withObject:self];
  }
#endif
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

#ifdef KROLL_COVERAGE
  ourKrollObject = [[KrollCoverageObject alloc] initWithTarget:proxy context:context];
#else
  ourKrollObject = [[KrollObject alloc] initWithTarget:proxy context:context];
#endif

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
  TiValueRef exception = NULL;
  TiValueRef resultRef = [eval jsInvokeInContext:context exception:&exception];
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
  [result setJsobject:(TiObjectRef)resultRef];
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

- (TiModule *)loadTopLevelNativeModule:(TiModule *)module withPath:(NSString *)path withContext:(KrollContext *)kroll
{
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
  NSURL *url_ = [TiHost resourceBasedURL:path baseURL:NULL];
  KrollWrapper *wrapper = [self loadCommonJSModule:contents withSourceURL:url_];

  // For right now, we need to mix any compiled JS on top of a compiled module, so that both components
  // are accessible. We store the exports object and then put references to its properties on the toplevel
  // object.

  TiContextRef jsContext = [[self krollContext] context];
  TiObjectRef jsObject = [wrapper jsobject];
  KrollObject *moduleObject = [module krollObjectForContext:[self krollContext]];
  [moduleObject noteObject:jsObject forTiString:kTiStringExportsKey context:jsContext];

  TiPropertyNameArrayRef properties = TiObjectCopyPropertyNames(jsContext, jsObject);
  size_t count = TiPropertyNameArrayGetCount(properties);
  for (size_t i = 0; i < count; i++) {
    // Mixin the property onto the module JS object if it's not already there
    TiStringRef propertyName = TiPropertyNameArrayGetNameAtIndex(properties, i);
    if (!TiObjectHasProperty(jsContext, [moduleObject jsobject], propertyName)) {
      TiValueRef property = TiObjectGetProperty(jsContext, jsObject, propertyName, NULL);
      TiObjectSetProperty([[self krollContext] context], [moduleObject jsobject], propertyName, property, kTiPropertyAttributeReadOnly, NULL);
    }
  }
  TiPropertyNameArrayRelease(properties);

  return module;
}

- (id)loadCoreModule:(NSString *)path withContext:(KrollContext *)kroll
{
  // make sure path doesn't begin with ., .., or /
  // Can't be a "core" module then
  if ([path hasPrefix:@"/"] || [path hasPrefix:@"."]) {
    return nil;
  }

  // moduleId then is the first path component
  // try to load up the native module's class...
  NSString *moduleID = [[path pathComponents] objectAtIndex:0];
  NSString *moduleClassName = [self pathToModuleClassName:moduleID];
  Class moduleClass = NSClassFromString(moduleClassName);
  // If no such module exists, bail out!
  if (moduleClass == nil) {
    return nil;
  }

  // If there is a JS file that collides with the given path,
  // warn the user of the collision, but prefer the native/core module
  NSURL *jsPath = [NSURL URLWithString:[NSString stringWithFormat:@"%@/%@.js", [[NSURL fileURLWithPath:[TiHost resourcePath] isDirectory:YES] path], path]];
  if ([[NSFileManager defaultManager] fileExistsAtPath:[jsPath absoluteString]]) {
    NSLog(@"[WARN] The requested path '%@' has a collison between a native Ti%@um API/module and a JS file.", path, @"tani");
    NSLog(@"[WARN] The native Ti%@um API/module will be loaded in preference.", @"tani");
    NSLog(@"[WARN] If you intended to address the JS file, please require the path using a prefixed string such as require('./%@') or require('/%@') instead.", path, path);
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

  // Are they just trying to load the top-level module?
  NSRange separatorLocation = [path rangeOfString:@"/"];
  if (separatorLocation.location == NSNotFound) {
    // Indicates toplevel module
    return [self loadTopLevelNativeModule:module withPath:path withContext:kroll];
  }

  // check rest of path
  NSString *assetPath = [path substringFromIndex:separatorLocation.location + 1];
  // Treat require('module.id/module.id') == require('module.id')
  if ([assetPath isEqualToString:moduleID]) {
    return [self loadTopLevelNativeModule:module withPath:path withContext:kroll];
  }

  // not top-level module!
  // Try to load the file as module asset!
  NSString *filepath = [assetPath stringByAppendingString:@".js"];
  NSData *data = [module loadModuleAsset:filepath];
  // does it exist in module?
  if (data == nil) {
    // nope, return nil so we can try to fall back to resource in user's app
    return nil;
  }
  NSString *contents = [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  // This is an asset inside the native module. Load it like a "normal" common js file
  return [self loadJavascriptText:contents fromFile:filepath withContext:kroll];
}

- (NSString *)loadFile:(NSString *)path
{
  NSURL *url_ = [NSURL URLWithString:path relativeToURL:[[self host] baseURL]];
  NSData *data = [TiUtils loadAppResource:url_]; // try to load encrypted file

  if (data == nil) {
    data = [NSData dataWithContentsOfURL:url_];
  }

  if (data != nil) {
    [self setCurrentURL:[NSURL URLWithString:[path stringByDeletingLastPathComponent] relativeToURL:[[self host] baseURL]]];
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  }
  return nil;
}

- (KrollWrapper *)loadJavascriptObject:(NSString *)data fromFile:(NSString *)filename withContext:(KrollContext *)kroll
{
  // We could cheat and just do "module.exports = %data%", but that wouldn't validate that the passed in content was JSON
  // and may open a security hole.

  // TODO It'd be good to try and handle things more gracefully if the JSON is "bad"/malformed

  // Take JSON and turn into JS program that assigns module.exports to the parsed JSON
  // 1. trim leading and trailing newlines and whitespace from JSON file
  data = [data stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];
  // 2. Escape single quotes
  data = [data stringByReplacingOccurrencesOfString:@"'" withString:@"\'"];
  // 3. assign module.exports as JSON.parse call on the JSON
  data = [@"module.exports = JSON.parse('" stringByAppendingString:data];
  // 4. Replace newlines with "' +\n'"
  data = [data stringByReplacingOccurrencesOfString:@"\n" withString:@"' +\n'"];
  // 5. close the JSON string and end the JSON.parse call
  data = [data stringByAppendingString:@"');"];

  return [self loadJavascriptText:data fromFile:filename withContext:kroll];
}

- (KrollWrapper *)loadJavascriptText:(NSString *)data fromFile:(NSString *)filename withContext:(KrollContext *)kroll
{
  NSURL *url_ = [TiHost resourceBasedURL:filename baseURL:NULL];
#ifndef USE_JSCORE_FRAMEWORK
  const char *urlCString = [[url_ absoluteString] UTF8String];
  if ([[self host] debugMode]) {
    TiDebuggerBeginScript([self krollContext], urlCString);
  }
#endif

  KrollWrapper *wrapper = [self loadCommonJSModule:data withSourceURL:url_];

#ifndef USE_JSCORE_FRAMEWORK
  if ([[self host] debugMode]) {
    TiDebuggerEndScript([self krollContext]);
  }
#endif

  if (![wrapper respondsToSelector:@selector(replaceValue:forKey:notification:)]) {
    @throw [NSException exceptionWithName:@"org.appcelerator.kroll"
                                   reason:[NSString stringWithFormat:@"Module \"%@\" failed to leave a valid exports object", filename]
                                 userInfo:nil];
  }

  // register the module if it's pure JS
  KrollWrapper *module = (id)wrapper;

  // cache the module by filename
  [modules setObject:module forKey:filename];
  if (filename != nil && module != nil) {
    // uri is optional but we point it to where we loaded it
    [module replaceValue:[NSString stringWithFormat:@"app://%@", filename] forKey:@"uri" notification:NO];
    [module replaceValue:filename forKey:@"id" notification:NO]; // set id to full path, originally this was the path from require call
  }

  return module;
}

- (KrollWrapper *)cachedLoadAsFile:(NSString *)path asJSON:(BOOL)json withContext:(KrollContext *)kroll
{
  // check cache first
  if (modules != nil) {
    KrollWrapper *module = [modules objectForKey:path];
    if (module != nil) {
      return module;
    }
  }

  // Fall back to trying to load file
  NSString *data = [self loadFile:path];
  if (data != nil) {
    if (json) {
      return [self loadJavascriptObject:data fromFile:path withContext:context];
    }
    return [self loadJavascriptText:data fromFile:path withContext:context];
  }
  return nil;
}

- (KrollWrapper *)loadAsFile:(NSString *)path withContext:(KrollContext *)kroll
{
  NSString *filename = path;

  // 1. If X is a file, load X as JavaScript text.  STOP
  // Note: I modified the algorithm here to handle .json files as JSON, everything else as JS
  NSString *ext = [filename pathExtension];
  BOOL json = (ext != nil && [ext isEqual:@"json"]);
  KrollWrapper *module = [self cachedLoadAsFile:filename asJSON:json withContext:context];
  if (module != nil) {
    return module;
  }

  // 2. If X.js is a file, load X.js as JavaScript text.  STOP
  filename = [path stringByAppendingString:@".js"];
  module = [self cachedLoadAsFile:filename asJSON:NO withContext:context];
  if (module != nil) {
    return module;
  }

  // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP
  filename = [path stringByAppendingString:@".json"];
  module = [self cachedLoadAsFile:filename asJSON:YES withContext:context];
  if (module != nil) {
    return module;
  }

  // failed to load anything!
  return nil;
}

- (KrollWrapper *)loadAsDirectory:(NSString *)path withContext:(KrollContext *)kroll
{
  // FIXME Use loadJavascriptObject: or cachedLoadAsFile: to get package.json and then get the main value out of it?
  // 1. If X/package.json is a file,
  NSString *filename = [path stringByAppendingPathComponent:@"package.json"];
  NSString *data = [self loadFile:filename];
  if (data != nil) {
    // a. Parse X/package.json, and look for "main" field.
    // Just cheat and use TiUtils.jsonParse here, rather than loading the package.json as a JS object...
    NSDictionary *json = [TiUtils jsonParse:data];
    if (json != nil) {
      id main = [json objectForKey:@"main"];
      NSString *mainString = nil;
      if ([main isKindOfClass:[NSString class]]) {
        mainString = (NSString *)main;
        // b. let M = X + (json main field)
        NSString *m = [[path stringByAppendingPathComponent:mainString] stringByStandardizingPath];
        // c. LOAD_AS_FILE(M)
        return [self loadAsFile:m withContext:context];
      }
    }
  }

  // 2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP
  filename = [path stringByAppendingPathComponent:@"index.js"];
  KrollWrapper *module = [self cachedLoadAsFile:filename asJSON:NO withContext:context];
  if (module != nil) {
    return module;
  }

  // 3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP
  filename = [path stringByAppendingPathComponent:@"index.json"];
  module = [self cachedLoadAsFile:filename asJSON:YES withContext:context];
  if (module != nil) {
    return module;
  }

  return nil;
}

- (KrollWrapper *)loadAsFileOrDirectory:(NSString *)path withContext:(KrollContext *)kroll
{
  // FIXME Can we improve perf a little here by detecting if the target is a file or directory first?
  // i.e.
  // - if node_modules/whatever exists and is a dir, we can skip checking for node_modules/whatever.js at least
  // - if it doesn't exist at all, we can skip checking:
  //    - node_modules/whatever
  //    - node_modules/whatever/index.js
  //    - node_modules/whatever/package.json
  //    - node_modules/whatever/index.json
  //    - node_modules/whatever/whatever.js

  // a. LOAD_AS_FILE(Y + X)
  KrollWrapper *module = [self loadAsFile:path withContext:context];
  if (module) {
    return module;
  }
  // b. LOAD_AS_DIRECTORY(Y + X)
  module = [self loadAsDirectory:path withContext:context];
  if (module) {
    return module;
  }

  return nil;
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

- (id)require:(KrollContext *)kroll path:(NSString *)path
{
  NSURL *oldURL = [self currentURL];
  NSString *workingPath = [oldURL relativePath];
  NSMutableString *pathCacheKey;
  @try {
    // First let's check if we cached the resolved path for this require string
    // and if we did, try and load a cached module for this path
    if (pathCache != nil && modules != nil) {
      // We generate a path resolution cache key, first part is the requested module id/path
      pathCacheKey = [path stringByAppendingString:@"|"];
      // If request is not-absolute and we're not at the top-level dir, then append current dir as second part of cache key
      if (workingPath != nil && ![path hasPrefix:@"/"]) {
        pathCacheKey = [pathCacheKey stringByAppendingString:workingPath];
      }
      NSString *resolvedPath = [pathCache objectForKey:pathCacheKey];
      if (resolvedPath != nil) {
        TiModule *module = [modules objectForKey:resolvedPath];
        if (module != nil) {
          return module;
        }
      }
    }

    id module; // may be TiModule* if it was a core module with no hybrid JS, or KrollWrapper* in all other cases
    @try {
      // 1. If X is a core module,
      module = [self loadCoreModule:path withContext:kroll];
      if (module) {
        // a. return the core module
        // b. STOP
        return module;
      }

      // 2. If X begins with './' or '/' or '../'
      if ([path hasPrefix:@"./"] || [path hasPrefix:@"../"]) {
        // Need base path to work from for relative modules...
        NSString *relativePath = (workingPath == nil) ? path : [workingPath stringByAppendingPathComponent:path];
        module = [self loadAsFileOrDirectory:[relativePath stringByStandardizingPath] withContext:context];
        if (module) {
          return module;
        }
        // Treat '/' special as absolute, drop the leading '/'
      } else if ([path hasPrefix:@"/"]) {
        module = [self loadAsFileOrDirectory:[[path substringFromIndex:1] stringByStandardizingPath] withContext:context];
        if (module) {
          return module;
        }
      } else {
        // TODO Grab the first path segment and see if it's a node module or commonJS module
        // We should be able to organize the modules in folder to determine if the user is attempting to
        // load one of them!

        // Look for CommonJS module
        if (![path containsString:@"/"]) {
          // For CommonJS we need to look for module.id/module.id.js first...
          // Only look for this _exact file_. DO NOT APPEND .js or .json to it!
          NSString *filename = [[path stringByAppendingPathComponent:path] stringByAppendingPathExtension:@"js"];
          module = [self cachedLoadAsFile:filename asJSON:NO withContext:context];
          if (module) {
            return module;
          }

          // Then try module.id as directory
          module = [self loadAsDirectory:path withContext:context];
          if (module) {
            return module;
          }
        }

        // Need base path to work from for determining the node_modules search paths.
        module = [self loadNodeModules:path withDir:workingPath withContext:context];
        if (module) {
          return module;
        }

        // We'd like to warn users about legacy style require syntax so they can update, but the new syntax is not backwards compatible.
        // So for now, let's just be quite about it. In future versions of the SDK (7.0?) we should warn (once 5.x is end of life so backwards compat is not necessary)
        //NSLog(@"require called with un-prefixed module id: %@, should be a core or CommonJS module. Falling back to old Ti behavior and assuming it's an absolute path: /%@", path, path);
        module = [self loadAsFileOrDirectory:[path stringByStandardizingPath] withContext:context];
        if (module) {
          return module;
        }
      }
    }
    @finally {
      // Cache the resolved path for this request if we got a module
      if (module != nil && pathCache != nil && pathCacheKey != nil) {
        // I cannot find a nicer way of grabbing the filepath out of the "id" or "uri" properties for the module!
        NSArray *keys = [modules allKeysForObject:module];
        if (keys != nil) {
          NSString *filename = keys[0];
          if (filename) { // native modules may have no value
            [pathCache setObject:filename forKey:pathCacheKey];
          }
        }
      }
    }
  }
  @finally {
    [self setCurrentURL:oldURL];
  }

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
#ifdef TI_USE_KROLL_THREAD
    KrollBridge *currentBridge = registryObjects[currentBridgeIndex];
    if ([[[currentBridge krollContext] threadName] isEqualToString:threadName]) {
      result = [[currentBridge retain] autorelease];
      break;
    }
#endif
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
