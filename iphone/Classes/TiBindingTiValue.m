/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBindingTiValue.h"
#import <objc/runtime.h>
#import "KrollObject.h"
#import "KrollMethod.h"
#import "KrollCallback.h"
#import "KrollContext.h"
#import "KrollBridge.h"

#ifdef KROLL_COVERAGE
# import "KrollCoverage.h"
#endif

/*
 *	Since TiStringRefs are not tied to any particular context, and are
 *	immutable, they are threadsafe and more importantly, ones that are in
 *	constant use never need to garbage collected, but can be reused.
 */

extern TiStringRef kTiStringGetTime;
extern TiStringRef kTiStringLength;
extern TiStringRef kTiStringTiPropertyKey;
extern TiStringRef kTiStringPropertyKey;
extern TiStringRef kTiStringEventKey;
extern TiStringRef kTiStringExportsKey;

//
// function for converting a TiValueRef into a NSDictionary*
//
NSDictionary * TiBindingTiValueToNSDictionary(TiContextRef jsContext, TiValueRef objRef)
{
	TiObjectRef obj = TiValueToObject(jsContext, objRef, NULL);
	TiPropertyNameArrayRef props = TiObjectCopyPropertyNames(jsContext,obj);
	
	NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
	
	size_t count = TiPropertyNameArrayGetCount(props);
	for (size_t i = 0; i < count; i++)
	{
		TiStringRef jsString = TiPropertyNameArrayGetNameAtIndex(props, i);
		TiValueRef v = TiObjectGetProperty(jsContext, obj, jsString, NULL);
		NSString* jsonkey = (NSString *)TiStringCopyCFString(kCFAllocatorDefault, jsString);
		id jsonvalue = TiBindingTiValueToNSObject(jsContext,v);
		if (jsonvalue && jsonkey) {
			[dict setObject:jsonvalue forKey:jsonkey];
		}
		[jsonkey release];
	}
	
	TiPropertyNameArrayRelease(props);
	
	return [dict autorelease];
}


