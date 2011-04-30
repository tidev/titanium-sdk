/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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

#define LOG_FINALIZE	0

TiClassRef KrollObjectClassRef = NULL;
TiClassRef JSObjectClassRef = NULL;

id TiValueToId(KrollContext* context, TiValueRef v);

@implementation KrollUndefined
+(KrollUndefined*)undefined
{
	static KrollUndefined *undef;
	if (undef==nil)
	{
		undef = [[KrollUndefined alloc] init];
	}
	return undef;
}
@end

//
// function to determine if the object passed is a JS Date
//
BOOL IsDateLike(TiContextRef jsContext, TiObjectRef object, TiValueRef *v)
{
	BOOL result = NO;
	TiStringRef jsString = TiStringCreateWithUTF8CString("getTime");
	if (TiObjectHasProperty(jsContext, object, jsString))
	{
		TiValueRef fn = TiObjectGetProperty(jsContext, object, jsString, NULL);
		TiObjectRef fnObj = TiValueToObject(jsContext, fn, NULL);
		if (TiObjectIsFunction(jsContext, fnObj))
		{
			*v = TiObjectCallAsFunction(jsContext,fnObj,object,0,NULL,NULL);
			result = YES;
		}
	}
	TiStringRelease(jsString);
	return result;
}

//
// function to determine if the object passed is a JS Array 
//
BOOL IsArrayLike(TiContextRef jsContext, TiObjectRef object)
{
	//TODO: this has got to be slow since we have to dip into the object 3 times
	//can we get smarter here?
	
	BOOL isArrayLike = YES;
	
	TiStringRef pop = TiStringCreateWithUTF8CString("pop");
	isArrayLike = isArrayLike && TiObjectHasProperty(jsContext, object, pop);
	TiStringRelease(pop);
	
	if (!IsArrayLike) return NO;
	
	TiStringRef concat = TiStringCreateWithUTF8CString("concat");
	isArrayLike = isArrayLike && TiObjectHasProperty(jsContext, object, concat);
	TiStringRelease(concat);

	if (!IsArrayLike) return NO;

	TiStringRef length = TiStringCreateWithUTF8CString("length");
	isArrayLike = isArrayLike && TiObjectHasProperty(jsContext, object, length);
	TiStringRelease(length);
	
	return isArrayLike;
}

