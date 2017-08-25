/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollObject.h"
#import "KrollBridge.h"
#import "KrollCallback.h"
#import "KrollContext.h"
#import "KrollMethod.h"
#import "KrollMethodDelegate.h"
#import "KrollPropertyDelegate.h"
#import "TiBindingTiValue.h"
#import "TiExceptionHandler.h"
#import <objc/runtime.h>

#ifdef KROLL_COVERAGE
#import "KrollCoverage.h"
#endif

#import "TiApp.h"

TiClassRef KrollObjectClassRef = NULL;
TiClassRef JSObjectClassRef = NULL;

/*
 *	Since TiStringRefs are not tied to any particular context, and are
 *	immutable, they are threadsafe and more importantly, ones that are in
 *	constant use never need to garbage collected, but can be reused.
 */

TiStringRef kTiStringGetTime;
TiStringRef kTiStringLength;
TiStringRef kTiStringTiPropertyKey;
TiStringRef kTiStringPropertyKey;
TiStringRef kTiStringEventKey;
TiStringRef kTiStringExportsKey;

id TiValueToId(KrollContext *context, TiValueRef v);

//
// function to determine if the object passed is a JS Date
//
BOOL IsDateLike(TiContextRef jsContext, TiObjectRef object, TiValueRef *v)
{
  BOOL result = NO;
  if (TiObjectHasProperty(jsContext, object, kTiStringGetTime)) {
    TiValueRef fn = TiObjectGetProperty(jsContext, object, kTiStringGetTime, NULL);
    TiObjectRef fnObj = TiValueToObject(jsContext, fn, NULL);
    if (TiObjectIsFunction(jsContext, fnObj)) {
      *v = TiObjectCallAsFunction(jsContext, fnObj, object, 0, NULL, NULL);
      result = YES;
    }
  }
  return result;
}

//
// function for converting a TiValueRef into a NSDictionary*
//
NSDictionary *TiValueToDict(KrollContext *context, TiValueRef value)
{
  return TiBindingTiValueToNSDictionary([context context], value);
}

//
// function for converting a TiValueRef into a JSON string as NSString*
//
NSString *TiValueToJSON(KrollContext *context, TiValueRef value)
{
  return [TiUtils jsonStringify:TiValueToId(context, value)];
}

//
// function for converting a TiValueRef into an NSObject* (as ID)
//
id TiValueToId(KrollContext *context, TiValueRef v)
{
  return TiBindingTiValueToNSObject([context context], v);
}

//
// function for converting a TiValue to an NSObject* (as ID)
//
TiValueRef ConvertIdTiValue(KrollContext *context, id obj)
{
  return TiBindingTiValueFromNSObject([context context], obj);
}

//
// callback for handling finalization (in JS land)
//
void KrollFinalizer(TiObjectRef ref)
{
  waitForMemoryPanicCleared();
  id o = (id)TiObjectGetPrivate(ref);

  if ((o == nil) || [o isKindOfClass:[KrollContext class]]) {
    return;
  }
  if (![o isKindOfClass:[KrollObject class]]) {
    DeveloperLog(@"[WARN] Object %@ was not a KrollObject during finalization, was: %@", o, [o class]);
    return;
  }
#if KOBJECT_MEMORY_DEBUG == 1
  NSLog(@"[KROLL DEBUG] KROLL FINALIZER: %@, retain:%d", o, [o retainCount]);
#endif

  [(KrollObject *)o setFinalized:YES];
  if ([o isMemberOfClass:[KrollObject class]]) {
    KrollBridge *ourBridge = [(KrollObject *)o bridge];
    if ([KrollBridge krollBridgeExists:ourBridge]) {
      TiProxy *ourTarget = [o target];
      if ((ourTarget != nil) && ([ourBridge krollObjectForProxy:ourTarget] == o)) {
        [ourBridge unregisterProxy:ourTarget];
      }
    }
  }

  [o release];
  o = nil;
}

bool KrollDeleteProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef *exception)
{
  waitForMemoryPanicCleared();
  id o = (id)TiObjectGetPrivate(object);
  if ([o isKindOfClass:[KrollObject class]]) {
    NSString *name = (NSString *)TiStringCopyCFString(kCFAllocatorDefault, propertyName);
    [o deleteKey:name];
    [o forgetObjectForTiString:propertyName context:ctx];

    [name release];
  }
  return true;
}

//
// callback for handling creation (in JS land)
//
void KrollInitializer(TiContextRef ctx, TiObjectRef object)
{
  waitForMemoryPanicCleared();
  id o = (id)TiObjectGetPrivate(object);
  if ([o isKindOfClass:[KrollContext class]]) {
    return;
  }
#if KOBJECT_MEMORY_DEBUG == 1
  NSLog(@"[KROLL DEBUG] KROLL RETAINER: %@ (%@), retain:%d", o, [o class], [o retainCount]);
#endif

  if ([o isKindOfClass:[KrollObject class]]) {
    [o retain];
    TiObjectRef propsObject = TiObjectMake(ctx, NULL, NULL);
    TiObjectSetProperty(ctx, object, kTiStringTiPropertyKey, propsObject, kTiPropertyAttributeDontEnum, NULL);
    [o setPropsObject:propsObject];
  } else {
    DeveloperLog(@"[DEBUG] Initializer for %@", [o class]);
  }
}

//
// callback for handling retrieving an objects property (in JS land)
//

