/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIiOSProxy.h"
#import "TiUtils.h"
#import "Webcolor.h"
#ifdef USE_TI_UIIOS
 
#ifdef USE_TI_UIIOSTRANSITIONANIMATION
#import "TiUIiOSTransitionAnimationProxy.h"
#endif

#ifdef USE_TI_UIIOSATTRIBUTEDSTRING
#import "TiUIiOSAttributedStringProxy.h"
#endif

#ifdef USE_TI_UIIOSADVIEW
	#import "TiUIiOSAdViewProxy.h"
    #import <iAd/iAd.h>
#endif

#ifdef USE_TI_UIIOS3DMATRIX
	#import "Ti3DMatrix.h"
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

#if defined(USE_TI_UIIPADDOCUMENTVIEWER) || defined(USE_TI_UIIOSDOCUMENTVIEWER)
    #import "TiUIiOSDocumentViewerProxy.h"
#endif
#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
    #import "TiUIiOSNavWindowProxy.h"
#endif
#ifdef USE_TI_UIIOSANIMATOR
#import "TiAnimatorProxy.h"
#ifdef USE_TI_UIIOSSNAPBEHAVIOR
#import "TiSnapBehavior.h"
#endif
#ifdef USE_TI_UIIOSPUSHBEHAVIOR
#import "TiPushBehavior.h"
#endif
#ifdef USE_TI_UIIOSGRAVITYBEHAVIOR
#import "TiGravityBehavior.h"
#endif
#ifdef USE_TI_UIIOSANCHORATTACHMENTBEHAVIOR
#import "TiAnchorAttachBehavior.h"
#endif
#ifdef USE_TI_UIIOSVIEWATTACHMENTBEHAVIOR
#import "TiViewAttachBehavior.h"
#endif
#ifdef USE_TI_UIIOSCOLLISIONBEHAVIOR
#import "TiCollisionBehavior.h"
#endif
#ifdef USE_TI_UIIOSDYNAMICITEMBEHAVIOR
#import "TiDynamicItemBehavior.h"
#endif
#endif

@implementation TiUIiOSProxy

-(NSString*)apiName
{
    return @"Ti.UI.iOS";
}

-(NSNumber*)SCROLL_DECELERATION_RATE_NORMAL
{
    return NUMFLOAT(UIScrollViewDecelerationRateNormal);
}

-(NSNumber*)SCROLL_DECELERATION_RATE_FAST
{
    return NUMFLOAT(UIScrollViewDecelerationRateFast);
}

-(NSNumber*)CLIP_MODE_DEFAULT
{
    return NUMINT(0);
}
-(NSNumber*)CLIP_MODE_ENABLED
{
    return NUMINT(1);
}
-(NSNumber*)CLIP_MODE_DISABLED
{
    return NUMINT(-1);
}

#ifdef USE_TI_UIIOSATTRIBUTEDSTRING
MAKE_SYSTEM_PROP(ATTRIBUTE_FONT, AttributeNameFont);
MAKE_SYSTEM_PROP(ATTRIBUTE_PARAGRAPH_STYLE, AttributeNameParagraphStyle);
MAKE_SYSTEM_PROP(ATTRIBUTE_FOREGROUND_COLOR, AttributeNameForegroundColor);
MAKE_SYSTEM_PROP(ATTRIBUTE_BACKGROUND_COLOR, AttributeNameBackgroundColor);
MAKE_SYSTEM_PROP(ATTRIBUTE_LIGATURE, AttributeNameLigature);
MAKE_SYSTEM_PROP(ATTRIBUTE_KERN, AttributeNameKern);
MAKE_SYSTEM_PROP(ATTRIBUTE_STRIKETHROUGH_STYLE, AttributeNameStrikethroughStyle);
MAKE_SYSTEM_PROP(ATTRIBUTE_UNDERLINES_STYLE, AttributeNameUnderlineStyle);
MAKE_SYSTEM_PROP(ATTRIBUTE_STROKE_COLOR, AttributeNameStrokeColor);
MAKE_SYSTEM_PROP(ATTRIBUTE_STROKE_WIDTH, AttributeNameStrokeWidth);
MAKE_SYSTEM_PROP(ATTRIBUTE_SHADOW, AttributeNameShadow);
MAKE_SYSTEM_PROP(ATTRIBUTE_VERTICAL_GLYPH_FORM, AttributeNameVerticalGlyphForm);
MAKE_SYSTEM_PROP(ATTRIBUTE_WRITING_DIRECTION, AttributeNameWritingDirection);
MAKE_SYSTEM_PROP(ATTRIBUTE_TEXT_EFFECT, AttributeNameTextEffect);
MAKE_SYSTEM_PROP(ATTRIBUTE_ATTACHMENT, AttributeNameAttachment);
MAKE_SYSTEM_PROP(ATTRIBUTE_LINK, AttributeNameLink);
MAKE_SYSTEM_PROP(ATTRIBUTE_BASELINE_OFFSET, AttributeNameBaselineOffset);
MAKE_SYSTEM_PROP(ATTRIBUTE_UNDERLINE_COLOR, AttributeNameUnderlineColor);
MAKE_SYSTEM_PROP(ATTRIBUTE_STRIKETHROUGH_COLOR, AttributeNameStrikethroughColor);
MAKE_SYSTEM_PROP(ATTRIBUTE_OBLIQUENESS, AttributeNameObliqueness);
MAKE_SYSTEM_PROP(ATTRIBUTE_EXPANSION, AttributeNameExpansion);

