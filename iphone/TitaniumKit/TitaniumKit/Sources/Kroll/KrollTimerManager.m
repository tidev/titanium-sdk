/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollTimerManager.h"
#import "TiBase.h"
#import "TiBindingTiValue.h"
#import "TiExceptionHandler.h"
#import "TiUtils.h"

@interface KrollTimerManager ()

@property NSUInteger nextTimerIdentifier;

@property (nonatomic, strong) NSMutableDictionary<NSNumber *, KrollTimerTarget *> *targets;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, NSNumber *> *intervals;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, NSNumber *> *repeatsFlags;
@property (nonatomic, strong) NSMutableDictionary<NSNumber *, NSNumber *> *remainingIntervals;
@property (nonatomic, assign) BOOL paused;
@property (nonatomic, strong, nullable) id pauseObserver;
@property (nonatomic, strong, nullable) id resumeObserver;

@end

@implementation KrollTimerTarget

- (instancetype)initWithCallback:(JSValue *)callback arguments:(NSArray<JSValue *> *)arguments
{
  self = [super init];
  if (!self) {
    return nil;
  }

  self.callback = callback;
  self.arguments = arguments;

  return self;
}

- (void)dealloc
{
  [_callback release];
  _callback = nil;
  if (_arguments != nil) {
    [_arguments release];
    _arguments = nil;
  }

  [super dealloc];
}

- (void)timerFired:(NSTimer *_Nonnull)timer
{
  // Liveness guard: skip if the callback or its JS context is gone. This can
  // happen during teardown or if a paused timer's target is resurrected after
  // the context that owns it has been released. Guards the foreground-resume
  // crash in issue #14434 where overdue timers fire into freed JS state.
  if (self.callback == nil || self.callback.context == nil) {
    return;
  }

  [self.callback callWithArguments:self.arguments];
  // handle an uncaught exception
  JSContext *context = self.callback.context;
  JSValue *exception = context.exception;
  if (exception != nil) {
    [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inJSContext:context];
  }
}

@end

@implementation KrollTimerManager

- (instancetype)initInContext:(JSContext *)context
{
  self = [super init];
  if (!self) {
    return nil;
  }

  self.nextTimerIdentifier = 1;
  self.timers = [NSMutableDictionary dictionary];
  self.targets = [NSMutableDictionary dictionary];
  self.intervals = [NSMutableDictionary dictionary];
  self.repeatsFlags = [NSMutableDictionary dictionary];
  self.remainingIntervals = [NSMutableDictionary dictionary];
  self.paused = NO;

  NSUInteger (^setInterval)(JSValue *, double) = ^(JSValue *callback, double interval) {
    return [self setInterval:interval withCallback:callback shouldRepeat:YES];
  };
  context[@"setInterval"] = setInterval;

  NSUInteger (^setTimeout)(JSValue *, double) = ^(JSValue *callback, double interval) {
    return [self setInterval:interval withCallback:callback shouldRepeat:NO];
  };
  context[@"setTimeout"] = setTimeout;

  void (^clearInterval)(NSUInteger) = ^(NSUInteger value) {
    return [self clearIntervalWithIdentifier:value];
  };
  context[@"clearInterval"] = clearInterval;
  context[@"clearTimeout"] = clearInterval;

  // Pause timers on background and resume on foreground. While the app is
  // backgrounded the main run loop suspends, so overdue NSTimers coalesce and
  // burst-fire on resume into JS/proxy state that may have been freed by a
  // background memory-warning GC — the root cause of the foreground-resume
  // crash in issue #14434. Pausing invalidates the NSTimers; resuming
  // reschedules them without catch-up (one-shots fire once, intervals skip
  // missed cycles).
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
  __weak KrollTimerManager *weakSelf = self;
  self.pauseObserver = [nc addObserverForName:kTiPausedNotification
                                       object:nil
                                        queue:nil
                                   usingBlock:^(NSNotification *_Nonnull note) {
                                     [weakSelf pauseAllTimers];
                                   }];
  self.resumeObserver = [nc addObserverForName:kTiResumeNotification
                                        object:nil
                                         queue:nil
                                    usingBlock:^(NSNotification *_Nonnull note) {
                                      [weakSelf resumeAllTimers];
                                    }];

  return self;
}

- (void)dealloc
{
  if (self.pauseObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:self.pauseObserver];
    self.pauseObserver = nil;
  }
  if (self.resumeObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:self.resumeObserver];
    self.resumeObserver = nil;
  }

  if (self.timers != nil) {
    [self invalidateAllTimers];
    [self.timers release];
    self.timers = nil;
  }
  if (_targets != nil) {
    [_targets release];
    _targets = nil;
  }
  if (_intervals != nil) {
    [_intervals release];
    _intervals = nil;
  }
  if (_repeatsFlags != nil) {
    [_repeatsFlags release];
    _repeatsFlags = nil;
  }
  if (_remainingIntervals != nil) {
    [_remainingIntervals release];
    _remainingIntervals = nil;
  }

  [super dealloc];
}