//TODO: We should fetch from the props object and shortcut some of this. Especially now that callbacks are CURRENTLY write-only.
TiValueRef KrollGetProperty(TiContextRef jsContext, TiObjectRef object, TiStringRef prop, TiValueRef *exception)
{
  waitForMemoryPanicCleared();
  // Debugger may actually try to get properties off global Kroll property (which is a special case KrollContext singleton)
  id privateObject = (id)TiObjectGetPrivate(object);
  if ([privateObject isKindOfClass:[KrollContext class]]) {
    return NULL;
  }

  KrollObject *o = (KrollObject *)privateObject;
  @try {
    if (TiStringIsEqual(prop, kTiStringTiPropertyKey)) {
      return NULL;
    }

    // Attempt to retrieve the property from the exports, before going through
    // the routing
    TiObjectRef exports = [o objectForTiString:kTiStringExportsKey context:jsContext];
    if ((exports != NULL) && TiObjectHasProperty(jsContext, exports, prop)) {
      return TiObjectGetProperty(jsContext, exports, prop, NULL);
    }

    NSString *name = (NSString *)TiStringCopyCFString(kCFAllocatorDefault, prop);
    [name autorelease];

    id result = [o valueForKey:name];

    if ([result isKindOfClass:[KrollWrapper class]]) {
      if (![KrollBridge krollBridgeExists:[(KrollWrapper *)result bridge]]) {
        //This remote object no longer exists.
        [o deleteKey:name];
        result = nil;
      } else {
        TiObjectRef cachedObject = [o objectForTiString:prop context:jsContext];
        TiObjectRef remoteFunction = [(KrollWrapper *)result jsobject];
        if ((cachedObject != NULL) && (cachedObject != remoteFunction)) {
          [o forgetObjectForTiString:prop context:jsContext]; //Clean up the old property.
        }
        if (remoteFunction != NULL) {
          [o noteObject:remoteFunction forTiString:prop context:jsContext];
        }
        return remoteFunction;
      }
    }

    TiValueRef jsResult = ConvertIdTiValue([o context], result);
    if (([result isKindOfClass:[KrollObject class]] && ![result isKindOfClass:[KrollCallback class]] && [[result target] isKindOfClass:[TiProxy class]])
        || ([result isKindOfClass:[TiProxy class]])) {
      [o noteObject:(TiObjectRef)jsResult forTiString:prop context:jsContext];
    } else {
      [o forgetObjectForTiString:prop context:jsContext];
    }
    if (result == nil) {
      TiValueRef jsResult2 = [o jsvalueForUndefinedKey:name];
      if (jsResult2 != NULL) {
        jsResult = jsResult2;
      }
    }

#if KOBJECT_DEBUG == 1
    NSLog(@"[KROLL DEBUG] KROLL GET PROPERTY: %@=%@", name, result);
#endif
    return jsResult;
  }
  @catch (NSException *ex) {
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  return TiValueMakeUndefined(jsContext);
}

//
// callback for handling a setter (in JS land)
//
bool KrollSetProperty(TiContextRef jsContext, TiObjectRef object, TiStringRef prop, TiValueRef value, TiValueRef *exception)
{
  waitForMemoryPanicCleared();
  id privateObject = (id)TiObjectGetPrivate(object);
  if ([privateObject isKindOfClass:[KrollContext class]]) {
    return false;
  }

  KrollObject *o = (KrollObject *)privateObject;
  @try {
    if (TiStringIsEqual(prop, kTiStringTiPropertyKey)) {
      return false;
    }
    NSString *name = (NSString *)TiStringCopyCFString(kCFAllocatorDefault, prop);
    [name autorelease];

    id v = TiValueToId([o context], value);
#if KOBJECT_DEBUG == 1
    NSLog(@"[KROLL DEBUG] KROLL SET PROPERTY: %@=%@ against %@", name, v, o);
#endif
    if ([v isKindOfClass:[TiProxy class]]) {
      [o noteObject:(TiObjectRef)value forTiString:prop context:jsContext];
    } else {
      [o forgetObjectForTiString:prop context:jsContext];
    }
#ifdef TI_USE_KROLL_THREAD
    [o setValue:v
          forKey:name];
#else

    TiThreadPerformOnMainThread(^{
      [o setValue:v forKey:name];
    },
        YES);
#endif
    return true;
  }
  @catch (NSException *ex) {
    *exception = [KrollObject toValue:[o context] value:ex];
  }
  return false;
}

// forward declare these

//@interface TitaniumObject : NSObject
//@end

@interface TitaniumObject (Private)
- (NSDictionary *)modules;
@end

//@interface TiProxy : NSObject
//@end

//
// handle property names which makes the object iterable
//
void KrollPropertyNames(TiContextRef ctx, TiObjectRef object, TiPropertyNameAccumulatorRef propertyNames)
{
  id privateObject = (id)TiObjectGetPrivate(object);
  if ([privateObject isKindOfClass:[KrollContext class]]) {
    return;
  }

  KrollObject *o = (KrollObject *)privateObject;
  if (o) {
    id target = [o target];

    if ([o isKindOfClass:[TitaniumObject class]]) {
      for (NSString *key in [[(TitaniumObject *)o modules] allKeys]) {
        TiStringRef value = TiStringCreateWithUTF8CString([key UTF8String]);
        TiPropertyNameAccumulatorAddName(propertyNames, value);
        TiStringRelease(value);
      }
    } else if ([target isKindOfClass:[TiProxy class]]) {
      for (NSString *key in [target allKeys]) {
        TiStringRef value = TiStringCreateWithUTF8CString([key UTF8String]);
        TiPropertyNameAccumulatorAddName(propertyNames, value);
        TiStringRelease(value);
      }
    }
  }
}

//
// support casting
//
bool KrollHasInstance(TiContextRef ctx, TiObjectRef constructor, TiValueRef possibleInstance, TiValueRef *exception)
{
  id privateObject = (id)TiObjectGetPrivate(constructor);
  if ([privateObject isKindOfClass:[KrollContext class]]) {
    return false;
  }

  KrollObject *o1 = (KrollObject *)privateObject;
  if (o1) {
    TiValueRef ex = NULL;
    TiObjectRef objTarget = TiValueToObject(ctx, possibleInstance, &ex);
    if (!ex) {
      KrollObject *o2 = (KrollObject *)TiObjectGetPrivate(objTarget);
      if (o2) {
        id t1 = [o1 target];
        id t2 = [o2 target];
        Class c1 = [t1 class];
        Class c2 = [t2 class];
        Class ti = [TiProxy class];
        while (c1 != c2 && c1 != nil && c2 != nil && c1 != ti && c2 != ti) {
          // if the proxies are the same class, we can cast
          if (c1 == c2) {
            return true;
          }
          // if the target is a kind of class that matches this superclass, we can cast
          if ([t2 isKindOfClass:c1]) {
            return true;
          }
          c1 = [c1 superclass];
          c2 = [c2 superclass];
        }
      }
    }
  }
  return false;
}

@implementation KrollObject

@synthesize propsObject, finalized, bridge;

+ (void)initialize
{
  if (KrollObjectClassRef == NULL) {
    TiClassDefinition classDef = kTiClassDefinitionEmpty;
    classDef.className = "Object";
    classDef.initialize = KrollInitializer;
    classDef.finalize = KrollFinalizer;
    classDef.setProperty = KrollSetProperty;
    classDef.getProperty = KrollGetProperty;
    classDef.deleteProperty = KrollDeleteProperty;
    classDef.getPropertyNames = KrollPropertyNames;
    classDef.hasInstance = KrollHasInstance;
    KrollObjectClassRef = TiClassCreate(&classDef);

    kTiStringGetTime = TiStringCreateWithUTF8CString("getTime");
    kTiStringLength = TiStringCreateWithUTF8CString("length");
    kTiStringTiPropertyKey = TiStringCreateWithUTF8CString("__TI");
    kTiStringPropertyKey = TiStringCreateWithUTF8CString("__PR");
    kTiStringEventKey = TiStringCreateWithUTF8CString("__EV");
    kTiStringExportsKey = TiStringCreateWithUTF8CString("__EX");
  }
}

+ (TiClassRef)jsClassRef
{
  return KrollObjectClassRef;
}

- (id)initWithTarget:(id)target_ context:(KrollContext *)context_
{
  if (self = [self init]) {
#if DEBUG
    //TODO: See if this actually happens, and if not, remove this extra check.
    if ([(KrollBridge *)[context_ delegate] usesProxy:target_] && [self isMemberOfClass:[KrollObject class]]) {
      DeveloperLog(@"[WARN] Bridge %@ already has target %@!", [context_ delegate], target_);
    }

    if (![context_ isKJSThread]) {
      DeveloperLog(@"[WARN] %@->%@ is being made in a thread not owned by %@.", self, target_, context_);
    }
#endif
    target = [target_ retain];
    context = context_; // don't retain
    jsContext = [context context];
    bridge = (KrollBridge *)[context_ delegate];
    jsobject = TiObjectMake(jsContext, [[self class] jsClassRef], self);
    targetable = [target conformsToProtocol:@protocol(KrollTargetable)];
  }
  return self;
}

- (TiObjectRef)jsobject
{
  return jsobject;
}

- (void)invalidateJsobject;
{
  propsObject = NULL;
  jsobject = NULL;
  context = nil;
  jsContext = NULL;
}

- (BOOL)isEqual:(id)anObject
{
  if ([anObject isKindOfClass:[KrollObject class]]) {
    TiObjectRef ref1 = jsobject;
    TiObjectRef ref2 = [(KrollObject *)anObject jsobject];
    return TiValueIsStrictEqual(jsContext, ref1, ref2);
  }
  return NO;
}

- (void)dealloc
{
#if KOBJECT_MEMORY_DEBUG == 1
  NSLog(@"[KROLL DEBUG] DEALLOC KROLLOBJECT: %@", [self description]);
#endif
  RELEASE_TO_NIL(properties);
  RELEASE_TO_NIL(target);
  RELEASE_TO_NIL(statics);
  //	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
  [super dealloc];
}

#if KOBJECT_MEMORY_DEBUG == 1
- (id)description
{
  return [NSString stringWithFormat:@"[KROLL DEBUG] KrollObject[%@] held:%d", target, [target retainCount]];
}
#endif

@synthesize context, jsContext;

- (id)target
{
  return target;
}

//
// create a JS TiValueRef from a NSObject* (as ID)
//
+ (TiValueRef)create:(id)object context:(KrollContext *)context
{
#ifdef KROLL_COVERAGE
  KrollObject *ko = [[[KrollCoverageObject alloc] initWithTarget:object context:context] autorelease];
#else
  KrollObject *ko = [[[KrollObject alloc] initWithTarget:object context:context] autorelease];
#endif
  return [ko jsobject];
}

//
// convert TiValueRef to ID
//
+ (id)toID:(KrollContext *)context value:(TiValueRef)ref
{
  return TiValueToId(context, ref);
}

+ (id)nonNull:(id)value
{
  if (value == nil || value == [NSNull null]) {
    return nil;
  }
  return value;
}

//
// convert ID to TiValueRef
//
+ (TiValueRef)toValue:(KrollContext *)context value:(id)obj
{
  return ConvertIdTiValue(context, obj);
}

- (NSString *)propercase:(NSString *)name index:(int)index
{
  if (index > 0) {
    NSString *result = [name substringFromIndex:index];
    return [NSString stringWithFormat:@"%@%@", [[result substringToIndex:1] lowercaseString], [result length] > 1 ? [result substringFromIndex:1] : @""];
  } else {
    return [NSString stringWithFormat:@"%@%@", [[name substringToIndex:1] uppercaseString], [name length] > 1 ? [name substringFromIndex:1] : @""];
  }
}

- (NSString *)_propertyGetterSetterKey:(NSString *)key
{
  NSString *newkey = [key substringFromIndex:3];
  return [NSString stringWithFormat:@"%@%@", [[newkey substringToIndex:1] lowercaseString], [newkey length] > 1 ? [newkey substringFromIndex:1] : @""];
}

- (id)convertValueToDelegate:(id)result forKey:(NSString *)key
{
  if ([result isKindOfClass:[KrollMethodDelegate class]]) {
    int argcount = [result args] ? 1 : 0;
#ifdef KROLL_COVERAGE
    return [[[KrollCoverageMethod alloc] initWithTarget:[result target]
                                               selector:[result selector]
                                               argcount:argcount
                                                   type:KrollMethodInvoke
                                                   name:key
                                                context:[self context]
                                                 parent:self] autorelease];
#else
    return [[[KrollMethod alloc] initWithTarget:[result target]
                                       selector:[result selector]
                                       argcount:argcount
                                           type:KrollMethodInvoke
                                           name:key
                                        context:[self context]] autorelease];
#endif
  } else if ([result isKindOfClass:[KrollPropertyDelegate class]]) {
    KrollPropertyDelegate *d = (KrollPropertyDelegate *)result;
    return [[d target] performSelector:[d selector]];
  }
  return result;
}

- (id)_valueForKey:(NSString *)key
{
  //TODO: need to consult property_getAttributes to make sure we're not hitting readonly, etc. but do this
  //only for non-production builds

  // TODO: We do a significant amount of magic here (set/get routing, and additionally "automatic"
  // get/set based on what we assume the user is doing) that may need to be removed.

  if ([key hasPrefix:@"set"] && ([key length] >= 4) &&
      [[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[key characterAtIndex:3]]) {
    // This is PROBABLY a request for an internal setter (either setX('a') or setX('a','b')). But
    // it could also be:
    // * Pulling a user-defined property prefixed with 'get'
    // * Autogenerating a getter/setter
    // In the event of the former, we actually have to actually pull a jump to
    // returning the property's appropriate type, as below in the general case.

    SEL selector;

    NSString *propertyKey = [self _propertyGetterSetterKey:key];
#ifdef KROLL_COVERAGE
    KrollMethod *result = [[KrollCoverageMethod alloc] initWithTarget:target context:[self context] parent:self];
#else
    KrollMethod *result = [[KrollMethod alloc] initWithTarget:target context:[self context]];
#endif
    [result setArgcount:1];
    [result setPropertyKey:propertyKey];
    [result setType:KrollMethodSetter];
    [result setUpdatesProperty:[(TiProxy *)target retainsJsObjectForKey:propertyKey]];

    selector = NSSelectorFromString([key stringByAppendingString:@":withObject:"]);
    if ([target respondsToSelector:selector]) {
      [result setArgcount:2];
      [result setSelector:selector];
    } else {
      selector = NSSelectorFromString([key stringByAppendingString:@":"]);
      if ([target respondsToSelector:selector]) {
        [result setSelector:selector];
      } else {
        // Either a custom property, OR a request for an autogenerated setter
        id value = [target valueForKey:key];
        if (value != nil) {
          [result release];
          return [self convertValueToDelegate:value forKey:key];
        } else {
          [result setType:KrollMethodPropertySetter];
          [result setName:propertyKey];
        }
      }
    }

    return [result autorelease]; // we simply return a method delegator  against the target to set the property directly on the target
  } else if ([key hasPrefix:@"get"]) {
#ifdef KROLL_COVERAGE
    KrollMethod *result = [[KrollCoverageMethod alloc] initWithTarget:target context:[self context] parent:self];
#else
    KrollMethod *result = [[KrollMethod alloc] initWithTarget:target context:[self context]];
#endif
    NSString *propertyKey = [self _propertyGetterSetterKey:key];
    [result setPropertyKey:propertyKey];
    [result setArgcount:1];
    [result setUpdatesProperty:[(TiProxy *)target retainsJsObjectForKey:propertyKey]];

    //first make sure we don't have a method with the fullname
    SEL fullSelector = NSSelectorFromString([NSString stringWithFormat:@"%@:", key]);
    if ([target respondsToSelector:fullSelector]) {
      [result setSelector:fullSelector];
      [result setType:KrollMethodInvoke];
      return [result autorelease];
    }

    // this is a request for a getter method
    // a.getFoo()
    NSString *partkey = [self propercase:key index:3];
    SEL selector = NSSelectorFromString(partkey);
    if ([target respondsToSelector:selector]) {
      [result setSelector:selector];
      [result setType:KrollMethodGetter];
      return [result autorelease];
    }
    // see if its an actual method that takes an arg instead
    selector = NSSelectorFromString([NSString stringWithFormat:@"%@:", partkey]);
    if ([target respondsToSelector:selector]) {
      [result setSelector:selector];
      [result setType:KrollMethodGetter];
      return [result autorelease];
    }

    // Check for custom property before returning the autogenerated getter
    id value = [target valueForKey:key];
    if (value != nil) {
      [result release];
      return [self convertValueToDelegate:value forKey:key];
    }

    [result setName:propertyKey];
    [result setArgcount:0];
    [result setType:KrollMethodPropertyGetter];
    return [result autorelease];
  } else {
    // property accessor - need to determine if its a objc property of method
    objc_property_t p = class_getProperty([target class], [key UTF8String]);
    if (p == NULL) {
      if ([key isEqualToString:@"toString"] || [key isEqualToString:@"valueOf"]) {
        return [[[KrollMethod alloc] initWithTarget:target selector:@selector(toString:) argcount:0 type:KrollMethodInvoke name:nil context:[self context]] autorelease];
      }

      SEL selector = NSSelectorFromString([NSString stringWithFormat:@"%@:", key]);
      if ([target respondsToSelector:selector]) {
#ifdef KROLL_COVERAGE
        return [[[KrollCoverageMethod alloc] initWithTarget:target
                                                   selector:selector
                                                   argcount:1
                                                       type:KrollMethodInvoke
                                                       name:nil
                                                    context:[self context]
                                                     parent:self] autorelease];
#else
        return [[[KrollMethod alloc] initWithTarget:target
                                           selector:selector
                                           argcount:1
                                               type:KrollMethodInvoke
                                               name:nil
                                            context:[self context]] autorelease];
#endif
      }
      // Special handling for className due to conflict with NSObject private API
      if ([key isEqualToString:@"className"]) {
        return [target valueForUndefinedKey:key];
      }
      // attempt a function that has no args (basically a non-property property)
      selector = NSSelectorFromString([NSString stringWithFormat:@"%@", key]);
      if ([target respondsToSelector:selector]) {
#ifdef KROLL_COVERAGE
        id<KrollCoverage> cSelf = (id<KrollCoverage>)self;
        [cSelf increment:key coverageType:COVERAGE_TYPE_GET apiType:API_TYPE_PROPERTY];
#endif
        return [target performSelector:selector];
      }
      id result = [target valueForKey:key];
      if (result != nil) {
        return [self convertValueToDelegate:result forKey:key];
      }
      // see if this is a create factory which we can do dynamically
      if ([key hasPrefix:@"create"]) {
        SEL selector = @selector(createProxy:forName:context:);
        if ([target respondsToSelector:selector]) {
#ifdef KROLL_COVERAGE
          return [[[KrollCoverageMethod alloc] initWithTarget:target
                                                     selector:selector
                                                     argcount:2
                                                         type:KrollMethodFactory
                                                         name:key
                                                      context:[self context]
                                                       parent:self] autorelease];
#else
          return [[[KrollMethod alloc] initWithTarget:target
                                             selector:selector
                                             argcount:2
                                                 type:KrollMethodFactory
                                                 name:key
                                              context:[self context]] autorelease];
#endif
        }
      }
    } else {
#ifdef KROLL_COVERAGE
      id<KrollCoverage> cSelf = (id<KrollCoverage>)self;
      [cSelf increment:key coverageType:COVERAGE_TYPE_GET apiType:API_TYPE_PROPERTY];
#endif

      NSString *attributes = [NSString stringWithCString:property_getAttributes(p) encoding:NSUTF8StringEncoding];
      SEL selector = NSSelectorFromString([NSString stringWithCString:property_getName(p) encoding:NSUTF8StringEncoding]);

      if ([attributes hasPrefix:@"T@"]) {
        // this means its a return type of id
        return [target performSelector:selector];
      } else {
        NSInvocation *invocation = [NSInvocation invocationWithMethodSignature:[target methodSignatureForSelector:selector]];
        [invocation setSelector:selector];
        [invocation invokeWithTarget:target];
        if ([attributes hasPrefix:@"Td,"]) {
          double d;
          [invocation getReturnValue:&d];
          return [NSNumber numberWithDouble:d];
        } else if ([attributes hasPrefix:@"Tf,"]) {
          float f;
          [invocation getReturnValue:&f];
          return [NSNumber numberWithFloat:f];
        } else if ([attributes hasPrefix:@"Ti,"]) {
          int i;
          [invocation getReturnValue:&i];
          return [NSNumber numberWithInt:i];
        } else if ([attributes hasPrefix:@"TI,"]) {
          unsigned int ui;
          [invocation getReturnValue:&ui];
          return [NSNumber numberWithUnsignedInt:ui];
        } else if ([attributes hasPrefix:@"Tl,"]) {
          long l;
          [invocation getReturnValue:&l];
          return [NSNumber numberWithLong:l];
        } else if ([attributes hasPrefix:@"TL,"]) {
          unsigned long ul;
          [invocation getReturnValue:&ul];
          return [NSNumber numberWithUnsignedLong:ul];
        } else if ([attributes hasPrefix:@"Tc,"]) {
          char c;
          [invocation getReturnValue:&c];
          return [NSNumber numberWithChar:c];
        } else if ([attributes hasPrefix:@"TC,"]) {
          unsigned char uc;
          [invocation getReturnValue:&uc];
          return [NSNumber numberWithUnsignedChar:uc];
        } else if ([attributes hasPrefix:@"Ts,"]) {
          short s;
          [invocation getReturnValue:&s];
          return [NSNumber numberWithShort:s];
        } else if ([attributes hasPrefix:@"TS,"]) {
          unsigned short us;
          [invocation getReturnValue:&us];
          return [NSNumber numberWithUnsignedShort:us];
        } else if ([attributes hasPrefix:@"Tq,"]) {
          long long ll;
          [invocation getReturnValue:&ll];
          return [NSNumber numberWithLongLong:ll];
        } else if ([attributes hasPrefix:@"TQ,"]) {
          unsigned long long ull;
          [invocation getReturnValue:&ull];
          return [NSNumber numberWithUnsignedLongLong:ull];
        } else if ([attributes hasPrefix:@"TB,"] || [attributes hasPrefix:@"Tb,"]) {
          bool b;
          [invocation getReturnValue:&b];
          return [NSNumber numberWithBool:b];
        } else {
          // let it fall through and return undefined
          DebugLog(@"[WARN] Unsupported property: %@ for %@, attributes = %@", key, target, attributes);
        }
      }
    }
  }
  return nil;
}

- (id)valueForKey:(NSString *)key
{
  BOOL executionSet = NO;
  @try {
    // first consult our statics
    if (statics != nil) {
      id result = [statics objectForKey:key];
      if (result != nil) {
        return result;
      }
    }
    // second consult our fixed properties dictionary if we have one
    if (properties != nil) {
      id result = [properties objectForKey:key];
      if (result != nil) {
        return result;
      }
    }
    if (targetable) {
      executionSet = YES;
      [target setExecutionContext:context.delegate];
    }
    id result = [self _valueForKey:key];
    // we can safely cache method objects
    if ([result isKindOfClass:[KrollObject class]]) {
      [self setStaticValue:result forKey:key purgable:YES];
    }
    return result;
  }
  @finally {
    if (executionSet) {
      [target setExecutionContext:nil];
    }
  }
}

- (TiValueRef)jsvalueForUndefinedKey:(NSString *)key
{
  return NULL;
}

- (void)deleteKey:(NSString *)key
{
  [target deleteKey:key];
}

- (void)setValue:(id)value forKey:(NSString *)key
{
  BOOL executionSet = NO;
  if ([target conformsToProtocol:@protocol(KrollTargetable)]) {
    executionSet = YES;
    [target setExecutionContext:context.delegate];
  }

  @try {
    if (value == [NSNull null]) {
      value = nil;
    }

    NSString *name = [self propercase:key index:0];
    SEL selector = NSSelectorFromString([NSString stringWithFormat:@"set%@:withObject:", name]);
    if ([target respondsToSelector:selector]) {
      [target performSelector:selector withObject:value withObject:nil];
      return;
    }
    selector = NSSelectorFromString([NSString stringWithFormat:@"set%@:", name]);
    if ([target respondsToSelector:selector] && ![name isEqualToString:@"ZIndex"]) //TODO: Quick hack is quick.
    {
      [target performSelector:selector withObject:value];
    } else {
      [target setValue:value forKey:key];
    }
#ifdef KROLL_COVERAGE
    id<KrollCoverage> cSelf = (id<KrollCoverage>)self;
    [cSelf increment:key coverageType:COVERAGE_TYPE_SET apiType:API_TYPE_PROPERTY];
#endif
  }
  @finally {
    if (executionSet) {
      [target setExecutionContext:nil];
    }
  }
}

- (void)setStaticValue:(id)value forKey:(NSString *)key purgable:(BOOL)purgable
{
  if (purgable) {
    if (properties == nil) {
      properties = [[NSMutableDictionary alloc] initWithCapacity:3];
    }
    [properties setValue:value forKey:key];
  } else {
    if (statics == nil) {
      statics = [[NSMutableDictionary alloc] initWithCapacity:2];
    }
    [statics setValue:value forKey:key];
  }
}

- (void)protectJsobject
{
  if (protecting) {
    return;
  }

  TiContextRef jscontext = [context context];
  if (finalized || (jscontext == NULL) || (jsobject == NULL)) {
    return;
  }

#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    NSOperation *safeProtect = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(protectJsobject) object:nil];
    [context enqueue:safeProtect];
    [safeProtect release];
    return;
  }
#endif
  protecting = YES;
  TiValueProtect(jscontext, jsobject);
}

- (void)unprotectJsobject
{
  if (!protecting) {
    return;
  }
  TiContextRef jscontext = [context context];
  if (finalized || (jscontext == NULL) || (jsobject == NULL)) {
    return;
  }

#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    NSOperation *safeUnprotect = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(unprotectJsobject) object:nil];
    [context enqueue:safeUnprotect];
    [safeUnprotect release];
    return;
  }
#endif
  protecting = NO;
  TiValueUnprotect(jscontext, jsobject);
}

