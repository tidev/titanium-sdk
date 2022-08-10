/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIButtonBarProxy.h"
#import "TiUIButtonBar.h"

@implementation TiUIButtonBarProxy

NSArray *tabbedKeySequence;

- (NSArray *)keySequence
{
  if (tabbedKeySequence == nil) {
    tabbedKeySequence = [[NSArray alloc] initWithObjects:@"labels", @"style", nil];
  }
  return tabbedKeySequence;
}

- (NSString *)apiName
{
  return @"Ti.UI.ButtonBar";
}

- (TiUIView *)newView
{
  TiUIButtonBar *result = [[TiUIButtonBar alloc] init];
  [result setTabbedBar:NO];
  return result;
}

USE_VIEW_FOR_CONTENT_WIDTH
USE_VIEW_FOR_CONTENT_HEIGHT

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
