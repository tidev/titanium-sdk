/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiApp.h"
#import "TiDebugger.h"

#include <stdarg.h>
#include <libkern/OSAtomic.h>

NSMutableArray* TiCreateNonRetainingArray() 
{
	CFArrayCallBacks callbacks = kCFTypeArrayCallBacks;
	callbacks.retain = NULL;
	callbacks.release = NULL;
	return (NSMutableArray*)CFArrayCreateMutable(nil, 0, &callbacks);
}

NSMutableDictionary* TiCreateNonRetainingDictionary() 
{
	CFDictionaryKeyCallBacks keyCallbacks = kCFTypeDictionaryKeyCallBacks;
	CFDictionaryValueCallBacks callbacks = kCFTypeDictionaryValueCallBacks;
	callbacks.retain = NULL;
	callbacks.release = NULL;
	return (NSMutableDictionary*)CFDictionaryCreateMutable(nil, 0, &keyCallbacks, &callbacks);
}

CGPoint midpointBetweenPoints(CGPoint a, CGPoint b) 
{
    CGFloat x = (a.x + b.x) / 2.0;
    CGFloat y = (a.y + b.y) / 2.0;
    return CGPointMake(x, y);
}

void TiLogMessage(NSString* str, ...) {
    va_list args;
    va_start(args, str);
    
    NSString* message = [[NSString alloc] initWithFormat:str arguments:args];
    if ([[TiApp app] debugMode]) {
        TiDebuggerLogMessage(OUT, message);
    }
    else {
        const char* s = [message UTF8String];
        if (s[0]=='[')
        {
            fprintf(stderr,"%s\n", s);
            fflush(stderr);
        }
        else
        {
            fprintf(stderr,"[DEBUG] %s\n", s);
            fflush(stderr);
        }
    }

    [message release];
}

NSString * const kTiASCIIEncoding = @"ascii";
NSString * const kTiISOLatin1Encoding = @"ios-latin-1";
NSString * const kTiUTF8Encoding = @"utf8";
NSString * const kTiUTF16Encoding = @"utf16";
NSString * const kTiUTF16LEEncoding = @"utf16le";
NSString * const kTiUTF16BEEncoding = @"utf16be";

NSString * const kTiByteTypeName = @"byte";
NSString * const kTiShortTypeName = @"short";
NSString * const kTiIntTypeName = @"int";
NSString * const kTiLongTypeName = @"long";
NSString * const kTiFloatTypeName = @"float";
NSString * const kTiDoubleTypeName = @"double";

NSString * const kTiContextShutdownNotification = @"TiContextShutdown";
NSString * const kTiWillShutdownNotification = @"TiWillShutdown";
NSString * const kTiShutdownNotification = @"TiShutdown";
NSString * const kTiSuspendNotification = @"TiSuspend";
NSString * const kTiResumeNotification = @"TiResume";
NSString * const kTiResumedNotification = @"TiResumed";
NSString * const kTiAnalyticsNotification = @"TiAnalytics";
NSString * const kTiRemoteDeviceUUIDNotification = @"TiDeviceUUID";
NSString * const kTiGestureShakeNotification = @"TiGestureShake";
NSString * const kTiRemoteControlNotification = @"TiRemoteControl";

NSString * const kTiLocalNotification = @"TiLocalNotification";

BOOL TiExceptionIsSafeOnMainThread = NO;

void TiExceptionThrowWithNameAndReason(NSString * exceptionName, NSString * message)
{
	NSLog(@"[ERROR] %@",message);
	if (TiExceptionIsSafeOnMainThread || ([NSThread isMainThread]==NO)) {
		@throw [NSException exceptionWithName:exceptionName reason:message userInfo:nil];
	}	
}

NSMutableArray * TiThreadBlockQueue = nil;
OSSpinLock TiThreadSpinLock = OS_SPINLOCK_INIT;


