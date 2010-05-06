/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONESTATUSBAR

#import "TiProxy.h"


@interface TiUIStatusBarProxy : TiProxy {

}

@property(nonatomic,readonly)	NSNumber *DEFAULT;
@property(nonatomic,readonly)	NSNumber *GREY;
@property(nonatomic,readonly)	NSNumber *GRAY;
@property(nonatomic,readonly)	NSNumber *OPAQUE_BLACK;
@property(nonatomic,readonly)	NSNumber *TRANSLUCENT_BLACK;

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
@property(nonatomic,readonly)	NSNumber *ANIMATION_STYLE_NONE;
@property(nonatomic,readonly)	NSNumber *ANIMATION_STYLE_SLIDE;
@property(nonatomic,readonly)	NSNumber *ANIMATION_STYLE_FADE;
#endif

@end

#endif