/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollTimerManager.h"
#import "TiBindingTiValue.h"
#import "TiExceptionHandler.h"
#import "TiUtils.h"
#import <dispatch/dispatch.h>
#import <os/lock.h>

@interface KrollTimerManager ()

@property NSUInteger nextTimerIdentifier;

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

// ARC handles memory management - dealloc removed

- (void)timerFired:(NSTimer *)timer
{
  [self.callback callWithArguments:self.arguments];
  // handle an uncaught exception
  JSContext *context = self.callback.context;
  JSValue *exception = context.exception;
  if (exception != nil) {
    [TiExceptionHandler.defaultExceptionHandler reportScriptError:exception inJSContext:context];
  }
}

@end

@interface KrollDispatchTimer : NSObject

@property (nonatomic, assign) dispatch_source_t source;
@property (nonatomic, strong) KrollTimerTarget *target;
@property (nonatomic, assign) BOOL repeats;

@end

@implementation KrollDispatchTimer

- (void)dealloc
{
  if (_source) {
    dispatch_source_cancel(_source);
    _source = nil;
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
  // Use strong-to-strong so GCD timers are retained until cleared/invalidated.
  self.timers = [NSMapTable strongToStrongObjectsMapTable];

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

  return self;
}

- (void)dealloc
{
  if (self.timers != nil) {
    [self invalidateAllTimers];
    [self.timers removeAllObjects];
    self.timers = nil;
  }
}

- (void)invalidateAllTimers
{
  NSArray<NSNumber *> *keys = [[self.timers keyEnumerator] allObjects];
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
  KrollTimerTarget *timerTarget = [[KrollTimerTarget alloc] initWithCallback:callback arguments:callbackArgs];

  // Create GCD timer on the main queue to execute within the JS context's thread.
  dispatch_queue_t queue = dispatch_get_main_queue();
  dispatch_source_t source = dispatch_source_create(DISPATCH_SOURCE_TYPE_TIMER, 0, 0, queue);

  // Configure timer with desired start and repeat interval, allow small leeway for coalescing.
  uint64_t intervalNsec = (uint64_t)(interval * NSEC_PER_SEC);
  uint64_t leewayNsec = (uint64_t)(0.001 * NSEC_PER_SEC); // 1ms leeway
  dispatch_time_t startTime = dispatch_time(DISPATCH_TIME_NOW, intervalNsec);
  dispatch_source_set_timer(source, startTime, shouldRepeat ? intervalNsec : intervalNsec, leewayNsec);

  KrollDispatchTimer *container = [[KrollDispatchTimer alloc] init];
  container.source = source;
  container.target = timerTarget;
  container.repeats = shouldRepeat;

  __weak KrollTimerManager *weakSelf = self;

  dispatch_source_set_event_handler(source, ^{
    __strong KrollTimerManager *strongSelf = weakSelf;
    if (!strongSelf) {
      return;
    }

    [container.target timerFired:nil];
    if (!container.repeats) {
      // one-shot: cancel and clear
      dispatch_source_cancel(container.source);
      // Remove from map after cancel to break retain cycles
      [strongSelf.timers removeObjectForKey:timerIdentifier];
    }
  });

  // No need for cancel handler with ARC - memory is managed automatically

  dispatch_resume(source);

  [self.timers setObject:container forKey:timerIdentifier];
  return [timerIdentifier unsignedIntegerValue];
}

- (void)clearIntervalWithIdentifier:(NSUInteger)identifier
{
  NSNumber *timerIdentifier = @(identifier);
  id entry = [self.timers objectForKey:timerIdentifier];
  if (entry != nil) {
    if ([entry isKindOfClass:[KrollDispatchTimer class]]) {
      KrollDispatchTimer *container = (KrollDispatchTimer *)entry;
      if (container.source) {
        dispatch_source_cancel(container.source);
        container.source = nil;
      }
    }
    [self.timers removeObjectForKey:timerIdentifier];
  }
}

@end
