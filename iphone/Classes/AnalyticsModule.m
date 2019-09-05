/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AnalyticsModule.h"
@import TitaniumKit.APSAnalytics;
@import TitaniumKit.TiBase;
@import TitaniumKit.TiUtils;

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

- (void)navEvent:(NSString *)from to:(NSString *)to withName:(NSString *)name withData:(NSDictionary *)data
{
  if (!TI_APPLICATION_ANALYTICS) {
    DebugLog(@"[ERROR] Analytics service is not enabled in your app. Please set analytics to true in the tiapp.xml. ");
    return;
  }
  if (from == nil || to == nil) {
    [self throwException:@"invalid number of arguments, expected at least 2" subreason:nil location:CODELOCATION];
    return;
  }

  if (name == nil) {
    name = @"";
  }
  if (data == nil) {
    data = [NSDictionary dictionary];
  }
  [[APSAnalytics sharedInstance] sendAppNavEventFromView:from toView:to withName:name payload:data];
}

- (NSInteger)featureEvent:(NSString *)name withData:(id)data
{
  if (!TI_APPLICATION_ANALYTICS) {
    DebugLog(@"[ERROR] Analytics service is not enabled in your app. Please set analytics to true in the tiapp.xml.");
    return ANALYTICS_DISABLED;
  }
  if (name == nil) {
    [self throwException:@"invalid number of arguments, expected at least 1" subreason:nil location:CODELOCATION];
  }
  if (data == nil) {
    data = [NSDictionary dictionary];
  }
  if (data != nil && ![data isKindOfClass:[NSDictionary class]]) {
    id value = nil;
    if ([data isKindOfClass:[NSString class]]) {
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
    [[APSAnalytics sharedInstance] sendAppFeatureEvent:name payload:data];
    return JSON_VALIDATION_PASSED;
  }

  DebugLog(@"[WARN] Feature event '%@' not conforming to recommended usage.", name);
  return JSON_VALIDATION_FAILED;
}

- (void)filterEvents:(NSArray *)events
{
  if (_filteredEvents == nil) {
    _filteredEvents = [[NSMutableArray array] retain];
  } else {
    [_filteredEvents removeAllObjects];
  }

  for (id event in events) {
    ENSURE_STRING(event);
    if (![_filteredEvents containsObject:event]) {
      [_filteredEvents addObject:event];
    }
  }
}

- (void)setOptedOut:(BOOL)optedOut
{
  [[APSAnalytics sharedInstance] setOptedOut:optedOut];
}

- (BOOL)optedOut
{
  return [[APSAnalytics sharedInstance] isOptedOut];
}

READWRITE_IMPL(BOOL, optedOut, OptedOut);

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