-(NSNumber*)ATTRIBUTE_UNDERLINE_STYLE_NONE
{
    return NUMINT(NSUnderlineStyleNone);
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_STYLE_SINGLE
{
    return NUMINT(NSUnderlineStyleSingle);
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_STYLE_THICK
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlineStyleThick): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_STYLE_DOUBLE
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlineStyleDouble): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_PATTERN_SOLID
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlinePatternSolid): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_PATTERN_DOT
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlinePatternDot): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_PATTERN_DASH
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlinePatternDash): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_PATTERN_DASH_DOT
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlinePatternDashDot): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_PATTERN_DASH_DOT_DOT
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlinePatternDashDotDot): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_UNDERLINE_BY_WORD
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSUnderlineByWord): NUMINT(NSUnderlineStyleNone));
}
-(NSNumber*)ATTRIBUTE_WRITING_DIRECTION_NATURAL
{
    return NUMINT(NSWritingDirectionNatural);
}
-(NSNumber*)ATTRIBUTE_WRITING_DIRECTION_LEFT_TO_RIGHT
{
    return NUMINT(NSWritingDirectionLeftToRight);
}
-(NSNumber*)ATTRIBUTE_WRITING_DIRECTION_RIGHT_TO_LEFT
{
    return NUMINT(NSWritingDirectionRightToLeft);
}
-(NSNumber*)ATTRIBUTE_WRITING_DIRECTION_EMBEDDING
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSTextWritingDirectionEmbedding): NUMINT(NSWritingDirectionNatural));
}
-(NSNumber*)ATTRIBUTE_WRITING_DIRECTION_OVERRIDE
{
    return ([TiUtils isIOS7OrGreater] ? NUMINT(NSTextWritingDirectionOverride): NUMINT(NSWritingDirectionNatural));
}
-(NSString *)ATTRIBUTE_LETTERPRESS_STYLE
{
    return ([TiUtils isIOS7OrGreater] ? NSTextEffectLetterpressStyle : @"");
}


#endif

#ifdef USE_TI_UIIOSADVIEW

-(NSString*)AD_SIZE_PORTRAIT 
{
    return [TiUIiOSAdViewProxy portraitSize];
}

-(NSString*)AD_SIZE_LANDSCAPE 
{
    return [TiUIiOSAdViewProxy landscapeSize];
}

