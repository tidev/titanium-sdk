/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollCallback.h"
#import "KrollBridge.h"
#import "KrollObject.h"
#import "TiExceptionHandler.h"

static NSMutableArray * callbacks;
static NSLock *callbackLock;

@interface KrollCallback()
@property(nonatomic,assign)KrollContext *context;
@end


@implementation KrollCallback

@synthesize context, type;

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

+(void)initialize
{
	if (callbacks==nil)
	{
		callbackLock = [[NSLock alloc] init];
		callbacks = TiCreateNonRetainingArray();
	}
}

-(id)initWithCallback:(TiValueRef)function_ thisObject:(TiObjectRef)thisObject_ context:(KrollContext*)context_
{
	if (self = [super init])
	{
		context = context_;
		bridge = (KrollBridge *)[context_ delegate];
		jsContext = [context context];
		function = TiValueToObject(jsContext,function_,NULL);
		thisObj = thisObject_;
		TiValueProtect(jsContext, function);
		TiValueProtect(jsContext, thisObj);
		contextLock = [[NSLock alloc] init];
		[callbacks addObject:self];
	}
	return self;
}

-(void)dealloc
{
	[callbackLock lock];
	[callbacks removeObject:self];
	[callbackLock unlock];

	[type release];
	[contextLock release];
	if ([KrollBridge krollBridgeExists:bridge])
	{
		if ([context isKJSThread])
		{
			TiValueUnprotect(jsContext, function);
			TiValueUnprotect(jsContext, thisObj);
		}
		else
		{
			KrollUnprotectOperation * delayedUnprotect = [[KrollUnprotectOperation alloc]
					initWithContext:jsContext withJsobject:function andJsobject:thisObj];
			[context enqueue:delayedUnprotect];
			[delayedUnprotect release];
		}
	}
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
	if ((anObject == nil) || ![anObject isKindOfClass:[KrollCallback class]])
	{
		return NO;
	}
	KrollCallback *otherCallback = (KrollCallback*)anObject;
	if (function!=NULL)
	{	//TODO: Is there ever two functions with diffent memory pointers
	// that represent the exact same function? I'm thinking not.
		TiObjectRef ref1 = function;
		TiObjectRef ref2 = [otherCallback function];
		return (ref2 == ref1);
	}
	return NO;
}

-(id)call:(NSArray*)args thisObject:(id)thisObject_
{
	[contextLock lock];
	if (context==nil)
	{
		[contextLock unlock];
		return nil;
	}
	
	[context retain];
	
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
	TiValueRef retVal = TiObjectCallAsFunction(jsContext,function,tp,[args count],_args,&exception);
	if (exception!=NULL)
	{
		id excm = [KrollObject toID:context value:exception];
		TiScriptError *scriptError = nil;
		if ([excm isKindOfClass:[NSDictionary class]]) {
			scriptError = [[TiScriptError alloc] initWithDictionary:excm];
		} else {
			scriptError = [[TiScriptError alloc] initWithMessage:[excm description] sourceURL:nil lineNo:0];
		}
		[[TiExceptionHandler defaultExceptionHandler] reportScriptError:scriptError];
	}
	if (top!=NULL)
	{
		TiValueUnprotect(jsContext,tp);
		TiValueUnprotect(jsContext,top);
	}
	
	id val = [KrollObject toID:context value:retVal];
	[context release];
	[contextLock unlock];
	return val;
}

-(TiObjectRef)function
{
	return function;
}

-(KrollContext*)context
{
	return context;
}

-(void)setContext:(KrollContext*)context_
{
	[contextLock lock];
	context = context_;
	[contextLock unlock];
}

@end

@implementation KrollWrapper
@synthesize jsobject, bridge;

/*	NOTE:
 *	Until KrollWrapper takes a more expanded role as a general purpose wrapper,
 *	protectJsobject is to be used during commonJS inclusion ONLY.
 *	For example, KrollBridge ensures that this is only done in the JS thread,
 *	and unlike KrollObject, KrollWrapper does not have the infrastructure to
 *	handle being called outside the JS.
 *	Furthermore, KrollWrapper does not get notified of JSObject finalization,
 *	etc, etc. The specific cases where KrollWrapper is currently used do not
 *	make this an issue, but KrollWrapper needs hardening if it is to be a base
 *	class.
 */

- (void)dealloc {
	if (protecting) {
		[self unprotectJsobject];
	}
    [super dealloc];
}

-(void)protectJsobject
{
	if (protecting || ![KrollBridge krollBridgeExists:bridge])
	{
		return;
	}

	if (![[bridge krollContext] isKJSThread])
	{
		DeveloperLog(@"[WARN] KrollWrapper trying to protect in the wrong thread.%@",CODELOCATION);
		return;
	}
	protecting = YES;
	TiValueProtect([[bridge krollContext] context],jsobject);
}

-(void)unprotectJsobject
{
	if (!protecting || ![KrollBridge krollBridgeExists:bridge])
	{
		return;
	}
	
	if (![[bridge krollContext] isKJSThread])
	{
		DeveloperLog(@"[WARN] KrollWrapper trying to unprotect in the wrong thread.%@",CODELOCATION);
		return;
	}
	protecting = NO;
	TiValueUnprotect([[bridge krollContext] context],jsobject);
}

- (void)replaceValue:(id)value forKey:(NSString*)key notification:(BOOL)notify
{	/*
	 *	This is to be used ONLY from KrollBridge's require call, due to some
	 *	JS files assigning exports to a function instead of a standard
	 *	JS object.
	 */
	KrollContext * context = [bridge krollContext];
	TiValueRef valueRef = [KrollObject toValue:context value:value];
	TiStringRef keyRef = TiStringCreateWithCFString((CFStringRef) key);
	TiObjectSetProperty([context context], jsobject, keyRef, valueRef, kTiPropertyAttributeReadOnly, NULL);
	TiStringRelease(keyRef);
}

@end
