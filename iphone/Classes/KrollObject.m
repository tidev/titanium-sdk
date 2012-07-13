/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <objc/runtime.h>
#import "SBJSON.h"
#import "KrollObject.h"
#import "KrollMethod.h"
#import "KrollCallback.h"
#import "KrollMethodDelegate.h"
#import "KrollPropertyDelegate.h"
#import "KrollContext.h"
#import "KrollBridge.h"

#ifdef KROLL_COVERAGE
# import "KrollCoverage.h"
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
TiStringRef kTiStringNewObject;
TiStringRef kTiStringTiPropertyKey;
TiStringRef kTiStringPropertyKey;
TiStringRef kTiStringEventKey;
TiStringRef kTiStringExportsKey;


id TiValueToId(KrollContext* context, TiValueRef v);

//
// function to determine if the object passed is a JS Date
//
BOOL IsDateLike(TiContextRef jsContext, TiObjectRef object, TiValueRef *v)
{
	BOOL result = NO;
	if (TiObjectHasProperty(jsContext, object, kTiStringGetTime))
	{
		TiValueRef fn = TiObjectGetProperty(jsContext, object, kTiStringGetTime, NULL);
		TiObjectRef fnObj = TiValueToObject(jsContext, fn, NULL);
		if (TiObjectIsFunction(jsContext, fnObj))
		{
			*v = TiObjectCallAsFunction(jsContext,fnObj,object,0,NULL,NULL);
			result = YES;
		}
	}
	return result;
}

//
// function for converting a TiValueRef into a NSDictionary*
//
NSDictionary* TiValueToDict(KrollContext *context, TiValueRef value)
{
	TiContextRef jsContext = [context context];
	TiObjectRef obj = TiValueToObject(jsContext, value, NULL);
	TiPropertyNameArrayRef props = TiObjectCopyPropertyNames(jsContext,obj);
	
	NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
	
	size_t count = TiPropertyNameArrayGetCount(props);
	for (size_t i = 0; i < count; i++)
	{
		TiStringRef jsString = TiPropertyNameArrayGetNameAtIndex(props, i);
		TiValueRef v = TiObjectGetProperty(jsContext, obj, jsString, NULL);
		NSString* jsonkey = [NSString stringWithCharacters:TiStringGetCharactersPtr(jsString) length:TiStringGetLength(jsString)];
		id jsonvalue = TiValueToId(context,v);
		if (jsonvalue && jsonkey) {
			[dict setObject:jsonvalue forKey:jsonkey];
		}
	}
	
	TiPropertyNameArrayRelease(props);
	
	return [dict autorelease];
}

//
// function for converting a TiValueRef into a JSON string as NSString*
//
NSString* TiValueToJSON(KrollContext *context, TiValueRef value)
{
	return [SBJSON stringify:TiValueToId(context,value)];
}

//
// function for converting a TiValueRef into an NSObject* (as ID)
//
id TiValueToId(KrollContext *context, TiValueRef v)
{
	id result = nil;
	if (v) {
		TiContextRef jsContext = [context context];
		TiType tt = TiValueGetType(jsContext, v);
		switch (tt) {
			case kTITypeUndefined:{
				result = nil;
				break;
			}
			case kTITypeNull: {
				result = [NSNull null];
				break;
			}
			case kTITypeBoolean: {
				result = [NSNumber numberWithBool:TiValueToBoolean(jsContext, v)];
				break;
			}
			case kTITypeNumber: {
				result = [NSNumber numberWithDouble:TiValueToNumber(jsContext, v, NULL)];
                if([result isEqualToNumber:[NSDecimalNumber notANumber]]){
                    result = [NSDecimalNumber notANumber];
                }
                break;
			}
			case kTITypeString: {
				TiStringRef stringRefValue = TiValueToStringCopy(jsContext, v, NULL);
				result = [(NSString *)TiStringCopyCFString
						  (kCFAllocatorDefault,stringRefValue) autorelease];
				TiStringRelease(stringRefValue);
				break;
			}
			case kTITypeObject: {
				TiObjectRef obj = TiValueToObject(jsContext, v, NULL);
				id privateObject = (id)TiObjectGetPrivate(obj);
				if ([privateObject isKindOfClass:[KrollObject class]]) {
					result = [privateObject target];
					break;
				}
				if (TiValueIsArray(jsContext,obj)) {
					TiValueRef length = TiObjectGetProperty(jsContext, obj, kTiStringLength, NULL);
					double len = TiValueToNumber(jsContext, length, NULL);
					NSMutableArray* resultArray = [[NSMutableArray alloc] initWithCapacity:len];
					for (size_t c=0; c<len; ++c)
					{
						TiValueRef valueRef = TiObjectGetPropertyAtIndex(jsContext, obj, c, NULL);
						id value = TiValueToId(context,valueRef);
						//TODO: This is a temprorary workaround for the time being. We have to properly take care of [undefined] objects.
						if(value == nil){
							[resultArray addObject:[NSNull null]];
						}
						else{
							[resultArray addObject:value];
						}
					}
					result = [resultArray autorelease];
					break;
				}
				if (TiValueIsDate(jsContext, obj)) {
					TiValueRef fn = TiObjectGetProperty(jsContext, obj, kTiStringGetTime, NULL);
					TiObjectRef fnObj = TiValueToObject(jsContext, fn, NULL);
					TiValueRef resultDate = TiObjectCallAsFunction(jsContext,fnObj,obj,0,NULL,NULL);
					double value = TiValueToNumber(jsContext, resultDate, NULL);
					result = [NSDate dateWithTimeIntervalSince1970:value/1000]; // ms for JS, sec for Obj-C
					break;
				}
				if (TiObjectIsFunction(jsContext,obj)) {
					result = [[[KrollCallback alloc] initWithCallback:obj thisObject:TiContextGetGlobalObject(jsContext) context:context] autorelease];
				} else {
					result = TiValueToDict(context,v);
				}
				break;
			}
			default: {
				break;
			}
		}
	}
	return result;
}

