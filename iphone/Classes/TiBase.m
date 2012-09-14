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

#if DEBUG

#include <assert.h>
#include <stdbool.h>
#include <sys/types.h>
#include <unistd.h>
#include <sys/sysctl.h>

#endif

static bool ApplicationBeingDebugged(void)
// Returns true if the current process is being debugged (either
// running under the debugger or has a debugger attached post facto).
{
#if TARGET_IPHONE_SIMULATOR
    return 1;
#elif DEBUG
    int                 junk;
    int                 mib[4];
    struct kinfo_proc   info;
    size_t              size;
    
    // Initialize the flags so that, if sysctl fails for some bizarre
    // reason, we get a predictable result.
    
    info.kp_proc.p_flag = 0;
    
    // Initialize mib, which tells sysctl the info we want, in this case
    // we're looking for information about a specific process ID.
    
    mib[0] = CTL_KERN;
    mib[1] = KERN_PROC;
    mib[2] = KERN_PROC_PID;
    mib[3] = getpid();
    
    // Call sysctl.
    
    size = sizeof(info);
    junk = sysctl(mib, sizeof(mib) / sizeof(*mib), &info, &size, NULL, 0);
    if(junk != 0){
        return 0;
    }
    // We're being debugged if the P_TRACED flag is set.
    return ( (info.kp_proc.p_flag & P_TRACED) != 0 );
#else
    return 0;
#endif
}

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
        
        if (ApplicationBeingDebugged()) {
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
        else{
#pragma push
#undef NSLog
            NSLog(@"%@",message);
#pragma pop
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
NSString * const kTiPausedNotification = @"TiPaused";
NSString * const kTiResumeNotification = @"TiResume";
NSString * const kTiResumedNotification = @"TiResumed";
NSString * const kTiAnalyticsNotification = @"TiAnalytics";
NSString * const kTiRemoteDeviceUUIDNotification = @"TiDeviceUUID";
NSString * const kTiGestureShakeNotification = @"TiGestureShake";
NSString * const kTiRemoteControlNotification = @"TiRemoteControl";

NSString * const kTiLocalNotification = @"TiLocalNotification";

NSString* const kTiBehaviorSize = @"SIZE";
NSString* const kTiBehaviorFill = @"FILL";
NSString* const kTiBehaviorAuto = @"auto";
NSString* const kTiUnitPixel = @"px";
NSString* const kTiUnitCm = @"cm";
NSString* const kTiUnitMm = @"mm";
NSString* const kTiUnitInch = @"in";
NSString* const kTiUnitDip = @"dip";
NSString* const kTiUnitDipAlternate = @"dp";
NSString* const kTiUnitSystem = @"system";
NSString* const kTiUnitPercent = @"%";




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
        __block id blockVar = releasedObject;
		TiThreadPerformOnMainThread(^{[blockVar release];}, waitForFinish);
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
        __block UIView* blockVar = view;
		TiThreadPerformOnMainThread(^{[blockVar removeFromSuperview];}, waitForFinish);
	}
}

// NOTE: This method of batch-processing is actually fairly expensive
// for us, and doesn't take full advantage of GCD scheduling (and requires
// lots of mutexing). Unfortunately for now it seems to be necessary, as:
// * We are required to complete all scheduled main thread GCD operations
//   as "suspend" is fired

// There may be other ways to do this (dispatch source on the main loop that
// pulls from a private queue, for example) but in and of itself this could be
// expensive (still have to semaphore the queue) and requires further research.

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
	
    
    // If we're on the main thread and required to wait for completion, just
    // run the block immediately. This behavior is consistent with
    // -[NSObject performSelectorOnMainThread:withObject:waitUntilDone:], which
    // our code may currently rely on the assumptions for.
    
    if (alreadyOnMainThread && waitForFinish) {
        wrapperBlock();

        if (caughtException != nil) {
            [caughtException autorelease];
            [caughtException raise];
        }
        
        return;
    }
    
	void (^wrapperBlockCopy)() = [wrapperBlock copy];
	
	pthread_mutex_lock(&TiThreadBlockMutex);
    [TiThreadBlockQueue addObject:wrapperBlockCopy];
    pthread_cond_signal(&TiThreadBlockCondition);
    pthread_mutex_unlock(&TiThreadBlockMutex);
	
	dispatch_block_t dispatchedMainBlock = (dispatch_block_t)^(){
		TiThreadProcessPendingMainThreadBlocks(0.0, YES, nil);
	};
    
    dispatch_async(dispatch_get_main_queue(), dispatchedMainBlock);
    
    if (waitForFinish)
    {
        /*
         *	The reason we use a semaphore instead of simply calling the block sychronously
         *	is that it is possible that a previous dispatchedMainBlock (Or manual call of
         *	TiThreadProcessPendingMainThreadBlocks) processes the wrapperBlockCopy we
         *	care about. In other words, sychronously waiting will lead to the thread
         *	blocking much longer than necessary, especially during the shutdown sequence.
         */
        dispatch_time_t oneSecond = dispatch_time(DISPATCH_TIME_NOW, NSEC_PER_SEC);
        BOOL waiting = dispatch_semaphore_wait(waitSemaphore, oneSecond);
        if (waiting) {
            DeveloperLog(@"[WARN] Timing out waiting on main thread. Possibly a deadlock? %@",CODELOCATION);
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
//Initializing krollContextCounter to zero.
int krollContextCounter = 0;

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
			
			if (shouldContinue && isEmpty && (krollContextCounter >0)) {
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
	} while (shouldContinue && (krollContextCounter >0));
	return isEmpty;
}

//KrollCounter Helper function

void incrementKrollCounter(){
    OSAtomicIncrement32Barrier(&krollContextCounter);
}

void decrementKrollCounter(){
    
    int currentContextCount = OSAtomicDecrement32Barrier(&krollContextCounter);
    if(currentContextCount == 0)
    {
        pthread_mutex_lock(&TiThreadBlockMutex);
        pthread_cond_signal(&TiThreadBlockCondition);
        pthread_mutex_unlock(&TiThreadBlockMutex);
    }
}
