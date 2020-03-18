/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcProxy.h"
#import "KrollBridge.h"
#import "TiBindingTiValue.h"
#import "TiExceptionHandler.h"
#import "TiHost.h"

@implementation ObjcProxy

@synthesize bubbleParent;

+ (JSValue *)createError:(NSString *)reason subreason:(NSString *)subreason location:(NSString *)location inContext:(JSContext *)context
{
  NSString *exceptionName = @"org.appcelerator";
  NSDictionary *details;
  if (subreason != nil) {
    details = @{
      kTiExceptionSubreason : subreason,
      kTiExceptionLocation : location
    };
  } else {
    details = @{
      kTiExceptionLocation : location
    };
  }
  NSException *exc = [NSException exceptionWithName:exceptionName reason:reason userInfo:details];
  JSGlobalContextRef jsContext = [context JSGlobalContextRef];
  JSValueRef jsValueRef = TiBindingTiValueFromNSObject(jsContext, exc);
  return [JSValue valueWithJSValueRef:jsValueRef inContext:context];
}

- (JSValue *)createError:(NSString *)reason subreason:(NSString *)subreason location:(NSString *)location inContext:(JSContext *)context
{
  NSString *exceptionName = [@"org.appcelerator." stringByAppendingString:NSStringFromClass([self class])];
  NSDictionary *details;
  if (subreason != nil) {
    details = @{
      kTiExceptionSubreason : subreason,
      kTiExceptionLocation : location
    };
  } else {
    details = @{
      kTiExceptionLocation : location
    };
  }
  NSException *exc = [NSException exceptionWithName:exceptionName reason:reason userInfo:details];
  JSGlobalContextRef jsContext = [context JSGlobalContextRef];
  JSValueRef jsValueRef = TiBindingTiValueFromNSObject(jsContext, exc);
  return [JSValue valueWithJSValueRef:jsValueRef inContext:context];
}

- (void)throwException:(NSString *)reason subreason:(NSString *)subreason location:(NSString *)location
{
  JSContext *context = [JSContext currentContext];
  JSValue *error = [self createError:reason subreason:subreason location:location inContext:context];
  [context setException:error];
}

+ (void)throwException:(NSString *)reason subreason:(NSString *)subreason location:(NSString *)location
{
  JSContext *context = [JSContext currentContext];
  JSValue *error = [ObjcProxy createError:reason subreason:subreason location:location inContext:context];
  [context setException:error];
}

// Conversion methods for interacting with "old" KrollObject style proxies
- (id)JSValueToNative:(JSValue *)jsValue
{
  JSContext *context = [jsValue context];
  JSGlobalContextRef jsContext = [context JSGlobalContextRef];
  JSValueRef valueRef = [jsValue JSValueRef];
  id obj = TiBindingTiValueToNSObject(jsContext, valueRef);
  return obj;
}

- (JSValue *)NativeToJSValue:(id)native
{
  JSContext *context = [JSContext currentContext];
  JSGlobalContextRef jsContext = [context JSGlobalContextRef];
  JSValueRef jsValueRef = TiBindingTiValueFromNSObject(jsContext, native);
  return [JSValue valueWithJSValueRef:jsValueRef inContext:context];
}

- (id)init
{
  if (self = [super init]) {
    self.bubbleParent = YES;
    JSContext *context = [JSContext currentContext];
    if (context == nil) { // from native code!
      // Ask KrollBridge for current URL?
      NSString *basePath = [TiHost resourcePath];
      baseURL = [[NSURL fileURLWithPath:basePath] retain];
    } else {
      JSValue *filename = [context evaluateScript:@"__filename"];
      NSString *asString = [filename toString];
      NSString *base;
      [TiHost resourceBasedURL:asString baseURL:&base];
      baseURL = [[NSURL fileURLWithPath:base] retain];
    }
    pthread_rwlock_init(&_listenerLock, NULL);
    [self _configure];
  }
  return self;
}

- (id)_initWithPageContext:(id<TiEvaluator>)context
{
  return [self init];
}

- (id)_initWithPageContext:(id<TiEvaluator>)context_ args:(NSArray *)args
{
  if (self = [self _initWithPageContext:context_]) {
    NSDictionary *a = nil;
    NSUInteger count = [args count];
    if (count > 0 && [[args objectAtIndex:0] isKindOfClass:[NSDictionary class]]) {
      a = [args objectAtIndex:0];
    }

    // If we're being created by an old proxy/module but we're a new-style obj-c proxy
    // we need to handle assigning the properties object passed into the constructor
    if (a != nil) {
      // Get the JS object corresponding to "this" proxy
      // Note that [JSContext currentContext] is nil, so we need to hack and get the global context
      // TODO: Can we hack in a nice method that gets current context if available, falls back to global context?
      // Because a lot of the code in the proxy base class assumes current context is not nil
      KrollContext *krollContext = [context_ krollContext];
      JSGlobalContextRef ref = krollContext.context;
      JSValueRef jsValueRef = TiBindingTiValueFromNSObject(ref, self);
      JSContext *context = [JSContext contextWithJSGlobalContextRef:ref];
      JSValue *this = [JSValue valueWithJSValueRef:jsValueRef inContext:context];

      // Go through the key/value pairs and set them on "this"
      for (NSString *key in a) {
        id value = a[key];
        this[key] = value;
      }
    }
  }
  return self;
}

- (NSURL *)_baseURL
{
  return baseURL;
}

