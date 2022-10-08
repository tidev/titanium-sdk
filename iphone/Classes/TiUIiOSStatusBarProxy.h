/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSTATUSBAR

#import <TitaniumKit/TiProxy.h>

@interface TiUIiOSStatusBarProxy : TiProxy {
}

@property (nonatomic, readonly) NSNumber *DEFAULT;
@property (nonatomic, readonly) NSNumber *GREY;
@property (nonatomic, readonly) NSNumber *GRAY;
@property (nonatomic, readonly) NSNumber *LIGHT_CONTENT;

@property (nonatomic, readonly) NSNumber *ANIMATION_STYLE_NONE;
@property (nonatomic, readonly) NSNumber *ANIMATION_STYLE_SLIDE;
@property (nonatomic, readonly) NSNumber *ANIMATION_STYLE_FADE;

@end

#endif
