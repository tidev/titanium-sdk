/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBindingRunLoop.h"

@interface TiBindingCallbackInvoke : NSObject
-(id)initWithCallback:(TiBindingCallback)ourCallback payload:(void*)ourPayload;
-(void)invoke:(TiBindingRunLoop)runLoop;
@end

@implementation TiBindingCallbackInvoke
{
	TiBindingCallback callback;
	void * payload;
}
-(id)initWithCallback:(TiBindingCallback)ourCallback payload:(void*)ourPayload
{
	if((self=[super init])){
		callback = ourCallback;
		payload = ourPayload;
	}
	return self;
}

-(void)invoke:(TiBindingRunLoop)runLoop
{
	callback(runLoop,payload);
}

@end

void TiBindingRunLoopEnqueue(TiBindingRunLoop runLoop, TiBindingCallback callback, void * payload)
{
	TiBindingCallbackInvoke * runCallback = [[TiBindingCallbackInvoke alloc] initWithCallback:callback payload:payload];
	[runLoop enqueue:runCallback];
	[runCallback release];
}
