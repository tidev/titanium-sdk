/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollMethod.h"
#import "KrollObject.h"
#import "KrollContext.h"
#import "TiBase.h"

#import "KrollBridge.h"

#ifdef KROLL_COVERAGE
# import "KrollCoverage.h"
#endif

#import "TiApp.h"

TiClassRef KrollMethodClassRef = NULL;

TiValueRef KrollCallAsFunction(TiContextRef jsContext, TiObjectRef func, TiObjectRef thisObj, size_t argCount, const TiValueRef arguments[], TiValueRef* exception)
{
    waitForMemoryPanicCleared();
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	KrollMethod* o = (KrollMethod*) TiObjectGetPrivate(func);
	@try
	{
		NSMutableArray* args = nil;
		if (argCount > 0)
		{
			args = [[NSMutableArray alloc] initWithCapacity:argCount];
			for (size_t c=0;c<argCount;c++)
			{
				id value = [KrollObject toID:[o context] value:arguments[c]];
				//TODO: This is a temprorary workaround for the time being. We have to properly take care of [undefined] objects.
				if(value == nil){
					[args addObject:[NSNull null]];
				}
				else{
					[args addObject:value];
				}
			}
		}
#if KMETHOD_DEBUG == 1
		NSDate *reftime = [NSDate date];
		NSLog(@"[DEBUG] Invoking %@ with args: %@",o,args);
#endif
		id result = [o call:args];
#if KMETHOD_DEBUG == 1
		double elapsed = [[NSDate date] timeIntervalSinceDate:reftime];
		NSLog(@"[DEBUG] Invoked %@ with result: %@ [took: %f]",o,result,elapsed);
#endif
		[args release];
		return [KrollObject toValue:[o context] value:result];
	}
	@catch (NSException *ex) 
	{
#if KMETHOD_DEBUG == 1
		NSLog(@"[ERROR] method invoked exception: %@",ex);
#endif	
		*exception = [KrollObject toValue:[o context] value:ex];
	}
	@finally 
	{
		[pool release];
		pool = nil;
	}
	return TiValueMakeUndefined(jsContext);
}

