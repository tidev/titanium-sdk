/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollContext.h"
#import "KrollCallback.h"
#import "KrollObject.h"
#import "KrollTimerManager.h"
#import "TiApp.h"
#import "TiLocale.h"
#import "TiUtils.h"

#import "TiExceptionHandler.h"
#include <pthread.h>

static unsigned short KrollContextCount = 0;

static pthread_mutex_t KrollEntryLock;

@implementation KrollUnprotectOperation

- (id)initWithContext:(JSContextRef)newContext withJsobject:(JSObjectRef)newFirst
{
  return [self initWithContext:newContext withJsobject:newFirst andJsobject:NULL];
}

- (id)initWithContext:(JSContextRef)newContext withJsobject:(JSObjectRef)newFirst andJsobject:(JSObjectRef)newSecond
{
  self = [super init];
  if (self != nil) {
    jsContext = newContext;
    firstObject = newFirst;
    secondObject = newSecond;
  }
  return self;
}

- (void)main
{
  JSValueUnprotect(jsContext, firstObject);
  if (secondObject != NULL) {
    JSValueUnprotect(jsContext, secondObject);
  }
}

@end

@implementation KrollInvocation

- (id)initWithTarget:(id)target_ method:(SEL)method_ withObject:(id)obj_ condition:(NSCondition *)condition_
{
  if (self = [super init]) {
    target = [target_ retain];
    method = method_;
    obj = [obj_ retain];
    condition = [condition_ retain];
  }
  return self;
}

- (id)initWithTarget:(id)target_ method:(SEL)method_ withObject:(id)obj_ callback:(id)callback_ selector:(SEL)selector_
{
  if (self = [super init]) {
    target = [target_ retain];
    method = method_;
    obj = [obj_ retain];
    notify = [callback_ retain];
    notifySelector = selector_;
  }
  return self;
}

- (void)dealloc
{
  [target release];
  [obj release];
  [condition release];
  [notify release];
  [super dealloc];
}

- (void)invoke:(KrollContext *)context
{
  pthread_mutex_lock(&KrollEntryLock);

  @try {
    if (target != nil) {
      [target performSelector:method withObject:obj withObject:context];
    }
    if (condition != nil) {
      [condition lock];
      [condition signal];
      [condition unlock];
    }
    if (notify != nil) {
      [notify performSelector:notifySelector];
    }
  }
  @catch (NSException *e) {
    @throw e;
  }
  @finally {
    pthread_mutex_unlock(&KrollEntryLock);
  }
}

@end

JSContextRef appJsContextRef = NULL;
KrollContext *appJsKrollContext = nil;

KrollContext *GetKrollContext(JSContextRef context)
{
  if (context == appJsContextRef) {
    return appJsKrollContext;
  }
  static const char *krollNS = "Kroll";
  JSGlobalContextRef globalContext = JSContextGetGlobalContext(context);
  JSObjectRef global = JSContextGetGlobalObject(globalContext);
  JSStringRef string = JSStringCreateWithUTF8CString(krollNS);
  JSValueRef value = JSObjectGetProperty(globalContext, global, string, NULL);
  KrollContext *ctx = (KrollContext *)JSObjectGetPrivate(JSValueToObject(globalContext, value, NULL));
  JSStringRelease(string);
  return ctx;
}

JSValueRef ThrowException(JSContextRef ctx, NSString *message, JSValueRef *exception)
{
  JSGlobalContextRef globalContextRef = JSContextGetGlobalContext(ctx);
  JSContext *context = [JSContext contextWithJSGlobalContextRef:globalContextRef];
  JSValue *value = [JSValue valueWithNewErrorFromMessage:message inContext:context];
  *exception = value.JSValueRef;

  return JSValueMakeUndefined(ctx);
}

static JSValueRef CommonJSRequireCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount != 1) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  id path = [KrollObject toID:ctx value:args[0]];
  @try {
    id result = [ctx.delegate require:ctx path:path];
    return [KrollObject toValue:ctx value:result];
  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }
}

static JSValueRef LCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount < 1) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  NSString *key = [KrollObject toID:ctx value:args[0]];
  NSString *comment = nil;
  // ignore non-String default values
  if (argCount > 1) {
    id defaultValue = [KrollObject toID:ctx value:args[1]];
    if ([defaultValue isKindOfClass:[NSString class]]) {
      comment = (NSString *)defaultValue;
    }
  }
  @try {
    id result = [TiLocale getString:key comment:comment];
    return [KrollObject toValue:ctx value:result];
  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }
}