- (void)invalidateAllTimers
{
  NSArray<NSNumber *> *keys = [self.timers allKeys];
  for (NSNumber *timerIdentifier in keys) {
    [self clearIntervalWithIdentifier:timerIdentifier.unsignedIntegerValue];
  }
}

- (NSUInteger)setInterval:(double)interval withCallback:(JSValue *)callback shouldRepeat:(BOOL)shouldRepeat
{
  // interval is optional, should default to 0 per spec, but let's enforce at least 1 ms minimum (like Node)
  if (isnan(interval) || interval < 1) {
    interval = 1; // defaults to 1ms
  }
  interval = interval / 1000.0; // convert from ms to seconds

  // Handle additional arguments being passed in
  NSArray<JSValue *> *args = [JSContext currentArguments];
  NSUInteger argCount = [args count];
  NSArray<JSValue *> *callbackArgs = nil;
  if (argCount > 2) {
    callbackArgs = [args subarrayWithRange:NSMakeRange(2, argCount - 2)];
  }
  NSNumber *timerIdentifier = @(self.nextTimerIdentifier++);
  KrollTimerTarget *timerTarget = [[[KrollTimerTarget alloc] initWithCallback:callback arguments:callbackArgs] autorelease];
  [self.targets setObject:timerTarget forKey:timerIdentifier];
  [self.intervals setObject:@(interval) forKey:timerIdentifier];
  [self.repeatsFlags setObject:@(shouldRepeat) forKey:timerIdentifier];

  // If the app is backgrounded, don't schedule the NSTimer now; it will be
  // scheduled on foreground resume. This avoids a timer created while
  // backgrounded firing into an unprepared run loop.
  if (!self.paused) {
    [self scheduleTimerForIdentifier:timerIdentifier remainingInterval:interval];
  }
  return [timerIdentifier unsignedIntegerValue];
}

- (void)scheduleTimerForIdentifier:(NSNumber *)timerIdentifier remainingInterval:(NSTimeInterval)remainingInterval
{
  KrollTimerTarget *timerTarget = [self.targets objectForKey:timerIdentifier];
  if (timerTarget == nil) {
    return;
  }
  NSTimeInterval interval = [[self.intervals objectForKey:timerIdentifier] doubleValue];
  BOOL shouldRepeat = [[self.repeatsFlags objectForKey:timerIdentifier] boolValue];
  // For repeating timers, always resume at now + interval so missed cycles
  // while backgrounded are skipped (no burst-fire / no overshoot). For
  // one-shots, honor the remaining time; a remaining of 0 fires immediately
  // on the next run loop tick (the overdue case).
  NSTimeInterval fireIn = shouldRepeat ? interval : remainingInterval;
  NSTimer *timer = [NSTimer timerWithTimeInterval:fireIn target:timerTarget selector:@selector(timerFired:) userInfo:timerTarget repeats:shouldRepeat];
  [[NSRunLoop mainRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];
  [self.timers setObject:timer forKey:timerIdentifier];
}

- (void)clearIntervalWithIdentifier:(NSUInteger)identifier
{
  NSNumber *timerIdentifier = @(identifier);
  NSTimer *timer = [self.timers objectForKey:timerIdentifier];
  if (timer != nil) {
    if ([timer isValid]) {
      [timer invalidate];
    }
    [self.timers removeObjectForKey:timerIdentifier];
  }
  [self.targets removeObjectForKey:timerIdentifier];
  [self.intervals removeObjectForKey:timerIdentifier];
  [self.repeatsFlags removeObjectForKey:timerIdentifier];
  [self.remainingIntervals removeObjectForKey:timerIdentifier];
}

- (void)pauseAllTimers
{
  self.paused = YES;
  NSDate *now = [NSDate date];
  NSArray<NSNumber *> *keys = [self.timers allKeys];
  for (NSNumber *timerIdentifier in keys) {
    NSTimer *timer = [self.timers objectForKey:timerIdentifier];
    if (timer != nil) {
      NSTimeInterval remaining = [timer.fireDate timeIntervalSinceDate:now];
      if (remaining < 0) {
        remaining = 0;
      }
      [self.remainingIntervals setObject:@(remaining) forKey:timerIdentifier];
      if ([timer isValid]) {
        [timer invalidate];
      }
      [self.timers removeObjectForKey:timerIdentifier];
    }
  }
}

- (void)resumeAllTimers
{
  self.paused = NO;
  NSArray<NSNumber *> *identifiers = [self.targets allKeys];
  for (NSNumber *timerIdentifier in identifiers) {
    NSTimeInterval remaining = 0;
    NSNumber *remainingNum = [self.remainingIntervals objectForKey:timerIdentifier];
    if (remainingNum != nil) {
      remaining = [remainingNum doubleValue];
    } else {
      // Timer was created while backgrounded; no remaining recorded, use the
      // full interval as the first fire window.
      remaining = [[self.intervals objectForKey:timerIdentifier] doubleValue];
    }
    [self scheduleTimerForIdentifier:timerIdentifier remainingInterval:remaining];
  }
  [self.remainingIntervals removeAllObjects];
}

@end