TiValueRef KrollCallAsNamedFunction(TiContextRef jsContext, TiObjectRef func, TiObjectRef thisObj, size_t argCount, const TiValueRef arguments[], TiValueRef* exception)
{
    waitForMemoryPanicCleared();
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	
	KrollMethod* o = (KrollMethod*) TiObjectGetPrivate(thisObj);
	TiStringRef jsString = TiValueToStringCopy(jsContext, func, NULL);
	NSString* funcName = (NSString *)TiStringCopyCFString(kCFAllocatorDefault, jsString);
	TiStringRelease(jsString);
	[funcName autorelease];

	@try {
		NSMutableArray* args = nil;
		if (argCount > 0) {
			args = [[NSMutableArray alloc] initWithCapacity:argCount];
			for (size_t c=0;c<argCount;c++) {
				id value = [KrollObject toID:[o context] value:arguments[c]];
				//TODO: This is a temprorary workaround for the time being. We have to properly take care of [undefined] objects.
				if(value == nil){
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
		NSLog(@"[DEBUG] Invoking %@ with args: %@",o,args);
#endif
		id result = [o call:args];
#if KMETHOD_DEBUG == 1
		double elapsed = [[NSDate date] timeIntervalSinceDate:reftime];
		NSLog(@"[DEBUG] Invoked %@ with result: %@ [took: %f]",o,result,elapsed);
#endif
		[args release];
		return [KrollObject toValue:[o context] value:result];
	}
	@catch (NSException *ex) {
#if KMETHOD_DEBUG == 1
		NSLog(@"[ERROR] method invoked exception: %@",ex);
#endif	
		*exception = [KrollObject toValue:[o context] value:ex];
	}
	@finally {
		[pool release];
		pool = nil;
	}
	return TiValueMakeUndefined(jsContext);
}

@implementation KrollMethod
@synthesize propertyKey, selector,argcount,type,name,updatesProperty;

-(id)init
{
	if (self = [super init])
	{
		if (KrollMethodClassRef==NULL)
		{
			TiClassDefinition classDef = kTiClassDefinitionEmpty;
			classDef.className = "Function";
			classDef.initialize = KrollInitializer;
			classDef.finalize = KrollFinalizer;
			classDef.setProperty = KrollSetProperty;
			classDef.getProperty = KrollGetProperty;
			classDef.callAsFunction = KrollCallAsFunction;
			KrollMethodClassRef = TiClassCreate(&classDef);
		}
	}
	return self;
}

+(TiClassRef)jsClassRef
{
	return KrollMethodClassRef;
}

#ifdef DEBUG
-(id)description
{
	return [NSString stringWithFormat:@"%@->%@ [%d]",target,NSStringFromSelector(selector),(int)type];
}
#endif

-(id)initWithTarget:(id)target_ context:(KrollContext*)context_;
{
	if (self = [super initWithTarget:target_ context:context_])
	{
		[target_ release];
	}
	return self;
}


-(id)initWithTarget:(id)target_ selector:(SEL)selector_ argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_ context:(KrollContext*)context_;
{
	if (self = [self initWithTarget:target_ context:context_])
	{
		selector = selector_;
		argcount = argcount_;
		type = type_;
		name = [name_ retain];
	}
	return self;
}

-(void)dealloc
{
	target = nil;
	[name release];
	name = nil;
	[propertyKey release];
	[super dealloc];
}

-(void)updateJSObjectWithValue:(id)value forKey:(NSString *)key
{
	if (!updatesProperty)
	{
		return;
	}
	KrollBridge * ourBridge = (KrollBridge*)[context delegate];
	KrollObject * targetKrollObject = [ourBridge krollObjectForProxy:target];
	TiStringRef keyString = TiStringCreateWithCFString((CFStringRef) key);

	if ((value != target) && [value isKindOfClass:[TiProxy class]] && [ourBridge usesProxy:value])
	{
		KrollObject *valueKrollObject = [ourBridge krollObjectForProxy:value];
		[targetKrollObject noteObject:[valueKrollObject jsobject] forTiString:keyString context:[context context]];
	}
	else
	{
		[targetKrollObject forgetObjectForTiString:keyString context:[context context]];
	}
	
	TiStringRelease(keyString);
}


-(id)call:(NSArray*)args
{
	// special property setter delegator against the target
	if (type == KrollMethodPropertySetter && [args count]==1)
	{
		id newValue = [KrollObject nonNull:[args objectAtIndex:0]];
		[self updateJSObjectWithValue:newValue forKey:name];
		[target setValue:newValue forKey:name];
		return self;
	}
	// special property getter delegator against the target
	if (type == KrollMethodPropertyGetter)
	{
		// hold, see below
		id result = [target valueForKey:name];
		[self updateJSObjectWithValue:result forKey:name];		
		return result;
	}
	
	// special generic factory for creating proxy objects for modules
	if (type == KrollMethodFactory)
	{
		//TODO: This likely could be further optimized later
		//
		NSMethodSignature *methodSignature = [target methodSignatureForSelector:selector];
		bool useResult = [methodSignature methodReturnLength] == sizeof(id);
		id result = nil;
		id delegate = context.delegate;
		IMP methodFunction = [target methodForSelector:selector];
		if (useResult) {
			result = methodFunction(target,selector,args,name,delegate);
		}
		else
		{
			methodFunction(target,selector,args,name,delegate);
		}
		return result;
	}
	
	
	// create proxy method invocation
	NSMethodSignature *methodSignature = [target methodSignatureForSelector:selector];
	if (methodSignature==nil)
	{
		@throw [NSException exceptionWithName:@"org.appcelerator.kroll" reason:[NSString stringWithFormat:@"invalid method '%@'",NSStringFromSelector(selector)] userInfo:nil];
	}
	IMP methodFunction = [target methodForSelector:selector];
	id arg1=nil;
	id arg2=nil;

	if ([target conformsToProtocol:@protocol(KrollTargetable)])
	{
		[target setExecutionContext:context.delegate];
	}
	
	int methodArgCount = [methodSignature numberOfArguments];
	
	if (methodArgCount > 0 && argcount > 0)
	{
		if (argcount==2 && methodArgCount==4)
		{
			arg1 = [KrollObject nonNull:args==nil ? nil : [args objectAtIndex:0]];
			arg2 = [KrollObject nonNull:[args count] > 1 ? [args objectAtIndex:1] : nil];
			if (type == KrollMethodSetter)
			{
				[self updateJSObjectWithValue:arg1 forKey:propertyKey];
			}
		}
		else
		{
			if (type == KrollMethodDynamicProxy)
			{
				arg1 = name;
				arg2 = args;
			}
			else if (type == KrollMethodSetter)
			{
				arg1 = [KrollObject nonNull:[args count] == 1 ? [args objectAtIndex:0] : args];
				[self updateJSObjectWithValue:arg1 forKey:propertyKey];
			}
			else if (args!=nil)
			{
				arg1 = [KrollObject nonNull:args];
			}
		}
	}
	
	if ([methodSignature methodReturnLength] == sizeof(id)) 
	{
		id result;
		result = methodFunction(target,selector,arg1,arg2);
		return result;
	}

	const char * retType = [methodSignature methodReturnType];
	char t = retType[0];
	switch(t)
	{
		case 'v':
			methodFunction(target,selector,arg1,arg2);
			return nil;
		case 'c':
		{
			char c;
			typedef char (*cIMP)(id, SEL, ...);
			c = ((cIMP)methodFunction)(target,selector,arg1,arg2);
			return [NSNumber numberWithChar:c];
		}
		case 'f':
		{
			float f;
			typedef float (*fIMP)(id, SEL, ...);
			f = ((fIMP)methodFunction)(target,selector,arg1,arg2);
			return [NSNumber numberWithFloat:f];
		}
		case 'i':
		{
			int i;
			typedef float (*iIMP)(id, SEL, ...);
			i = ((iIMP)methodFunction)(target,selector,arg1,arg2);
			return [NSNumber numberWithInt:i];
		}
		case 'd':
		{
			double d;
			typedef double (*dIMP)(id, SEL, ...);
			d = ((dIMP)methodFunction)(target,selector,arg1,arg2);
			return [NSNumber numberWithDouble:d];
		}
		case 'l':
		{
			long l;
			typedef long (*lIMP)(id, SEL, ...);
			l = ((lIMP)methodFunction)(target,selector,arg1,arg2);
			return [NSNumber numberWithLong:l];
		}
		case 'q':
		{
			long long l;
			typedef long long (*lIMP)(id, SEL, ...);
			l = ((lIMP)methodFunction)(target,selector,arg1,arg2);
			return [NSNumber numberWithLongLong:l];
		}
		case 'Q':
		{
			unsigned long long l;
			typedef unsigned long long (*lIMP)(id, SEL, ...);
			l = ((lIMP)methodFunction)(target,selector,arg1,arg2);
			return [NSNumber numberWithUnsignedLongLong:l];
		}
		default:
		{
			DeveloperLog(@"[ERROR] Unsupported primitive return type: %c for target:%@->%@",t,target,NSStringFromSelector(selector));
			break;
		}
	}
	
	return nil; 
}

- (TiValueRef)jsvalueForUndefinedKey:(NSString *)key
{
	if (![key isEqualToString:@"call"] && ![key isEqualToString:@"apply"]) {
		return NULL;
	}
	TiContextRef ctx = [context context];
	TiStringRef jsString = TiStringCreateWithCFString((CFStringRef) key);
	TiObjectRef jsFuncObject = TiObjectMakeFunctionWithCallback(ctx, jsString, KrollCallAsNamedFunction);
	TiStringRelease(jsString);
	return jsFuncObject;
}

@end