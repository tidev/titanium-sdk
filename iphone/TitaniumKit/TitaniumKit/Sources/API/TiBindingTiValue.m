/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBindingTiValue.h"
#import "KrollBridge.h"
#import "KrollCallback.h"
#import "KrollContext.h"
#import "KrollMethod.h"
#import "KrollObject.h"
#import <objc/runtime.h>

/*
 *	Since JSStringRefs are not tied to any particular context, and are
 *	immutable, they are threadsafe and more importantly, ones that are in
 *	constant use never need to garbage collected, but can be reused.
 */

extern JSStringRef kTiStringGetTime;
extern JSStringRef kTiStringLength;
extern JSStringRef kTiStringTiPropertyKey;
extern JSStringRef kTiStringPropertyKey;
extern JSStringRef kTiStringEventKey;
extern JSStringRef kTiStringExportsKey;

//
// function for converting a JSValueRef into a NSDictionary*
//
NSDictionary *TiBindingTiValueToNSDictionary(JSContextRef jsContext, JSValueRef objRef)
{
  JSObjectRef obj = JSValueToObject(jsContext, objRef, NULL);
  JSPropertyNameArrayRef props = JSObjectCopyPropertyNames(jsContext, obj);

  NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];

  size_t count = JSPropertyNameArrayGetCount(props);
  for (size_t i = 0; i < count; i++) {
    JSStringRef jsString = JSPropertyNameArrayGetNameAtIndex(props, i);
    JSValueRef v = JSObjectGetProperty(jsContext, obj, jsString, NULL);
    NSString *jsonkey = (NSString *)JSStringCopyCFString(kCFAllocatorDefault, jsString);
    id jsonvalue = TiBindingTiValueToNSObject(jsContext, v);
    if (jsonvalue && jsonkey) {
      [dict setObject:jsonvalue forKey:jsonkey];
    }
    [jsonkey release];
  }

  // if this looks like a JS Error object, get the message
  if ([dict objectForKey:@"line"] != nil && [dict objectForKey:@"column"] != nil) {
    JSStringRef messageKeyRef = JSStringCreateWithUTF8CString("message");
    JSStringRef stackKeyRef = JSStringCreateWithUTF8CString("stack");
    JSValueRef messageRef = JSObjectGetProperty(jsContext, obj, messageKeyRef, NULL);
    JSValueRef stackRef = JSObjectGetProperty(jsContext, obj, stackKeyRef, NULL);

    id message = TiBindingTiValueToNSObject(jsContext, messageRef);
    if (message && ![message isEqual:[NSNull null]]) {
      [dict setObject:message forKey:@"message"];
    }
    JSStringRelease(messageKeyRef);

    id stack = TiBindingTiValueToNSObject(jsContext, stackRef);
    if (stack && ![stack isEqual:[NSNull null]]) {

      // lets re-format the stack similar to node.js
      stack = [stack stringByReplacingOccurrencesOfString:[NSString stringWithFormat:@"file://%@", [[NSBundle mainBundle] bundlePath]] withString:@"("];
      stack = [stack stringByReplacingOccurrencesOfString:@"\n" withString:@")\n    at "];
      stack = [stack stringByReplacingOccurrencesOfString:@"])" withString:@"]"];
      stack = [stack stringByReplacingOccurrencesOfString:@"@(" withString:@"("];
      stack = [NSString stringWithFormat:@"    at %@)", stack];

      [dict setObject:stack forKey:@"stack"];
    }
    JSStringRelease(stackKeyRef);
  }

  JSPropertyNameArrayRelease(props);

  return [dict autorelease];
}

