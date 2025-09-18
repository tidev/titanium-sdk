/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIBLURVIEW
#import "TiUIBlurViewProxy.h"
#import "TiUIBlurView.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIBlurViewProxy

#pragma mark Proxy lifecycle

- (NSString *)apiName
{
  return @"Ti.UI.BlurView";
}

- (void)dealloc
{
  [super dealloc];
}

#pragma mark Public APIs

- (TiUIBlurView *)blurView
{
  return (TiUIBlurView *)self.view;
}

@end
#endif