//
// function for converting a TiValueRef into a NSDictionary*
//
NSDictionary* TiValueToDict(KrollContext *context, TiValueRef value)
{
	TiContextRef jsContext = [context context];
	TiObjectRef obj = TiValueToObject(jsContext, value, NULL);
	TiPropertyNameArrayRef props = TiObjectCopyPropertyNames(jsContext,obj);
	TiPropertyNameArrayRetain(props);
	
	NSMutableDictionary *dict = [[NSMutableDictionary alloc] init];
	
	size_t count = TiPropertyNameArrayGetCount(props);
	for (size_t i = 0; i < count; i++)
	{
		TiStringRef jsString = TiPropertyNameArrayGetNameAtIndex(props, i);
		TiValueRef v = TiObjectGetProperty(jsContext, obj, jsString, NULL);
		
		size_t size = TiStringGetMaximumUTF8CStringSize(jsString);
		char* cstring = (char*) malloc(size);
		TiStringGetUTF8CString(jsString, cstring, size);
		NSString *jsonkey = [NSString stringWithUTF8String:cstring];
		id jsonvalue = TiValueToId(context,v);
		if (jsonkey!=nil && jsonvalue!=nil)
		{
			[dict setObject:jsonvalue forKey:jsonkey];
		}
		free(cstring);
		TiStringRelease(jsString);
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
// function for converting a TiValueRef string into a NSString*
//
NSString* TiStringToNSString(TiContextRef jsContext, TiValueRef value)
{
	if (TiValueIsString(jsContext,value))
	{
		TiStringRef jsString = TiValueToStringCopy(jsContext, value, NULL);
		if (jsString)
		{
			size_t size = TiStringGetLength(jsString);
			const TiChar* ustring = TiStringGetCharactersPtr(jsString);
			NSString *result = [NSString stringWithCharacters:ustring length:size];
			TiStringRelease(jsString);
			return result;
		}
	}
	else if (TiValueIsNumber(jsContext, value))
	{
		double f = TiValueToNumber(jsContext, value, NULL);
		return [[NSNumber numberWithDouble:f] stringValue];
	}
	else if (TiValueIsBoolean(jsContext, value))
	{
		bool b = TiValueToBoolean(jsContext, value);
		return b ? @"true" : @"false";
	}				
	return nil;
}

//
// function for converting a TiValueRef into an NSObject* (as ID)
//
id TiValueToId(KrollContext *context, TiValueRef v)
{
	if (v == NULL)
	{
		//As opposed to null, this really is a case of no value.
		//TODO: Right? Or should this be a NSNull?
		return nil;
	}
	TiContextRef jsContext = [context context];
	if (TiValueIsString(jsContext,v))
	{
		return TiStringToNSString(jsContext, v);
	}
	else if (TiValueIsNumber(jsContext,v))
	{
		return [NSNumber numberWithDouble:TiValueToNumber(jsContext, v, NULL)];
	}
	else if (TiValueIsBoolean(jsContext, v))
	{
		return [NSNumber numberWithBool:TiValueToBoolean(jsContext, v)];
	}
	else if (TiValueIsNull(jsContext,v) || TiValueIsUndefined(jsContext, v))
	{
		// we can't use nil since that would prevent the value from being placed
		// in a dictionary (for example) so we need to use the special NSNull class
		// to indicate that this is an *explicit* null vs. not found
		return [NSNull null];
	}
	else if (TiValueIsObject(jsContext, v))
	{
		TiObjectRef obj = TiValueToObject(jsContext, v, NULL);
		id privateObject = (id)TiObjectGetPrivate(obj);
		if ([privateObject isKindOfClass:[KrollObject class]])
		{
			return [privateObject target];
		}
		if (IsArrayLike(jsContext,obj))
		{
			TiStringRef lengthProp = TiStringCreateWithUTF8CString("length");
			TiValueRef length = TiObjectGetProperty(jsContext, obj, lengthProp, NULL);
			TiStringRelease(lengthProp);
			double len = TiValueToNumber(jsContext, length, NULL);
			NSMutableArray *result = [[NSMutableArray alloc] initWithCapacity:len];
			for (size_t c=0;c<len;c++)
			{
				TiValueRef valueRef = TiObjectGetPropertyAtIndex(jsContext, obj, c, NULL);
				id value = TiValueToId(context,valueRef);
				[result addObject:value];
			}
			return [result autorelease];
		}
		TiValueRef result;
		if (IsDateLike(jsContext,obj,&result))
		{
			double value = TiValueToNumber(jsContext, result, NULL);
			return [NSDate dateWithTimeIntervalSince1970:value/1000]; // ms for JS, sec for Obj-C
		}
		if (TiObjectIsFunction(jsContext,obj))
		{
			return [[[KrollCallback alloc] initWithCallback:obj thisObject:TiContextGetGlobalObject(jsContext) context:context] autorelease];
		}
		return TiValueToDict(context,v);
	}
	return nil;
}

//
// function for converting a TiValue to an NSObject* (as ID)
//
TiValueRef ConvertIdTiValue(KrollContext *context, id obj)
{
	TiContextRef jsContext = [context context];
	if (obj == nil || [obj isKindOfClass:[NSNull class]])
	{
		return TiValueMakeNull(jsContext);
	}
	else if ([obj isKindOfClass:[KrollUndefined class]])
	{
		return TiValueMakeUndefined(jsContext);
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
		TiStringRef jsString = TiStringCreateWithUTF8CString("new Object()");
		TiValueRef value = TiEvalScript(jsContext, jsString, NULL, NULL, 0, NULL);
		TiStringRelease(jsString);
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
				return [[ourBridge registerProxy:obj] jsobject];
			}
			KrollObject * objKrollObject = [ourBridge krollObjectForProxy:obj];
			return [objKrollObject jsobject];
		}
		
		NSLog(@"[WARN] Generating a new TiObject for KrollObject %@ because the contexts %@ and its context %@ differed.",obj,context,ourBridge);

		KrollObject *o = [[[KrollObject alloc] initWithTarget:obj context:context] autorelease];
		return TiObjectMake(jsContext,KrollObjectClassRef,o);
	}
	return TiValueMakeNull(jsContext);
}

