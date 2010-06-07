/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_UI

#import "UIModule.h"
#import "TiProxy.h"

#ifdef USE_TI_UI2DMATRIX
	#import "Ti2DMatrix.h"
#endif
#ifdef USE_TI_UI3DMATRIX
	#import "Ti3DMatrix.h"
#endif
#ifdef USE_TI_UIANIMATION
	#import "TiAnimation.h"
#endif
#ifdef USE_TI_UIIPHONE
	#import "TiUIiPhoneProxy.h"
#endif
#ifdef USE_TI_UIIPAD
	#import "TiUIiPadProxy.h"
#endif
#import "TiApp.h"
#import "ImageLoader.h"
#import "Webcolor.h"

@implementation UIModule

-(void)dealloc
{
#ifdef USE_TI_UIIPAD
	RELEASE_TO_NIL(ipad);
#endif
#ifdef USE_TI_UIIPHONE
	RELEASE_TO_NIL(iphone);
#endif
	[super dealloc];
}

#pragma mark Public Constants

MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_IN_OUT,UIViewAnimationCurveEaseInOut);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_IN,UIViewAnimationCurveEaseIn);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_OUT,UIViewAnimationCurveEaseOut);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_LINEAR,UIViewAnimationCurveLinear);

MAKE_SYSTEM_PROP(TEXT_VERTICAL_ALIGNMENT_TOP,UIControlContentVerticalAlignmentTop);
MAKE_SYSTEM_PROP(TEXT_VERTICAL_ALIGNMENT_CENTER,UIControlContentVerticalAlignmentCenter);
MAKE_SYSTEM_PROP(TEXT_VERTICAL_ALIGNMENT_BOTTOM,UIControlContentVerticalAlignmentBottom);

MAKE_SYSTEM_PROP(TEXT_ALIGNMENT_LEFT,UITextAlignmentLeft);
MAKE_SYSTEM_PROP(TEXT_ALIGNMENT_CENTER,UITextAlignmentCenter);
MAKE_SYSTEM_PROP(TEXT_ALIGNMENT_RIGHT,UITextAlignmentRight);

MAKE_SYSTEM_PROP(RETURNKEY_DEFAULT,UIReturnKeyDefault);
MAKE_SYSTEM_PROP(RETURNKEY_GO,UIReturnKeyGo);
MAKE_SYSTEM_PROP(RETURNKEY_GOOGLE,UIReturnKeyGoogle);
MAKE_SYSTEM_PROP(RETURNKEY_JOIN,UIReturnKeyJoin);
MAKE_SYSTEM_PROP(RETURNKEY_NEXT,UIReturnKeyNext);
MAKE_SYSTEM_PROP(RETURNKEY_ROUTE,UIReturnKeyRoute);
MAKE_SYSTEM_PROP(RETURNKEY_SEARCH,UIReturnKeySearch);
MAKE_SYSTEM_PROP(RETURNKEY_SEND,UIReturnKeySend);
MAKE_SYSTEM_PROP(RETURNKEY_YAHOO,UIReturnKeyYahoo);
MAKE_SYSTEM_PROP(RETURNKEY_DONE,UIReturnKeyDone);
MAKE_SYSTEM_PROP(RETURNKEY_EMERGENCY_CALL,UIReturnKeyEmergencyCall);

MAKE_SYSTEM_PROP(KEYBOARD_DEFAULT,UIKeyboardTypeDefault);
MAKE_SYSTEM_PROP(KEYBOARD_ASCII,UIKeyboardTypeASCIICapable);
MAKE_SYSTEM_PROP(KEYBOARD_NUMBERS_PUNCTUATION,UIKeyboardTypeNumbersAndPunctuation);
MAKE_SYSTEM_PROP(KEYBOARD_URL,UIKeyboardTypeURL);
MAKE_SYSTEM_PROP(KEYBOARD_NUMBER_PAD,UIKeyboardTypeNumberPad);
MAKE_SYSTEM_PROP(KEYBOARD_PHONE_PAD,UIKeyboardTypePhonePad);
MAKE_SYSTEM_PROP(KEYBOARD_NAMEPHONE_PAD,UIKeyboardTypeNamePhonePad);
MAKE_SYSTEM_PROP(KEYBOARD_EMAIL,UIKeyboardTypeEmailAddress);

