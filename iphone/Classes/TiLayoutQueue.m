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


NSMutableArray * layoutArray = nil;
CFRunLoopTimerRef layoutTimer = NULL;
pthread_mutex_t layoutMutex;

void allNodes(NSMutableArray** array, TiViewProxy* tivp) {
    if([tivp.children count] > 0) {
        for (TiViewProxy* p in tivp.children) {
            allNodes(array, p);
        }
    }
    return [(NSMutableArray*)(*array) addObject:tivp];
}


NSMutableArray* getAllNodesOfProxy(NSArray* array) {
    NSMutableArray* all = [[NSMutableArray alloc] init];
    for (TiViewProxy* proxy in array) {
        NSMutableArray* allChildrenOfProxy = [[NSMutableArray alloc] init];
        [allChildrenOfProxy addObject:proxy];
        allNodes(&allChildrenOfProxy, proxy);
        [all addObject:allChildrenOfProxy];
    }
    
    return all;
}


NSArray* isInSameTree(NSArray* needs) {
    NSMutableArray* alltrees = getAllNodesOfProxy(needs);
    int count = [alltrees count];
    NSMutableArray* indexes = [[NSMutableArray alloc] initWithCapacity:count];
    
    for (int i = 0; i < count; i++) {
        for (int j = 0; j < count; j++) {
            if (i != j) {
                if([[alltrees objectAtIndex:j] containsObject:[[alltrees objectAtIndex:i] objectAtIndex:0]] ) {
                    [indexes addObject:[NSNumber numberWithInt:i]];
                    continue;
                }
            }
        }
    }
    
    for(int i = 0; i < [indexes count]; i++) {
        int tmp = [[indexes objectAtIndex:i] integerValue];
        for (int j = 0; j < [indexes count]; j++) {
            if (i != j) {
                if([[indexes objectAtIndex:j] integerValue] == tmp) {
                    [indexes removeObjectAtIndex:j];
                }
            }
        }
    }
    
    NSMutableIndexSet* indexSet = [[NSMutableIndexSet alloc] init];
    for (NSNumber* num in indexes) {
        [indexSet addIndex:[num integerValue]];
    }
    [alltrees removeObjectsAtIndexes:indexSet];
    [indexes removeAllObjects];
    
    for(NSMutableArray* a in alltrees) {
        //tmp use indexes，avoid alloc new array.
        [indexes addObject:[a objectAtIndex:0]];
    }
    
    [alltrees release];
    
    return indexes;
}


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

	// add push req for this optimization
	localLayoutArray = isInSameTree(localLayoutArray);
	
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
				CFAbsoluteTimeGetCurrent()+LAYOUT_TIMER_INTERVAL,
				LAYOUT_TIMER_INTERVAL,
				0, 0, performLayoutRefresh, NULL);
		CFRunLoopAddTimer(CFRunLoopGetMain(), layoutTimer, kCFRunLoopCommonModes);
	}

	pthread_mutex_unlock(&layoutMutex);
}

@end
