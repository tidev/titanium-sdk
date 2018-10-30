/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIOSBLURVIEW
#import "TiUIiOSBlurViewProxy.h"
#import "TiUIiOSBlurView.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSBlurViewProxy

#pragma mark Proxy lifecycle

- (NSString *)apiName
{
  return @"Ti.UI.iOS.BlurView";
}

- (void)dealloc
{
  [super dealloc];
}

#pragma mark Public APIs

- (TiUIiOSBlurView *)blurView
{
  return (TiUIiOSBlurView *)self.view;
}

@end
#endif
