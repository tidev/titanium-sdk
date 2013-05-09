/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiLayoutQueue.h"
#import "TiViewProxy.h"
#import <CoreFoundation/CoreFoundation.h>
#import <pthread.h>

#define LAYOUT_TIMER_INTERVAL	0.05
#define LAYOUT_START_INTERVAL	0.01


NSMutableArray * layoutArray = nil;
CFRunLoopTimerRef layoutTimer = NULL;
pthread_mutex_t layoutMutex;


void performLayoutRefresh(CFRunLoopTimerRef timer, void *info)
{
	NSArray* localLayoutArray = nil;
	
	// This prevents deadlock if, while laying out, a relayout is requested
	// (as in the case of redrawing text in a reproxy)
	pthread_mutex_lock(&layoutMutex);
	localLayoutArray = layoutArray;
	layoutArray = nil;

	if ((layoutTimer != NULL) && ([localLayoutArray count]==0))
	{
		//Might as well stop the timer for now.
		CFRunLoopTimerInvalidate(layoutTimer);
		CFRelease(layoutTimer);
		layoutTimer = NULL;
	}

	pthread_mutex_unlock(&layoutMutex);
	
	for (TiViewProxy *thisProxy in localLayoutArray)
	{
        [TiLayoutQueue layoutProxy:thisProxy];
	}
		
	RELEASE_TO_NIL(localLayoutArray);
}


@implementation TiLayoutQueue

+(void)initialize
{
	pthread_mutex_init(&layoutMutex, NULL);
}

+(void)layoutProxy:(TiViewProxy*)thisProxy
{
    if ([thisProxy viewAttached]) {
        [thisProxy layoutChildrenIfNeeded];
    }
    else {
        [thisProxy refreshView:nil];
    }
}

+(void)addViewProxy:(TiViewProxy*)newViewProxy
{
	pthread_mutex_lock(&layoutMutex);

	if (layoutArray == nil)
	{
		layoutArray = [[NSMutableArray alloc] initWithObjects:newViewProxy,nil];
	}
	else if([layoutArray containsObject:newViewProxy])
	{//Nothing to do here. Already added.
		pthread_mutex_unlock(&layoutMutex);
		return;
	}
	else if([layoutArray containsObject:[newViewProxy parent]])
	{//For safety reasons, we do add this to the list. But since the parent's already here,
	//We add it to the FIRST so that children draw before parents, giving us good layout values for later!
		[layoutArray insertObject:newViewProxy atIndex:0];
	}
	else
	{//We might be someone's parent... but that means that children should draw FIRST.
		// This is because in many cases, parent size is determined by child size (e.g. auto, vert. layout, etc.)
		[layoutArray addObject:newViewProxy];
	}

	if (layoutTimer == NULL)
	{
		layoutTimer = CFRunLoopTimerCreate(NULL,
				CFAbsoluteTimeGetCurrent()+LAYOUT_START_INTERVAL,
				LAYOUT_TIMER_INTERVAL,
				0, 0, performLayoutRefresh, NULL);
		CFRunLoopAddTimer(CFRunLoopGetMain(), layoutTimer, kCFRunLoopCommonModes);
	}

	pthread_mutex_unlock(&layoutMutex);
}

@end