void TiThreadProcessPendingMainThreadBlocks(NSTimeInterval duration, BOOL untilEmpty, void (^isDoneBlock)(BOOL *) )
{
	NSTimeInterval doneTime = [NSDate timeIntervalSinceReferenceDate] + duration;
	BOOL shouldContinue = YES;
	do {
		int queueCount;
		void (^thisAction)(void) = nil;

		OSSpinLockLock(&TiThreadSpinLock);
		queueCount = [TiThreadBlockQueue count];
		if (queueCount > 0) {
			thisAction = [[TiThreadBlockQueue objectAtIndex:0] retain];
			[TiThreadBlockQueue removeObjectAtIndex:0];
		}
		OSSpinLockUnlock(&TiThreadSpinLock);
		
		if (thisAction != nil) {
			thisAction();
			[thisAction release];
		}
		
		shouldContinue = [NSDate timeIntervalSinceReferenceDate] >= doneTime;
		if (shouldContinue && untilEmpty) {	// If empty, exit beforehand.
			shouldContinue = queueCount > 0;
		}
		if (isDoneBlock != NULL) { //isDoneBlock can override anything.
			isDoneBlock(&shouldContinue);
		}
		if (shouldContinue && (queueCount <= 0)) {
			/*
			 *	If we're told to loop despite there being nothing to loop, it
			 *	is likely we're waiting for the background thread to request
			 *	something. In this case, we should briefly sleep.
			 */
			[NSThread sleepForTimeInterval:0.01];
		}
	} while (shouldContinue);
}

void TiThreadPerformOnMainThread(void (^mainBlock)(void),BOOL waitForFinish)
{
	//Set up the block that actuall will be executed (Which includes exception abilities)
	__block NSException * caughtException = nil;
	__block BOOL finished = NO;
	void (^wrapperBlock)() = ^{
		BOOL exceptionsWereSafe = TiExceptionIsSafeOnMainThread;
		TiExceptionIsSafeOnMainThread = YES;
		@try {
			mainBlock();
		}
		@catch (NSException *exception) {
			if (waitForFinish) {
				caughtException = [exception retain];
			}
		}
		TiExceptionIsSafeOnMainThread = exceptionsWereSafe;
		finished = YES;
	};
	wrapperBlock = [[wrapperBlock copy] autorelease];
	//Add to the block queue
	int queueCount;
	OSSpinLockLock(&TiThreadSpinLock);
	queueCount = [TiThreadBlockQueue count];
	if (TiThreadBlockQueue == nil)
	{
		TiThreadBlockQueue = [[NSMutableArray alloc] initWithObjects:wrapperBlock, nil];
	}
	else
	{
		[TiThreadBlockQueue addObject:wrapperBlock];
	}
	OSSpinLockUnlock(&TiThreadSpinLock);

	/*
	 *	Event coalescing trick:
	 *	If the queueCount was 0, that means that there was likely no other
	 *	dispatches in line. As such, we take the main queue and wait 10 ms
	 *	in case others are also lining up. In this way, we can handle multiple
	 *	blocks at the same time.
	 *
	 *	If we were NOT first in line when we prepared in the background,
	 *	we run through the process without waiting. In the case where
	 *	all blocks were processed (including our own) beforehand, the
	 *	process function flows quickly out, no harm done. In the case
	 *	where the previous in line finished before it got to our block,
	 *	ThreadProcess will do the right thing.
	 */
	__block BOOL processingDone = NO;
	dispatch_async(dispatch_get_main_queue(), (dispatch_block_t)^(){
		if (queueCount <= 0) {
			[NSThread sleepForTimeInterval:0.01];
		}
		TiThreadProcessPendingMainThreadBlocks(0.1, YES, nil);
		processingDone = YES;
	});

	/*
	 *	We can't dispatch_sync in the rare case of deadlock
	 *	or hung action. Instead, we patiently wait for up to 100ms
	 *	before resuming our background thread which hopefully
	 *	will break the deadlock.
	 *
	 *	It's been untested, but theoretically possible that breaking the
	 *	deadlock and there being a caughtException may leak, or worse,
	 *	write to somewhere unexpected. The deadlock break is not 100% safe,
	 *	and is a last-ditch effort. TODO: Perhaps a stronger message than WARN?
	 */
	while(waitForFinish && !finished)
	{
		[NSThread sleepForTimeInterval:0.01];
		if (processingDone && !finished) {
			NSLog(@"[WARN] Timed out waiting for action on main thread to complete.");
		}
	}
	
	if (caughtException != nil) {
		[caughtException autorelease];
		[caughtException raise];
	}
}
