/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollMethod.h"
#import "KrollContext.h"
#import "KrollObject.h"
#import <JavaScriptCore/JavaScriptCore.h>

#import "KrollBridge.h"
#import "TiApp.h"

JSClassRef KrollMethodClassRef = NULL;

JSValueRef KrollCallAsFunction(JSContextRef jsContext, JSObjectRef func, JSObjectRef thisObj, size_t argCount, const JSValueRef arguments[], JSValueRef *exception)
{
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
  KrollMethod *o = (KrollMethod *)JSObjectGetPrivate(func);
  @try {
    NSMutableArray *args = nil;
    if (argCount > 0) {
      args = [[NSMutableArray alloc] initWithCapacity:argCount];
      for (size_t c = 0; c < argCount; c++) {
        id value = [KrollObject toID:[o context] value:arguments[c]];
        //TODO: This is a temprorary workaround for the time being. We have to properly take care of [undefined] objects.
        if (value == nil) {
          [args addObject:[NSNull null]];
        } else {
          [args addObject:value];
        }
      }
    }
#if KMETHOD_DEBUG == 1
    NSDate *reftime = [NSDate date];
    NSLog(@"[DEBUG] Invoking %@ with args: %@", o, args);
#endif

    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [o call:args];
        },
        YES);
#if KMETHOD_DEBUG == 1
    double elapsed = [[NSDate date] timeIntervalSinceDate:reftime];
    NSLog(@"[DEBUG] Invoked %@ with result: %@ [took: %f]", o, result, elapsed);