TI_INLINE TiStringRef TiStringCreateWithPointerValue(int value)
{
  /*
	 *	When we note proxies, we need to come up with a property name
	 *	that is unique. We previously did an nsstring with format
	 *	of __PX%X, but this method is so often called, and allocating a string
	 *	can be a waste, so it's better to jump straight to something hardwired
	 *
	 *	No sense in doing hex when so many more characters are valid property
	 *	characters. So we do it in chunks of 6 bits, from '<' (60) to '{' (123)
	 */
  char result[10];
  result[0] = '_';
  result[1] = '_';
  result[2] = ':';
  result[3] = '<' + (value & 0x3F);
  result[4] = '<' + ((value >> 6) & 0x3F);
  result[5] = '<' + ((value >> 12) & 0x3F);
  result[6] = '<' + ((value >> 18) & 0x3F);
  result[7] = '<' + ((value >> 24) & 0x3F);
  result[8] = '<' + ((value >> 30) & 0x3F);
  result[9] = 0;
  return TiStringCreateWithUTF8CString(result);
}

- (void)noteKeylessKrollObject:(KrollObject *)value
{
  if ([value finalized]) {
    return;
  }

// TODO: Enquing safeProtect here may not be enough to guarantee that the object is actually
// safely protected "in time" (i.e. it may be GC'd before the safe protect is evaluated
// by the queue processor). We need to seriously re-evaluate the memory model and thread
// interactions during such.

#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    NSOperation *safeProtect = [[NSInvocationOperation alloc] initWithTarget:self
                                                                    selector:@selector(noteKeylessKrollObject:)
                                                                      object:value];
    [context enqueue:safeProtect];
    [safeProtect release];
    return;
  }