//
// function for converting a TiValue to an NSObject* (as ID)
//
TiValueRef ConvertIdTiValue(KrollContext *context, id obj)
{
	TiContextRef jsContext = [context context];
	if ([obj isKindOfClass:[NSNull class]])
	{
		return TiValueMakeNull(jsContext);
	}
	else if (obj == nil)
	{
		return TiValueMakeUndefined(jsContext);
	}
	else if ([obj isKindOfClass:[NSURL class]])
	{
        NSString* urlString = [obj absoluteString];
		TiStringRef jsString = TiStringCreateWithCFString((CFStringRef) urlString);
		TiValueRef result = TiValueMakeString(jsContext,jsString);
		TiStringRelease(jsString);
		return result;
	}
	else if ([obj isKindOfClass:[NSString class]])
	{
		TiStringRef jsString = TiStringCreateWithCFString((CFStringRef) obj);
		TiValueRef result = TiValueMakeString(jsContext,jsString);
		TiStringRelease(jsString);
		return result;
	}
	else if ([obj isKindOfClass:[NSNumber class]])
	{
		const char *ch = [obj objCType];
		if ('c' == ch[0])
		{
			return TiValueMakeBoolean(jsContext, [obj boolValue]);
        }
		else
		{
			return TiValueMakeNumber(jsContext, [obj doubleValue]);
		}
	}
	else if ([obj isKindOfClass:[NSArray class]])	
	{
		size_t count = [obj count];
		TiValueRef args[count];
		for (size_t c=0;c<count;c++)
		{
			args[c]=ConvertIdTiValue(context,[obj objectAtIndex:c]);
		}
		return TiObjectMakeArray(jsContext, count, args, NULL);
	}
	else if ([obj isKindOfClass:[NSDictionary class]])
	{
		//Why not just make a blank object?
		TiValueRef value = TiEvalScript(jsContext, kTiStringNewObject, NULL, NULL, 0, NULL);
		TiObjectRef objRef = TiValueToObject(jsContext, value, NULL);
		for (id prop in obj)
		{
			TiStringRef key = TiStringCreateWithCFString((CFStringRef) prop);
			TiValueRef value = ConvertIdTiValue(context,[obj objectForKey:prop]);
			TiObjectSetProperty(jsContext, objRef, key, value, 0, NULL);
			TiStringRelease(key);
		}
		return objRef;
	}
	else if ([obj isKindOfClass:[NSException class]])
	{
		TiStringRef jsString = TiStringCreateWithCFString((CFStringRef) [obj reason]);
		TiValueRef result = TiValueMakeString(jsContext,jsString);
		TiStringRelease(jsString);
		return TiObjectMakeError(jsContext, 1, &result, NULL);
	}
	else if ([obj isKindOfClass:[KrollMethod class]])
	{
		KrollContext * ourContext = [(KrollMethod *)obj context];
		if (context == ourContext)
		{
			return [(KrollMethod *)obj jsobject];
		}
		return TiObjectMake(jsContext,KrollMethodClassRef,obj);
	}
	else if ([obj isKindOfClass:[KrollWrapper class]])
	{
		if ([KrollBridge krollBridgeExists:[(KrollWrapper *)obj bridge]])
		{
			return [(KrollWrapper *)obj jsobject];
		}
		//Otherwise, this flows to null.
	}
	else if ([obj isKindOfClass:[KrollObject class]])
	{
		KrollContext * ourContext = [(KrollObject *)obj context];
		TiObjectRef ourJsObject = [(KrollObject *)obj jsobject];
		if ((context == ourContext) && (ourJsObject != NULL))
		{
			return ourJsObject;
		}
		return TiObjectMake(jsContext,KrollObjectClassRef,obj);
	}
	else if ([obj isKindOfClass:[KrollCallback class]])
	{
		return [(KrollCallback*)obj function];
	}
	else if ([obj isKindOfClass:[NSDate class]])
	{
		NSDate *date = (NSDate*)obj;
		double number = [date timeIntervalSince1970]*1000; // JS is ms
 		TiValueRef args [1];
		args[0] = TiValueMakeNumber(jsContext,number);
		return TiObjectMakeDate(jsContext,1,args,NULL);
	}
	else
	{
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
	return TiValueMakeNull(jsContext);
}

//
// callback for handling finalization (in JS land)
//
void KrollFinalizer(TiObjectRef ref)
{
    waitForMemoryPanicCleared();
	id o = (KrollObject*)TiObjectGetPrivate(ref);

	if ((o==nil) || [o isKindOfClass:[KrollContext class]])
	{
		return;
	}
	if (![o isKindOfClass:[KrollObject class]])
	{
		DeveloperLog(@"[WARN] Object %@ was not a KrollObject during finalization, was: %@",o,[o class]);
		return;
	}
#if KOBJECT_MEMORY_DEBUG == 1
	NSLog(@"[KROLL DEBUG] KROLL FINALIZER: %@, retain:%d",o,[o retainCount]);
#endif

	[(KrollObject *)o setFinalized:YES];
	if ([o isMemberOfClass:[KrollObject class]])
	{
		KrollBridge * ourBridge = [(KrollObject *)o bridge];
		if ([KrollBridge krollBridgeExists:ourBridge])
		{
			TiProxy * ourTarget = [o target];
			if ((ourTarget != nil) && ([ourBridge krollObjectForProxy:ourTarget] == o))
			{
				[ourBridge unregisterProxy:ourTarget];
			}
		}
	}

	[o release];
	o = nil;
}

bool KrollDeleteProperty(TiContextRef ctx, TiObjectRef object, TiStringRef propertyName, TiValueRef* exception)
{
    waitForMemoryPanicCleared();
	KrollObject* o = (KrollObject*) TiObjectGetPrivate(object);
	if ([o isKindOfClass:[KrollObject class]])
	{
		NSString* name = (NSString*)TiStringCopyCFString(kCFAllocatorDefault, propertyName);
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
	KrollObject * o = (KrollObject*)TiObjectGetPrivate(object);
	if ([o isKindOfClass:[KrollContext class]])
	{
		return;
	}
#if KOBJECT_MEMORY_DEBUG == 1
	NSLog(@"[KROLL DEBUG] KROLL RETAINER: %@ (%@), retain:%d",o,[o class],[o retainCount]);
#endif
 
	if ([o isKindOfClass:[KrollObject class]])
	{
		[o retain];
		TiObjectRef propsObject = TiObjectMake(ctx, NULL, NULL);
		TiObjectSetProperty(ctx, object, kTiStringTiPropertyKey, propsObject, kTiPropertyAttributeDontEnum, NULL);
		[o setPropsObject:propsObject];
	}
	else {
		DeveloperLog(@"[DEBUG] Initializer for %@",[o class]);
	}

}

//
// callback for handling retrieving an objects property (in JS land)
//

//TODO: We should fetch from the props object and shortcut some of this. Especially now that callbacks are CURRENTLY write-only.
TiValueRef KrollGetProperty(TiContextRef jsContext, TiObjectRef object, TiStringRef prop, TiValueRef* exception)
{
    waitForMemoryPanicCleared();
	KrollObject* o = (KrollObject*) TiObjectGetPrivate(object);
	@try 
	{
		if(TiStringIsEqual(prop,kTiStringTiPropertyKey))
		{
			return NULL;
		}
        
        // Attempt to retrieve the property from the exports, before going through
        // the routing
        TiObjectRef exports = [o objectForTiString:kTiStringExportsKey context:jsContext];
        if ((exports != NULL) && TiObjectHasProperty(jsContext, exports, prop)) {
            return TiObjectGetProperty(jsContext, exports, prop, NULL);
        }
        
		
		NSString* name = (NSString*)TiStringCopyCFString(kCFAllocatorDefault, prop);
		[name autorelease];		

		id result = [o valueForKey:name];
		TiObjectRef cachedObject = [o objectForTiString:prop context:jsContext];

		if ([result isKindOfClass:[KrollWrapper class]])
		{
			if (![KrollBridge krollBridgeExists:[(KrollWrapper *)result bridge]])
			{
				//This remote object no longer exists.
				[o deleteKey:name];
				result = nil;
			}
			else
			{
				TiObjectRef remoteFunction = [(KrollWrapper *)result jsobject];
				if ((cachedObject != NULL) && (cachedObject != remoteFunction))
				{
					[o forgetObjectForTiString:prop context:jsContext];	//Clean up the old property.
				}
				if (remoteFunction != NULL)
				{
					[o noteObject:remoteFunction forTiString:prop context:jsContext];
				}
				return remoteFunction;
			}

		}

		TiValueRef jsResult = ConvertIdTiValue([o context],result);
		if ( ([result isKindOfClass:[KrollObject class]] &&
				![result isKindOfClass:[KrollCallback class]] && [[result target] isKindOfClass:[TiProxy class]])
			|| ([result isKindOfClass:[TiProxy class]]) )
		{
			[o noteObject:(TiObjectRef)jsResult forTiString:prop context:jsContext];
		}
		else
		{
			[o forgetObjectForTiString:prop context:jsContext];
		}
		if (result == nil) {
			TiValueRef jsResult2 = [o jsvalueForUndefinedKey:name];
			if (jsResult2 != NULL) {
				jsResult = jsResult2;
			}
		}

#if KOBJECT_DEBUG == 1
		NSLog(@"[KROLL DEBUG] KROLL GET PROPERTY: %@=%@",name,result);
#endif
		return jsResult;
	}
	@catch (NSException * ex) 
	{
		*exception = [KrollObject toValue:[o context] value:ex];
	}
	return TiValueMakeUndefined(jsContext);
} 

//
// callback for handling a setter (in JS land)
//
bool KrollSetProperty(TiContextRef jsContext, TiObjectRef object, TiStringRef prop, TiValueRef value, TiValueRef* exception)
{
    waitForMemoryPanicCleared();
	KrollObject* o = (KrollObject*) TiObjectGetPrivate(object);
	@try 
	{
		if(TiStringIsEqual(prop,kTiStringTiPropertyKey))
		{
			return false;
		}
		NSString* name = (NSString*)TiStringCopyCFString(kCFAllocatorDefault, prop);
		[name autorelease];

		id v = TiValueToId([o context], value);
#if KOBJECT_DEBUG == 1
		NSLog(@"[KROLL DEBUG] KROLL SET PROPERTY: %@=%@ against %@",name,v,o);
#endif
		if ([v isKindOfClass:[TiProxy class]])
		{
			[o noteObject:(TiObjectRef)value forTiString:prop context:jsContext];
		}
		else
		{
			[o forgetObjectForTiString:prop context:jsContext];
		}
		[o setValue:v forKey:name];

		return true;
	}
	@catch (NSException * ex) 
	{
		*exception = [KrollObject toValue:[o context] value:ex];
	}
	return false;
}	

// forward declare these

//@interface TitaniumObject : NSObject
//@end

@interface TitaniumObject (Private)
-(NSDictionary*)modules;
@end

//@interface TiProxy : NSObject
//@end


//
// handle property names which makes the object iterable
//
void KrollPropertyNames(TiContextRef ctx, TiObjectRef object, TiPropertyNameAccumulatorRef propertyNames)
{
	KrollObject* o = (KrollObject*) TiObjectGetPrivate(object);
	if (o)
	{
		id target = [o target];
		
		if ([o isKindOfClass:[TitaniumObject class]])
		{
			for (NSString *key in [[(TitaniumObject*)o modules] allKeys])
			{
				TiStringRef value = TiStringCreateWithUTF8CString([key UTF8String]);
				TiPropertyNameAccumulatorAddName(propertyNames,value);
				TiStringRelease(value);
			}
		}
		else if ([target isKindOfClass:[TiProxy class]])
		{
			for (NSString *key in [target allKeys])
			{
				TiStringRef value = TiStringCreateWithUTF8CString([key UTF8String]);
				TiPropertyNameAccumulatorAddName(propertyNames,value);
				TiStringRelease(value);
			}
		}
	}
}

//
// support casting
//
bool KrollHasInstance(TiContextRef ctx, TiObjectRef constructor, TiValueRef possibleInstance, TiValueRef* exception)
{
	KrollObject* o1 = (KrollObject*) TiObjectGetPrivate(constructor);
	if (o1)
	{
		TiValueRef ex = NULL;
		TiObjectRef objTarget = TiValueToObject(ctx, possibleInstance, &ex);
		if (!ex)
		{
			KrollObject* o2 = (KrollObject*) TiObjectGetPrivate(objTarget);
			if (o2)
			{
				id t1 = [o1 target];
				id t2 = [o2 target];
				Class c1 = [t1 class];
				Class c2 = [t2 class];
				Class ti = [TiProxy class];
				while (c1!=c2 && c1!=nil && c2!=nil && c1!=ti && c2!=ti)
				{
					// if the proxies are the same class, we can cast
					if (c1 == c2)
					{
						return true;
					}
					// if the target is a kind of class that matches this superclass, we can cast
					if ([t2 isKindOfClass:c1])
					{
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

+(void)initialize
{
	if (KrollObjectClassRef==NULL)
	{
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
		kTiStringNewObject = TiStringCreateWithUTF8CString("new Object()");
		kTiStringTiPropertyKey = TiStringCreateWithUTF8CString("__TI");
		kTiStringPropertyKey = TiStringCreateWithUTF8CString("__PR");
		kTiStringEventKey = TiStringCreateWithUTF8CString("__EV");
        kTiStringExportsKey = TiStringCreateWithUTF8CString("__EX");
	}
}

+(TiClassRef)jsClassRef
{
	return KrollObjectClassRef;
}

-(id)initWithTarget:(id)target_ context:(KrollContext*)context_
{
	if (self = [self init])
	{
#if DEBUG
		//TODO: See if this actually happens, and if not, remove this extra check.
		if ([(KrollBridge *)[context_ delegate] usesProxy:target_] && [self isMemberOfClass:[KrollObject class]])
		{
			DeveloperLog(@"[WARN] Bridge %@ already has target %@!",[context_ delegate],target_);
		}

		if (![context_ isKJSThread])
		{
			DeveloperLog(@"[WARN] %@->%@ is being made in a thread not owned by %@.",self,target_,context_);
		}
#endif
		target = [target_ retain];
		context = context_; // don't retain
		bridge = (KrollBridge*)[context_ delegate];
		jsobject = TiObjectMake([context context],[[self class] jsClassRef],self);
		targetable = [target conformsToProtocol:@protocol(KrollTargetable)];
	}
	return self;
}

-(TiObjectRef)jsobject
{
	return jsobject;
}

-(void)invalidateJsobject;
{
	propsObject = NULL;
	jsobject = NULL;
	context = nil;
}

- (BOOL)isEqual:(id)anObject
{
	if ([anObject isKindOfClass:[KrollObject class]])
	{
		TiObjectRef ref1 = jsobject;
		TiObjectRef ref2 = [(KrollObject*)anObject jsobject];
		return TiValueIsStrictEqual([context context],ref1,ref2);
	}
	return NO;
}

-(void)dealloc
{
#if KOBJECT_MEMORY_DEBUG == 1
	NSLog(@"[KROLL DEBUG] DEALLOC KROLLOBJECT: %@",[self description]);
#endif
	RELEASE_TO_NIL(properties);
	RELEASE_TO_NIL(target);
	RELEASE_TO_NIL(statics);
//	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationDidReceiveMemoryWarningNotification object:nil];
	[super dealloc];
}

#if KOBJECT_MEMORY_DEBUG == 1
-(id)description
{
	return [NSString stringWithFormat:@"[KROLL DEBUG] KrollObject[%@] held:%d",target,[target retainCount]];
}
#endif


-(KrollContext*)context
{
	return context;
}

-(id)target
{
	return target;
}

//
// create a JS TiValueRef from a NSObject* (as ID)
//
+(TiValueRef)create:(id)object context:(KrollContext*)context
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
+(id)toID:(KrollContext*)context value:(TiValueRef) ref
{
	return TiValueToId(context,ref);
}

+(id)nonNull:(id)value
{
	if (value == nil || value == [NSNull null])
	{
		return nil;
	}
	return value;
}

//
// convert ID to TiValueRef
//
+(TiValueRef)toValue:(KrollContext*)context value:(id)obj
{
	return ConvertIdTiValue(context,obj);
}

-(NSString*)propercase:(NSString*)name index:(int)index
{
	if (index > 0)
	{
		NSString *result = [name substringFromIndex:index];
		return [NSString stringWithFormat:@"%@%@", [[result substringToIndex:1] lowercaseString], [result length] > 1 ? [result substringFromIndex:1] : @""];
	}
	else 
	{
		return [NSString stringWithFormat:@"%@%@", [[name substringToIndex:1] uppercaseString], [name length] > 1 ? [name substringFromIndex:1] : @""];
	}
}

-(NSString*)_propertyGetterSetterKey:(NSString *)key
{
	NSString *newkey = [key substringFromIndex:3];
	return [NSString stringWithFormat:@"%@%@",[[newkey substringToIndex:1] lowercaseString], [newkey length]>1 ? [newkey substringFromIndex:1]: @""];
}

-(id)convertValueToDelegate:(id)result forKey:(NSString*)key
{
    if ([result isKindOfClass:[KrollMethodDelegate class]])
    {
        int argcount = [result args] ? 1 : 0;
#ifdef KROLL_COVERAGE
        return [[[KrollCoverageMethod alloc] initWithTarget:[result target] selector:[result selector]
                                                   argcount:argcount type:KrollMethodInvoke name:key context:[self context] parent:self] autorelease];
#else
        return [[[KrollMethod alloc] initWithTarget:[result target] selector:[result selector]
                                           argcount:argcount type:KrollMethodInvoke name:key context:[self context]] autorelease];
#endif
    }
    else if ([result isKindOfClass:[KrollPropertyDelegate class]])
    {
        KrollPropertyDelegate *d = (KrollPropertyDelegate*)result;
        return [[d target] performSelector:[d selector]];
    }
    return result;
}

-(id)_valueForKey:(NSString *)key
{
	//TODO: need to consult property_getAttributes to make sure we're not hitting readonly, etc. but do this
	//only for non-production builds
	
    // TODO: We do a significant amount of magic here (set/get routing, and additionally "automatic"
    // get/set based on what we assume the user is doing) that may need to be removed.
    
	if ([key hasPrefix:@"set"] && ([key length]>=4) &&
			[[NSCharacterSet uppercaseLetterCharacterSet] characterIsMember:[key characterAtIndex:3]])
	{
        // This is PROBABLY a request for an internal setter (either setX('a') or setX('a','b')). But
        // it could also be:
        // * Pulling a user-defined property prefixed with 'get'
        // * Autogenerating a getter/setter
        // In the event of the former, we actually have to actually pull a jump to
        // returning the property's appropriate type, as below in the general case.
        
		SEL selector;
		
		NSString * propertyKey = [self _propertyGetterSetterKey:key];
#ifdef KROLL_COVERAGE
		KrollMethod * result  = [[KrollCoverageMethod alloc] initWithTarget:target context:[self context] parent:self];
#else
		KrollMethod * result = [[KrollMethod alloc] initWithTarget:target context:[self context]];
#endif
		[result setArgcount:1];
		[result setPropertyKey:propertyKey];
		[result setType:KrollMethodSetter];
		[result setUpdatesProperty:[(TiProxy *)target retainsJsObjectForKey:propertyKey]];

		selector = NSSelectorFromString([key stringByAppendingString:@":withObject:"]);
		if ([target respondsToSelector:selector])
		{
			[result setArgcount:2];
			[result setSelector:selector];
		}
		else
		{
			selector = NSSelectorFromString([key stringByAppendingString:@":"]);
			if ([target respondsToSelector:selector])
			{
				[result setSelector:selector];
			}
			else
			{
                // Either a custom property, OR a request for an autogenerated setter
                id value = [target valueForKey:key];
                if (value!=nil) {
                    [result release];
                    return [self convertValueToDelegate:value forKey:key];
                }
                else {
                    [result setType:KrollMethodPropertySetter];
                    [result setName:propertyKey];
                }
			}

		}
		
		return [result autorelease];	// we simply return a method delegator  against the target to set the property directly on the target
	}
	else if ([key hasPrefix:@"get"])
	{
#ifdef KROLL_COVERAGE
		KrollMethod * result  = [[KrollCoverageMethod alloc] initWithTarget:target context:[self context] parent:self];
#else
		KrollMethod * result = [[KrollMethod alloc] initWithTarget:target context:[self context]];
#endif
		NSString * propertyKey = [self _propertyGetterSetterKey:key];
		[result setPropertyKey:propertyKey];
		[result setArgcount:1];
		[result setUpdatesProperty:[(TiProxy *)target retainsJsObjectForKey:propertyKey]];
		

		//first make sure we don't have a method with the fullname
		SEL fullSelector = NSSelectorFromString([NSString stringWithFormat:@"%@:",key]);
		if ([target respondsToSelector:fullSelector])
		{
			[result setSelector:fullSelector];
			[result setType:KrollMethodInvoke];
			return [result autorelease];
		}		

		// this is a request for a getter method
		// a.getFoo()
		NSString *partkey = [self propercase:key index:3];
		SEL selector = NSSelectorFromString(partkey);
		if ([target respondsToSelector:selector])
		{
			[result setSelector:selector];
			[result setType:KrollMethodGetter];
			return [result autorelease];
		}
		// see if its an actual method that takes an arg instead
		selector = NSSelectorFromString([NSString stringWithFormat:@"%@:",partkey]);
		if ([target respondsToSelector:selector])
		{
			[result setSelector:selector];
			[result setType:KrollMethodGetter];
			return [result autorelease];
		}
        
        // Check for custom property before returning the autogenerated getter
        id value = [target valueForKey:key];
        if (value!=nil) {
            [result release];
            return [self convertValueToDelegate:value forKey:key];
        }        
        
		[result setName:propertyKey];
		[result setArgcount:0];
		[result setType:KrollMethodPropertyGetter];
		return [result autorelease];
	}
	else 
	{
		// property accessor - need to determine if its a objc property of method
		objc_property_t p = class_getProperty([target class], [key UTF8String]);
		if (p==NULL)
		{
			if ([key isEqualToString:@"toString"] || [key isEqualToString:@"valueOf"])
			{
				return [[[KrollMethod alloc] initWithTarget:target selector:@selector(toString:) argcount:0 type:KrollMethodInvoke name:nil context:[self context]] autorelease];
			}
			
			SEL selector = NSSelectorFromString([NSString stringWithFormat:@"%@:",key]);
			if ([target respondsToSelector:selector])
			{
#ifdef KROLL_COVERAGE
				return [[[KrollCoverageMethod alloc] initWithTarget:target selector:selector
					argcount:1 type:KrollMethodInvoke name:nil context:[self context] parent:self] autorelease];
#else
				return [[[KrollMethod alloc] initWithTarget:target selector:selector
					argcount:1 type:KrollMethodInvoke name:nil context:[self context]] autorelease];
#endif
			}
			// attempt a function that has no args (basically a non-property property)
			selector = NSSelectorFromString([NSString stringWithFormat:@"%@",key]);
			if ([target respondsToSelector:selector])
			{
#ifdef KROLL_COVERAGE
				id<KrollCoverage> cSelf = (id<KrollCoverage>)self;
				[cSelf increment:key coverageType:COVERAGE_TYPE_GET apiType:API_TYPE_PROPERTY];
#endif
				return [target performSelector:selector];
			}
			id result = [target valueForKey:key];
			if (result!=nil)
			{
                return [self convertValueToDelegate:result forKey:key];
            }
			// see if this is a create factory which we can do dynamically
			if ([key hasPrefix:@"create"])
			{
				SEL selector = @selector(createProxy:forName:context:);
				if ([target respondsToSelector:selector])
				{
#ifdef KROLL_COVERAGE
					return [[[KrollCoverageMethod alloc] initWithTarget:target selector:selector argcount:2
						type:KrollMethodFactory name:key context:[self context] parent:self] autorelease];
#else
					return [[[KrollMethod alloc] initWithTarget:target selector:selector argcount:2
						type:KrollMethodFactory name:key context:[self context]] autorelease];
#endif				
				}
			}
		}
		else 
		{
#ifdef KROLL_COVERAGE
			id<KrollCoverage> cSelf = (id<KrollCoverage>)self;
			[cSelf increment:key coverageType:COVERAGE_TYPE_GET apiType:API_TYPE_PROPERTY];
#endif
			
			NSString *attributes = [NSString stringWithCString:property_getAttributes(p) encoding:NSUTF8StringEncoding];
			SEL selector = NSSelectorFromString([NSString stringWithCString:property_getName(p) encoding:NSUTF8StringEncoding]);

			if ([attributes hasPrefix:@"T@"])
			{
				// this means its a return type of id
				return [target performSelector:selector];
			}
			else
			{
				// it's probably a primitive type - check for them
				NSMethodSignature *methodSignature = [target methodSignatureForSelector:selector];
				IMP methodFunction = [target methodForSelector:selector];
				if ([attributes hasPrefix:@"Td,"])
				{
					double d;
					typedef double (*dIMP)(id, SEL, ...);
					d = ((dIMP)methodFunction)(target,selector);
					return [NSNumber numberWithDouble:d];
				}
				else if ([attributes hasPrefix:@"Tf,"])
				{
					float f;
					typedef float (*fIMP)(id, SEL, ...);
					f = ((fIMP)methodFunction)(target,selector);
					return [NSNumber numberWithFloat:f];
				}
				else if ([attributes hasPrefix:@"Ti,"])
				{
					int i;
					typedef int (*iIMP)(id, SEL, ...);
					i = ((iIMP)methodFunction)(target,selector);
					return [NSNumber numberWithInt:i];
				}
				else if ([attributes hasPrefix:@"Tl,"])
				{
					long l;
					typedef long (*lIMP)(id, SEL, ...);
					l = ((lIMP)methodFunction)(target,selector);
					return [NSNumber numberWithLong:l];
				}
				else if ([attributes hasPrefix:@"Tc,"])
				{
					char c;
					typedef char (*cIMP)(id, SEL, ...);
					c = ((cIMP)methodFunction)(target,selector);
					return [NSNumber numberWithChar:c];
				}
                else if ([attributes hasPrefix:@"TQ,"])
                {
                    unsigned long long ull;
                    typedef unsigned long long (*ullIMP)(id, SEL, ...);
                    ull = ((ullIMP)methodFunction)(target,selector);
                    return [NSNumber numberWithUnsignedLongLong:ull];
                }
				else 
				{
					// let it fall through and return undefined
					DeveloperLog(@"[WARN] Unsupported property: %@ for %@, attributes = %@",key,target,attributes);
				}
			}
		}
	}
	return nil;
}

-(id)valueForKey:(NSString *)key
{
	BOOL executionSet = NO;
	@try 
	{
		// first consult our statics
		if (statics!=nil)
		{
			id result = [statics objectForKey:key];
			if (result!=nil)
			{
				return result;
			}
		}
		// second consult our fixed properties dictionary if we have one
		if (properties!=nil)
		{
			id result = [properties objectForKey:key];
			if (result!=nil)
			{
				return result;
			}
		}	
		if (targetable)
		{
			executionSet = YES;
			[target setExecutionContext:context.delegate];
		}
		id result = [self _valueForKey:key];
		// we can safely cache method objects
		if ([result isKindOfClass:[KrollObject class]])
		{
			[self setStaticValue:result forKey:key purgable:YES];
		}
		return result;
	}
	@finally 
	{
		if (executionSet)
		{
			[target setExecutionContext:nil];
		}
	}
}

- (TiValueRef)jsvalueForUndefinedKey:(NSString *)key
{
	return NULL;
}

-(void)deleteKey:(NSString*)key
{
	[target deleteKey:key];
}

-(void)setValue:(id)value forKey:(NSString *)key
{
	BOOL executionSet = NO;
	if ([target conformsToProtocol:@protocol(KrollTargetable)])
	{
		executionSet = YES;
		[target setExecutionContext:context.delegate];
	}
	
	@try 
	{
		if (value == [NSNull null])
		{
			value = nil;
		}
		
		NSString *name = [self propercase:key index:0];
		SEL selector = NSSelectorFromString([NSString stringWithFormat:@"set%@:withObject:",name]);
		if ([target respondsToSelector:selector])
		{
			[target performSelector:selector withObject:value withObject:nil];
			return;
		}
		selector = NSSelectorFromString([NSString stringWithFormat:@"set%@:",name]);
		if ([target respondsToSelector:selector] && ![name isEqualToString:@"ZIndex"])//TODO: Quick hack is quick.
		{
			[target performSelector:selector withObject:value];
		}
		else 
		{
			[target setValue:value forKey:key];
		}
#ifdef KROLL_COVERAGE
		id<KrollCoverage> cSelf = (id<KrollCoverage>) self;
		[cSelf increment:key coverageType:COVERAGE_TYPE_SET apiType:API_TYPE_PROPERTY];
#endif
	}
	@finally 
	{
		if (executionSet)
		{
			[target setExecutionContext:nil];
		}
	}
}

-(void)setStaticValue:(id)value forKey:(NSString*)key purgable:(BOOL)purgable
{
	if (purgable)
	{
		if (properties == nil)
		{
			properties = [[NSMutableDictionary alloc] initWithCapacity:3];
		}
		[properties setValue:value forKey:key];
	}
	else 
	{
		if (statics==nil)
		{
			statics = [[NSMutableDictionary alloc] initWithCapacity:2];
		}
		[statics setValue:value forKey:key];
	}
}

-(void)protectJsobject
{
	if (protecting)
	{
		return;
	}

	TiContextRef jscontext = [context context];
	if (finalized || (jscontext == NULL) || (jsobject == NULL))
	{
		return;
	}

	if (![context isKJSThread])
	{
		NSOperation * safeProtect = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(protectJsobject) object:nil];
		[context enqueue:safeProtect];
		[safeProtect release];
		return;
	}
	protecting = YES;
	TiValueProtect(jscontext,jsobject);
}

-(void)unprotectJsobject
{
	if (!protecting)
	{
		return;
	}
	TiContextRef jscontext = [context context];
	if (finalized || (jscontext == NULL) || (jsobject == NULL))
	{
		return;
	}

	if (![context isKJSThread])
	{
		NSOperation * safeUnprotect = [[NSInvocationOperation alloc] initWithTarget:self selector:@selector(unprotectJsobject) object:nil];
		[context enqueue:safeUnprotect];
		[safeUnprotect release];
		return;
	}
	protecting = NO;
	TiValueUnprotect(jscontext,jsobject);
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
	result[0]='_';
	result[1]='_';
	result[2]=':';
	result[3]='<' + (value & 0x3F);
	result[4]='<' + ((value >> 6) & 0x3F);
	result[5]='<' + ((value >> 12) & 0x3F);
	result[6]='<' + ((value >> 18) & 0x3F);
	result[7]='<' + ((value >> 24) & 0x3F);
	result[8]='<' + ((value >> 30) & 0x3F);
	result[9]=0;
	return TiStringCreateWithUTF8CString(result);
}

-(void)noteKeylessKrollObject:(KrollObject *)value
{
	if ([value finalized])
	{
		return;
	}

    // TODO: Enquing safeProtect here may not be enough to guarantee that the object is actually
    // safely protected "in time" (i.e. it may be GC'd before the safe protect is evaluated
    // by the queue processor). We need to seriously re-evaluate the memory model and thread
    // interactions during such.
    
	if (![context isKJSThread])
	{
		NSOperation * safeProtect = [[NSInvocationOperation alloc] initWithTarget:self
				selector:@selector(noteKeylessKrollObject:) object:value];
		[context enqueue:safeProtect];
		[safeProtect release];
		return;
	}
	
	TiStringRef nameRef = TiStringCreateWithPointerValue((int)value);
	[self noteObject:[value jsobject] forTiString:nameRef context:[context context]];
	TiStringRelease(nameRef);
}

-(void)forgetKeylessKrollObject:(KrollObject *)value
{
	if (![context isKJSThread])
	{
		NSOperation * safeUnprotect = [[NSInvocationOperation alloc] initWithTarget:self
				selector:@selector(forgetKeylessKrollObject:) object:value];
		[context enqueue:safeUnprotect];
		[safeUnprotect release];
		return;
	}

	TiStringRef nameRef = TiStringCreateWithPointerValue((int)value);
	[self forgetObjectForTiString:nameRef context:[context context]];
	TiStringRelease(nameRef);
}

-(void)noteCallback:(KrollCallback *)eventCallback forKey:(NSString *)key
{
	if (![context isKJSThread])
	{
		DeveloperLog(@"[WARN] %@ tried to protect callback for %@ in the wrong thead.",target,key);
		NSOperation * safeInvoke = [[ExpandedInvocationOperation alloc]
				initWithTarget:self selector:_cmd object:eventCallback object:key];
		[context enqueue:safeInvoke];
		[safeInvoke release];
		return;
	}

	TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
	[self noteObject:[eventCallback function] forTiString:nameRef context:[context context]];
	TiStringRelease(nameRef);

}

-(void)forgetCallbackForKey:(NSString *)key
{
	if (![context isKJSThread])
	{
		NSOperation * safeForget = [[NSInvocationOperation alloc] initWithTarget:self
				selector:@selector(forgetCallbackForKey:) object:key];
		[context enqueue:safeForget];
		[safeForget release];
		return;
	}
	TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
	[self forgetObjectForTiString:nameRef context:[context context]];
	TiStringRelease(nameRef);
}

-(void)invokeCallbackForKey:(NSString *)key withObject:(NSDictionary *)eventData thisObject:(id)thisObject
{
	if (finalized)
	{
		return;
	}

	if (![context isKJSThread])
	{
		NSOperation * safeInvoke = [[ExpandedInvocationOperation alloc]
				initWithTarget:self selector:_cmd object:key object:eventData object:thisObject];
		[context enqueue:safeInvoke];
		[safeInvoke release];
		return;
	}
	
	if (![thisObject isKindOfClass:[KrollObject class]])
	{
		thisObject = [(KrollBridge *)[context delegate] registerProxy:thisObject];
	}
	
	TiValueRef exception=NULL;

	TiContextRef jsContext = [context context];
	TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringPropertyKey, &exception);

	jsProxyHash = TiValueToObject(jsContext, jsProxyHash, &exception);
	if ((jsProxyHash == NULL) || (TiValueGetType(jsContext,jsProxyHash) != kTITypeObject))
	{
		return;
	}
	
	TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
	TiObjectRef jsCallback = (TiObjectRef)TiObjectGetProperty(jsContext, jsProxyHash, nameRef, NULL);
	TiStringRelease(nameRef);

	if ((jsCallback == NULL) || (TiValueGetType(jsContext,jsCallback) != kTITypeObject))
	{
		return;
	}

	TiValueRef jsEventData = ConvertIdTiValue(context, eventData);
	TiObjectCallAsFunction(jsContext, jsCallback, [thisObject jsobject], 1, &jsEventData,&exception);
}

-(void)noteKrollObject:(KrollObject *)value forKey:(NSString *)key
{
	if ([value finalized])
	{
		return;
	}

	if (![context isKJSThread])
	{
		DeveloperLog(@"[WARN] %@ tried to note the callback for %@ in the wrong thead.",target,key);
		NSOperation * safeInvoke = [[ExpandedInvocationOperation alloc]
				initWithTarget:self selector:_cmd object:value object:key];
		[context enqueue:safeInvoke];
		[safeInvoke release];
		return;
	}

	TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
	[self noteObject:[value jsobject] forTiString:nameRef context:[context context]];
	TiStringRelease(nameRef);
}

-(void)forgetKrollObjectforKey:(NSString *)key;
{
	if (![context isKJSThread])
	{
		NSOperation * safeForget = [[NSInvocationOperation alloc] initWithTarget:self
				selector:_cmd object:key];
		[context enqueue:safeForget];
		[safeForget release];
		return;
	}
	TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
	[self forgetObjectForTiString:nameRef context:[context context]];
	TiStringRelease(nameRef);
}

-(void)noteObject:(TiObjectRef)storedJSObject forTiString:(TiStringRef) keyString context:(TiContextRef) jsContext
{
	if ((propsObject == NULL) || (storedJSObject == NULL) || finalized)
	{
		return;
	}
	TiValueRef exception=NULL;

	TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringPropertyKey, &exception);

	if ((jsProxyHash == NULL) || (TiValueGetType(jsContext,jsProxyHash) != kTITypeObject))
	{
		jsProxyHash = TiObjectMake(jsContext, NULL, &exception);
		TiObjectSetProperty(jsContext, propsObject, kTiStringPropertyKey, jsProxyHash,
				kTiPropertyAttributeDontEnum , &exception);
	}

	TiObjectSetProperty(jsContext, jsProxyHash, keyString, storedJSObject,
			kTiPropertyAttributeDontEnum , &exception);
}

-(void)forgetObjectForTiString:(TiStringRef) keyString context:(TiContextRef) jsContext
{
	if ((propsObject == NULL) || finalized)
	{
		return;
	}
	TiValueRef exception=NULL;

	TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringPropertyKey, &exception);

	if ((jsProxyHash == NULL) || (TiValueGetType(jsContext,jsProxyHash) != kTITypeObject))
	{
		return;
	}

	TiObjectDeleteProperty(jsContext, jsProxyHash, keyString, &exception);
}

-(TiObjectRef)objectForTiString:(TiStringRef) keyString context:(TiContextRef) jsContext
{
	if(finalized){
		return NULL;
	}

	TiValueRef exception=NULL;

	TiObjectRef jsProxyHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringPropertyKey, &exception);

	if ((jsProxyHash == NULL) || (TiValueGetType(jsContext,jsProxyHash) != kTITypeObject))
	{
		return NULL;
	}
	
	TiObjectRef result = (TiObjectRef)TiObjectGetProperty(jsContext, jsProxyHash, keyString, NULL);
	if ((result == NULL) || (TiValueGetType(jsContext,result) != kTITypeObject))
	{
		return NULL;
	}

	return result;
}

-(void)storeListener:(KrollCallback *)eventCallback forEvent:(NSString *)eventName
{
	if ((propsObject == NULL) || finalized)
	{
		return;
	}

	TiValueRef exception=NULL;

	TiContextRef jsContext = [context context];
	TiObjectRef jsEventHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringEventKey, &exception);

	jsEventHash = TiValueToObject(jsContext, jsEventHash, &exception);
	if ((jsEventHash == NULL) || (TiValueGetType(jsContext,jsEventHash) != kTITypeObject))
	{
		jsEventHash = TiObjectMake(jsContext, NULL, &exception);
		TiObjectSetProperty(jsContext, propsObject, kTiStringEventKey, jsEventHash,
				kTiPropertyAttributeDontEnum , &exception);
	}

	TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef) eventName);
	TiObjectRef jsCallbackArray = (TiObjectRef)TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, &exception);
	TiObjectRef callbackFunction = [eventCallback function];
	jsCallbackArray = TiValueToObject(jsContext, jsCallbackArray, &exception);

	if ((jsCallbackArray == NULL) || (TiValueGetType(jsContext,jsCallbackArray) != kTITypeObject))
	{
		jsCallbackArray = TiObjectMakeArray(jsContext, 1, (TiValueRef*)&callbackFunction, &exception);
		TiObjectSetProperty(jsContext, jsEventHash, jsEventTypeString, jsCallbackArray,
				kTiPropertyAttributeDontEnum , &exception);
	}
	else
	{
		TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, kTiStringLength, &exception);
		int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, &exception);
		
		TiObjectSetPropertyAtIndex(jsContext, jsCallbackArray, arrayLength, callbackFunction, &exception);
	}

	//TODO: Call back to the proxy?
	TiStringRelease(jsEventTypeString);
}