#if LOG_FINALIZE
void quickLogger(KrollContext * ourContext, TiObjectRef ref, TiProxy * ourTarget, KrollBridge * ourBridge, KrollObject * o)
{
	NSString * ourTargetDesc = [ourTarget description];
	if ([ourTargetDesc length] > 40)
	{
		ourTargetDesc = [[ourTargetDesc substringToIndex:30] stringByAppendingString:@"..."];
	}
	NSString * textString = [[ourTarget valueForKey:@"text"] description];
	if ([textString length] > 40)
	{
		textString = [[textString substringToIndex:30] stringByAppendingString:@"..."];
	}
	
	NSLog(@"FINALIZING %@[%X]->%@[%@==%@]->%@ %X (%@:%@)",ourContext,ref,ourBridge,o,[ourBridge krollObjectForProxy:ourTarget],
			ourTargetDesc,ourTarget,[ourTarget valueForKey:@"title"],textString);
}
#endif

//
// callback for handling finalization (in JS land)
//
void KrollFinalizer(TiObjectRef ref)
{
	id o = (KrollObject*)TiObjectGetPrivate(ref);

	if ((o==nil) || [o isKindOfClass:[KrollContext class]])
	{
		return;
	}
	if (![o isKindOfClass:[KrollObject class]])
	{
		NSLog(@"[WARN] object: %@ was not of the right class: %@",o,[o class]);
		return;
	}
#if KOBJECT_MEMORY_DEBUG == 1
	NSLog(@"KROLL FINALIZER: %@, retain:%d",o,[o retainCount]);
#endif

	[(KrollObject *)o setFinalized:YES];
	if ([o isMemberOfClass:[KrollObject class]])
	{
		KrollBridge * ourBridge = [(KrollObject *)o bridge];
		if ([KrollBridge krollBridgeExists:ourBridge])
		{
			TiProxy * ourTarget = [o target];
#if LOG_FINALIZE
			quickLogger(ourContext,ref,ourTarget,ourBridge,o);
#endif
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
	KrollObject * o = (KrollObject*)TiObjectGetPrivate(object);
	if ([o isKindOfClass:[KrollContext class]])
	{
		return;
	}
#if KOBJECT_MEMORY_DEBUG == 1
	NSLog(@"KROLL RETAINER: %@ (%@), retain:%d",o,[o class],[o retainCount]);
#endif
 
	if ([o isKindOfClass:[KrollObject class]])
	{
		[o retain];
		TiObjectRef propsObject = TiObjectMake(ctx, NULL, NULL);
		TiStringRef propsKey = TiStringCreateWithUTF8CString("__TI");
		TiObjectSetProperty(ctx, object, propsKey, propsObject, kTiPropertyAttributeDontEnum, NULL);
		TiStringRelease(propsKey);
		[o setPropsObject:propsObject];
	}
	else {
		NSLog(@"[DEBUG] initializer for %@",[o class]);
	}

}

//
// callback for handling retrieving an objects property (in JS land)
//

//TODO: We should fetch from the props object and shortcut some of this. Especially now that callbacks are CURRENTLY write-only.
TiValueRef KrollGetProperty(TiContextRef jsContext, TiObjectRef object, TiStringRef prop, TiValueRef* exception)
{
	KrollObject* o = (KrollObject*) TiObjectGetPrivate(object);
	@try 
	{
		NSString* name = (NSString*)TiStringCopyCFString(kCFAllocatorDefault, prop);
		[name autorelease];
		if([name isEqualToString:@"__TI"])
		{
			return NULL;
		}
		
		TiObjectRef cachedObject = [o objectForTiString:prop context:jsContext];
		
		if ((cachedObject != NULL) && TiObjectIsFunction(jsContext,cachedObject))
		{
			return cachedObject;
		}
		
		id result = [o valueForKey:name];
		TiValueRef jsResult = ConvertIdTiValue([o context],result);
		if ([result isKindOfClass:[KrollObject class]] &&
				![result isKindOfClass:[KrollCallback class]] && [[result target] isKindOfClass:[TiProxy class]])
		{
			[o noteObject:jsResult forTiString:prop context:jsContext];
		}
		else
		{
			[o forgetObjectForTiString:prop context:jsContext];
		}

#if KOBJECT_DEBUG == 1
		NSLog(@"KROLL GET PROPERTY: %@=%@",name,result);
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
	KrollObject* o = (KrollObject*) TiObjectGetPrivate(object);
	@try 
	{
		NSString* name = (NSString*)TiStringCopyCFString(kCFAllocatorDefault, prop);
		[name autorelease];
		if([name isEqualToString:@"__TI"])
		{
			return false;
		}

		id v = TiValueToId([o context], value);
#if KOBJECT_DEBUG == 1
		NSLog(@"KROLL SET PROPERTY: %@=%@ against %@",name,v,o);
#endif
		if ([v isKindOfClass:[TiProxy class]])
		{
			[o noteObject:value forTiString:prop context:jsContext];
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
			NSLog(@"[WARN] %@ already has %@!",[context_ delegate],target_);
		}

		if (![context_ isKJSThread])
		{
			NSLog(@"[WARN] %@->%@ is being made in a thread not owned by %@",self,target_,context_);
		}


#endif
		target = [target_ retain];
		context = context_; // don't retain
		bridge = [context_ delegate];
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
	NSLog(@"DEALLOC KROLLOBJECT: %@",[self description]);
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
	return [NSString stringWithFormat:@"KrollObject[%@] held:%d",target,[target retainCount]];
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
	KrollObject *ko = [[[KrollObject alloc] initWithTarget:object context:context] autorelease];
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

-(id)_valueForKey:(NSString *)key
{
	//TODO: need to consult property_getAttributes to make sure we're not hitting readonly, etc. but do this
	//only for non-production builds
	
	if ([key hasPrefix:@"set"])
	{
		// this is a request for a setter method
		// a.setFoo('bar')
		SEL selector;
		// setter can also have a special 2nd parameter, let's check that
		// right now we only support 2 but easy to add more
		// form is foo.setFoo('bar','foo')
		
		NSString * propertyKey = [self _propertyGetterSetterKey:key];
		KrollMethod * result = [[KrollMethod alloc] initWithTarget:target context:[self context]];
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
				[result setType:KrollMethodPropertySetter];
				[result setName:propertyKey];
			}

		}
		
		return [result autorelease];	// we simply return a method delegator against the target to set the property directly on the target
	}
	else if ([key hasPrefix:@"get"])
	{
		KrollMethod * result = [[KrollMethod alloc] initWithTarget:target context:[self context]];
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
				return [[[KrollMethod alloc] initWithTarget:target selector:selector argcount:1 type:KrollMethodInvoke name:nil context:[self context]] autorelease];
			}
			// attempt a function that has no args (basically a non-property property)
			selector = NSSelectorFromString([NSString stringWithFormat:@"%@",key]);
			if ([target respondsToSelector:selector])
			{
				return [target performSelector:selector];
			}
			id result = [target valueForKey:key];
			if (result!=nil)
			{
				if ([result isKindOfClass:[KrollMethodDelegate class]])
				{
					int argcount = [result args] ? 1 : 0;
					return [[[KrollMethod alloc] initWithTarget:[result target] selector:[result selector] argcount:argcount type:KrollMethodInvoke name:key context:[self context]] autorelease];
				}
				else if ([result isKindOfClass:[KrollPropertyDelegate class]])
				{
					KrollPropertyDelegate *d = (KrollPropertyDelegate*)result;
					return [[d target] performSelector:[d selector]];
				}
				return result;
			}
			// see if this is a create factory which we can do dynamically
			if ([key hasPrefix:@"create"])
			{
				SEL selector = @selector(createProxy:forName:context:);
				if ([target respondsToSelector:selector])
				{
					return [[[KrollMethod alloc] initWithTarget:target selector:selector argcount:2 type:KrollMethodFactory name:key context:[self context]] autorelease];
				}
			}
		}
		else 
		{
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
				NSInvocation *invoker = [NSInvocation invocationWithMethodSignature:methodSignature];
				[invoker setSelector:selector];
				[invoker setTarget:target];
				[invoker invoke];
				if ([attributes hasPrefix:@"Td,"])
				{
					double result;
					[invoker getReturnValue:&result];
					return [NSNumber numberWithDouble:result];
				}
				else if ([attributes hasPrefix:@"Tf,"])
				{
					float result;
					[invoker getReturnValue:&result];
					return [NSNumber numberWithFloat:result];
				}
				else if ([attributes hasPrefix:@"Ti,"])
				{
					int result;
					[invoker getReturnValue:&result];
					return [NSNumber numberWithInt:result];
				}
				else if ([attributes hasPrefix:@"Tl,"])
				{
					long result;
					[invoker getReturnValue:&result];
					return [NSNumber numberWithLong:result];
				}
				else if ([attributes hasPrefix:@"Tc,"])
				{
					char result;
					[invoker getReturnValue:&result];
					return [NSNumber numberWithChar:result];
				}
				else 
				{
					// let it fall through and return undefined
					NSLog(@"[WARN] unsupported property: %@ for %@, attributes = %@",key,target,attributes);
				}
			}
		}
	}
	return [KrollUndefined undefined];
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

-(void)noteKeylessKrollObject:(KrollObject *)value
{
	if (![context isKJSThread])
	{
		NSOperation * safeProtect = [[NSInvocationOperation alloc] initWithTarget:self
				selector:@selector(noteKeylessKrollObject:) object:value];
		[context enqueue:safeProtect];
		[safeProtect release];
		return;
	}

	NSString * falseKey = [NSString stringWithFormat:@"__PX%X",value];
	[self noteKrollObject:value forKey:falseKey];
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

	NSString * falseKey = [NSString stringWithFormat:@"__PX%X",value];
	[self forgetKrollObjectforKey:falseKey];
}

-(void)noteCallback:(KrollCallback *)eventCallback forKey:(NSString *)key
{
	if (![context isKJSThread])
	{
		NSLog(@"[WARN] %@ tried to note the callback for %@ in the wrong thead.",target,key);
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
	TiStringRef jsPropertyHashString = TiStringCreateWithUTF8CString("__PR");
	TiObjectRef jsProxyHash = TiObjectGetProperty(jsContext, propsObject, jsPropertyHashString, &exception);
	TiStringRelease(jsPropertyHashString);

	jsProxyHash = TiValueToObject(jsContext, jsProxyHash, &exception);
	if ((jsProxyHash == NULL) || (TiValueGetType(jsContext,jsProxyHash) != kTITypeObject))
	{
		return;
	}
	
	TiStringRef nameRef = TiStringCreateWithCFString((CFStringRef)key);
	TiObjectRef jsCallback = TiObjectGetProperty(jsContext, jsProxyHash, nameRef, NULL);
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
		NSLog(@"[WARN] %@ tried to note the callback for %@ in the wrong thead.",target,key);
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

	TiStringRef jsPropertyHashString = TiStringCreateWithUTF8CString("__PR");
	TiObjectRef jsProxyHash = TiObjectGetProperty(jsContext, propsObject, jsPropertyHashString, &exception);

	jsProxyHash = TiValueToObject(jsContext, jsProxyHash, &exception);
	if ((jsProxyHash == NULL) || (TiValueGetType(jsContext,jsProxyHash) != kTITypeObject))
	{
		jsProxyHash = TiObjectMake(jsContext, NULL, &exception);
		TiObjectSetProperty(jsContext, propsObject, jsPropertyHashString, jsProxyHash,
				kTiPropertyAttributeDontEnum , &exception);
	}
	TiStringRelease(jsPropertyHashString);

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

	TiStringRef jsPropertyHashString = TiStringCreateWithUTF8CString("__PR");
	TiObjectRef jsProxyHash = TiObjectGetProperty(jsContext, propsObject, jsPropertyHashString, &exception);
	TiStringRelease(jsPropertyHashString);

	jsProxyHash = TiValueToObject(jsContext, jsProxyHash, &exception);
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

	TiStringRef jsPropertyHashString = TiStringCreateWithUTF8CString("__PR");
	TiObjectRef jsProxyHash = TiObjectGetProperty(jsContext, propsObject, jsPropertyHashString, &exception);
	TiStringRelease(jsPropertyHashString);

	jsProxyHash = TiValueToObject(jsContext, jsProxyHash, &exception);
	if ((jsProxyHash == NULL) || (TiValueGetType(jsContext,jsProxyHash) != kTITypeObject))
	{
		return NULL;
	}
	
	TiObjectRef result = TiObjectGetProperty(jsContext, jsProxyHash, keyString, NULL);

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
	TiStringRef jsEventHashString = TiStringCreateWithUTF8CString("__EV");
	TiObjectRef jsEventHash = TiObjectGetProperty(jsContext, propsObject, jsEventHashString, &exception);

	jsEventHash = TiValueToObject(jsContext, jsEventHash, &exception);
	if ((jsEventHash == NULL) || (TiValueGetType(jsContext,jsEventHash) != kTITypeObject))
	{
		jsEventHash = TiObjectMake(jsContext, NULL, &exception);
		TiObjectSetProperty(jsContext, propsObject, jsEventHashString, jsEventHash,
				kTiPropertyAttributeDontEnum , &exception);
	}

	TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef) eventName);
	TiObjectRef jsCallbackArray = TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, &exception);
	TiObjectRef callbackFunction = [eventCallback function];
	jsCallbackArray = TiValueToObject(jsContext, jsCallbackArray, &exception);

	if ((jsCallbackArray == NULL) || (TiValueGetType(jsContext,jsCallbackArray) != kTITypeObject))
	{
		jsCallbackArray = TiObjectMakeArray(jsContext, 1, &callbackFunction, &exception);
		TiObjectSetProperty(jsContext, jsEventHash, jsEventTypeString, jsCallbackArray,
				kTiPropertyAttributeDontEnum , &exception);
	}
	else
	{
		TiStringRef jsLengthString = TiStringCreateWithUTF8CString("length");
		TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, jsLengthString, &exception);
		int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, &exception);
		TiStringRelease(jsLengthString);
		
		TiObjectSetPropertyAtIndex(jsContext, jsCallbackArray, arrayLength, callbackFunction, &exception);
	}

	//TODO: Call back to the proxy?
	TiStringRelease(jsEventTypeString);
	TiStringRelease(jsEventHashString);
}