//
// function for converting a JSValueRef into an NSObject* (as ID)
//
NSObject *TiBindingTiValueToNSObject(JSContextRef jsContext, JSValueRef objRef)
{
  if (objRef == NULL) {
    return nil;
  }
  JSType tt = JSValueGetType(jsContext, objRef);
  switch (tt) {
  case kJSTypeUndefined: {
    return nil;
  }
  case kJSTypeNull: {
    return [NSNull null];
  }
  case kJSTypeBoolean: {
    return [NSNumber numberWithBool:JSValueToBoolean(jsContext, objRef)];
  }
  case kJSTypeNumber: {
    double result = JSValueToNumber(jsContext, objRef, NULL);
    if (isnan(result)) {
      return [NSDecimalNumber numberWithDouble:result];
    }
    return [NSNumber numberWithDouble:result];
  }
  case kJSTypeString: {
    JSStringRef stringRefValue = JSValueToStringCopy(jsContext, objRef, NULL);
    NSString *result = [(NSString *)JSStringCopyCFString(kCFAllocatorDefault, stringRefValue) autorelease];
    JSStringRelease(stringRefValue);
    return result;
  }
  case kJSTypeObject: {
    JSObjectRef obj = JSValueToObject(jsContext, objRef, NULL);
    id privateObject = (id)JSObjectGetPrivate(obj);
    if ([privateObject isKindOfClass:[KrollObject class]]) {
      return [privateObject target];
    }
    if ([privateObject isKindOfClass:[TiProxy class]]) {
      return privateObject;
    }

    // No private object, so this may be:
    // - a standard JS object (Array, Date, Function, Object)
    // - A JS object wrapping a new-style obj-c proxy (JSExport)
    // - A JS object wrapper for hyperloop holding a $native property that is the native proxy
    if (privateObject == nil) {
      // First, check for special hyperloop $native property
      JSStringRef jsString = JSStringCreateWithUTF8CString("$native");
      JSValueRef jsValue = JSObjectGetProperty(jsContext, obj, jsString, NULL);
      JSStringRelease(jsString);
      if (JSValueIsObject(jsContext, jsValue)) {
        privateObject = (id)JSObjectGetPrivate(JSValueToObject(jsContext, jsValue, NULL));
        if (privateObject != nil) {
          return privateObject;
        }
      }

      // Next, try to convert to new-style obj-c proxy!
      JSGlobalContextRef globalContext = JSContextGetGlobalContext(jsContext);
      JSContext *context = [JSContext contextWithJSGlobalContextRef:globalContext];
      JSValue *objcJSValue = [JSValue valueWithJSValueRef:objRef inContext:context];
      id whatever = [objcJSValue toObject]; // For typical JS Object, this will become an NSDictionary*, which we could cheat and re-use below instead of calling TiBindingTiValueToNSDictionary (though it'd have to handle the Error special case)
      if (whatever != nil && [whatever conformsToProtocol:@protocol(JSExport)]) {
        return whatever;
      }
    }

    if (JSValueIsArray(jsContext, obj)) {
      JSValueRef length = JSObjectGetProperty(jsContext, obj, kTiStringLength, NULL);
      double len = JSValueToNumber(jsContext, length, NULL);
      NSMutableArray *resultArray = [[NSMutableArray alloc] initWithCapacity:len];
      for (uint c = 0; c < len; ++c) {
        JSValueRef valueRef = JSObjectGetPropertyAtIndex(jsContext, obj, c, NULL);
        id value = TiBindingTiValueToNSObject(jsContext, valueRef);
        //TODO: This is a temprorary workaround for the time being. We have to properly take care of [undefined] objects.
        if (value == nil) {
          [resultArray addObject:[NSNull null]];
        } else {
          [resultArray addObject:value];
        }
      }
      return [resultArray autorelease];
    }
    if (JSValueIsDate(jsContext, obj)) {
      JSValueRef fn = JSObjectGetProperty(jsContext, obj, kTiStringGetTime, NULL);
      JSObjectRef fnObj = JSValueToObject(jsContext, fn, NULL);
      JSValueRef resultDate = JSObjectCallAsFunction(jsContext, fnObj, obj, 0, NULL, NULL);
      double value = JSValueToNumber(jsContext, resultDate, NULL);
      return [NSDate dateWithTimeIntervalSince1970:value / 1000]; // ms for JS, sec for Obj-C
    }
    if (JSObjectIsFunction(jsContext, obj)) {
      KrollContext *context = GetKrollContext(jsContext);
      return [[[KrollCallback alloc] initWithCallback:obj thisObject:JSContextGetGlobalObject(jsContext) context:context] autorelease];
    }

    return TiBindingTiValueToNSDictionary(jsContext, objRef);
  }
  default: {
    return nil;
  }
  }
}

