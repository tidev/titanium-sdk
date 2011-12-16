/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_UIIOS
 
#ifdef USE_TI_UIIOSADVIEW
	#import "TiUIiOSAdViewProxy.h"
    #import <iAd/iAd.h>
#endif

#ifdef USE_TI_UIIOS3DMATRIX
	#import "TiUIiOS3DMatrix.h"
#endif
#ifdef USE_TI_UIIOSCOVERFLOWVIEW
	#import "TiUIiOSCoverFlowViewProxy.h"
#endif
#ifdef USE_TI_UIIOSTOOLBAR
	#import "TiUIiOSToolbarProxy.h"
#endif
#ifdef USE_TI_UIIOSTABBEDBAR
	#import "TiUIiOSTabbedBarProxy.h"
#endif
@implementation TiUIiOSProxy

#ifdef USE_TI_UIIOSADVIEW

-(NSString*)AD_SIZE_PORTRAIT 
{
	if ([TiUtils isIOS4_2OrGreater]) {
		return ADBannerContentSizeIdentifierPortrait;
	}
	return @"ADBannerContentSize320x50";
}

-(NSString*)AD_SIZE_LANDSCAPE 
{
	if ([TiUtils isIOS4_2OrGreater]) {
		return ADBannerContentSizeIdentifierLandscape;
	}
	return @"ADBannerContentSize480x32";
}

-(id)createAdView:(id)args
{
	return [[[TiUIiOSAdViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

#endif

#ifdef USE_TI_UIIOS3DMATRIX
-(id)create3DMatrix:(id)args
{
	if (args==nil || [args count] == 0)
	{
		return [[[TiUIiOS3DMatrix alloc] init] autorelease];
	}
	ENSURE_SINGLE_ARG(args,NSDictionary);
	TiUIiOS3DMatrix *matrix = [[TiUIiOS3DMatrix alloc] initWithProperties:args];
	return [matrix autorelease];
}
#endif
#ifdef USE_TI_UIIOSCOVERFLOWVIEW
-(id)createCoverFlowView:(id)args
{
	return [[[TiUIiOSCoverFlowViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif
#ifdef USE_TI_UIIOSTOOLBAR
-(id)createToolbar:(id)args
{
	return [[[TiUIiOSToolbarProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSTABBEDBAR
-(id)createTabbedBar:(id)args
{
    return [[[TiUIiOSTabbedBarProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif
#ifdef USE_TI_UIIOS
MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_IN_OUT,UIViewAnimationCurveEaseInOut);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_IN,UIViewAnimationCurveEaseIn);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_OUT,UIViewAnimationCurveEaseOut);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_LINEAR,UIViewAnimationCurveLinear);

MAKE_SYSTEM_PROP(BLEND_MODE_NORMAL,kCGBlendModeNormal);
MAKE_SYSTEM_PROP(BLEND_MODE_MULTIPLY,kCGBlendModeMultiply);
MAKE_SYSTEM_PROP(BLEND_MODE_SCREEN,kCGBlendModeScreen);
MAKE_SYSTEM_PROP(BLEND_MODE_OVERLAY,kCGBlendModeOverlay);
MAKE_SYSTEM_PROP(BLEND_MODE_DARKEN,kCGBlendModeDarken);
MAKE_SYSTEM_PROP(BLEND_MODE_LIGHTEN,kCGBlendModeLighten);
MAKE_SYSTEM_PROP(BLEND_MODE_COLOR_DODGE,kCGBlendModeColorDodge);
MAKE_SYSTEM_PROP(BLEND_MODE_COLOR_BURN,kCGBlendModeColorBurn);
MAKE_SYSTEM_PROP(BLEND_MODE_SOFT_LIGHT,kCGBlendModeSoftLight);
MAKE_SYSTEM_PROP(BLEND_MODE_HARD_LIGHT,kCGBlendModeHardLight);
MAKE_SYSTEM_PROP(BLEND_MODE_DIFFERENCE,kCGBlendModeDifference);
MAKE_SYSTEM_PROP(BLEND_MODE_EXCLUSION,kCGBlendModeExclusion);
MAKE_SYSTEM_PROP(BLEND_MODE_HUE,kCGBlendModeHue);
MAKE_SYSTEM_PROP(BLEND_MODE_SATURATION,kCGBlendModeSaturation);
MAKE_SYSTEM_PROP(BLEND_MODE_COLOR,kCGBlendModeColor);
MAKE_SYSTEM_PROP(BLEND_MODE_LUMINOSITY,kCGBlendModeLuminosity);
MAKE_SYSTEM_PROP(BLEND_MODE_CLEAR,kCGBlendModeClear);
MAKE_SYSTEM_PROP(BLEND_MODE_COPY,kCGBlendModeCopy);
MAKE_SYSTEM_PROP(BLEND_MODE_SOURCE_IN,kCGBlendModeSourceIn);
MAKE_SYSTEM_PROP(BLEND_MODE_SOURCE_OUT,kCGBlendModeSourceOut);
MAKE_SYSTEM_PROP(BLEND_MODE_SOURCE_ATOP,kCGBlendModeSourceAtop);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_OVER,kCGBlendModeDestinationOver);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_IN,kCGBlendModeDestinationIn);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_OUT,kCGBlendModeDestinationOut);
MAKE_SYSTEM_PROP(BLEND_MODE_DESTINATION_ATOP,kCGBlendModeDestinationAtop);
MAKE_SYSTEM_PROP(BLEND_MODE_XOR,kCGBlendModeXOR);
MAKE_SYSTEM_PROP(BLEND_MODE_PLUS_DARKER,kCGBlendModePlusDarker);
MAKE_SYSTEM_PROP(BLEND_MODE_PLUS_LIGHTER,kCGBlendModePlusLighter);

MAKE_SYSTEM_PROP(AUTODETECT_NONE,UIDataDetectorTypeNone);
MAKE_SYSTEM_PROP(AUTODETECT_ALL,UIDataDetectorTypeAll);
MAKE_SYSTEM_PROP(AUTODETECT_PHONE,UIDataDetectorTypePhoneNumber);
MAKE_SYSTEM_PROP(AUTODETECT_LINK,UIDataDetectorTypeLink);
MAKE_SYSTEM_PROP(AUTODETECT_ADDRESS,UIDataDetectorTypeAddress);
MAKE_SYSTEM_PROP(AUTODETECT_CALENDAR,UIDataDetectorTypeCalendarEvent);

#endif
@end

#endif