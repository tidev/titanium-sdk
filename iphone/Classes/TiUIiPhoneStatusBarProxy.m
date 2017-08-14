/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESTATUSBAR

#import "TiUIiPhoneStatusBarProxy.h"
#import "TiUtils.h"

@implementation TiUIiPhoneStatusBarProxy

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(DEFAULT, UIStatusBarStyleDefault, @"UI.iPhone.StatusBar.DEFAULT", @"5.4.0", @"UI.iOS.StatusBar.DEFAULT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(GRAY, UIStatusBarStyleDefault, @"UI.iPhone.StatusBar.GRAY", @"5.4.0", @"UI.iOS.StatusBar.GRAY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(GREY, UIStatusBarStyleDefault, @"UI.iPhone.StatusBar.GREY", @"5.4.0", @"UI.iOS.StatusBar.GREY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED_REMOVED(OPAQUE_BLACK, UIStatusBarStyleLightContent, @"UI.iPhone.StatusBar.OPAQUE_BLACK", @"3.4.2", @"3.6.0", @"UI.iOS.StatusBar.LIGHT_CONTENT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED_REMOVED(TRANSLUCENT_BLACK, UIStatusBarStyleLightContent, @"UI.iPhone.StatusBar.TRANSLUCENT_BLACK", @"3.4.2", @"3.6.0", @"UI.iOS.StatusBar.LIGHT_CONTENT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(LIGHT_CONTENT, UIStatusBarStyleLightContent, @"UI.iPhone.StatusBar.LIGHT_CONTENT", @"5.4.0", @"UI.iOS.StatusBar.LIGHT_CONTENT");

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ANIMATION_STYLE_NONE, UIStatusBarAnimationNone, @"UI.iPhone.StatusBar.ANIMATION_STYLE_NONE", @"5.4.0", @"UI.iOS.StatusBar.ANIMATION_STYLE_NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ANIMATION_STYLE_SLIDE, UIStatusBarAnimationSlide, @"UI.iPhone.StatusBar.ANIMATION_STYLE_SLIDE", @"5.4.0", @"UI.iOS.StatusBar.ANIMATION_STYLE_SLIDE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ANIMATION_STYLE_FADE, UIStatusBarAnimationFade, @"UI.iPhone.StatusBar.ANIMATION_STYLE_FADE", @"5.4.0", @"UI.iOS.StatusBar.ANIMATION_STYLE_FADE");

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.StatusBar";
}

@end

#endif