- (void)addEventListener:(NSString *)name withCallback:(JSValue *)callback
{
  pthread_rwlock_wrlock(&_listenerLock);
  NSUInteger ourCallbackCount = 0;
  @try {
    if (_listeners == nil) {
      _listeners = [[NSMutableDictionary alloc] initWithCapacity:3];
    }
    JSManagedValue *managedRef = [JSManagedValue managedValueWithValue:callback];
    [callback.context.virtualMachine addManagedReference:managedRef withOwner:self];
    NSMutableArray *listenersForType = [_listeners objectForKey:name];
    if (listenersForType == nil) {
      listenersForType = [[NSMutableArray alloc] init];
    }
    [listenersForType addObject:managedRef];
    ourCallbackCount = [listenersForType count];
    [_listeners setObject:listenersForType forKey:name];
  }
  @finally {
    pthread_rwlock_unlock(&_listenerLock);
    [self _listenerAdded:name count:(int)ourCallbackCount];
  }
}

- (void)removeEventListener:(NSString *)name withCallback:(JSValue *)callback
{
  pthread_rwlock_wrlock(&_listenerLock);
  NSUInteger ourCallbackCount = 0;
  BOOL removed = false;
  @try {
    if (_listeners == nil) {
      return;
    }
    NSMutableArray *listenersForType = (NSMutableArray *)[_listeners objectForKey:name];
    if (listenersForType == nil) {
      return;
    }

    NSUInteger count = [listenersForType count];
    for (NSUInteger i = 0; i < count; i++) {
      JSManagedValue *storedCallback = (JSManagedValue *)[listenersForType objectAtIndex:i];
      JSValue *actualCallback = [storedCallback value];
      if ([actualCallback isEqualToObject:callback]) {
        // if the callback matches, remove the listener from our mapping and mark unmanaged
        [actualCallback.context.virtualMachine removeManagedReference:storedCallback withOwner:self];
        [listenersForType removeObjectAtIndex:i];
        [_listeners setObject:listenersForType forKey:name];
        ourCallbackCount = count - 1;
        removed = true;
        break;
      }
    }
  }
  @finally {
    pthread_rwlock_unlock(&_listenerLock);
    if (removed) {
      [self _listenerRemoved:name count:(int)ourCallbackCount];
    }
  }
}

- (BOOL)_hasListeners:(NSString *)type
{
  pthread_rwlock_rdlock(&_listenerLock);
  @try {
    if (_listeners == nil) {
      return NO;
    }
    NSMutableArray *listenersForType = (NSMutableArray *)[_listeners objectForKey:type];
    if (listenersForType == nil) {
      return NO;
    }
    return [listenersForType count] > 0;
  }
  @finally {
    pthread_rwlock_unlock(&_listenerLock);
  }
}

- (void)_listenerAdded:(NSString *)type count:(int)count
{
  // for subclasses
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  // for subclasses
}

- (void)fireEvent:(NSString *)name withDict:(NSDictionary *)dict
{
  pthread_rwlock_rdlock(&_listenerLock);
  @try {
    if (_listeners == nil) {
      return;
    }
    NSArray *listenersForType = [_listeners objectForKey:name];
    if (listenersForType == nil) {
      return;
    }
    // FIXME: looks like we need to handle bubble logic/etc. See other fireEvent impl
    for (JSManagedValue *storedCallback in listenersForType) {
      JSValue *function = [storedCallback value];
      [self _fireEventToListener:name withObject:dict listener:function];
    }
  }
  @finally {
    pthread_rwlock_unlock(&_listenerLock);
  }
}

- (void)_fireEventToListener:(NSString *)type withObject:(id)obj listener:(JSValue *)listener
{
  NSMutableDictionary *eventObject = nil;
  if ([obj isKindOfClass:[NSDictionary class]]) {
    eventObject = [NSMutableDictionary dictionaryWithDictionary:obj];
  } else {
    eventObject = [NSMutableDictionary dictionary];
  }

  // common event properties for all events we fire.. IF they're undefined.
  if (eventObject[@"type"] == nil) {
    eventObject[@"type"] = type;
  }
  if (eventObject[@"source"] == nil) {
    eventObject[@"source"] = self;
  }

  if (listener != nil) {
    [listener callWithArguments:@[ eventObject ]];
    // handle an uncaught exception
    JSValue *exception = listener.context.exception;
    if (exception != nil) {
      NSDictionary *exceptionDict = [self JSValueToNative:exception];
      [[TiExceptionHandler defaultExceptionHandler] reportScriptError:[TiUtils scriptErrorValue:exceptionDict]];
    }
  }
}

//For subclasses to override
- (NSString *)apiName
{
  DebugLog(@"[ERROR] Subclasses must override the apiName API endpoint.");
  return @"Ti.Proxy";
}

GETTER_IMPL(NSString *, apiName, ApiName);
READWRITE_IMPL(BOOL, bubbleParent, BubbleParent);

- (void)dealloc
{
  [self _destroy];
  pthread_rwlock_destroy(&_listenerLock);
  [super dealloc];
}

- (void)_destroy
{
  // remove all listeners JS side proxy
  pthread_rwlock_wrlock(&_listenerLock);
  // releasing JSManagedValues should clean up the wrapped JSValue*
  RELEASE_TO_NIL(_listeners);
  pthread_rwlock_unlock(&_listenerLock);

  RELEASE_TO_NIL(baseURL);
}

- (void)_configure
{
  // for subclasses
}

- (id<TiEvaluator>)executionContext
{
  KrollContext *context = GetKrollContext([[JSContext currentContext] JSGlobalContextRef]);
  return (KrollBridge *)[context delegate];
}

@end