MAKE_SYSTEM_PROP(KEYBOARD_APPEARANCE_DEFAULT,UIKeyboardAppearanceDefault);
MAKE_SYSTEM_PROP(KEYBOARD_APPEARANCE_ALERT,UIKeyboardAppearanceAlert);

MAKE_SYSTEM_PROP(TEXT_AUTOCAPITALIZATION_NONE,UITextAutocapitalizationTypeNone);
MAKE_SYSTEM_PROP(TEXT_AUTOCAPITALIZATION_WORDS,UITextAutocapitalizationTypeWords);
MAKE_SYSTEM_PROP(TEXT_AUTOCAPITALIZATION_SENTENCES,UITextAutocapitalizationTypeSentences);
MAKE_SYSTEM_PROP(TEXT_AUTOCAPITALIZATION_ALL,UITextAutocapitalizationTypeAllCharacters);

MAKE_SYSTEM_PROP(INPUT_BUTTONMODE_NEVER,UITextFieldViewModeNever);
MAKE_SYSTEM_PROP(INPUT_BUTTONMODE_ALWAYS,UITextFieldViewModeAlways);
MAKE_SYSTEM_PROP(INPUT_BUTTONMODE_ONFOCUS,UITextFieldViewModeWhileEditing);
MAKE_SYSTEM_PROP(INPUT_BUTTONMODE_ONBLUR,UITextFieldViewModeUnlessEditing);

MAKE_SYSTEM_PROP(INPUT_BORDERSTYLE_NONE,UITextBorderStyleNone);
MAKE_SYSTEM_PROP(INPUT_BORDERSTYLE_LINE,UITextBorderStyleLine);
MAKE_SYSTEM_PROP(INPUT_BORDERSTYLE_BEZEL,UITextBorderStyleBezel);
MAKE_SYSTEM_PROP(INPUT_BORDERSTYLE_ROUNDED,UITextBorderStyleRoundedRect);

MAKE_SYSTEM_PROP(PICKER_TYPE_PLAIN,-1);
MAKE_SYSTEM_PROP(PICKER_TYPE_DATE_AND_TIME,UIDatePickerModeDateAndTime);
MAKE_SYSTEM_PROP(PICKER_TYPE_DATE,UIDatePickerModeDate);
MAKE_SYSTEM_PROP(PICKER_TYPE_TIME,UIDatePickerModeTime);
MAKE_SYSTEM_PROP(PICKER_TYPE_COUNT_DOWN_TIMER,UIDatePickerModeCountDownTimer);

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



-(void)setBackgroundColor:(id)color
{
	TiRootViewController *controller = [[TiApp app] controller];
	[controller setBackgroundColor:UIColorWebColorNamed(color)];
}

-(void)setBackgroundImage:(id)image
{
	TiRootViewController *controller = [[TiApp app] controller];
	UIImage *resultImage = [[ImageLoader sharedLoader] loadImmediateStretchableImage:[TiUtils toURL:image proxy:self]];
	if (resultImage==nil && [image isEqualToString:@"Default.png"])
	{
		// special case where we're asking for Default.png and it's in Bundle not path
		resultImage = [UIImage imageNamed:image];
	}
	[controller setBackgroundImage:resultImage];
}

#pragma mark Factory methods 

#ifdef USE_TI_UI2DMATRIX
-(id)create2DMatrix:(id)args
{
	if (args==nil || [args count] == 0)
	{
		return [[[Ti2DMatrix alloc] init] autorelease];
	}
	ENSURE_SINGLE_ARG(args,NSDictionary);
	Ti2DMatrix *matrix = [[Ti2DMatrix alloc] initWithProperties:args];
	return [matrix autorelease];
}
#endif

