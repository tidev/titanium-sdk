/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "APIModule.h"
#import "TiApp.h"
#import "TiBase.h"
#import "TiExceptionHandler.h"
#import "TiUtils.h"

@implementation APIModule

- (NSString *)apiName
{
  return @"Ti.API";
}

- (void)logMessage:(NSArray *)args severity:(NSString *)severity
{
  NSLog(@"[%@] %@", [severity uppercaseString], [args componentsJoinedByString:@" "]);
}

- (id)transform:(id)arg
{
  if ([arg isKindOfClass:[NSDictionary class]]) {
    return [[[[TiScriptError alloc] initWithDictionary:arg] autorelease] description];
  }
  return arg;
}

- (void)debug:(NSArray *)args
{
  [self logMessage:args severity:@"debug"];
}

- (void)info:(NSArray *)args
{
  [self logMessage:args severity:@"info"];
}

- (void)warn:(NSArray *)args
{
  [self logMessage:args severity:@"warn"];
}

- (void)error:(NSArray *)args
{
  [self logMessage:args severity:@"error"];
}

- (void)trace:(NSArray *)args
{
  [self logMessage:args severity:@"trace"];
}

- (void)timestamp:(NSArray *)args
{
  NSLog(@"[TIMESTAMP] %f %@", [NSDate timeIntervalSinceReferenceDate], [self transform:[args objectAtIndex:0]]);
  fflush(stderr);
}

- (void)notice:(NSArray *)args
{
  [self logMessage:args severity:@"info"];
}

- (void)critical:(NSArray *)args
{
  [self logMessage:args severity:@"error"];
}

- (void)log:(NSArray *)args
{
  if ([args count] > 1) {
    [self logMessage:[args subarrayWithRange:NSMakeRange(1, [args count] - 1)] severity:[args objectAtIndex:0]];
  } else {
    [self logMessage:args severity:@"info"];
  }
}

- (void)reportUnhandledException:(NSArray *)args
{
  id lineNumber = [args objectAtIndex:0];
  id source = [args objectAtIndex:1];
  id message = [args objectAtIndex:2];

  NSLog(@"[ERROR] %@:%@ %@", source, lineNumber, message);
  fflush(stderr);
}

@end