static JSValueRef AlertCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount < 1) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  NSString *message = [TiUtils stringValue:[KrollObject toID:ctx value:args[0]]];

  [[[TiApp app] controller] incrementActiveAlertControllerCount];

  UIAlertController *alert = [UIAlertController alertControllerWithTitle:nil message:message preferredStyle:UIAlertControllerStyleAlert];
  [alert addAction:[UIAlertAction actionWithTitle:NSLocalizedString(@"OK", nil)
                                            style:UIAlertActionStyleDefault
                                          handler:^(UIAlertAction *_Nonnull action) {
                                            [[[TiApp app] controller] decrementActiveAlertControllerCount];
                                          }]];
  [[TiApp app] showModalController:alert animated:YES];

  return JSValueMakeUndefined(jsContext);
}

static JSValueRef StringFormatCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount < 2) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  NSString *format = [KrollObject toID:ctx value:args[0]];
#if TARGET_IPHONE_SIMULATOR
  // convert string references to objects
  format = [format stringByReplacingOccurrencesOfString:@"%@" withString:@"%@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%s" withString:@"%@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%1$s" withString:@"%1$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%2$s" withString:@"%2$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%3$s" withString:@"%3$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%4$s" withString:@"%4$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%5$s" withString:@"%5$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%6$s" withString:@"%6$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%7$s" withString:@"%7$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%8$s" withString:@"%8$@_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%9$s" withString:@"%9$@_TIDELIMITER_"];
  // we're dealing with double, so convert so that it formats right
  format = [format stringByReplacingOccurrencesOfString:@"%d" withString:@"%1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%1$d" withString:@"%1$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%2$d" withString:@"%2$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%3$d" withString:@"%3$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%4$d" withString:@"%4$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%5$d" withString:@"%5$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%6$d" withString:@"%6$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%7$d" withString:@"%7$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%8$d" withString:@"%8$1.0f_TIDELIMITER_"];
  format = [format stringByReplacingOccurrencesOfString:@"%9$d" withString:@"%9$1.0f_TIDELIMITER_"];

  NSArray *formatArray = [format componentsSeparatedByString:@"_TIDELIMITER_"];
  NSUInteger formatCount = [formatArray count];
  NSMutableString *result = [[NSMutableString alloc] init];
  size_t lastArgIndex = 0;
  @try {
    for (size_t x = 1; (x < argCount) && (x <= formatCount); x++) {
      NSString *theFormat = [formatArray objectAtIndex:(x - 1)];
      JSValueRef valueRef = args[x];
      if (JSValueIsString(jsContext, valueRef) || JSValueIsObject(jsContext, valueRef)) {
        id theResult = [KrollObject toID:ctx value:valueRef];
        [result appendString:[NSString stringWithFormat:theFormat, theResult]];
      } else if (JSValueIsNumber(jsContext, valueRef)) {
        double theResult = JSValueToNumber(jsContext, valueRef, NULL);
        [result appendString:[NSString stringWithFormat:theFormat, theResult]];
      } else if (JSValueIsBoolean(jsContext, valueRef)) {
        bool theResult = JSValueToBoolean(jsContext, valueRef);
        [result appendString:[NSString stringWithFormat:theFormat, theResult]];
      }
      lastArgIndex = x;
    }
    if (lastArgIndex < formatCount) {
      // Append any remaining format components
      [result appendString:[[formatArray subarrayWithRange:NSMakeRange(lastArgIndex, formatCount - lastArgIndex)] componentsJoinedByString:@""]];
    }
    JSValueRef value = [KrollObject toValue:ctx value:result];
    [result release];
    return value;

  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }

