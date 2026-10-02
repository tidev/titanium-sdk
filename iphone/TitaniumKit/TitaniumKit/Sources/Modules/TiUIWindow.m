/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIWindow.h"
#import "TiUIWindowProxy.h"

@implementation TiUIWindow

- (void)dealloc
{
  [super dealloc];
}

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoFill];
  [self setDefaultWidth:TiDimensionAutoFill];
}
#endif

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
  [super frameSizeChanged:frame bounds:bounds];

  TiUIWindowProxy *windowProxy = (TiUIWindowProxy *)[self proxy];

  if ([windowProxy respondsToSelector:@selector(willChangeSize)]) {
    [(id)windowProxy willChangeSize];
  }
  // During a rotation the proxy updates the nav bar again once the transition
  // coordinator completes, when the navigation bar bounds are final.
  if ([windowProxy respondsToSelector:@selector(updateNavBar)]) {
    [windowProxy updateNavBar];
  }
}

@end
