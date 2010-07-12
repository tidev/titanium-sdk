/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollCallback.h"
#import "KrollObject.h"

static NSMutableArray * callbacks;
static NSLock *callbackLock;

@interface KrollCallback()
@property(nonatomic,assign)KrollContext *context;
@end


@implementation KrollCallback

@synthesize context;

+(void)shutdownContext:(KrollContext*)context
{
	[callbackLock lock];
	for (KrollCallback *callback in callbacks)
	{
		if ([callback context]==context)
		{
			callback.context = nil;
		}
	}
	[callbackLock unlock];
}

-(id)initWithCallback:(TiValueRef)function_ thisObject:(TiObjectRef)thisObject_ context:(KrollContext*)context_
{
	if (self = [super init])
	{
		context = context_;
		jsContext = [context context];
		function = TiValueToObject(jsContext,function_,NULL);
		thisObj = thisObject_;
		TiValueProtect(jsContext, function);
		TiValueProtect(jsContext, thisObj);
		if (callbacks==nil)
		{
			callbackLock = [[NSLock alloc] init];
			callbacks = TiCreateNonRetainingArray();
		}
		[callbacks addObject:self];
	}
	return self;
}

-(void)dealloc
{
	[callbackLock lock];
	[callbacks removeObject:self];
	[callbackLock unlock];

	TiValueUnprotect(jsContext, function);
	TiValueUnprotect(jsContext, thisObj);
	function = NULL;
	thisObj = NULL;
	context = NULL;
	[super dealloc];
}

- (BOOL)isEqual:(id)anObject
{
	if (anObject == self)
	{
		return YES;
	}
	if (anObject == nil)
	{
		return NO;
	}
	if (function!=NULL && [anObject isKindOfClass:[KrollCallback class]])
	{
		TiObjectRef ref1 = function;
		TiObjectRef ref2 = [(KrollCallback*)anObject function];
		return TiValueIsStrictEqual(jsContext,ref1,ref2);
	}
	return NO;
}

-(void)call:(NSArray*)args thisObject:(id)thisObject_
{
	if (context==nil)
	{
		return;
	}
	
	[[context retain] autorelease];
	
	TiValueRef _args[[args count]];
	for (size_t c = 0; c < [args count]; c++)
	{
		_args[c] = [KrollObject toValue:context value:[args objectAtIndex:c]];
	}
	TiObjectRef tp = thisObj;
	TiValueRef top = NULL;
	if (thisObject_!=nil)
	{
		// hold the this reference until this thread completes
		[[thisObject_ retain] autorelease];
		// if we have a this pointer passed in, use it instead of the one we 
		// constructed this callback with -- nice for when you want to effectively
		// do fn.call(this,arg) or fn.apply(this,[args])
		//
		top = [KrollObject toValue:context value:thisObject_];
		tp = TiValueToObject(jsContext, top, NULL);
		TiValueProtect(jsContext,tp);
		TiValueProtect(jsContext,top);
	}
	TiValueRef exception = NULL;
	TiObjectCallAsFunction(jsContext,function,tp,[args count],_args,&exception);
	if (exception!=NULL)
	{
		NSLog(@"[WARN] Exception in event callback. %@",[KrollObject toID:context value:exception]);
	}
	if (top!=NULL)
	{
		TiValueUnprotect(jsContext,tp);
		TiValueUnprotect(jsContext,top);
	}
}

-(TiObjectRef)function
{
	return function;
}

-(KrollContext*)context
{
	return context;
}

@end
