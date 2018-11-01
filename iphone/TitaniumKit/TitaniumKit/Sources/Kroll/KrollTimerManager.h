/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

/**
 * Handles creating and clearing timers
 */
@interface KrollTimerManager : NSObject

/**
 * Map of timer identifiers and the underlying native NSTimer.
 */
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, NSTimer *> *timers;

/**
 * Initailizes the timer manager in the given JS context. Exposes the global set/clear
 * functions for creating and clearing intervals/timeouts.
 *
 * @param context The JSContext where timer function should be made available to.
 */
- (instancetype)initInContext:(JSContext *)context;

/**
 * Invalidates all timers.
 */
- (void)invalidateAllTimers;

@end