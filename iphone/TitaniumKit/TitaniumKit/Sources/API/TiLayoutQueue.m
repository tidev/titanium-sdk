/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TI_USE_AUTOLAYOUT

#import "TiLayoutQueue.h"
#import "TiViewProxy.h"
#import <CoreFoundation/CoreFoundation.h>

#define LAYOUT_TIMER_INTERVAL 0.05
#define LAYOUT_START_INTERVAL 0.01

NSMutableArray *layoutArray = nil;
CFRunLoopTimerRef layoutTimer = NULL;
static dispatch_queue_t layoutQueue;

void performLayoutRefresh(CFRunLoopTimerRef timer, void *info)
{
  __block NSArray *localLayoutArray = nil;
  dispatch_sync(layoutQueue, ^{
    localLayoutArray = layoutArray;
    layoutArray = nil;
    if ((layoutTimer != NULL) && ([localLayoutArray count] == 0)) {
      CFRunLoopTimerInvalidate(layoutTimer);
      CFRelease(layoutTimer);
      layoutTimer = NULL;
    }
  });

  for (TiViewProxy *thisProxy in localLayoutArray) {
    [TiLayoutQueue layoutProxy:thisProxy];
  }
  RELEASE_TO_NIL(localLayoutArray);
}

@implementation TiLayoutQueue

+ (void)initialize
{
  layoutQueue = dispatch_queue_create("ti.layout.queue", DISPATCH_QUEUE_SERIAL);
}

+ (void)resetQueue
{
  dispatch_sync(layoutQueue, ^{
    [layoutArray release];
    layoutArray = nil;
    if (layoutTimer != NULL) {
      CFRunLoopTimerInvalidate(layoutTimer);
      CFRelease(layoutTimer);
      layoutTimer = NULL;
    }
  });
}

+ (void)layoutProxy:(TiViewProxy *)thisProxy
{
  if ([thisProxy viewAttached]) {
    [thisProxy layoutChildrenIfNeeded];
  } else {
    [thisProxy refreshView:nil];
  }

  [thisProxy didFinishLayout];
}

+ (void)addViewProxy:(TiViewProxy *)newViewProxy
{
  dispatch_sync(layoutQueue, ^{
    if (layoutArray == nil) {
      layoutArray = [[NSMutableArray alloc] initWithObjects:newViewProxy, nil];
    } else if ([layoutArray containsObject:newViewProxy]) {
      return; // return from block = skip rest of critical section
    } else if ([layoutArray containsObject:[newViewProxy parent]]) {
      [layoutArray insertObject:newViewProxy atIndex:0];
    } else {
      [layoutArray addObject:newViewProxy];
    }
    if (layoutTimer == NULL) {
      layoutTimer = CFRunLoopTimerCreate(NULL,
          CFAbsoluteTimeGetCurrent() + LAYOUT_START_INTERVAL,
          LAYOUT_TIMER_INTERVAL,
          0, 0, performLayoutRefresh, NULL);
      CFRunLoopAddTimer(CFRunLoopGetMain(), layoutTimer, kCFRunLoopCommonModes);
    }
  });
}

@end

#endif
