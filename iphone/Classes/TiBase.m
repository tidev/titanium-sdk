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
#include <pthread.h>
#include <sys/time.h>

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
	if (TiExceptionIsSafeOnMainThread || ![NSThread isMainThread]) {
		@throw [NSException exceptionWithName:exceptionName reason:message userInfo:nil];
	}
}

void TiThreadReleaseOnMainThread(id releasedObject,BOOL waitForFinish)
{
	if (releasedObject == nil) {
		return;
	}
	if ([NSThread isMainThread]) {
		[releasedObject release];
	}
	else
	{
		TiThreadPerformOnMainThread(^{[releasedObject release];}, waitForFinish);
	}
}

void TiThreadRemoveFromSuperviewOnMainThread(UIView* view,BOOL waitForFinish)
{
	if (view == nil) {
		return;
	}
	if ([NSThread isMainThread]) {
		[view removeFromSuperview];
	}
	else
	{
		TiThreadPerformOnMainThread(^{[view removeFromSuperview];}, waitForFinish);
	}
}


NSMutableArray * TiThreadBlockQueue = nil;
pthread_mutex_t TiThreadBlockMutex;
pthread_cond_t TiThreadBlockCondition;

void TiThreadInitalize()
{
	pthread_mutex_init(&TiThreadBlockMutex,NULL);
    pthread_cond_init(&TiThreadBlockCondition, NULL);
	TiThreadBlockQueue = [[NSMutableArray alloc] initWithCapacity:10];
}

void TiThreadPerformOnMainThread(void (^mainBlock)(void),BOOL waitForFinish)
{
	BOOL alreadyOnMainThread = [NSThread isMainThread];
	BOOL usesWaitSemaphore = waitForFinish && !alreadyOnMainThread;
	__block dispatch_semaphore_t waitSemaphore;
	if (usesWaitSemaphore) {
		waitSemaphore = dispatch_semaphore_create(0);
	}
	__block NSException * caughtException = nil;
	void (^wrapperBlock)() = ^{
		BOOL exceptionsWereSafe = TiExceptionIsSafeOnMainThread;
		TiExceptionIsSafeOnMainThread = YES;
		@try {
			mainBlock();
		}
		@catch (NSException *exception) {
			if (waitForFinish && (!alreadyOnMainThread || exceptionsWereSafe)) {
				caughtException = [exception retain];
			}
		}
		TiExceptionIsSafeOnMainThread = exceptionsWereSafe;
		if (usesWaitSemaphore) {
			dispatch_semaphore_signal(waitSemaphore);
		}
	};
	void (^wrapperBlockCopy)() = [wrapperBlock copy];
	
	
	pthread_mutex_lock(&TiThreadBlockMutex);
		if (!alreadyOnMainThread || !waitForFinish) {
			[TiThreadBlockQueue addObject:wrapperBlockCopy];
		}
    pthread_cond_signal(&TiThreadBlockCondition);
    pthread_mutex_unlock(&TiThreadBlockMutex);
	
	if (alreadyOnMainThread) {
		// In order to maintain serial consistency, we have to stand in line
		BOOL finished = TiThreadProcessPendingMainThreadBlocks(0.1, YES, nil);
		if(waitForFinish)
		{
			//More or less. If things took too long, we cut.
			wrapperBlockCopy();
		}
		[wrapperBlockCopy release];
		if (caughtException != nil) {
			[caughtException autorelease];
			NSLog(@"[ERROR] %@",[caughtException reason]);
			if (TiExceptionIsSafeOnMainThread) {
				@throw caughtException;
			}
		}
		return;
	}

	dispatch_block_t dispatchedMainBlock = (dispatch_block_t)^(){
		TiThreadProcessPendingMainThreadBlocks(10.0, YES, nil);
	};
	dispatch_async(dispatch_get_main_queue(), (dispatch_block_t)dispatchedMainBlock);
	if (waitForFinish)
	{
		/*
		 *	The reason we use a semaphore instead of simply calling the block sychronously
		 *	is that it is possible that a previous dispatchedMainBlock (Or manual call of
		 *	TiThreadProcessPendingMainThreadBlocks) processes the 
		 */
		dispatch_time_t oneSecond = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC);
		BOOL waiting = dispatch_semaphore_wait(waitSemaphore, oneSecond);
		if (waiting) {
			NSLog(@"[WARN] Timing out waiting on main thread. Possibly a deadlock? %@",CODELOCATION);
			dispatch_semaphore_wait(waitSemaphore, DISPATCH_TIME_FOREVER);
		}
		dispatch_release(waitSemaphore);
	}
	[wrapperBlockCopy release];
	if (caughtException != nil) {
		[caughtException autorelease];
		[caughtException raise];
	}
}

BOOL TiThreadProcessPendingMainThreadBlocks(NSTimeInterval timeout, BOOL doneWhenEmpty, void (^continueCallback)(BOOL *) )
{
	struct timeval doneTime;
	gettimeofday(&doneTime, NULL);
	float timeoutSeconds = floorf(timeout);
	doneTime.tv_usec += ((timeout - timeoutSeconds) * USEC_PER_SEC);
	if (doneTime.tv_usec >= USEC_PER_SEC) {
		doneTime.tv_usec -= USEC_PER_SEC;
		doneTime.tv_sec += 1 + (int)timeoutSeconds;
	}
	else {
		doneTime.tv_sec += (int)timeoutSeconds;
	}
	
	BOOL shouldContinue = YES;
	BOOL isEmpty = NO;
	do {
		void (^thisAction)(void) = nil;
		
		pthread_mutex_lock(&TiThreadBlockMutex);
			isEmpty = [TiThreadBlockQueue count] <= 0;
			if (!isEmpty) {
				thisAction = [[TiThreadBlockQueue objectAtIndex:0] retain];
				[TiThreadBlockQueue removeObjectAtIndex:0];
			}
		pthread_mutex_unlock(&TiThreadBlockMutex);
		
		if (thisAction != nil) {
			NSAutoreleasePool * smallPool = [[NSAutoreleasePool alloc] init];
			thisAction();
			[thisAction release];
			[smallPool release];
		}
		//It's entirely possible that the action itself caused more entries.

		pthread_mutex_lock(&TiThreadBlockMutex);
			isEmpty = [TiThreadBlockQueue count] <= 0;
			shouldContinue = !(doneWhenEmpty && isEmpty);
			if (shouldContinue) {
				struct timeval nowTime;
				gettimeofday(&nowTime, NULL);
				shouldContinue = timercmp(&nowTime, &doneTime, <);
			}
			
			if (continueCallback != NULL) { //continueCallback can override anything.
				continueCallback(&shouldContinue);
			}
			if (shouldContinue && isEmpty) {
				struct timespec doneTimeSpec;
				TIMEVAL_TO_TIMESPEC(&doneTime,&doneTimeSpec);
				/*
				 *	If we're told to loop despite there being nothing to loop, it
				 *	is likely we're waiting for the background thread to request
				 *	something. In this case, we should briefly sleep.
				 */
				pthread_cond_timedwait(&TiThreadBlockCondition, &TiThreadBlockMutex, &doneTimeSpec);
			}
		pthread_mutex_unlock(&TiThreadBlockMutex);

	} while (shouldContinue);
	return isEmpty;
}
