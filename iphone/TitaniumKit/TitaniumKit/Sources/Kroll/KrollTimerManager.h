/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import <JavaScriptCore/JavaScriptCore.h>

/**
 * Object acting as the target that receives a message when a timer fires.
 */
@interface KrollTimerTarget : NSObject

/**
 * The JS function to call when the timer fires.
 */
@property (strong, nonatomic, nonnull) JSValue *callback;

/**
 * Additional arugments to pass to the callback function
 */
@property (strong, nonatomic, nullable) NSArray<JSValue *> *arguments;

- (_Nullable instancetype)initWithCallback:(nonnull JSValue *)callback arguments:(nullable NSArray<JSValue *> *)arguments;

/**
 * The method that will be triggered when a timer fires.
 */
- (void)timerFired:(nonnull NSTimer *)timer;

@end

/**
 * Handles creating and clearing timers
 */
@interface KrollTimerManager : NSObject

/**
 * Map of timer identifiers to the currently scheduled native NSTimer.
 * Entries are removed while the app is backgrounded (timers are paused)
 * and repopulated on foreground resume. Retained strongly so paused
 * timers are not released by the run loop.
 */
@property (nonatomic, strong, nullable) NSMutableDictionary<NSNumber *, NSTimer *> *timers;

/**
 * Initializes the timer manager in the given JS context. Exposes the global set/clear
 * functions for creating and clearing intervals/timeouts.
 *
 * @param context The JSContext where timer function should be made available to.
 */
- (_Nullable instancetype)initInContext:(nonnull JSContext *)context;

/**
 * Invalidates all timers.
 */
- (void)invalidateAllTimers;

@end
