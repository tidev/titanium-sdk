/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollTimerManager.h"
#import "TiBindingTiValue.h"
#import "TiExceptionHandler.h"
#import "TiUtils.h"

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
  self.timers = [NSMapTable strongToWeakObjectsMapTable];

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
    [self.timers release];
    self.timers = nil;
  }

  [super dealloc];
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
  KrollTimerTarget *timerTarget = [[[KrollTimerTarget alloc] initWithCallback:callback arguments:callbackArgs] autorelease];
  NSTimer *timer = [NSTimer timerWithTimeInterval:interval target:timerTarget selector:@selector(timerFired:) userInfo:timerTarget repeats:shouldRepeat];
  [[NSRunLoop mainRunLoop] addTimer:timer forMode:NSRunLoopCommonModes];

  [self.timers setObject:timer forKey:timerIdentifier];
  return [timerIdentifier unsignedIntegerValue];
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
}

@end
