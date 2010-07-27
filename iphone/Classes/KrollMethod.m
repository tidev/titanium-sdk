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

TiClassRef KrollMethodClassRef = NULL;

TiValueRef KrollCallAsFunction(TiContextRef jsContext, TiObjectRef func, TiObjectRef thisObj, size_t argCount, const TiValueRef arguments[], TiValueRef* exception)
{
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
				[args addObject:value];
			}
		}
#if KMETHOD_DEBUG == 1
		NSDate *reftime = [NSDate date];
		NSLog(@"Invoking %@ with args: %@",o,args);
#endif
		id result = [o call:args];
#if KMETHOD_DEBUG == 1
		double elapsed = [[NSDate date] timeIntervalSinceDate:reftime];
		NSLog(@"Invoked %@ with result: %@ [took: %f]",o,result,elapsed);
#endif
		if (args!=nil) [args release];
		if (result==nil) return TiValueMakeNull(jsContext);
		return [KrollObject toValue:[o context] value:result];
	}
	@catch (NSException *ex) 
	{
#if KMETHOD_DEBUG == 1
		NSLog(@"[ERROR] method invoked exception: %@",ex);
#endif	
		*exception = [KrollObject toValue:[o context] value:ex];
	}
	return TiValueMakeUndefined(jsContext);
}

@implementation KrollMethod

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

#ifdef DEBUG
-(id)description
{
	return [NSString stringWithFormat:@"%@->%@ [%d]",target,NSStringFromSelector(selector),(int)type];
}
#endif

-(id)initWithTarget:(id)target_ selector:(SEL)selector_ argcount:(int)argcount_ type:(KrollMethodType)type_ name:(id)name_ context:(KrollContext*)context_;
{
	if (self = [super initWithTarget:target_ context:context_])
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
	[name release];
	[invoker release];
	[super dealloc];
}

-(id)call:(NSArray*)args
{
	// special property setter delegator against the target
	if (type == KrollMethodPropertySetter && [args count]==1)
	{
		[target setValue:[KrollObject nonNull:[args objectAtIndex:0]] forKey:name];
		return self;
	}
	// special property getter delegator against the target
	if (type == KrollMethodPropertyGetter)
	{
		// hold, see below
		return [target valueForKey:name];
	}
	
	// special generic factory for creating proxy objects for modules
	if (type == KrollMethodFactory)
	{
		if (imp==nil)
		{
			imp = [target methodForSelector:selector];
		}
		return imp(target,selector,args,name,context.delegate);
	}
	
	
	// create proxy method invocation
	NSMethodSignature *methodSignature = [target methodSignatureForSelector:selector];
	
	if (invoker==nil)
	{
		if (methodSignature==nil)
		{
			@throw [NSException exceptionWithName:@"org.appcelerator.kroll" reason:[NSString stringWithFormat:@"invalid method '%@'",NSStringFromSelector(selector)] userInfo:nil];
		}
		invoker = [NSInvocation invocationWithMethodSignature:methodSignature];
		[invoker setSelector:selector];
		[invoker setTarget:target];
		[invoker retain];
	}
	
	
	BOOL executionSet = NO;
	
	if ([target conformsToProtocol:@protocol(KrollTargetable)])
	{
		executionSet = YES;
		[target setExecutionContext:context.delegate];
	}
	
	int methodArgCount = [methodSignature numberOfArguments];
	
	if (methodArgCount > 0 && argcount > 0)
	{
		if (argcount==2 && methodArgCount==4)
		{
			id arg1 = [KrollObject nonNull:args==nil ? nil : [args objectAtIndex:0]];
			id arg2 = [KrollObject nonNull:[args count] > 1 ? [args objectAtIndex:1] : nil];
			[invoker setArgument:&arg1 atIndex:2];
			[invoker setArgument:&arg2 atIndex:3];
		}
		else
		{
			if (type == KrollMethodDynamicProxy)
			{
				[invoker setArgument:&name atIndex:2];
				[invoker setArgument:&args atIndex:3];
			}
			else if (type == KrollMethodSetter)
			{
				id arg = [KrollObject nonNull:[args count] == 1 ? [args objectAtIndex:0] : args];
				[invoker setArgument:&arg atIndex:2];
			}
			else if (args!=nil)
			{
				args = [KrollObject nonNull:args];
				[invoker setArgument:&args atIndex:2];
			}
			else if (args==nil)
			{
				[invoker setArgument:&args atIndex:2];
			}
		}
	}
	
	[invoker invoke];
	
	if (executionSet)
	{
		[target setExecutionContext:nil];
	}
	
	void* result = nil;
	
	if ([methodSignature methodReturnLength] == sizeof(id)) 
	{
		[invoker getReturnValue:&result];
		return result;
	}
	else 
	{
		const char * retType = [methodSignature methodReturnType];
		char t = retType[0];
		switch(t)
		{
			case 'v':
				return nil;
			case 'c':
			{
				char c;
				[invoker getReturnValue:&c];
				return [NSNumber numberWithChar:c];
			}
			case 'f':
			{
				float f;
				[invoker getReturnValue:&f];
				return [NSNumber numberWithFloat:f];
			}
			case 'i':
			{
				int i;
				[invoker getReturnValue:&i];
				return [NSNumber numberWithInt:i];
			}
			case 'd':
			{
				double d;
				[invoker getReturnValue:&d];
				return [NSNumber numberWithDouble:d];
			}
			case 'l':
			{
				long l;
				[invoker getReturnValue:&l];
				return [NSNumber numberWithLong:l];
			}
			case 'q':
			{
				long long l;
				[invoker getReturnValue:&l];
				return [NSNumber numberWithLongLong:l];
			}
			case 'Q':
			{
				unsigned long long l;
				[invoker getReturnValue:&l];
				return [NSNumber numberWithUnsignedLongLong:l];
			}
			default:
			{
				NSLog(@"[ERROR] unknown & unsupported primitive return type: %c for target:%@->%@",t,target,NSStringFromSelector(selector));
				break;
			}
		}
	}
	
	return nil; 
}

@end