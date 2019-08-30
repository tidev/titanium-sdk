/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSTATUSBAR

#import "TiUIiOSStatusBarProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSStatusBarProxy

MAKE_SYSTEM_PROP(DEFAULT, UIStatusBarStyleDefault);
MAKE_SYSTEM_PROP(GRAY, UIStatusBarStyleDefault);
MAKE_SYSTEM_PROP(GREY, UIStatusBarStyleDefault);
MAKE_SYSTEM_PROP(LIGHT_CONTENT, UIStatusBarStyleLightContent);
#if IS_SDK_IOS_13
MAKE_SYSTEM_PROP(DARK_CONTENT, UIStatusBarStyleDarkContent);
#endif

MAKE_SYSTEM_PROP(ANIMATION_STYLE_NONE, UIStatusBarAnimationNone);
MAKE_SYSTEM_PROP(ANIMATION_STYLE_SLIDE, UIStatusBarAnimationSlide);
MAKE_SYSTEM_PROP(ANIMATION_STYLE_FADE, UIStatusBarAnimationFade);

- (NSString *)apiName
{
  return @"Ti.UI.iOS.StatusBar";
}

@end

#endif