#endif
  TiStringRef nameRef = TiStringCreateWithPointerValue((int)value);
  [self noteObject:[value jsobject] forTiString:nameRef context:[context context]];
  TiStringRelease(nameRef);
}

- (void)forgetKeylessKrollObject:(KrollObject *)value
{
#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    NSOperation *safeUnprotect = [[NSInvocationOperation alloc] initWithTarget:self
                                                                      selector:@selector(forgetKeylessKrollObject:)
                                                                        object:value];
    [context enqueue:safeUnprotect];
    [safeUnprotect release];
    return;
  }
#endif
  TiStringRef nameRef = TiStringCreateWithPointerValue((int)value);
  [self forgetObjectForTiString:nameRef context:[context context]];
  TiStringRelease(nameRef);
}

- (void)noteCallback:(KrollCallback *)eventCallback forKey:(NSString *)key
{
#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    DeveloperLog(@"[WARN] %@ tried to protect callback for %@ in the wrong thead.", target, key);
    NSOperation *safeInvoke = [[ExpandedInvocationOperation alloc]
        initWithTarget:self
              selector:_cmd
                object:eventCallback
                object:key];
    [context enqueue:safeInvoke];
    [safeInvoke release];
    return;
  }
#endif
  TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
  [self noteObject:[eventCallback function] forTiString:nameRef context:[context context]];
  TiStringRelease(nameRef);
}