//
// function for converting a TiValue to an NSObject* (as ID)
// Note that if obj is nil, this returns an empty object. This is intentional.
JSObjectRef TiBindingTiValueFromNSDictionary(JSContextRef jsContext, NSDictionary *obj)
{
  JSObjectRef objRef = JSObjectMake(jsContext, NULL, NULL);
  for (id prop in (NSDictionary *)obj) {
    JSStringRef key = JSStringCreateWithCFString((CFStringRef)prop);
    JSValueRef value = TiBindingTiValueFromNSObject(jsContext, [(NSDictionary *)obj objectForKey:prop]);
    JSObjectSetProperty(jsContext, objRef, key, value, 0, NULL);
    JSStringRelease(key);
  }
  return objRef;
}

JSValueRef TiBindingTiValueFromProxy(JSContextRef jsContext, TiProxy *obj)
{
  if (obj == nil) {
    return JSValueMakeUndefined(jsContext);
  }
  KrollContext *context = GetKrollContext(jsContext);
  KrollBridge *ourBridge = (KrollBridge *)[context delegate];
  if (ourBridge != nil) {
    if (![ourBridge usesProxy:obj]) {
      if (![context isKJSThread]) {
        DebugLog(@"[WARN] Creating %@ in a different context than the calling function.", obj);
        ourBridge = [KrollBridge krollBridgeForThreadName:[[NSThread currentThread] name]];
      }
      return [[ourBridge registerProxy:obj] jsobject];
    }
    KrollObject *objKrollObject = [ourBridge krollObjectForProxy:obj];
#ifdef USE_JSCORE_FRAMEWORK
    [objKrollObject removeGarbageCollectionSafeguard];
#endif
    return [objKrollObject jsobject];
  }

  DebugLog(@"[WARN] Generating a new JSObject for KrollObject %@ because the contexts %@ and its context %@ differed.", obj, context, ourBridge);
  KrollObject *o = [[[KrollObject alloc] initWithTarget:obj context:context] autorelease];
  return JSObjectMake(jsContext, KrollObjectClassRef, o);
}

