/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AnalyticsModule.h"
#import "APSAnalytics/APSAnalytics.h"

extern BOOL const TI_APPLICATION_ANALYTICS;
static NSMutableArray *_filteredEvents;

// Validation limits as per TIMOB-19826
static const uint MAX_SERLENGTH = 1000;
static const uint MAX_KEYS = 35;
static const uint MAX_LEVELS = 5;
static const uint MAX_KEYLENGTH = 50;

static const NSInteger JSON_VALIDATION_PASSED = 0;
static const NSInteger JSON_VALIDATION_FAILED = -1;
static const NSInteger ANALYTICS_DISABLED = -2;

@implementation AnalyticsModule

- (void)dealloc
{
  RELEASE_TO_NIL(_filteredEvents);
  [super dealloc];
}
- (NSString *)apiName
{
  return @"Ti.Analytics";
}

- (NSString *)lastEvent
{
  return [[APSAnalytics sharedInstance] performSelector:@selector(getLastEvent)];
}

- (void)navEvent:(id)args
{
  if (TI_APPLICATION_ANALYTICS == NO) {
    DebugLog(@"[ERROR] Analytics service is not enabled in your app. Please set analytics to true in the tiapp.xml. ");
    return;
  }
  if ([args count] < 2) {
    [self throwException:@"invalid number of arguments, expected at least 2" subreason:nil location:CODELOCATION];
    return;
  }
  NSString *from = [args objectAtIndex:0];
  NSString *to = [args objectAtIndex:1];
  NSString *event = [args count] > 2 ? [args objectAtIndex:2] : @"";
  id data = [args count] > 3 ? [args objectAtIndex:3] : [NSDictionary dictionary];
  [[APSAnalytics sharedInstance] sendAppNavEventFromView:from toView:to withName:event payload:data];
}

- (NSInteger)featureEvent:(id)args
{
  if (TI_APPLICATION_ANALYTICS == NO) {
    DebugLog(@"[ERROR] Analytics service is not enabled in your app. Please set analytics to true in the tiapp.xml.");
    return ANALYTICS_DISABLED;
  }
  if ([args count] < 1) {
    [self throwException:@"invalid number of arguments, expected at least 1" subreason:nil location:CODELOCATION];
  }
  NSString *event = [args objectAtIndex:0];
  id data = [args count] > 1 ? [args objectAtIndex:1] : [NSDictionary dictionary];
  if (data != nil && ([data isKindOfClass:[NSDictionary class]] == NO)) {
    id value = nil;
    if ([data isKindOfClass:[NSString class]] == YES) {
      value = [TiUtils jsonParse:data];
      if (value == nil)
        value = [NSDictionary dictionaryWithObject:data forKey:@"data"];
    } else {
      //if all else fails fall back old behavior
      value = [TiUtils jsonStringify:data];
      value = [NSDictionary dictionaryWithObject:value forKey:@"data"];
    }
    data = value;
  }
  if ([AnalyticsModule validatePayload:data level:0]) {
    [[APSAnalytics sharedInstance] sendAppFeatureEvent:event payload:data];
    return JSON_VALIDATION_PASSED;
  } else {
    DebugLog(@"[WARN] Feature event '%@' not conforming to recommended usage.", event);
    return JSON_VALIDATION_FAILED;
  }
}

- (void)filterEvents:(id)args
{
  ENSURE_SINGLE_ARG(args, NSArray);
  if (_filteredEvents == nil) {
    _filteredEvents = [[NSMutableArray array] retain];
  } else {
    [_filteredEvents removeAllObjects];
  }

  for (id event in args) {
    ENSURE_STRING(event);
    if (![_filteredEvents containsObject:event]) {
      [_filteredEvents addObject:event];
    }
  }
}

+ (BOOL)isEventFiltered:(NSString *)eventName
{
  if (_filteredEvents == nil)
    return NO;
  for (NSString *event in _filteredEvents) {
    if ([event isEqualToString:eventName]) {
      return YES;
    }
  }
  return NO;
}

+ (BOOL)validatePayload:(id)payload level:(uint)level
{
  DeveloperLog(@"Validating %@ \nlevel %d", payload, level);
  if (level > MAX_LEVELS) {
    DebugLog(@"[WARN] Feature event cannot have more than %u nested levels", MAX_LEVELS);
    return NO;
  }

  BOOL isDictionary = [payload isKindOfClass:[NSDictionary class]];
  if ((level == 0) && ([TiUtils jsonStringify:payload].length > MAX_SERLENGTH)) {
    DebugLog(@"[WARN] Feature event length should not exceed %u.", MAX_SERLENGTH);
    return NO;
  }

  if (isDictionary && ([[payload allKeys] count] > MAX_KEYS)) {
    DebugLog(@"[WARN] Feature event maximum keys should not exceed %u", MAX_KEYS);
    return NO;
  }

  id item;
  for (item in payload) {
    id value;
    if (isDictionary) {
      if ([item length] > MAX_KEYLENGTH) {
        DebugLog(@"[WARN] Feature event key '%@' length should not exceed %u characters", item, MAX_KEYLENGTH);
        return NO;
      }
      value = [payload objectForKey:item];
    } else {
      value = item;
    }

    if ([value isKindOfClass:[NSDictionary class]] || [value isKindOfClass:[NSArray class]]) {
      if (![AnalyticsModule validatePayload:value level:level + 1]) {
        DeveloperLog(@"Inner json validation failed");
        return NO;
      }
    }
  }

  DeveloperLog(@"Validation passed!");
  return YES;
}

@end
