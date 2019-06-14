/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

#import "TiPlatformDisplayCaps.h"
@import TitaniumKit.TiUtils;

@implementation TiPlatformDisplayCaps

// NOTE: device capabilities currently are hardcoded for iPad, while high/low
// display density is now detected for iPhone / iPod Touch under iOS 4.

- (NSString *)density
{
  if ([TiUtils is3xRetina]) {
    return @"xhigh";
  }
  if ([TiUtils is2xRetina]) {
    return @"high";
  }
  return @"medium";
}
GETTER_IMPL(NSString *, density, Density);

- (NSString *)apiName
{
  return @"Ti.Platform.DisplayCaps";
}

- (NSNumber *)dpi
{
  return [NSNumber numberWithInt:[TiUtils dpi]];
}
GETTER_IMPL(NSNumber *, dpi, Dpi);

// TODO Remove? Not in our docs!
- (BOOL)isDevicePortrait
{
  UIDeviceOrientation orientation = [UIDevice currentDevice].orientation;
  return (orientation == UIDeviceOrientationPortrait || orientation == UIDeviceOrientationPortraitUpsideDown || orientation == UIDeviceOrientationUnknown);
}

// TODO Remove? Not in our docs!
- (BOOL)isUIPortrait
{
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  return UIInterfaceOrientationIsPortrait(orientation);
}

- (NSNumber *)platformWidth
{
  CGRect mainScreenBounds = [[UIScreen mainScreen] bounds];
  return [NSNumber numberWithFloat:mainScreenBounds.size.width];
}
GETTER_IMPL(NSNumber *, platformWidth, PlatformWidth);

- (NSNumber *)platformHeight
{
  CGRect mainScreenBounds = [[UIScreen mainScreen] bounds];
  return [NSNumber numberWithFloat:mainScreenBounds.size.height];
}
GETTER_IMPL(NSNumber *, platformHeight, PlatformHeight);

- (NSNumber *)logicalDensityFactor
{
  return [NSNumber numberWithFloat:[[UIScreen mainScreen] scale]];
}
GETTER_IMPL(NSNumber *, logicalDensityFactor, LogicalDensityFactor);

@end

#endif
