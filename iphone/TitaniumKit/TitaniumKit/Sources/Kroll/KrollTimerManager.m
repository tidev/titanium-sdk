/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollTimerManager.h"

@interface KrollTimerManager ()

@property NSUInteger nextTimerIdentifier;

@end

@implementation KrollTimerManager

- (instancetype)initInContext:(JSContext *)context
{
  self = [super init];
  if (!self) {
    return nil;
  }

  self.nextTimerIdentifier = 0;
  self.timers = [NSMutableDictionary new];

  NSUInteger (^setInterval)(void) = ^() {
    return [self setIntervalFromArguments:JSContext.currentArguments shouldRepeat:YES];
  };
  context[@"setInterval"] = setInterval;

  NSUInteger (^setTimeout)(void) = ^() {
    return [self setIntervalFromArguments:JSContext.currentArguments shouldRepeat:NO];
  };
  context[@"setTimeout"] = setTimeout;

  void (^clearInterval)(JSValue *) = ^(JSValue *value) {
    return [self clearIntervalWithIdentifier:value.toInt32];
  };
  context[@"clearInterval"] = clearInterval;
  context[@"clearTimeout"] = clearInterval;

  return self;
}

- (void)dealloc
{
  if (self.timers != nil) {
    [self.timers removeAllObjects];
    [self.timers release];
    self.timers = nil;
  }

  [super dealloc];
}

- (void)invalidateAllTimers
{
  for (NSNumber *timerIdentifier in self.timers.allKeys) {
    [self clearIntervalWithIdentifier:timerIdentifier.unsignedIntegerValue];
  }
}

- (NSUInteger)setIntervalFromArguments:(NSArray<JSValue *> *)arguments shouldRepeat:(BOOL)shouldRepeat
{
  NSMutableArray *callbackArgs = [arguments.mutableCopy autorelease];
  JSValue *callbackFunction = [callbackArgs objectAtIndex:0];
  [callbackArgs removeObjectAtIndex:0];
  double interval = [[callbackArgs objectAtIndex:0] toDouble] / 1000;
  [callbackArgs removeObjectAtIndex:0];
  NSNumber *timerIdentifier = @(self.nextTimerIdentifier++);
  NSTimer *timer = [NSTimer scheduledTimerWithTimeInterval:interval
                                                   repeats:shouldRepeat
                                                     block:^(NSTimer *_Nonnull timer) {
                                                       [callbackFunction callWithArguments:callbackArgs];
                                                       if (!shouldRepeat) {
                                                         [self.timers removeObjectForKey:timerIdentifier];
                                                       }
                                                     }];
  self.timers[timerIdentifier] = timer;
  return [timerIdentifier unsignedIntegerValue];
}

- (void)clearIntervalWithIdentifier:(NSUInteger)identifier
{
  NSNumber *timerIdentifier = @(identifier);
  [self.timers[timerIdentifier] invalidate];
  [self.timers removeObjectForKey:timerIdentifier];
}

@end