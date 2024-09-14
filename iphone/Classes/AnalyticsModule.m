/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AnalyticsModule.h"
@import TitaniumKit.TiBase;
@import TitaniumKit.TiUtils;
#import <objc/runtime.h>

@implementation AnalyticsModule

- (NSString *)apiName
{
  return @"Ti.Analytics";
}

- (NSString *)lastEvent
{
  DEPRECATED_REMOVED(@"Analytyics.lastEvent", @"11.2.0", @"11.2.0");
  return nil;
}

- (void)navEvent:(NSString *)from to:(NSString *)to withName:(NSString *)name withData:(NSDictionary *)data
{
  DEPRECATED_REMOVED(@"Analytyics.navEvent", @"11.2.0", @"11.2.0");
}

- (NSInteger)featureEvent:(NSString *)name withData:(id)data
{
  DEPRECATED_REMOVED(@"Analytyics.featureEvent", @"11.2.0", @"11.2.0");
  return -1;
}

- (void)filterEvents:(NSArray *)events
{
  DEPRECATED_REMOVED(@"Analytyics.filterEvents", @"11.2.0", @"11.2.0");
}

- (void)setOptedOut:(bool)optedOut
{
  DEPRECATED_REMOVED(@"Analytyics.optedOut", @"11.2.0", @"11.2.0");
}

- (BOOL)optedOut
{
  DEPRECATED_REMOVED(@"Analytyics.optedOut", @"11.2.0", @"11.2.0");
  return NO;
}

READWRITE_IMPL(bool, optedOut, OptedOut);

@end
