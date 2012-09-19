/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBindingRunLoop.h"

void TiBindingRunLoopEnqueue(TiBindingRunLoop runLoop, TiBindingCallback callback, void * payload)
{
	NSOperation * runCallback = [NSBlockOperation blockOperationWithBlock:^(){callback(runLoop,payload);}];
	[runLoop enqueue:runCallback];
}
