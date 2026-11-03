/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPROGRESSBAR

#import "TiUIProgressBarProxy.h"
#import "TiUIProgressBar.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIProgressBarProxy

USE_VIEW_FOR_CONTENT_WIDTH
USE_VIEW_FOR_CONTENT_HEIGHT

- (NSString *)apiName
{
  return @"Ti.UI.ProgressBar";
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  [self initializeProperty:@"animated" defaultValue:NUMBOOL(YES)];
  [super _initWithProperties:properties];
}

- (TiUIView *)newView
{
  UIProgressViewStyle style = [TiUtils intValue:[self valueForUndefinedKey:@"style"] def:UIProgressViewStyleDefault];
  CGFloat min = [TiUtils floatValue:[self valueForUndefinedKey:@"min"] def:0];
  CGFloat max = [TiUtils floatValue:[self valueForUndefinedKey:@"max"] def:1];

  return [[TiUIProgressBar alloc] initWithStyle:style andMinimumValue:min maximumValue:max];
}

#ifndef TI_USE_AUTOLAYOUT
- (TiDimension)defaultAutoWidthBehavior:(id)unused
{
  return TiDimensionAutoFill;
}
- (TiDimension)defaultAutoHeightBehavior:(id)unused
{
  return TiDimensionAutoSize;
}
#endif

@end

#endif
