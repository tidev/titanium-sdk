/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEANIMATIONSTYLE

#import "TiUIAnimationStyleProxy.h"


@implementation TiUIAnimationStyleProxy

MAKE_SYSTEM_PROP(NONE,UIViewAnimationTransitionNone);
MAKE_SYSTEM_PROP(CURL_UP,UIViewAnimationTransitionCurlUp);
MAKE_SYSTEM_PROP(CURL_DOWN,UIViewAnimationTransitionCurlDown);
MAKE_SYSTEM_PROP(FLIP_FROM_LEFT,UIViewAnimationTransitionFlipFromLeft);
MAKE_SYSTEM_PROP(FLIP_FROM_RIGHT,UIViewAnimationTransitionFlipFromRight);

@end

#endif