-(void)removeListener:(KrollCallback *)eventCallback forEvent:(NSString *)eventName
{
	if (finalized || (propsObject == NULL))
	{
		return;
	}

	TiContextRef jsContext = [context context];
	TiObjectRef jsEventHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringEventKey, NULL);
	if ((jsEventHash == NULL) || (TiValueGetType(jsContext,jsEventHash) != kTITypeObject))
	{
		return;
	}

	TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef) eventName);
	TiObjectRef jsCallbackArray = (TiObjectRef)TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, NULL);
	TiStringRelease(jsEventTypeString);
	TiObjectRef callbackFunction = [eventCallback function];

	if ((jsCallbackArray == NULL) || (TiValueGetType(jsContext,jsCallbackArray) != kTITypeObject))
	{
		return;
	}

	TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, kTiStringLength, NULL);
	int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, NULL);

	if (arrayLength < 1)
	{
		return;
	}

	for (int currentCallbackIndex=0; currentCallbackIndex<arrayLength; currentCallbackIndex++)
	{
		TiValueRef currentCallback = TiObjectGetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, NULL);
		if (currentCallback == callbackFunction)
		{
			TiValueRef undefined = TiValueMakeUndefined(jsContext);
			TiObjectSetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, undefined, NULL);
		}
	}
}

