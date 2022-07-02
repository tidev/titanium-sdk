/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISWITCH

#import "TiUISwitchProxy.h"
#import "TiUISwitch.h"

@implementation TiUISwitchProxy

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self initializeProperty:@"enabled" defaultValue:NUMBOOL(YES)];
  [super _initWithProperties:properties];
}

- (UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
  return suggestedResizing & ~(UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth);
}

- (NSString *)apiName
{
  return @"Ti.UI.Switch";
}

- (NSNumber *)value
{
  return [(TiUISwitch *)[self view] value];
}

USE_VIEW_FOR_VERIFY_HEIGHT
USE_VIEW_FOR_VERIFY_WIDTH

#ifndef TI_USE_AUTOLAYOUT
- (TiDimension)defaultAutoWidthBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
#endif

@end

#endif