- (void)forgetCallbackForKey:(NSString *)key
{
#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    NSOperation *safeForget = [[NSInvocationOperation alloc] initWithTarget:self
                                                                   selector:@selector(forgetCallbackForKey:)
                                                                     object:key];
    [context enqueue:safeForget];
    [safeForget release];
    return;
  }
#endif
  TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
  [self forgetObjectForTiString:nameRef context:[context context]];
  TiStringRelease(nameRef);
}

- (void)invokeCallbackForKey:(NSString *)key withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject
{
  [self invokeCallbackForKey:key withObject:eventData thisObject:thisObject onDone:nil];
}
- (void)invokeCallbackForKey:(NSString *)key withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject onDone:(void (^)(id result))block
{

  if (finalized) {
    return;
  }
  __block id _thisObject = thisObject;
#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    NSOperation *safeInvoke = [[ExpandedInvocationOperation alloc]
        initWithTarget:self
              selector:_cmd
                object:key
                object:eventData
                object:thisObject];
    [context enqueue:safeInvoke];
    [safeInvoke release];

    if (block != nil) {
      block(nil);
    }

    return;
  }
#else
  void (^mainBlock)(void) = ^{
#endif
  if (![_thisObject isKindOfClass:[KrollObject class]]) {
    _thisObject = [(KrollBridge *)[context delegate] registerProxy:thisObject];
  }

  TiValueRef exception = NULL;

  TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringPropertyKey, &exception);

  jsProxyHash = TiValueToObject(jsContext, jsProxyHash, &exception);
  if ((jsProxyHash == NULL) || (TiValueGetType(jsContext, jsProxyHash) != kTITypeObject)) {
    if (block != nil) {
      block(nil);
    }
    return;
  }

  TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
  TiObjectRef jsCallback = (TiObjectRef)TiObjectGetProperty(jsContext, jsProxyHash, nameRef, NULL);
  TiStringRelease(nameRef);

  if ((jsCallback == NULL) || (TiValueGetType(jsContext, jsCallback) != kTITypeObject)) {
    if (block != nil) {
      block(nil);
    }
    return;
  }

  TiValueRef jsEventData = ConvertIdTiValue(context, eventData);
  TiValueRef result = TiObjectCallAsFunction(jsContext, jsCallback, [_thisObject jsobject], 1, &jsEventData, &exception);
  if (exception != NULL) {
    id excm = [KrollObject toID:context value:exception];
    [[TiExceptionHandler defaultExceptionHandler] reportScriptError:[TiUtils scriptErrorValue:excm]];
  }

  if (block != nil) {
    block(TiValueToId(context, result));
  };