-(id)createAdView:(id)args
{
	return [[[TiUIiOSAdViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

#endif

#ifdef USE_TI_UIIOS3DMATRIX
-(id)create3DMatrix:(id)args
{
	DEPRECATED_REPLACED(@"UI.iOS.create3DMatrix()", @"2.1.0", @"Ti.UI.create3DMatrix()");
    if (args==nil || [args count] == 0)
	{
		return [[[Ti3DMatrix alloc] init] autorelease];
	}
	ENSURE_SINGLE_ARG(args,NSDictionary);
	Ti3DMatrix *matrix = [[Ti3DMatrix alloc] initWithProperties:args];
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

#ifdef USE_TI_UIIOSATTRIBUTEDSTRING
-(id)createAttributedString:(id)args
{
    return [[[TiUIiOSAttributedStringProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UIIOSTABBEDBAR
-(id)createTabbedBar:(id)args
{
    return [[[TiUIiOSTabbedBarProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#if defined(USE_TI_UIIPADDOCUMENTVIEWER) || defined(USE_TI_UIIOSDOCUMENTVIEWER)
-(id)createDocumentViewer:(id)args
{
	return [[[TiUIiOSDocumentViewerProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif
#ifdef USE_TI_UIIOSNAVIGATIONWINDOW
-(id)createNavigationWindow:(id)args
{
    return [[[TiUIiOSNavWindowProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif
#ifdef USE_TI_UIIOSTRANSITIONANIMATION
-(id)createTransitionAnimation:(id)args;
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiUIiOSTransitionAnimationProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Transition Animation Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
#endif
#ifdef USE_TI_UIIOSANIMATOR
-(id)createAnimator:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiAnimatorProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Animator object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
#ifdef USE_TI_UIIOSSNAPBEHAVIOR
-(id)createSnapBehavior:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiSnapBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Snap Behavior Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
#endif
#ifdef USE_TI_UIIOSPUSHBEHAVIOR
-(id)createPushBehavior:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiPushBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Push Behavior Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
//TiPushBehavior Constants
MAKE_SYSTEM_PROP(PUSH_MODE_CONTINUOUS, 0);
MAKE_SYSTEM_PROP(PUSH_MODE_INSTANTANEOUS, 1);
#endif

#ifdef USE_TI_UIIOSGRAVITYBEHAVIOR
-(id)createGravityBehavior:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiGravityBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Gravity Behavior Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
#endif

#ifdef USE_TI_UIIOSANCHORATTACHMENTBEHAVIOR
-(id)createAnchorAttachmentBehavior:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiAnchorAttachBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Anchor Attachment Behavior Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
#endif

#ifdef USE_TI_UIIOSVIEWATTACHMENTBEHAVIOR
-(id)createViewAttachmentBehavior:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiViewAttachBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The View Attachment Behavior Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
#endif

#ifdef USE_TI_UIIOSCOLLISIONBEHAVIOR
-(id)createCollisionBehavior:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiCollisionBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Collision Behavior Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
//TiCollisionBehavior Constants
MAKE_SYSTEM_PROP(COLLISION_MODE_ITEM, 0);
MAKE_SYSTEM_PROP(COLLISION_MODE_BOUNDARY, 1);
MAKE_SYSTEM_PROP(COLLISION_MODE_ALL, 2);
#endif

#ifdef USE_TI_UIIOSDYNAMICITEMBEHAVIOR
-(id)createDynamicItemBehavior:(id)args
{
    if ([TiUtils isIOS7OrGreater]) {
        return [[[TiDynamicItemBehavior alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
    } else {
        DebugLog(@"[WARN] The Dynamic Item Behavior Object is only available on iOS7 and above. Returning nil");
        return nil;
    }
}
#endif

#endif


#ifdef USE_TI_UIIOS
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ANIMATION_CURVE_EASE_IN_OUT, UIViewAnimationOptionCurveEaseInOut, @"UI.iOS.ANIMATION_CURVE_EASE_IN_OUT", @"2.1.0", @"Ti.UI.ANIMATION_CURVE_EASE_IN_OUT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ANIMATION_CURVE_EASE_IN, UIViewAnimationOptionCurveEaseIn, @"UI.iOS.ANIMATION_CURVE_EASE_IN", @"2.1.0", @"Ti.UI.ANIMATION_CURVE_EASE_IN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ANIMATION_CURVE_EASE_OUT,UIViewAnimationOptionCurveEaseOut,  @"UI.iOS.ANIMATION_CURVE_EASE_OUT", @"2.1.0", @"Ti.UI.ANIMATION_CURVE_EASE_OUT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(ANIMATION_CURVE_LINEAR,UIViewAnimationOptionCurveLinear, @"UI.iOS.ANIMATION_CURVE_LINEAR", @"2.1.0", @"Ti.UI.ANIMATION_CURVE_LINEAR");

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_NONE,UIDataDetectorTypeNone, @"UI.iOS.AUTODETECT_NONE", @"3.0.0", @"Ti.UI.AUTOLINK_NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_ALL,UIDataDetectorTypeAll, @"UI.iOS.AUTODETECT_ALL", @"3.0.0", @"Ti.UI.AUTOLINK_ALL");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_PHONE,UIDataDetectorTypePhoneNumber, @"UI.iOS.AUTODETECT_PHONE", @"3.0.0", @"Ti.UI.AUTOLINK_PHONE_NUMBERS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_LINK,UIDataDetectorTypeLink, @"UI.iOS.AUTODETECT_LINK", @"3.0.0", @"Ti.UI.AUTOLINK_URLS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_ADDRESS,UIDataDetectorTypeAddress, @"UI.iOS.AUTODETECT_ADDRESS", @"3.0.0", @"Ti.UI.AUTOLINK_MAP_ADDRESSES");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_CALENDAR,UIDataDetectorTypeCalendarEvent, @"UI.iOS.AUTODETECT_CALENDAR", @"3.0.0", @"Ti.UI.AUTOLINK_CALENDAR");

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


MAKE_SYSTEM_STR(COLOR_SCROLLVIEW_BACKGROUND, IOS_COLOR_SCROLLVIEW_TEXTURED_BACKGROUND);
MAKE_SYSTEM_STR(COLOR_VIEW_FLIPSIDE_BACKGROUND, IOS_COLOR_VIEW_FLIPSIDE_BACKGROUND);
MAKE_SYSTEM_STR(COLOR_GROUP_TABLEVIEW_BACKGROUND, IOS_COLOR_GROUP_TABLEVIEW_BACKGROUND);

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_5_0
    MAKE_SYSTEM_STR(COLOR_UNDER_PAGE_BACKGROUND, IOS_COLOR_UNDER_PAGE_BACKGROUND);
#endif


MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_LINK_CLICKED,UIWebViewNavigationTypeLinkClicked);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_FORM_SUBMITTED,UIWebViewNavigationTypeFormSubmitted);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_BACK_FORWARD,UIWebViewNavigationTypeBackForward);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_RELOAD,UIWebViewNavigationTypeReload);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_FORM_RESUBMITTED,UIWebViewNavigationTypeFormResubmitted);
MAKE_SYSTEM_PROP(WEBVIEW_NAVIGATIONTYPE_OTHER,UIWebViewNavigationTypeOther);

#endif
@end

#endif
