/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

/**
 * Operation Queue is a utility class that provides a shared queue
 * that can be used to handle background jobs and after the jobs complete
 * can call a callback either on or off the main UI thread.
 */
@interface OperationQueue : NSObject {
	NSOperationQueue *queue;
}

/**
 Returns shared instance.
 @return The shared instance.
 */
+(OperationQueue*)sharedQueue;

/**
 Queues an operation.
 
 Queues an operation that targets selector on target
 invoke after (if not nil) on when completed
 pass YES to ui to invoke after on UI main thread
 @param selector The selector.
 @param target The target.
 @param arg The argument
 @param after The after selector.
 @param on The after target.
 @param ui The flag to invoke after on UI thread.
 */
-(void)queue:(SEL)selector target:(id)target arg:(id)arg after:(SEL)after on:(id)on ui:(BOOL)ui;

@end
