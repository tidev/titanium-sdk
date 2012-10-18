/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollTimer.h"
#import "KrollContext.h"
#import "KrollObject.h"
#import "TiUtils.h"
#import "TiBase.h"
#import "TiExceptionHandler.h"

@implementation KrollTimer

-(id)initWithContext:(TiContextRef)context_ function:(TiValueRef)function_ jsThis:(TiObjectRef)jsThis_ duration:(double)duration_ onetime:(BOOL)onetime_ kroll:(KrollContext*)kroll_ timerId:(double)timerId_
{
	if (self = [super init])
	{
		context = context_; //don't retain
		onetime = onetime_;
		duration = duration_;
		stopped = YES;
		timerId = timerId_;
		jsThis = TiValueToObject(context,jsThis_,NULL);
		function = TiValueToObject(context,function_,NULL);
		condition = [[NSCondition alloc] init];
		TiValueProtect(context, function);
		TiValueProtect(context, jsThis);
		kroll = [kroll_ retain];
	}
	return self;
}

-(void)dealloc
{
	[condition release];
	[kroll release];
	[super dealloc];
}

-(void)start
{
	if (stopped)
	{
		stopped = NO;
		[NSThread detachNewThreadSelector:@selector(main) toTarget:self withObject:nil];
	}
}

-(void)cancel
{
	if (stopped==NO)
	{
		stopped = YES;
		[condition lock];
		[condition signal];
		[condition unlock];
	}
	[kroll unregisterTimer:timerId];
}

-(void)invokeWithCondition:(NSConditionLock *)invokeCond
{
	[invokeCond lockWhenCondition:0];
	TiValueRef exception = NULL;
	TiObjectCallAsFunction(context,function,jsThis,0,NULL,&exception);
	if (exception!=NULL)
	{
		id excm = [KrollObject toID:kroll value:exception];
		TiScriptError *scriptError = nil;
		if ([excm isKindOfClass:[NSDictionary class]]) {
			scriptError = [[TiScriptError alloc] initWithDictionary:excm];
		} else {
			scriptError = [[TiScriptError alloc] initWithMessage:[excm description] sourceURL:nil lineNo:0];
		}
		[[TiExceptionHandler defaultExceptionHandler] reportScriptError:scriptError];
	}
	[invokeCond unlockWithCondition:1];
}

-(NSString*)description
{
	return [NSString stringWithFormat:@"KrollTimer<%d>",[self hash]];
}

-(void)main
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	
	// we need to retain a reference to ourselves while the timer is 
	// active otherwise we'll get garbage collected by context and 
	// timer will stop
	[self retain];
	
	NSConditionLock *invokeCond = [[NSConditionLock alloc] initWithCondition:0];

	NSDate *date = [[NSDate alloc] initWithTimeIntervalSinceNow:duration/1000];
	
	while(1)
	{
		// wait until we're signaled or we timeout
		[condition lock];
		[condition waitUntilDate:date];
		[condition unlock];

		// Always break if stopped; it means we were cancelled.  Even if started and then immediately
		// stopped, this is the behavior we want.
		if (stopped) break;

		NSAutoreleasePool *loopPool = [[NSAutoreleasePool alloc] init];
		
		// calculate the next interval before execution so we exclude it's time
		[date release];
		date = [[NSDate alloc] initWithTimeIntervalSinceNow:duration/1000];

		// push the invocation to happen on the context thread
		[kroll invokeOnThread:self method:@selector(invokeWithCondition:) withObject:invokeCond condition:nil];

		[loopPool release];
		[invokeCond lockWhenCondition:1];
		[invokeCond unlockWithCondition:0];

		// if we only fire once, stop now; otherwise, we keep looping through until cancelled.
		if (onetime) break;
	}
	
	[invokeCond release];
	[date release];
	
	TiValueUnprotect(context, function);
	TiValueUnprotect(context, jsThis);
	
	[self cancel];
	
	// release our own reference
	[self autorelease];
	
	[pool release];
}

@end