-(void)removeListener:(KrollCallback *)eventCallback forEvent:(NSString *)eventName
{
	if (finalized || (propsObject == NULL))
	{
		return;
	}

	TiContextRef jsContext = [context context];
	TiStringRef jsEventHashString = TiStringCreateWithUTF8CString("__EV");
	TiObjectRef jsEventHash = TiObjectGetProperty(jsContext, propsObject, jsEventHashString, NULL);
	if ((jsEventHash == NULL) || (TiValueGetType(jsContext,jsEventHash) != kTITypeObject))
	{
		return;
	}
	TiStringRelease(jsEventHashString);

	TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef) eventName);
	TiObjectRef jsCallbackArray = TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, NULL);
	TiObjectRef callbackFunction = [eventCallback function];

	if ((jsCallbackArray == NULL) || (TiValueGetType(jsContext,jsCallbackArray) != kTITypeObject))
	{
		return;
	}

	TiStringRef jsLengthString = TiStringCreateWithUTF8CString("length");
	TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, jsLengthString, NULL);
	int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, NULL);
	TiStringRelease(jsLengthString);

	if (arrayLength < 1)
	{
		return;
	}

	for (int currentCallbackIndex=0; currentCallbackIndex<arrayLength; currentCallbackIndex++)
	{
		TiValueRef currentCallback = TiObjectGetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, NULL);
		if (currentCallback == callbackFunction)
		{
			TiStringRef propertyName = TiStringCreateWithCFString((CFStringRef) [NSString stringWithFormat:@"%d",currentCallbackIndex]);
			TiObjectDeleteProperty(jsContext, jsCallbackArray, propertyName, NULL);
			TiStringRelease(propertyName);
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
	TiStringRef jsEventHashString = TiStringCreateWithUTF8CString("__EV");
	TiObjectRef jsEventHash = TiObjectGetProperty(jsContext, propsObject, jsEventHashString, NULL);

	if ((jsEventHash == NULL) || (TiValueGetType(jsContext,jsEventHash) != kTITypeObject))
	{	//We did not have any event listeners on this proxy. Perfectly normal.
		return;
	}
	TiStringRelease(jsEventHashString);

	TiStringRef jsEventTypeString = TiStringCreateWithCFString((CFStringRef) eventName);
	TiObjectRef jsCallbackArray = TiObjectGetProperty(jsContext, jsEventHash, jsEventTypeString, NULL);

	if ((jsCallbackArray == NULL) || (TiValueGetType(jsContext,jsCallbackArray) != kTITypeObject))
	{	//We did not have any event listeners on this proxy. Perfectly normal.
		return;
	}

	
	TiStringRef jsLengthString = TiStringCreateWithUTF8CString("length");
	TiValueRef jsCallbackArrayLength = TiObjectGetProperty(jsContext, jsCallbackArray, jsLengthString, NULL);
	int arrayLength = (int)TiValueToNumber(jsContext, jsCallbackArrayLength, NULL);
	TiStringRelease(jsLengthString);

	if (arrayLength < 1)
	{
		return;
	}

	TiValueRef jsEventData = ConvertIdTiValue(context, eventData);

	for (int currentCallbackIndex=0; currentCallbackIndex<arrayLength; currentCallbackIndex++)
	{
		TiValueRef currentCallback = TiObjectGetPropertyAtIndex(jsContext, jsCallbackArray, currentCallbackIndex, NULL);
		TiValueRef exception = NULL;
		TiObjectCallAsFunction(jsContext, currentCallback, [thisObject jsobject], 1, &jsEventData,&exception);
		if (exception!=NULL)
		{
			NSLog(@"[WARN] Exception in event callback. %@",[KrollObject toID:context value:exception]);
		}
	}
}

@end