#else
  // convert string references to objects
  format = [format stringByReplacingOccurrencesOfString:@"%s" withString:@"%@"];
  format = [format stringByReplacingOccurrencesOfString:@"%1$s" withString:@"%1$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%2$s" withString:@"%2$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%3$s" withString:@"%3$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%4$s" withString:@"%4$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%5$s" withString:@"%5$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%6$s" withString:@"%6$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%7$s" withString:@"%7$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%8$s" withString:@"%8$@"];
  format = [format stringByReplacingOccurrencesOfString:@"%9$s" withString:@"%9$@"];
  // we're dealing with double, so convert so that it formats right
  format = [format stringByReplacingOccurrencesOfString:@"%d" withString:@"%1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%1$d" withString:@"%1$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%2$d" withString:@"%2$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%3$d" withString:@"%3$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%4$d" withString:@"%4$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%5$d" withString:@"%5$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%6$d" withString:@"%6$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%7$d" withString:@"%7$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%8$d" withString:@"%8$1.0f"];
  format = [format stringByReplacingOccurrencesOfString:@"%9$d" withString:@"%9$1.0f"];

  @try {
    int size = 0;
    // we have to walk each type to detect the right size and alignment
    for (size_t x = 1; x < argCount; x++) {
      JSValueRef valueRef = args[x];
      if (JSValueIsString(jsContext, valueRef) || JSValueIsObject(jsContext, valueRef)) {
        size += sizeof(id);
      } else if (JSValueIsNumber(jsContext, valueRef)) {
        size += sizeof(double);
      } else if (JSValueIsBoolean(jsContext, valueRef)) {
        size += sizeof(bool);
      }
    }
    void *argList = malloc(size);
    void *bm = argList; // copy pointer since we move the other forward
    for (size_t x = 1; x < argCount; x++) {
      JSValueRef valueRef = args[x];
      if (JSValueIsString(jsContext, valueRef) || JSValueIsObject(jsContext, valueRef)) {
        (*(id *)argList) = [KrollObject toID:ctx value:valueRef];
        argList += sizeof(id);
      } else if (JSValueIsNumber(jsContext, valueRef)) {
        (*(double *)argList) = JSValueToNumber(jsContext, valueRef, NULL);
        argList += sizeof(double);
      } else if (JSValueIsBoolean(jsContext, valueRef)) {
        (*(bool *)argList) = JSValueToBoolean(jsContext, valueRef);
        argList += sizeof(bool);
      }
    }
    NSString *result = [[NSString alloc] initWithFormat:format arguments:bm];
    JSValueRef value = [KrollObject toValue:ctx value:result];
    free(bm);
    [result release];
    return value;
  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }
#endif
}

static JSValueRef StringFormatDateCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount < 1) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  NSDate *date = [KrollObject toID:ctx value:args[0]];
  NSDateFormatterStyle style = NSDateFormatterShortStyle;

  if (argCount > 1) {
    NSString *s = [KrollObject toID:ctx value:args[1]];
    if ([s isEqualToString:@"short"]) {
      // default
    } else if ([s isEqualToString:@"medium"]) {
      style = NSDateFormatterMediumStyle;
    } else if ([s isEqualToString:@"long"]) {
      style = NSDateFormatterLongStyle;
    } else if ([s isEqualToString:@"full"]) {
      style = NSDateFormatterFullStyle;
    }
  }

  @try {
    NSString *result = [NSDateFormatter localizedStringFromDate:date dateStyle:style timeStyle:NSDateFormatterNoStyle];
    JSValueRef value = [KrollObject toValue:ctx value:result];
    return value;
  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }
}

static JSValueRef StringFormatTimeCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount < 1) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  NSDate *date = [KrollObject toID:ctx value:args[0]];
  NSDateFormatterStyle style = NSDateFormatterShortStyle;

  if (argCount > 1) {
    NSString *s = [KrollObject toID:ctx value:args[1]];
    if ([s isEqualToString:@"short"]) {
      // default
    } else if ([s isEqualToString:@"medium"]) {
      style = NSDateFormatterMediumStyle;
    } else if ([s isEqualToString:@"long"]) {
      style = NSDateFormatterLongStyle;
    }
  }

  @try {
    NSString *result = [NSDateFormatter localizedStringFromDate:date dateStyle:NSDateFormatterNoStyle timeStyle:style];
    JSValueRef value = [KrollObject toValue:ctx value:result];
    return value;
  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }
}

static JSValueRef StringFormatCurrencyCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount < 1) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  NSNumber *number = [KrollObject toID:ctx value:args[0]];

  @try {
    NSString *result = [NSNumberFormatter localizedStringFromNumber:number numberStyle:NSNumberFormatterCurrencyStyle];
    JSValueRef value = [KrollObject toValue:ctx value:result];
    return value;
  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }
}

