/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "APIModule.h"
#import "TiBase.h"
#import "TiExceptionHandler.h"

@implementation APIModule

- (NSString *)apiName
{
  return @"Ti.API";
}

- (bool)isNSBoolean:(id)object
{
  return [object isKindOfClass:[@YES class]];
}

- (void)logMessage:(id)args severity:(NSString *)severity
{
  if (args == nil) {
    args = @[ [NSNull null] ];
  } else if (!([args isKindOfClass:[NSArray class]])) {
    args = @[ args ];
  }
  // If the arg is an NSNumber wrapping a BOOL we should print the string equivalent for the boolean!
  NSMutableArray *newArray = [NSMutableArray array];
  [args enumerateObjectsUsingBlock:^(id obj, NSUInteger idx, BOOL *stop) {
    if ([obj isKindOfClass:[JSValue class]]) {
      obj = ((JSValue *)obj).toObject;
    }
    if ([self isNSBoolean:obj]) {
      obj = [obj boolValue] ? @"true" : @"false";
    } else if (obj == nil) {
      obj = [NSNull null];
    }
    [newArray addObject:obj];
  }];
  NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
  [dateFormatter setDateFormat:@"yyyy-MM-dd HH:mm:ss"];
  // or @"yyyy-MM-dd hh:mm:ss a" if you prefer the time with AM/PM

  NSLog(@"[%@] %@ %@", [severity uppercaseString], [dateFormatter stringFromDate:[NSDate date]], [newArray componentsJoinedByString:@" "]);
}

- (id)transform:(id)arg
{
  if ([arg isKindOfClass:[NSDictionary class]]) {
    return [[[[TiScriptError alloc] initWithDictionary:arg] autorelease] description];
  }
  return arg;
}

- (void)debug:(id)args
{
  args = [JSContext currentArguments] ?: args;

  [self logMessage:args severity:@"debug"];
}

- (void)info:(id)args
{
  args = [JSContext currentArguments] ?: args;
  [self logMessage:args severity:@"info"];
}

- (void)warn:(id)args
{
  args = [JSContext currentArguments] ?: args;
  [self logMessage:args severity:@"warn"];
}

- (void)error:(NSArray *)args
{
  args = [JSContext currentArguments] ?: args;
  [self logMessage:args severity:@"error"];
}

- (void)trace:(id)args
{
  args = [JSContext currentArguments] ?: args;
  [self logMessage:args severity:@"trace"];
}

- (void)timestamp:(id)args
{
  id firstArg = args;
  if ([args isKindOfClass:[NSArray class]]) {
    firstArg = [args objectAtIndex:0];
  }
  NSLog(@"[TIMESTAMP] %f %@", [NSDate timeIntervalSinceReferenceDate], [self transform:firstArg]);
  fflush(stderr);
}

- (void)notice:(id)args
{
  args = [JSContext currentArguments] ?: args;
  [self logMessage:args severity:@"info"];
}

- (void)critical:(id)args
{
  args = [JSContext currentArguments] ?: args;
  [self logMessage:args severity:@"error"];
}

- (void)log:(id)level withMessage:(id)args
{
  if ([JSContext currentArguments].count > 0) {
    NSMutableArray *array = [NSMutableArray arrayWithArray:[JSContext currentArguments]];
    [array removeObjectAtIndex:0];
    args = array;
  }
  if (args == nil || ([args isKindOfClass:[NSArray class]] && [args count] == 0)) {
    [self logMessage:level severity:@"info"];
  } else {
    [self logMessage:args severity:level];
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