#endif
    [args release];
    return [KrollObject toValue:[o context] value:result];
  }
  @catch (NSException *ex) {
#if KMETHOD_DEBUG == 1
    NSLog(@"[ERROR] method invoked exception: %@", ex);
#endif
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  @catch (NSString *ex) {
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  @finally {
    [pool release];
    pool = nil;
  }
  return JSValueMakeUndefined(jsContext);
}

JSValueRef KrollCallAsNamedFunction(JSContextRef jsContext, JSObjectRef func, JSObjectRef thisObj, size_t argCount, const JSValueRef arguments[], JSValueRef *exception)
{
  NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

  KrollMethod *o = (KrollMethod *)JSObjectGetPrivate(thisObj);
  JSStringRef jsString = JSValueToStringCopy(jsContext, func, NULL);
  NSString *funcName = (NSString *)JSStringCopyCFString(kCFAllocatorDefault, jsString);
  JSStringRelease(jsString);
  [funcName autorelease];

  @try {
    NSMutableArray *args = nil;
    if (argCount > 0) {
      args = [[NSMutableArray alloc] initWithCapacity:argCount];
      for (size_t c = 0; c < argCount; c++) {
        id value = [KrollObject toID:[o context] value:arguments[c]];
        //TODO: This is a temprorary workaround for the time being. We have to properly take care of [undefined] objects.
        if (value == nil) {
          [args addObject:[NSNull null]];
        } else {
          [args addObject:value];
        }
      }
      // Substitute target(this) with first argument
      o = [[[KrollMethod alloc] initWithTarget:[args objectAtIndex:0] selector:o.selector argcount:o.argcount type:o.type name:o.name context:o.context] autorelease];
      [args removeObjectAtIndex:0];
      if ([funcName hasPrefix:@"function apply()"]) {
        // function.apply expects the only other argument which should be array
        if (([args count] == 1) && [[args objectAtIndex:0] isKindOfClass:[NSArray class]]) {
          args = [args objectAtIndex:0];
        } else {
          o = nil;
        }
      }
    } else {
      o = nil;
    }
#if KMETHOD_DEBUG == 1
    NSDate *reftime = [NSDate date];
    NSLog(@"[DEBUG] Invoking %@ with args: %@", o, args);
#endif
    id result = [o call:args];
#if KMETHOD_DEBUG == 1
    double elapsed = [[NSDate date] timeIntervalSinceDate:reftime];
    NSLog(@"[DEBUG] Invoked %@ with result: %@ [took: %f]", o, result, elapsed);
#endif
    [args release];
    return [KrollObject toValue:[o context] value:result];
  }
  @catch (NSException *ex) {
#if KMETHOD_DEBUG == 1
    NSLog(@"[ERROR] method invoked exception: %@", ex);
#endif
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  @catch (NSString *ex) {
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  @finally {
    [pool release];
    pool = nil;
  }
  return JSValueMakeUndefined(jsContext);
}

@interface KrollMethod ()
@property (nonatomic, readonly) NSMethodSignature *methodSignature;
@end

@implementation KrollMethod
@synthesize propertyKey, selector, argcount, type, name, updatesProperty;
@synthesize methodSignature = _methodSignature;

- (id)init
{
  if (self = [super init]) {
    if (KrollMethodClassRef == NULL) {
      JSClassDefinition classDef = kJSClassDefinitionEmpty;
      classDef.className = "Function";
      classDef.initialize = KrollInitializer;
      classDef.finalize = KrollFinalizer;
      classDef.setProperty = KrollSetProperty;
      classDef.getProperty = KrollGetProperty;
      classDef.callAsFunction = KrollCallAsFunction;
      KrollMethodClassRef = JSClassCreate(&classDef);
    }
  }
  return self;
}

+ (JSClassRef)jsClassRef
{
  return KrollMethodClassRef;
}

#ifdef DEBUG
- (id)description
{
  return [NSString stringWithFormat:@"%@->%@ [%d]", target, NSStringFromSelector(selector), (int)type];
}
#endif

- (id)initWithTarget:(id)target_ context:(KrollContext *)context_;
{
  if (self = [super initWithTarget:target_ context:context_]) {
    [target_ release];
  }
  return self;
}

- (id)initWithTarget:(id)target_ selector:(SEL)selector_ argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_ context:(KrollContext *)context_;
{
  if (self = [self initWithTarget:target_ context:context_]) {
    selector = selector_;
    argcount = argcount_;
    type = type_;
    name = [name_ retain];
    _methodSignature = [target methodSignatureForSelector:selector];
  }
  return self;
}

- (void)dealloc
{
  target = nil;
  [name release];
  name = nil;
  [propertyKey release];
  [super dealloc];
}

- (void)setSelector:(SEL)selector_
{
  selector = selector_;
  _methodSignature = [target methodSignatureForSelector:selector];
}

- (void)updateJSObjectWithValue:(id)value forKey:(NSString *)key
{
  if (!updatesProperty) {
    return;
  }
  KrollBridge *ourBridge = (KrollBridge *)[context delegate];
  KrollObject *targetKrollObject = [ourBridge krollObjectForProxy:target];
  JSStringRef keyString = JSStringCreateWithCFString((CFStringRef)key);

  if ((value != target) && [value isKindOfClass:[TiProxy class]] && [ourBridge usesProxy:value]) {
    KrollObject *valueKrollObject = [ourBridge krollObjectForProxy:value];
    [targetKrollObject noteObject:[valueKrollObject jsobject] forTiString:keyString context:[context context]];
  } else {
    [targetKrollObject forgetObjectForTiString:keyString context:[context context]];
  }

  JSStringRelease(keyString);
}

- (id)call:(NSArray *)args
{
  // special property setter delegator against the target
  if (type == KrollMethodPropertySetter && [args count] == 1) {
    // Spit out a deprecation warning to use normal property setter!
    // This is the code path followed for delegating access for soemthing like
    // Ti.UI.Label#setText(). Which delegates through TiProxy.m TiProxyDelegate code
    // Other code path is handled in KrollObject.m
    DebugLog(@"[WARN] Automatic setter methods for properties are deprecated in SDK 8.0.0 and will be removed in SDK 10.0.0. Please modify the property in standard JS style: obj.%@ = value; or obj['%@'] = value;", name, name);
    id newValue = [KrollObject nonNull:[args objectAtIndex:0]];
    [self updateJSObjectWithValue:newValue forKey:name];
    [target setValue:newValue forKey:name];
    return self;
  }
  // special property getter delegator against the target
  if (type == KrollMethodPropertyGetter) {
    // Spit out a deprecation warning to use normal property accessor!
    // This is the code path followed for delegating access for something like
    // Ti.UI.Label#getText(). Which delegates through TiProxy.m TiProxyDelegate code
    // Other code path is handled in KrollObject.m
    DebugLog(@"[WARN] Automatic getter methods for properties are deprecated in SDK 8.0.0 and will be removed in SDK 10.0.0. Please access the property in standard JS style: obj.%@ or obj['%@']", name, name);
    // hold, see below
    id result = [target valueForKey:name];
    [self updateJSObjectWithValue:result forKey:name];
    return result;
  }

  // special generic factory for creating proxy objects for modules
  if (type == KrollMethodFactory) {
    //TODO: This likely could be further optimized later
    //
    BOOL useResult = [_methodSignature methodReturnLength] == sizeof(id);
    id result = nil;
    id delegate = context.delegate;
    NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:_methodSignature];
    [invocation setTarget:target];
    [invocation setSelector:selector];
    [invocation setArgument:&args atIndex:2];
    [invocation setArgument:&name atIndex:3];
    [invocation setArgument:&delegate atIndex:4];
    [invocation invoke];
    if (useResult) {
      void *tempResult;
      [invocation getReturnValue:&tempResult];
      result = (__bridge id)tempResult;
    }
    return result;
  }

  // create proxy method invocation
  if (_methodSignature == nil) {
    @throw [NSException exceptionWithName:@"org.appcelerator.kroll" reason:[NSString stringWithFormat:@"invalid method '%@'", NSStringFromSelector(selector)] userInfo:nil];
  }
  id arg1 = nil;
  id arg2 = nil;

  if ([target conformsToProtocol:@protocol(KrollTargetable)]) {
    [target setExecutionContext:context.delegate];
  }

  NSUInteger methodArgCount = [_methodSignature numberOfArguments];

  if (methodArgCount > 0 && argcount > 0) {
    if (argcount == 2 && methodArgCount == 4) {
      arg1 = [KrollObject nonNull:args == nil ? nil : [args objectAtIndex:0]];
      arg2 = [KrollObject nonNull:[args count] > 1 ? [args objectAtIndex:1] : nil];
      if (type == KrollMethodSetter) {
        [self updateJSObjectWithValue:arg1 forKey:propertyKey];
      }
    } else {
      if (type == KrollMethodDynamicProxy) {
        arg1 = name;
        arg2 = args;
      } else if (type == KrollMethodSetter) {
        arg1 = [KrollObject nonNull:[args count] == 1 ? [args objectAtIndex:0] : args];
        [self updateJSObjectWithValue:arg1 forKey:propertyKey];
      } else if (args != nil) {
        arg1 = [KrollObject nonNull:args];
      }
    }
  }

  NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:_methodSignature];
  [invocation setTarget:target];
  [invocation setSelector:selector];
  if (methodArgCount >= 3) {
    [invocation setArgument:&arg1 atIndex:2];
  }
  if (methodArgCount >= 4) {
    [invocation setArgument:&arg2 atIndex:3];
  }

  [invocation invoke];

  const char *retType = [_methodSignature methodReturnType];
  char t = retType[0];
  switch (t) {
  case 'v': {
    return nil;
  }
  case '@': {
    id result = nil;
    void *tempResult;
    [invocation getReturnValue:&tempResult];
    result = (__bridge id)tempResult;
    return result;
  }
  case 'c': {
    char c;
    [invocation getReturnValue:&c];
    return [NSNumber numberWithChar:c];
  }
  case 'C': {
    unsigned char uc;
    [invocation getReturnValue:&uc];
    return [NSNumber numberWithUnsignedChar:uc];
  }
  case 'f': {
    float f;
    [invocation getReturnValue:&f];
    return [NSNumber numberWithFloat:f];
  }
  case 'i': {
    int i;
    [invocation getReturnValue:&i];
    return [NSNumber numberWithInt:i];
  }
  case 'I': {
    unsigned int ui;
    [invocation getReturnValue:&ui];
    return [NSNumber numberWithUnsignedInt:ui];
  }
  case 's': {
    short s;
    [invocation getReturnValue:&s];
    return [NSNumber numberWithShort:s];
  }
  case 'S': {
    unsigned short us;
    [invocation getReturnValue:&us];
    return [NSNumber numberWithUnsignedShort:us];
  }
  case 'd': {
    double d;
    [invocation getReturnValue:&d];
    return [NSNumber numberWithDouble:d];
  }
  case 'l': {
    long l;
    [invocation getReturnValue:&l];
    return [NSNumber numberWithLong:l];
  }
  case 'L': {
    unsigned long ul;
    [invocation getReturnValue:&ul];
    return [NSNumber numberWithUnsignedLong:ul];
  }
  case 'q': {
    long long ll;
    [invocation getReturnValue:&ll];
    return [NSNumber numberWithLongLong:ll];
  }
  case 'Q': {
    unsigned long long ull;
    [invocation getReturnValue:&ull];
    return [NSNumber numberWithUnsignedLongLong:ull];
  }
  case 'b':
  case 'B': {
    bool b;
    [invocation getReturnValue:&b];
    return [NSNumber numberWithBool:b];
  }
  default: {
    DebugLog(@"[ERROR] Unsupported primitive return type: %c for target:%@->%@", t, target, NSStringFromSelector(selector));
    break;
  }
  }

  return nil;
}

- (JSValueRef)jsvalueForUndefinedKey:(NSString *)key
{
  if (![key isEqualToString:@"call"] && ![key isEqualToString:@"apply"]) {
    return NULL;
  }
  JSContextRef ctx = [context context];
  JSStringRef jsString = JSStringCreateWithCFString((CFStringRef)key);
  JSObjectRef jsFuncObject = JSObjectMakeFunctionWithCallback(ctx, jsString, KrollCallAsNamedFunction);
  JSStringRelease(jsString);
  return jsFuncObject;
}

@end