static JSValueRef StringFormatDecimalCallback(JSContextRef jsContext, JSObjectRef jsFunction, JSObjectRef jsThis, size_t argCount,
    const JSValueRef args[], JSValueRef *exception)
{
  if (argCount < 1) {
    return ThrowException(jsContext, @"invalid number of arguments", exception);
  }

  KrollContext *ctx = GetKrollContext(jsContext);
  NSNumber *number = [KrollObject toID:ctx value:args[0]];

  @try {
    NSString *result;
    NSLocale *locale = nil;
    NSString *formatString = nil;
    if (argCount > 1) {
      NSString *arg = [KrollObject toID:ctx value:args[1]];
      if ([arg rangeOfCharacterFromSet:[NSCharacterSet characterSetWithCharactersInString:@"0#.,"]].location != NSNotFound) {
        formatString = arg;
      } else {
        locale = [[[NSLocale alloc] initWithLocaleIdentifier:arg] autorelease];
      }
    }
    // If locale is nil, either: Single argument, or the second arg is format string and not locale ID.
    if (locale == nil) {
      locale = [NSLocale currentLocale];
    }

    NSNumberFormatter *formatter = [[[NSNumberFormatter alloc] init] autorelease];

    [formatter setLocale:locale];
    [formatter setNumberStyle:NSNumberFormatterDecimalStyle];

    // Format handling to match the extremely vague android specs
    if (argCount == 3) {
      formatString = [KrollObject toID:ctx value:args[2]];
    }

    if (formatString != nil) {
      NSArray *formats = [formatString componentsSeparatedByString:@";"];
      [formatter setPositiveFormat:[formats objectAtIndex:0]];
      if ([formats count] > 1) {
        [formatter setNegativeFormat:[formats objectAtIndex:1]];
      } else {
        [formatter setNegativeFormat:[formats objectAtIndex:0]];
      }
    }

    result = [formatter stringFromNumber:number];

    JSValueRef value = [KrollObject toValue:ctx value:result];
    return value;
  }
  @catch (NSException *e) {
    return ThrowException(jsContext, [e reason], exception);
  }
}

@implementation KrollEval

- (id)initWithCode:(NSString *)code_
{
  return [self initWithCode:code_ sourceURL:nil];
}

- (id)initWithCode:(NSString *)code_ sourceURL:(NSURL *)sourceURL_
{
  return [self initWithCode:code_ sourceURL:sourceURL_ startingLineNo:1];
}

- (id)initWithCode:(NSString *)code_ sourceURL:(NSURL *)sourceURL_ startingLineNo:(NSInteger)startingLineNo_
{
  self = [super init];
  if (self) {
    code = [code_ copy];
    sourceURL = [sourceURL_ copy];
    startingLineNo = startingLineNo_;
  }
  return self;
}

- (void)dealloc
{
  [code release];
  [sourceURL release];
  [super dealloc];
}

- (JSValueRef)jsInvokeInContext:(KrollContext *)context exception:(JSValueRef *)exceptionPointer
{
  pthread_mutex_lock(&KrollEntryLock);
  JSStringRef jsCode = JSStringCreateWithCFString((CFStringRef)code);
  JSStringRef jsURL = NULL;
  if (sourceURL != nil) {
    jsURL = JSStringCreateWithUTF8CString([[sourceURL absoluteString] UTF8String]);
  }
  JSObjectRef global = JSContextGetGlobalObject([context context]);

  JSValueRef result = JSEvaluateScript([context context], jsCode, global, jsURL, (int)startingLineNo, exceptionPointer);

  JSStringRelease(jsCode);
  if (jsURL != NULL) {
    JSStringRelease(jsURL);
  }
  pthread_mutex_unlock(&KrollEntryLock);

  return result;
}

- (void)invoke:(KrollContext *)context
{
  pthread_mutex_lock(&KrollEntryLock);
  JSValueRef exception = NULL;
  [self jsInvokeInContext:context exception:&exception];

  if (exception != NULL) {
    [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inKrollContext:context];
    pthread_mutex_unlock(&KrollEntryLock);
  }
  pthread_mutex_unlock(&KrollEntryLock);
}

- (id)invokeWithResult:(KrollContext *)context
{
  pthread_mutex_lock(&KrollEntryLock);
  JSValueRef exception = NULL;
  JSValueRef result = [self jsInvokeInContext:context exception:&exception];

  if (exception != NULL) {
    [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inKrollContext:context];
    pthread_mutex_unlock(&KrollEntryLock);
  }
  pthread_mutex_unlock(&KrollEntryLock);

  return [KrollObject toID:context value:result];
}

@end

@implementation KrollEvent