-(void)triggerEvent:(NSString *)eventName withObject:(NSDictionary *)eventData thisObject:(KrollObject *)thisObject
{
	if (finalized || [thisObject finalized] || (propsObject == NULL))
	{
		return;
	}

	TiContextRef jsContext = [context context];
	TiObjectRef jsEventHash = (TiObjectRef)TiObjectGetProperty(jsContext, propsObject, kTiStringEventKey, NULL);

	if ((jsEventHash == NULL) || (TiValueGetType(jsContext,jsEventHash) != kTITypeObject))
	{	//We did not have any event listeners on this proxy. Perfectly normal.
		return;
	}

	TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef) eventName);
	TiObjectRef jsCallbackArray = (TiObjectRef)TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, NULL);
	TiStringRelease(jsEventTypeString);

	if ((jsCallbackArray == NULL) || (TiValueGetType(jsContext,jsCallbackArray) != kTITypeObject))
	{	//We did not have any event listeners on this proxy. Perfectly normal.
		return;
	}

	
	TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, kTiStringLength, NULL);
	int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, NULL);

	if (arrayLength < 1)
	{
		return;
	}

	TiValueRef jsEventData = ConvertIdTiValue(context, eventData);

	for (int currentCallbackIndex=0; currentCallbackIndex<arrayLength; currentCallbackIndex++)
	{
		TiValueRef currentCallback = TiObjectGetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, NULL);
		currentCallback = TiValueToObject(jsContext, currentCallback, NULL);
		if ((currentCallback == NULL) || !TiObjectIsFunction(jsContext,(TiObjectRef)currentCallback))
		{
			continue;
		}
		TiValueRef exception = NULL;
		TiObjectCallAsFunction(jsContext, (TiObjectRef)currentCallback, [thisObject jsobject], 1, &jsEventData,&exception);
		if (exception!=NULL)
		{
			DebugLog(@"[WARN] Exception in event callback. %@",[KrollObject toID:context value:exception]);
		}
	}
}

@end