#ifndef TI_USE_KROLL_THREAD
};
TiThreadPerformOnMainThread(mainBlock, NO);
#endif
}

- (void)noteKrollObject:(KrollObject *)value forKey:(NSString *)key
{

  if ([value finalized]) {
    return;
  }

#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    DeveloperLog(@"[WARN] %@ tried to note the callback for %@ in the wrong thead.", target, key);
    NSOperation *safeInvoke = [[ExpandedInvocationOperation alloc]
        initWithTarget:self
              selector:_cmd
                object:value
                object:key];
    [context enqueue:safeInvoke];
    [safeInvoke release];
    return;
  }
#endif
  TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
  [self noteObject:[value jsobject] forTiString:nameRef context:[context context]];
  TiStringRelease(nameRef);
}

- (void)forgetKrollObjectforKey:(NSString *)key;
{
#ifdef TI_USE_KROLL_THREAD
  if (![context isKJSThread]) {
    NSOperation *safeForget = [[NSInvocationOperation alloc] initWithTarget:self
                                                                   selector:_cmd
                                                                     object:key];
    [context enqueue:safeForget];
    [safeForget release];
    return;
  }
#endif
  TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
  [self forgetObjectForTiString:nameRef context:[context context]];
  TiStringRelease(nameRef);
}

