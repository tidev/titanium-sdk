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

-(void)invoke
{
	TiValueRef exception = NULL;
	TiObjectCallAsFunction(context,function,jsThis,0,NULL,&exception);
	if (exception!=NULL)
	{
		id excm = [KrollObject toID:kroll value:exception];
		NSLog(@"[ERROR] While executing Timer, received script error. '%@'",[TiUtils exceptionMessage:excm]);
	}
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
	
	NSCondition *invokeCond = [[NSCondition alloc] init];

	NSDate *date = [NSDate dateWithTimeIntervalSinceNow:duration/1000];
	
	while(1)
	{
		// wait until we're signaled or we timeout
		[condition lock];
		[condition waitUntilDate:date];
		[condition unlock];

		// calculate the next interval before execution so we exclude it's time
		date = [NSDate dateWithTimeIntervalSinceNow:duration/1000];
		
		// push the invocation to happen on the context thread
		[kroll invokeOnThread:self method:@selector(invoke) withObject:nil condition:invokeCond];

		[invokeCond lock];
		[invokeCond wait];
		[invokeCond unlock];

		// if we're on time (a timer), just stop
		// we always check for stopped after the timer fires just in
		// case it's started and stopped immediately but ready to go
		if (onetime || stopped) break;
	}
	
	[invokeCond release];
	
	TiValueUnprotect(context, function);
	TiValueUnprotect(context, jsThis);
	
	[self cancel];
	
	// release our own reference
	[self autorelease];
	
	[pool release];
}

@end
