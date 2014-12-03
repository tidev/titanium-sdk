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

MAKE_SYSTEM_PROP(DEFAULT,UIStatusBarStyleDefault);
MAKE_SYSTEM_PROP(GRAY,UIStatusBarStyleDefault);
MAKE_SYSTEM_PROP(GREY,UIStatusBarStyleDefault);
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED_REMOVED(OPAQUE_BLACK,UIStatusBarStyleLightContent,@"UI.iPhone.StatusBar.OPAQUE_BLACK",@"3.4.2",@"3.6.0",@"UI.iPhone.StatusBar.LIGHT_CONTENT")
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED_REMOVED(TRANSLUCENT_BLACK,UIStatusBarStyleLightContent,@"UI.iPhone.StatusBar.OPAQUE_BLACK",@"3.4.2",@"3.6.0",@"UI.iPhone.StatusBar.LIGHT_CONTENT")
MAKE_SYSTEM_PROP(LIGHT_CONTENT,UIStatusBarStyleLightContent);


MAKE_SYSTEM_PROP(ANIMATION_STYLE_NONE,UIStatusBarAnimationNone);
MAKE_SYSTEM_PROP(ANIMATION_STYLE_SLIDE,UIStatusBarAnimationSlide);
MAKE_SYSTEM_PROP(ANIMATION_STYLE_FADE,UIStatusBarAnimationFade);

-(NSString*)apiName
{
    return @"Ti.UI.iPhone.StatusBar";
}

@end

#endif
