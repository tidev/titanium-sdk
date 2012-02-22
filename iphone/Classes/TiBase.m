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
unsigned long long blockCounter = 0;

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

dispatch_group_t TiThreadBlocks;
pthread_mutex_t TiThreadBlockMutex;
pthread_cond_t TiThreadBlockCondition;

void TiThreadInitialize()
{
    TiThreadBlocks = dispatch_group_create();
    pthread_mutex_init(&TiThreadBlockMutex, NULL);
    pthread_cond_init(&TiThreadBlockCondition, NULL);
}

void TiThreadPerformOnMainThread(void (^mainBlock)(void), BOOL waitForFinish)
{
	BOOL alreadyOnMainThread = [NSThread isMainThread];
	BOOL usesWaitSemaphore = (waitForFinish && !alreadyOnMainThread);
    
	__block dispatch_semaphore_t waitSemaphore;
	if (usesWaitSemaphore) {
		waitSemaphore = dispatch_semaphore_create(0);
	}
	__block NSException * caughtException = nil;
    
	void (^wrapperBlock)(void) = ^{
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
    
    if (alreadyOnMainThread && waitForFinish) {
        // NOTE: Depending on system scheduling over GCD, this may lead to slight inefficiencies.
        // However this is preferable to deadlocks or other behavior that may result from 'waiting'
        // via an async until this block is finished or via other methods (such as with a manual queue).

        pthread_mutex_lock(&TiThreadBlockMutex);
        dispatch_group_enter(TiThreadBlocks);
        pthread_cond_broadcast(&TiThreadBlockCondition);
        pthread_mutex_unlock(&TiThreadBlockMutex);
        
        wrapperBlock();
        dispatch_group_leave(TiThreadBlocks);
    }
    else {
        pthread_mutex_lock(&TiThreadBlockMutex);
        dispatch_group_async(TiThreadBlocks, dispatch_get_main_queue(), wrapperBlock);
        pthread_cond_broadcast(&TiThreadBlockCondition);
        pthread_mutex_unlock(&TiThreadBlockMutex);
    }
    
    if (usesWaitSemaphore) { // Only waits for the single block; means everything prior was processed
        dispatch_time_t delay = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC); // 1s
        BOOL waiting = dispatch_semaphore_wait(waitSemaphore, delay);
        if (waiting) {
            NSLog(@"[WARN] Timing out waiting on main thread. Possibly a deadlock? %@",CODELOCATION);
            dispatch_semaphore_wait(waitSemaphore, DISPATCH_TIME_FOREVER);
        }
        dispatch_release(waitSemaphore);
    }
    
	if (caughtException != nil) {
		[caughtException autorelease];
		[caughtException raise];
	}
}

BOOL TiThreadProcessPendingMainThreadBlocks(NSTimeInterval timeout, BOOL doneWhenEmpty, void * reserved )
{
	struct timeval doneTime;
	gettimeofday(&doneTime, NULL);
	float timeoutSeconds = floorf(timeout);
	doneTime.tv_sec += (int)timeoutSeconds;
	doneTime.tv_usec += ((timeout - timeoutSeconds) * USEC_PER_SEC);
	if (doneTime.tv_usec >= USEC_PER_SEC) {
		doneTime.tv_usec -= USEC_PER_SEC;
		doneTime.tv_sec++;
	}
	
	BOOL shouldContinue = YES;
	BOOL isEmpty = NO;
    
	do {
        long dispatching = dispatch_group_wait(TiThreadBlocks, dispatch_time(DISPATCH_TIME_NOW, timeout*USEC_PER_SEC));
        isEmpty = (dispatching == 0);
                
		shouldContinue = !(doneWhenEmpty && isEmpty);
		if (shouldContinue) {
            struct timeval nowTime;
            gettimeofday(&nowTime, NULL);
            shouldContinue = timercmp(&nowTime, &doneTime, <);
        }
        
        if (shouldContinue && isEmpty) {
            struct timespec doneTimeSpec;
            TIMEVAL_TO_TIMESPEC(&doneTime,&doneTimeSpec);
            /*
             *	If we're told to loop despite there being nothing to loop, it
             *	is likely we're waiting for the background thread to request
             *	something. In this case, we should briefly sleep.
             */
            pthread_mutex_lock(&TiThreadBlockMutex);
            pthread_cond_timedwait(&TiThreadBlockCondition, &TiThreadBlockMutex, &doneTimeSpec);
            pthread_mutex_unlock(&TiThreadBlockMutex);
        }
	} while (shouldContinue);
    
	return isEmpty;
}
