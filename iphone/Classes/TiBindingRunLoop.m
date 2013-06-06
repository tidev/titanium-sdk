/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBindingRunLoop.h"
#import <libkern/OSAtomic.h>

typedef struct TiCallbackPayloadStruct *TiCallbackPayloadNode;

struct TiCallbackPayloadStruct{
	TiBindingCallback callback;
	void * payload;
	TiCallbackPayloadNode next;
};

TiCallbackPayloadNode TiCallbackPayloadCreate(TiBindingCallback callback, void * payload)
{
	TiCallbackPayloadNode newPair = malloc(sizeof(struct TiCallbackPayloadStruct));
	newPair->callback = callback;
	newPair->payload = payload;
	newPair->next = NULL;
	return newPair;
}



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





void TiCallbackPayloadAppendList(TiCallbackPayloadNode * queue, TiCallbackPayloadNode newPair)
{
	while (!OSAtomicCompareAndSwapPtrBarrier(NULL,newPair,(volatile void*)queue))
	{
		queue = &((*queue)->next);
	}
}


TiCallbackPayloadNode RunLoopCallOnStartQueue = NULL;

void TiBindingRunLoopCallOnStart(TiBindingCallback callback, void * payload)
{
	TiCallbackPayloadAppendList(&RunLoopCallOnStartQueue, TiCallbackPayloadCreate(callback, payload));
}

void TiBindingRunLoopAnnounceStart(TiBindingRunLoop runLoop)
{
	TiCallbackPayloadNode queue = RunLoopCallOnStartQueue;
	while (queue != NULL) {
		(queue->callback)(runLoop,(queue->payload));
		queue = queue->next;
	}
}