#ifdef USE_TI_UI3DMATRIX
-(id)create3DMatrix:(id)args
{
	if (args==nil || [args count] == 0)
	{
		return [[[Ti3DMatrix alloc] init] autorelease];
	}
	ENSURE_SINGLE_ARG(args,NSDictionary);
	Ti3DMatrix *matrix = [[Ti3DMatrix alloc] initWithProperties:args];
	return [matrix autorelease];
}
#endif

#ifdef USE_TI_UIANIMATION
-(id)createAnimation:(id)args
{
	if (args!=nil && [args isKindOfClass:[NSArray class]])
	{
		id properties = [args objectAtIndex:0];
		id callback = [args count] > 1 ? [args objectAtIndex:1] : nil;
		ENSURE_TYPE_OR_NIL(callback,KrollCallback);
		if ([properties isKindOfClass:[NSDictionary class]])
		{
			TiAnimation *a = [[[TiAnimation alloc] initWithDictionary:properties context:[self pageContext] callback:callback] autorelease];
			return a;
		}
	}
	return [[[TiAnimation alloc] _initWithPageContext:[self pageContext]] autorelease];
}
#endif

-(void)setOrientation:(id)mode
{
	ENSURE_UI_THREAD(setOrientation,mode);
	UIInterfaceOrientation orientation = [TiUtils orientationValue:mode def:UIInterfaceOrientationPortrait];
	[[[TiApp app] controller] manuallyRotateToOrientation:orientation];
}

MAKE_SYSTEM_PROP(PORTRAIT,UIInterfaceOrientationPortrait);
MAKE_SYSTEM_PROP(LANDSCAPE_LEFT,UIInterfaceOrientationLandscapeLeft);
MAKE_SYSTEM_PROP(LANDSCAPE_RIGHT,UIInterfaceOrientationLandscapeRight);
MAKE_SYSTEM_PROP(UPSIDE_PORTRAIT,UIInterfaceOrientationPortraitUpsideDown);
MAKE_SYSTEM_PROP(UNKNOWN,UIDeviceOrientationUnknown);
MAKE_SYSTEM_PROP(FACE_UP,UIDeviceOrientationFaceUp);
MAKE_SYSTEM_PROP(FACE_DOWN,UIDeviceOrientationFaceDown);

-(NSNumber*)isLandscape:(id)args
{
	return NUMBOOL([UIApplication sharedApplication].statusBarOrientation!=UIInterfaceOrientationPortrait);
}

-(NSNumber*)isPortrait:(id)args
{
	return NUMBOOL([UIApplication sharedApplication].statusBarOrientation==UIInterfaceOrientationPortrait);
}

-(NSNumber*)orientation
{
	return NUMINT([UIApplication sharedApplication].statusBarOrientation);
}

#pragma mark iPhone namespace

#ifdef USE_TI_UIIPHONE
-(id)iPhone
{
	if (iphone==nil)
	{
		// cache it since it's used alot
		iphone = [[TiUIiPhoneProxy alloc] _initWithPageContext:[self pageContext]];
	}
	return iphone;
}
#endif

#ifdef USE_TI_UIIPAD
-(id)iPad
{
	if (ipad==nil)
	{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
		if ([TiUtils isiPhoneOS3_2OrGreater] && [TiUtils isIPad])
		{
			ipad = [[TiUIiPadProxy alloc] _initWithPageContext:[self pageContext]];
		}
#endif
	}
	return ipad;
}
#endif

#pragma mark Internal Memory Management

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
#ifdef USE_TI_UIIPHONE
	RELEASE_TO_NIL(iphone);
#endif
#ifdef USE_TI_UIIPAD
	RELEASE_TO_NIL(ipad);
#endif
	[super didReceiveMemoryWarning:notification];
}

@end

#endif