- (id)initWithType:(NSString *)newType ForKrollObject:(KrollObject *)newCallbackObject eventObject:(NSDictionary *)newEventObject thisObject:(id)newThisObject;
{
  if (self = [super init]) {
    type = [newType copy];
    callbackObject = [newCallbackObject retain];
    eventObject = [newEventObject retain];
    thisObject = [newThisObject retain];
  }
  return self;
}

- (id)initWithCallback:(KrollCallback *)newCallback eventObject:(NSDictionary *)newEventObject thisObject:(id)newThisObject
{
  if (self = [super init]) {
    callback = [newCallback retain];
    eventObject = [newEventObject retain];
    thisObject = [newThisObject retain];
  }
  return self;
}

- (void)dealloc
{
  [callback release];
  [type release];
  [thisObject release];
  [callbackObject release];
  [eventObject release];
  [super dealloc];
}
- (void)invoke:(KrollContext *)context
{
  pthread_mutex_lock(&KrollEntryLock);
  if (callbackObject != nil) {
    [callbackObject triggerEvent:type withObject:eventObject thisObject:thisObject];
  }

  if (callback != nil) {
    [callback call:[NSArray arrayWithObject:eventObject] thisObject:thisObject];
  }
  pthread_mutex_unlock(&KrollEntryLock);
}
@end

@implementation KrollContext

@synthesize delegate;

+ (void)initialize
{
  if (self == [KrollContext class]) {
    pthread_mutexattr_t entryLockAttrs;
    pthread_mutexattr_init(&entryLockAttrs);
    pthread_mutexattr_settype(&entryLockAttrs, PTHREAD_MUTEX_RECURSIVE);
    pthread_mutex_init(&KrollEntryLock, &entryLockAttrs);
  }
}

- (NSString *)threadName
{
  return [NSString stringWithFormat:@"KrollContext<%@>", self.jsThread];
}

- (id)init
{
  if (self = [super init]) {
#if CONTEXT_MEMORY_DEBUG == 1
    NSLog(@"[DEBUG] INIT: %@", self);
#endif
    stopped = YES;
    KrollContextCount++;
    _jsThread = NSThread.currentThread;

    WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  }
  return self;
}

- (void)destroy
{
#if CONTEXT_MEMORY_DEBUG == 1
  NSLog(@"[DEBUG] DESTROY: %@", self);
#endif
  [self stop];
  RELEASE_TO_NIL(timerManager);
}

#if CONTEXT_MEMORY_DEBUG == 1
- (id)retain
{
  NSLog(@"[DEBUG] RETAIN: %@ (%d)", self, [self retainCount] + 1);
  return [super retain];
}
- (oneway void)release
{
  NSLog(@"[DEBUG] RELEASE: %@ (%d)", self, [self retainCount] - 1);
  [super release];
}
#endif

- (void)unregisterForNotifications
{
  WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)dealloc
{
#if CONTEXT_MEMORY_DEBUG == 1
  NSLog(@"[DEBUG] DEALLOC: %@", self);
#endif
  assert(!destroyed);
  destroyed = YES;
  [self destroy];
  KrollContextCount--;
  [super dealloc];
}

- (void)start
{
  if (stopped != YES) {
    @throw [NSException exceptionWithName:@"org.appcelerator.kroll"
                                   reason:@"already started"
                                 userInfo:nil];
  }
  stopped = NO;
  TiPerformBlock(
      self, ^{
        [self main];
      },
      NO);
}

- (void)stop
{
  if (!stopped) {
    stopped = YES;
  }
}

- (BOOL)running
{
  return !stopped;
}

- (JSGlobalContextRef)context
{
  return context;
}

- (BOOL)isKJSThread
{
  return self.jsThread == NSThread.currentThread;
}

- (void)invoke:(id)object
{
  pthread_mutex_lock(&KrollEntryLock);
  if ([object isKindOfClass:[NSOperation class]]) {
    [(NSOperation *)object start];
    pthread_mutex_unlock(&KrollEntryLock);
    return;
  }

  [object invoke:self];
  pthread_mutex_unlock(&KrollEntryLock);
}

- (void)enqueue:(id)obj
{
  TiPerformBlock(
      self, ^{
        [self invoke:obj];
      },
      self.isKJSThread);
}

- (void)evalJS:(NSString *)code
{
  KrollEval *eval = [[[KrollEval alloc] initWithCode:code] autorelease];
  [self enqueue:eval];
}