JSValueRef TiBindingTiValueFromNSObject(JSContextRef jsContext, NSObject *obj)
{
  if ([obj conformsToProtocol:@protocol(JSExport)]) {
    JSContext *objcContext = [JSContext contextWithJSGlobalContextRef:JSContextGetGlobalContext(jsContext)];
    return [[JSValue valueWithObject:obj inContext:objcContext] JSValueRef];
  }
  if ([obj isKindOfClass:[NSNull class]]) {
    return JSValueMakeNull(jsContext);
  }
  if (obj == nil) {
    return JSValueMakeUndefined(jsContext);
  }
  if ([obj isKindOfClass:[NSURL class]]) {
    NSString *urlString = [(NSURL *)obj absoluteString];
    JSStringRef jsString = JSStringCreateWithCFString((CFStringRef)urlString);
    JSValueRef result = JSValueMakeString(jsContext, jsString);
    JSStringRelease(jsString);
    return result;
  }
  if ([obj isKindOfClass:[NSString class]]) {
    JSStringRef jsString = JSStringCreateWithCFString((CFStringRef)(NSString *)obj);
    JSValueRef result = JSValueMakeString(jsContext, jsString);
    JSStringRelease(jsString);
    return result;
  }
  if ([obj isKindOfClass:[NSNumber class]]) {
    const char *ch = [(NSNumber *)obj objCType];
    if ('c' == ch[0]) {
      return JSValueMakeBoolean(jsContext, [(NSNumber *)obj boolValue]);
    }
    return JSValueMakeNumber(jsContext, [(NSNumber *)obj doubleValue]);
  }
  if ([obj isKindOfClass:[NSArray class]]) {
    size_t count = [(NSArray *)obj count];
    JSValueRef args[count];
    int i = 0;
    for (id thisObject in (NSArray *)obj) {
      args[i++] = TiBindingTiValueFromNSObject(jsContext, thisObject);
    }
    return JSObjectMakeArray(jsContext, count, args, NULL);
  }
  if ([obj isKindOfClass:[NSDictionary class]]) {
    return TiBindingTiValueFromNSDictionary(jsContext, (NSDictionary *)obj);
  }

  // Handle native errors
  if ([obj isKindOfClass:[NSException class]]) {
    JSStringRef jsString = JSStringCreateWithCFString((CFStringRef)[(NSException *)obj reason]);
    JSValueRef result = JSValueMakeString(jsContext, jsString);
    JSStringRelease(jsString);
    JSObjectRef excObject = JSObjectMakeError(jsContext, 1, &result, NULL);
    NSDictionary *details = [(NSException *)obj userInfo];

    // Add "nativeReason" key
    NSString *subreason = [details objectForKey:kTiExceptionSubreason];
    if (subreason != nil) {
      JSStringRef propertyName = JSStringCreateWithUTF8CString("nativeReason");
      JSStringRef valueString = JSStringCreateWithCFString((CFStringRef)subreason);
      JSObjectSetProperty(jsContext, excObject, propertyName, JSValueMakeString(jsContext, valueString), kJSPropertyAttributeReadOnly, NULL);
      JSStringRelease(propertyName);
      JSStringRelease(valueString);
    }

    // Add "nativeStack" key
    NSArray<NSString *> *nativeStack = [(NSException *)obj callStackSymbols];
    if (nativeStack != nil) {
      NSMutableArray<NSString *> *formattedStackTrace = [[[NSMutableArray alloc] init] autorelease];
      NSUInteger exceptionStackTraceLength = [nativeStack count];

      // re-size stack trace and format results. Starting at index = 4 to not include the script-error API's
      for (NSInteger i = 3; i < (exceptionStackTraceLength >= 20 ? 20 : exceptionStackTraceLength); i++) {
        NSString *line = [[nativeStack objectAtIndex:i] stringByReplacingOccurrencesOfString:@"     " withString:@""];
        [formattedStackTrace addObject:line];
      }

      JSStringRef propertyName = JSStringCreateWithUTF8CString("nativeStack");
      JSStringRef valueString = JSStringCreateWithCFString((CFStringRef)[formattedStackTrace componentsJoinedByString:@"\n"]);
      JSObjectSetProperty(jsContext, excObject, propertyName, JSValueMakeString(jsContext, valueString), kJSPropertyAttributeReadOnly, NULL);
      JSStringRelease(propertyName);
      JSStringRelease(valueString);
    }

    // Add "nativeLocation" key
    NSString *location = [details objectForKey:kTiExceptionLocation];
    if (location != nil) {
      JSStringRef propertyName = JSStringCreateWithUTF8CString("nativeLocation");
      JSStringRef valueString = JSStringCreateWithCFString((CFStringRef)location);
      JSObjectSetProperty(jsContext, excObject, propertyName, JSValueMakeString(jsContext, valueString), kJSPropertyAttributeReadOnly, NULL);
      JSStringRelease(propertyName);
      JSStringRelease(valueString);
    }
    return excObject;
  }
  if ([obj isKindOfClass:[KrollMethod class]]) {
    JSContextRef ourContext = [(KrollMethod *)obj jsContext];
    if (jsContext == ourContext) {
      return [(KrollMethod *)obj jsobject];
    }
    return JSObjectMake(jsContext, KrollMethodClassRef, obj);
  }
  if ([obj isKindOfClass:[KrollWrapper class]]) {
    if ([KrollBridge krollBridgeExists:[(KrollWrapper *)obj bridge]]) {
      return [(KrollWrapper *)obj jsobject];
    }
    return JSValueMakeNull(jsContext);
  }
  if ([obj isKindOfClass:[KrollObject class]]) {
    JSContextRef ourContext = [(KrollObject *)obj jsContext];
    JSObjectRef ourJsObject = [(KrollObject *)obj jsobject];
    if ((jsContext == ourContext) && (ourJsObject != NULL)) {
      return ourJsObject;
    }
    return JSObjectMake(jsContext, KrollObjectClassRef, obj);
  }
  if ([obj isKindOfClass:[KrollCallback class]]) {
    return [(KrollCallback *)obj function];
  }
  if ([obj isKindOfClass:[NSDate class]]) {
    NSDate *date = (NSDate *)obj;
    double number = [date timeIntervalSince1970] * 1000; // JS is ms
    JSValueRef args[1];
    args[0] = JSValueMakeNumber(jsContext, number);
    return JSObjectMakeDate(jsContext, 1, args, NULL);
  }
  return TiBindingTiValueFromProxy(jsContext, (TiProxy *)obj);
}
