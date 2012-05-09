/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_UIIOS

#ifdef USE_TI_UIIOSADVIEW
	#import "TiUIiOSAdViewProxy.h"
#endif

#endif

@interface TiUIiOSProxy : TiProxy {
@private

}

#ifdef USE_TI_UIIOSADVIEW
-(id)createAdView:(id)args;

@property(nonatomic,readonly) NSString* AD_SIZE_PORTRAIT;
@property(nonatomic,readonly) NSString* AD_SIZE_LANDSCAPE;

#endif
#ifdef USE_TI_UIIOS3DMATRIX
-(id)create3DMatrix:(id)args;
#endif
#ifdef USE_TI_UIIOSCOVERFLOWVIEW
-(id)createCoverFlowView:(id)args;
#endif
#ifdef USE_TI_UIIOSTOOLBAR
-(id)createToolbar:(id)args;
#endif
#ifdef USE_TI_UIIOSTABBEDBAR
-(id)createTabbedBar:(id)args;
#endif

extern NSString * const IOS_COLOR_SCROLLVIEW_TEXTURED_BACKGROUND;
extern NSString * const IOS_COLOR_VIEW_FLIPSIDE_BACKGROUND;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_5_0
extern NSString * const IOS_COLOR_UNDER_PAGE_BACKGROUND;
#endif

@end