- (id)evalJSAndWait:(NSString *)code
{
  KrollEval *eval = [[[KrollEval alloc] initWithCode:code] autorelease];
  return [eval invokeWithResult:self];
}

- (void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj condition:(NSCondition *)condition_
{
  KrollInvocation *invocation = [[[KrollInvocation alloc] initWithTarget:callback_ method:method_ withObject:obj condition:condition_] autorelease];
  [self invoke:invocation];
}

- (void)invokeOnThread:(id)callback_ method:(SEL)method_ withObject:(id)obj callback:(id)callback selector:(SEL)selector_
{
  KrollInvocation *invocation = [[[KrollInvocation alloc] initWithTarget:callback_ method:method_ withObject:obj callback:callback selector:selector_] autorelease];
  [self invoke:invocation];
}

- (void)invokeBlockOnThread:(void (^)(void))block
{
  pthread_mutex_lock(&KrollEntryLock);
  block();
  pthread_mutex_unlock(&KrollEntryLock);
}

+ (void)invokeBlock:(void (^)(void))block
{
  pthread_mutex_lock(&KrollEntryLock);
  block();
  pthread_mutex_unlock(&KrollEntryLock);
}

- (void)bindCallback:(NSString *)name callback:(JSObjectCallAsFunctionCallback)fn
{
  // create the invoker bridge
  JSStringRef invokerFnName = JSStringCreateWithCFString((CFStringRef)name);
  JSValueRef invoker = JSObjectMakeFunctionWithCallback(context, invokerFnName, fn);
  if (invoker) {
    JSObjectRef global = JSContextGetGlobalObject(context);
    JSObjectSetProperty(context, global,
        invokerFnName, invoker,
        kJSPropertyAttributeNone,
        NULL);
  }
  JSStringRelease(invokerFnName);
}

- (void)gc
{
  // don't worry about locking, not that important
  gcrequest = YES;
}

- (int)forceGarbageCollectNow
{
  JSGarbageCollect(context);
  gcrequest = NO;
  loopCount = 0;

  return 0;
}

- (void)main
{
  pthread_mutex_lock(&KrollEntryLock);
  context = JSGlobalContextCreate(NULL);
  JSObjectRef globalRef = JSContextGetGlobalObject(context);

  if (appJsKrollContext == nil) {
    appJsKrollContext = self;
    appJsContextRef = context;
  }

  // we register an empty kroll string that allows us to pluck out this instance
  KrollObject *kroll = [[KrollObject alloc] initWithTarget:nil context:self];
  JSValueRef krollRef = [KrollObject toValue:self value:kroll];
  JSStringRef prop = JSStringCreateWithUTF8CString("Kroll");
  JSObjectSetProperty(context, globalRef, prop, krollRef,
      kJSPropertyAttributeDontDelete | kJSPropertyAttributeDontEnum | kJSPropertyAttributeReadOnly,
      NULL);
  JSObjectRef krollObj = JSValueToObject(context, krollRef, NULL);
  bool set = JSObjectSetPrivate(krollObj, self);
  assert(set);
  [kroll release];
  JSStringRelease(prop);

  JSContext *jsContext = [JSContext contextWithJSGlobalContextRef:context];
  timerManager = [[KrollTimerManager alloc] initInContext:jsContext];

  [self bindCallback:@"require"
            callback:&CommonJSRequireCallback];
  [self bindCallback:@"L" callback:&LCallback];
  [self bindCallback:@"alert" callback:&AlertCallback];

  prop = JSStringCreateWithUTF8CString("String");

  // create a special method -- String.format -- that will act as a string formatter
  JSStringRef formatName = JSStringCreateWithUTF8CString("format");
  JSValueRef invoker = JSObjectMakeFunctionWithCallback(context, formatName, &StringFormatCallback);
  JSValueRef stringValueRef = JSObjectGetProperty(context, globalRef, prop, NULL);
  JSObjectRef stringRef = JSValueToObject(context, stringValueRef, NULL);
  JSObjectSetProperty(context, stringRef,
      formatName, invoker,
      kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete,
      NULL);
  JSStringRelease(formatName);

  // create a special method -- String.formatDate -- that will act as a date formatter
  formatName = JSStringCreateWithUTF8CString("formatDate");
  invoker = JSObjectMakeFunctionWithCallback(context, formatName, &StringFormatDateCallback);
  stringValueRef = JSObjectGetProperty(context, globalRef, prop, NULL);
  stringRef = JSValueToObject(context, stringValueRef, NULL);
  JSObjectSetProperty(context, stringRef,
      formatName, invoker,
      kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete,
      NULL);
  JSStringRelease(formatName);

  // create a special method -- String.formatTime -- that will act as a time formatter
  formatName = JSStringCreateWithUTF8CString("formatTime");
  invoker = JSObjectMakeFunctionWithCallback(context, formatName, &StringFormatTimeCallback);
  stringValueRef = JSObjectGetProperty(context, globalRef, prop, NULL);
  stringRef = JSValueToObject(context, stringValueRef, NULL);
  JSObjectSetProperty(context, stringRef,
      formatName, invoker,
      kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete,
      NULL);
  JSStringRelease(formatName);

  // create a special method -- String.formatDecimal -- that will act as a decimal formatter
  formatName = JSStringCreateWithUTF8CString("formatDecimal");
  invoker = JSObjectMakeFunctionWithCallback(context, formatName, &StringFormatDecimalCallback);
  stringValueRef = JSObjectGetProperty(context, globalRef, prop, NULL);
  stringRef = JSValueToObject(context, stringValueRef, NULL);
  JSObjectSetProperty(context, stringRef,
      formatName, invoker,
      kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete,
      NULL);
  JSStringRelease(formatName);

  // create a special method -- String.formatCurrency -- that will act as a currency formatter
  formatName = JSStringCreateWithUTF8CString("formatCurrency");
  invoker = JSObjectMakeFunctionWithCallback(context, formatName, &StringFormatCurrencyCallback);
  stringValueRef = JSObjectGetProperty(context, globalRef, prop, NULL);
  stringRef = JSValueToObject(context, stringValueRef, NULL);
  JSObjectSetProperty(context, stringRef,
      formatName, invoker,
      kJSPropertyAttributeReadOnly | kJSPropertyAttributeDontDelete,
      NULL);
  JSStringRelease(formatName);

  JSStringRelease(prop);

  if (delegate != nil && [delegate respondsToSelector:@selector(willStartNewContext:)]) {
    [delegate performSelector:@selector(willStartNewContext:) withObject:self];
  }

  loopCount = 0;

  if (delegate != nil && [delegate respondsToSelector:@selector(didStartNewContext:)]) {
    [delegate performSelector:@selector(didStartNewContext:) withObject:self];
  }
  pthread_mutex_unlock(&KrollEntryLock);
}

@end

@implementation ExpandedInvocationOperation
@synthesize invocationTarget, invocationSelector;
@synthesize invocationArg1, invocationArg2, invocationArg3, invocationArg4;

- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2;
{
  self = [super init];
  if (self != nil) {
    [self setInvocationTarget:target];
    [self setInvocationSelector:sel];
    [self setInvocationArg1:arg1];
    [self setInvocationArg2:arg2];
  }
  return self;
}

- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2 object:(id)arg3;
{
  self = [self initWithTarget:target selector:sel object:arg1 object:arg2];
  if (self != nil) {
    [self setInvocationArg3:arg3];
  }
  return self;
}

- (id)initWithTarget:(id)target selector:(SEL)sel object:(id)arg1 object:(id)arg2 object:(id)arg3 object:(id)arg4;
{
  self = [self initWithTarget:target selector:sel object:arg1 object:arg2 object:arg3];
  if (self != nil) {
    [self setInvocationArg4:arg4];
  }
  return self;
}

- (void)main
{
  NSMethodSignature *msignature = [invocationTarget methodSignatureForSelector:invocationSelector];
  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:msignature];
  NSUInteger argCount = [msignature numberOfArguments];
  if (argCount >= 3) {
    [invocation setArgument:&invocationArg1 atIndex:2];
  }
  if (argCount >= 4) {
    [invocation setArgument:&invocationArg2 atIndex:3];
  }
  if (argCount >= 5) {
    [invocation setArgument:&invocationArg3 atIndex:4];
  }
  if (argCount >= 6) {
    [invocation setArgument:&invocationArg4 atIndex:5];
  }
  [invocation setSelector:invocationSelector];
  [invocation invokeWithTarget:invocationTarget];
}

- (void)dealloc
{
  [invocationTarget release];
  [invocationArg1 release];
  [invocationArg2 release];
  [invocationArg3 release];
  [invocationArg4 release];
  [super dealloc];
}

@end