//
// function for converting a TiValueRef into an NSObject* (as ID)
//
NSObject * TiBindingTiValueToNSObject(TiContextRef jsContext, TiValueRef objRef)
{
	if(objRef == NULL){
		return nil;
	}
	TiType tt = TiValueGetType(jsContext, objRef);
	switch (tt) {
		case kTITypeUndefined:{
			return nil;
		}
		case kTITypeNull: {
			return [NSNull null];
		}
		case kTITypeBoolean: {
			return [NSNumber numberWithBool:TiValueToBoolean(jsContext, objRef)];
		}
		case kTITypeNumber: {
			double result = TiValueToNumber(jsContext, objRef, NULL);
			if (isnan(result)) {
				return [NSDecimalNumber numberWithDouble:result];
			}
			return [NSNumber numberWithDouble:result];
		}
		case kTITypeString: {
			TiStringRef stringRefValue = TiValueToStringCopy(jsContext, objRef, NULL);
			NSString * result = [(NSString *)TiStringCopyCFString
								 (kCFAllocatorDefault,stringRefValue) autorelease];
			TiStringRelease(stringRefValue);
			return result;
		}
		case kTITypeObject: {
			TiObjectRef obj = TiValueToObject(jsContext, objRef, NULL);
			id privateObject = (id)TiObjectGetPrivate(obj);
			if ([privateObject isKindOfClass:[KrollObject class]]) {
				return [privateObject target];
			}
			if (TiValueIsArray(jsContext,obj)) {
				TiValueRef length = TiObjectGetProperty(jsContext, obj, kTiStringLength, NULL);
				double len = TiValueToNumber(jsContext, length, NULL);
				NSMutableArray* resultArray = [[NSMutableArray alloc] initWithCapacity:len];
				for (size_t c=0; c<len; ++c)
				{
					TiValueRef valueRef = TiObjectGetPropertyAtIndex(jsContext, obj, c, NULL);
					id value = TiBindingTiValueToNSObject(jsContext,valueRef);
					//TODO: This is a temprorary workaround for the time being. We have to properly take care of [undefined] objects.
					if(value == nil){
						[resultArray addObject:[NSNull null]];
					}
					else{
						[resultArray addObject:value];
					}
				}
				return [resultArray autorelease];
			}
			if (TiValueIsDate(jsContext, obj)) {
				TiValueRef fn = TiObjectGetProperty(jsContext, obj, kTiStringGetTime, NULL);
				TiObjectRef fnObj = TiValueToObject(jsContext, fn, NULL);
				TiValueRef resultDate = TiObjectCallAsFunction(jsContext,fnObj,obj,0,NULL,NULL);
				double value = TiValueToNumber(jsContext, resultDate, NULL);
				return [NSDate dateWithTimeIntervalSince1970:value/1000]; // ms for JS, sec for Obj-C
				break;
			}
			if (TiObjectIsFunction(jsContext,obj)) {
				KrollContext * context = GetKrollContext(jsContext);
				return [[[KrollCallback alloc] initWithCallback:obj thisObject:TiContextGetGlobalObject(jsContext) context:context] autorelease];
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
//
TiObjectRef TiBindingTiValueFromNSDictionary(TiContextRef jsContext,NSDictionary *obj)
{
	TiObjectRef objRef = TiObjectMake(jsContext, NULL, NULL);
	for (id prop in (NSDictionary *)obj)
	{
		TiStringRef key = TiStringCreateWithCFString((CFStringRef) prop);
		TiValueRef value = TiBindingTiValueFromNSObject(jsContext,[(NSDictionary *)obj objectForKey:prop]);
		TiObjectSetProperty(jsContext, objRef, key, value, 0, NULL);
		TiStringRelease(key);
	}
	return objRef;
}

TiValueRef TiBindingTiValueFromProxy(TiContextRef jsContext, TiProxy * obj)
{
	if (obj == nil)
	{
		return TiValueMakeUndefined(jsContext);
	}
	KrollContext * context = GetKrollContext(jsContext);
	KrollBridge * ourBridge = (KrollBridge *)[context delegate];
	if (ourBridge != nil)
	{
		if (![ourBridge usesProxy:obj])
		{
			if (![context isKJSThread])
			{
				DebugLog(@"[WARN] Creating %@ in a different context than the calling function.",obj);
				ourBridge = [KrollBridge krollBridgeForThreadName:[[NSThread currentThread] name]];
			}
			return [[ourBridge registerProxy:obj] jsobject];
		}
		KrollObject * objKrollObject = [ourBridge krollObjectForProxy:obj];
		return [objKrollObject jsobject];
	}
	
	DebugLog(@"[WARN] Generating a new TiObject for KrollObject %@ because the contexts %@ and its context %@ differed.",obj,context,ourBridge);
#ifdef KROLL_COVERAGE
	KrollObject *o = [[[KrollCoverageObject alloc] initWithTarget:obj context:context] autorelease];
#else
	KrollObject *o = [[[KrollObject alloc] initWithTarget:obj context:context] autorelease];
#endif
	return TiObjectMake(jsContext,KrollObjectClassRef,o);
}

TiValueRef TiBindingTiValueFromNSObject(TiContextRef jsContext, NSObject * obj)
{
	if ([obj isKindOfClass:[NSNull class]])
	{
		return TiValueMakeNull(jsContext);
	}
	if (obj == nil)
	{
		return TiValueMakeUndefined(jsContext);
	}
	if ([obj isKindOfClass:[NSURL class]])
	{
        NSString* urlString = [(NSURL *)obj absoluteString];
		TiStringRef jsString = TiStringCreateWithCFString((CFStringRef) urlString);
		TiValueRef result = TiValueMakeString(jsContext,jsString);
		TiStringRelease(jsString);
		return result;
	}
	if ([obj isKindOfClass:[NSString class]])
	{
		TiStringRef jsString = TiStringCreateWithCFString((CFStringRef) obj);
		TiValueRef result = TiValueMakeString(jsContext,jsString);
		TiStringRelease(jsString);
		return result;
	}
	if ([obj isKindOfClass:[NSNumber class]])
	{
		const char *ch = [(NSNumber *)obj objCType];
		if ('c' == ch[0])
		{
			return TiValueMakeBoolean(jsContext, [(NSNumber *)obj boolValue]);
        }
		return TiValueMakeNumber(jsContext, [(NSNumber *)obj doubleValue]);
	}
	if ([obj isKindOfClass:[NSArray class]])
	{
		size_t count = [(NSArray *)obj count];
		TiValueRef args[count];
		int i=0;
		for (id thisObject in (NSArray *)obj) {
			args[i++]=TiBindingTiValueFromNSObject(jsContext, thisObject);
		}
		return TiObjectMakeArray(jsContext, count, args, NULL);
	}
	if ([obj isKindOfClass:[NSDictionary class]])
	{
		return TiBindingTiValueFromNSDictionary(jsContext, (NSDictionary *)obj);
	}
	if ([obj isKindOfClass:[NSException class]])
	{
		TiStringRef jsString = TiStringCreateWithCFString((CFStringRef) [(NSException *)obj reason]);
		TiValueRef result = TiValueMakeString(jsContext,jsString);
		TiStringRelease(jsString);
		return TiObjectMakeError(jsContext, 1, &result, NULL);
	}
	if ([obj isKindOfClass:[KrollMethod class]])
	{
		TiContextRef ourContext = [(KrollMethod *)obj jsContext];
		if (jsContext == ourContext)
		{
			return [(KrollMethod *)obj jsobject];
		}
		return TiObjectMake(jsContext,KrollMethodClassRef,obj);
	}
	if ([obj isKindOfClass:[KrollWrapper class]])
	{
		if ([KrollBridge krollBridgeExists:[(KrollWrapper *)obj bridge]])
		{
			return [(KrollWrapper *)obj jsobject];
		}
		return TiValueMakeNull(jsContext);
	}
	if ([obj isKindOfClass:[KrollObject class]])
	{
		TiContextRef ourContext = [(KrollObject *)obj jsContext];
		TiObjectRef ourJsObject = [(KrollObject *)obj jsobject];
		if ((jsContext == ourContext) && (ourJsObject != NULL))
		{
			return ourJsObject;
		}
		return TiObjectMake(jsContext,KrollObjectClassRef,obj);
	}
	if ([obj isKindOfClass:[KrollCallback class]])
	{
		return [(KrollCallback*)obj function];
	}
	if ([obj isKindOfClass:[NSDate class]])
	{
		NSDate *date = (NSDate*)obj;
		double number = [date timeIntervalSince1970]*1000; // JS is ms
 		TiValueRef args [1];
		args[0] = TiValueMakeNumber(jsContext,number);
		return TiObjectMakeDate(jsContext,1,args,NULL);
	}
	return TiBindingTiValueFromProxy(jsContext, (TiProxy *)obj);
}