- (void)noteObject:(TiObjectRef)storedJSObject forTiString:(TiStringRef)keyString context:(TiContextRef)jsContextRef
{
  if ((propsObject == NULL) || (storedJSObject == NULL) || finalized) {
    return;
  }
  TiValueRef exception = NULL;

  TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContextRef, propsObject, kTiStringPropertyKey, &exception);

  if ((jsProxyHash == NULL) || (TiValueGetType(jsContextRef, jsProxyHash) != kTITypeObject)) {
    jsProxyHash = TiObjectMake(jsContextRef, NULL, &exception);
    TiObjectSetProperty(jsContextRef, propsObject, kTiStringPropertyKey, jsProxyHash,
        kTiPropertyAttributeDontEnum, &exception);
  }

  TiObjectSetProperty(jsContextRef, jsProxyHash, keyString, storedJSObject,
      kTiPropertyAttributeDontEnum, &exception);
}

- (void)forgetObjectForTiString:(TiStringRef)keyString context:(TiContextRef)jsContextRef
{
  if ((propsObject == NULL) || finalized) {
    return;
  }
  TiValueRef exception = NULL;

  TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContextRef, propsObject, kTiStringPropertyKey, &exception);

  if ((jsProxyHash == NULL) || (TiValueGetType(jsContextRef, jsProxyHash) != kTITypeObject)) {
    return;
  }

  TiObjectDeleteProperty(jsContextRef, jsProxyHash, keyString, &exception);
}

- (TiObjectRef)objectForTiString:(TiStringRef)keyString context:(TiContextRef)jsContextRef
{
  if (finalized) {
    return NULL;
  }

  TiValueRef exception = NULL;

  TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContextRef, propsObject, kTiStringPropertyKey, &exception);

  if ((jsProxyHash == NULL) || (TiValueGetType(jsContextRef, jsProxyHash) != kTITypeObject)) {
    return NULL;
  }

  TiObjectRef result = (TiObjectRef)TiObjectGetProperty(jsContextRef, jsProxyHash, keyString, NULL);
  if ((result == NULL) || (TiValueGetType(jsContextRef, result) != kTITypeObject)) {
    return NULL;
  }

  return result;
}

