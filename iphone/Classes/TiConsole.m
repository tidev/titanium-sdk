/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiConsole.h"

@implementation TiConsole

- (void)log:(NSArray *)args
{
  [self logMessage:args severity:@"info"];
}

- (void)time:(id)label
{
  ENSURE_SINGLE_ARG_OR_NIL(label, NSString);
  if (label == nil) {
    label = @"default";
  }

  if (!_times) {
    _times = [[NSMutableDictionary alloc] init];
  }
  if ([_times objectForKey:label] != nil) {
    NSString *logMessage = [NSString stringWithFormat:@"Label \"%@\" already exists", label];
    [self logMessage:[logMessage componentsSeparatedByString:@" "] severity:@"warn"];
    return;
  }
  [_times setObject:[NSDate date] forKey:label];
}

- (void)timeEnd:(id)label
{
  ENSURE_SINGLE_ARG_OR_NIL(label, NSString);
  if (label == nil) {
    label = @"default";
  }
  NSDate *startTime = _times[label];
  if (startTime == nil) {
    NSString *logMessage = [NSString stringWithFormat:@"Label \"%@\" does not exist", label];
    [self logMessage:[logMessage componentsSeparatedByString:@" "] severity:@"warn"];
    return;
  }
  NSTimeInterval duration = [startTime timeIntervalSinceNow] * -1000;
  NSString *logMessage = [NSString stringWithFormat:@"%@: %0.fms", label, duration];
  [self logMessage:[logMessage componentsSeparatedByString:@" "] severity:@"info"];
  [_times removeObjectForKey:label];
}

- (void)timeLog:(id)args
{
  NSString *label = [args objectAtIndex:0] ?: @"default";
  NSArray *logData = [args count] > 1 ? [args subarrayWithRange:NSMakeRange(1, [args count] - 1)] : nil;
  NSDate *startTime = _times[label];
  if (startTime == nil) {
    NSString *logMessage = [NSString stringWithFormat:@"Label \"%@\" does not exist", label];
    [self logMessage:[logMessage componentsSeparatedByString:@" "] severity:@"warn"];
    return;
  }
  NSTimeInterval duration = [startTime timeIntervalSinceNow] * -1000;
  NSString *logMessage = [NSString stringWithFormat:@"%@: %0.fms ", label, duration];
  if ([logData count] > 0) {
    logMessage = [logMessage stringByAppendingString:[logData componentsJoinedByString:@" "]];
  }
  [self logMessage:[logMessage componentsSeparatedByString:@" "] severity:@"info"];
}

- (void)dealloc
{
  RELEASE_TO_NIL(_times);
  [super dealloc];
}
@end
