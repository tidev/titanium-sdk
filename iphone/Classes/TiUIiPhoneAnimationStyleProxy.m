/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEANIMATIONSTYLE

#import "TiUIiPhoneAnimationStyleProxy.h"
#import "TiBase.h"

@implementation TiUIiPhoneAnimationStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iPhone.AnimationStyle";
}

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(NONE, UIViewAnimationOptionTransitionNone, @"UI.iPhone.AnimationStyle.NONE", @"5.4.0", @"UI.iOS.AnimationStyle.NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(CURL_UP, UIViewAnimationOptionTransitionCurlUp, @"UI.iPhone.AnimationStyle.CURL_UP", @"5.4.0", @"UI.iOS.AnimationStyle.CURL_UP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(CURL_DOWN, UIViewAnimationOptionTransitionCurlDown, @"UI.iPhone.AnimationStyle.CURL_DOWN", @"5.4.0", @"UI.iOS.AnimationStyle.CURL_DOWN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FLIP_FROM_LEFT, UIViewAnimationOptionTransitionFlipFromLeft, @"UI.iPhone.AnimationStyle.FLIP_FROM_LEFT", @"5.4.0", @"UI.iOS.AnimationStyle.FLIP_FROM_LEFT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(FLIP_FROM_RIGHT, UIViewAnimationOptionTransitionFlipFromRight, @"UI.iPhone.AnimationStyle.FLIP_FROM_RIGHT", @"5.4.0", @"UI.iOS.AnimationStyle.FLIP_FROM_RIGHT");

@end

#endif