- (void)storeListener:(id)eventCallbackOrWrapper forEvent:(NSString *)eventName
{
  if ((propsObject == NULL) || finalized) {
    return;
  }

  TiValueRef exception = NULL;

  TiValueRef jsEventValue = TiObjectGetProperty(jsContext, propsObject, kTiStringEventKey, &exception);

  // Grab event JSObject. Default to NULL if it isn't an object
  TiObjectRef jsEventHash = NULL;
  if (TiValueGetType(jsContext, jsEventValue) == kTITypeObject) {
    jsEventHash = TiValueToObject(jsContext, jsEventValue, &exception);
  }

  // Value wasn't an object (undefined, likely) - or conversion to JSObjectRef failed
  if (jsEventHash == NULL) {
    jsEventHash = TiObjectMake(jsContext, NULL, &exception);
    TiObjectSetProperty(jsContext, propsObject, kTiStringEventKey, jsEventHash,
        kTiPropertyAttributeDontEnum, &exception);
  }

  // Grab the event callback we're adding
  TiObjectRef callbackFunction = nil;
  if ([eventCallbackOrWrapper isKindOfClass:[KrollCallback class]]) {
    callbackFunction = [(KrollCallback *)eventCallbackOrWrapper function];
  } else if ([eventCallbackOrWrapper isKindOfClass:[KrollWrapper class]]) {
    callbackFunction = [(KrollWrapper *)eventCallbackOrWrapper jsobject];
  }

  // Grab the array of callbacks for our event type from global event hash
  TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef)eventName);
  TiValueRef jsCallbackArrayValue = TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, &exception);

  // Default to NULL array object, if value doesn't exist or isn't an object
  TiObjectRef jsCallbackArray = NULL;
  if (TiValueGetType(jsContext, jsCallbackArrayValue) == kTITypeObject) {
    jsCallbackArray = TiValueToObject(jsContext, jsCallbackArrayValue, &exception);
  }

  // No callback array existed for this event type, or it wasn't an object
  if (jsCallbackArray == NULL) {
    // Make a new array, add the first callback function to it
    jsCallbackArray = TiObjectMakeArray(jsContext, 1, (TiValueRef *)&callbackFunction, &exception);
    // Store the array under the event name in our global event hash
    TiObjectSetProperty(jsContext, jsEventHash, jsEventTypeString, jsCallbackArray,
        kTiPropertyAttributeDontEnum, &exception);
  } else {
    // An array of callbacks already exists for this event type
    // Add the callback to it, unless it's already in the array
    TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, kTiStringLength, &exception);
    int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, &exception);

    for (uint i = 0; i < arrayLength; ++i) {
      TiValueRef valueRef = TiObjectGetPropertyAtIndex(jsContext, jsCallbackArray, i, NULL);
      if (valueRef == callbackFunction) {
        TiStringRelease(jsEventTypeString);
        return;
      }
    }

    TiObjectSetPropertyAtIndex(jsContext, jsCallbackArray, arrayLength, callbackFunction, &exception);
  }

  //TODO: Call back to the proxy?
  TiStringRelease(jsEventTypeString);
}

- (TiObjectRef)callbacksForEvent:(TiStringRef)jsEventTypeString
{
  if (finalized || (propsObject == NULL)) {
    return NULL;
  }

  TiObjectRef jsEventHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringEventKey, NULL);
  if ((jsEventHash == NULL) || (TiValueGetType(jsContext, jsEventHash) != kTITypeObject)) { //We did not have any event listeners on this proxy. Perfectly normal.
    return NULL;
  }

  TiObjectRef jsCallbackArray = (TiObjectRef)TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, NULL);

  if ((jsCallbackArray == NULL) || (TiValueGetType(jsContext, jsCallbackArray) != kTITypeObject)) {
    return NULL;
  }

  return jsCallbackArray;
}

- (void)removeListener:(KrollCallback *)eventCallback forEvent:(NSString *)eventName
{
  TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef)eventName);
  TiObjectRef jsCallbackArray = [self callbacksForEvent:jsEventTypeString];
  TiStringRelease(jsEventTypeString);

  if (jsCallbackArray == NULL) {
    return;
  }

  TiObjectRef callbackFunction = [eventCallback function];

  TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, kTiStringLength, NULL);
  int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, NULL);

  if (arrayLength < 1) {
    return;
  }

  for (int currentCallbackIndex = 0; currentCallbackIndex < arrayLength; currentCallbackIndex++) {
    TiValueRef currentCallback = TiObjectGetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, NULL);
    if (currentCallback == callbackFunction) {
      TiValueRef undefined = TiValueMakeUndefined(jsContext);
      TiObjectSetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, undefined, NULL);
    }
  }
}

- (void)triggerEvent:(NSString *)eventName withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject
{
  if (propsObject == NULL) {
    return;
  }

  TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef)eventName);
  TiObjectRef jsCallbackArray = [self callbacksForEvent:jsEventTypeString];
  TiStringRelease(jsEventTypeString);

  if (jsCallbackArray == NULL) {
    return;
  }

  TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, kTiStringLength, NULL);
  int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, NULL);

  if (arrayLength < 1) {
    return;
  }

  TiValueRef jsEventData = ConvertIdTiValue(context, eventData);

  for (int currentCallbackIndex = 0; currentCallbackIndex < arrayLength; currentCallbackIndex++) {
    TiValueRef currentCallback = TiObjectGetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, NULL);
    currentCallback = TiValueToObject(jsContext, currentCallback, NULL);
    if ((currentCallback == NULL) || !TiObjectIsFunction(jsContext, (TiObjectRef)currentCallback)) {
      continue;
    }
    TiValueRef exception = NULL;
    TiObjectCallAsFunction(jsContext, (TiObjectRef)currentCallback, [thisObject jsobject], 1, &jsEventData, &exception);
    if (exception != NULL) {
      id excm = [KrollObject toID:context value:exception];
      [[TiExceptionHandler defaultExceptionHandler] reportScriptError:[TiUtils scriptErrorValue:excm]];
    }
  }
}

@end
