/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSANIMATIONSTYLE

#import "TiUIiOSAnimationStyleProxy.h"
#import <TitaniumKit/TiBase.h>

@implementation TiUIiOSAnimationStyleProxy

- (NSString *)apiName
{
  return @"Ti.UI.iOS.AnimationStyle";
}

MAKE_SYSTEM_PROP(NONE, UIViewAnimationOptionTransitionNone);
MAKE_SYSTEM_PROP(CURL_UP, UIViewAnimationOptionTransitionCurlUp);
MAKE_SYSTEM_PROP(CURL_DOWN, UIViewAnimationOptionTransitionCurlDown)
MAKE_SYSTEM_PROP(FLIP_FROM_LEFT, UIViewAnimationOptionTransitionFlipFromLeft);
MAKE_SYSTEM_PROP(FLIP_FROM_RIGHT, UIViewAnimationOptionTransitionFlipFromRight);
MAKE_SYSTEM_PROP(FLIP_FROM_TOP, UIViewAnimationOptionTransitionFlipFromTop);
MAKE_SYSTEM_PROP(FLIP_FROM_BOTTOM, UIViewAnimationOptionTransitionFlipFromBottom);
MAKE_SYSTEM_PROP(CROSS_DISSOLVE, UIViewAnimationOptionTransitionCrossDissolve);

@end

#endif
