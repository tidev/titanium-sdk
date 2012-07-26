/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_UI

#import "TiDimension.h"
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
#ifdef USE_TI_UIIOS
#import "TiUIiOSProxy.h"
#endif
#ifdef USE_TI_UICLIPBOARD
#import "TiUIClipboardProxy.h"
#endif
#ifdef USE_TI_UICOVERFLOWVIEW
	#import "TiUIiOSCoverFlowViewProxy.h"
#endif
#ifdef USE_TI_UITOOLBAR
	#import "TiUIiOSToolbarProxy.h"
#endif
#ifdef USE_TI_UITABBEDBAR
    #import "TiUIiOSTabbedBarProxy.h"
#endif
#import "TiApp.h"
#import "ImageLoader.h"
#import "Webcolor.h"
#import "TiUtils.h"

@implementation UIModule

-(void)dealloc
{
#ifdef USE_TI_UIIPHONE
    [self forgetProxy:iphone];
	RELEASE_TO_NIL(iphone);
#endif
#ifdef USE_TI_UIIPAD
    [self forgetProxy:ipad];
    RELEASE_TO_NIL(ipad);
#endif
#ifdef USE_TI_UIIOS
    [self forgetProxy:ios];
    RELEASE_TO_NIL(ios);
#endif
#ifdef USE_TI_UICLIPBOARD	
    [self forgetProxy:clipboard];
    RELEASE_TO_NIL(clipboard);
#endif
	[super dealloc];
}

#pragma mark Public Constants

MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_IN_OUT,UIViewAnimationOptionCurveEaseInOut);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_IN,UIViewAnimationOptionCurveEaseIn);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_EASE_OUT,UIViewAnimationOptionCurveEaseOut);
MAKE_SYSTEM_PROP(ANIMATION_CURVE_LINEAR,UIViewAnimationOptionCurveLinear);

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

/* Because this is a new feature in 4.1, we have to guard against it in both compiling AND runtime.*/
-(NSNumber*)KEYBOARD_DECIMAL_PAD
{
#if __IPHONE_4_1 <= __IPHONE_OS_VERSION_MAX_ALLOWED
	if([[[UIDevice currentDevice] systemVersion] floatValue] >= 4.1){
		return [NSNumber numberWithInt:UIKeyboardTypeDecimalPad];
	}
#endif
	return [NSNumber numberWithInt:UIKeyboardTypeNumbersAndPunctuation];
}

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

MAKE_SYSTEM_PROP(URL_ERROR_AUTHENTICATION,NSURLErrorUserAuthenticationRequired);
MAKE_SYSTEM_PROP(URL_ERROR_BAD_URL,NSURLErrorBadURL);
MAKE_SYSTEM_PROP(URL_ERROR_CONNECT,NSURLErrorCannotConnectToHost);
MAKE_SYSTEM_PROP(URL_ERROR_SSL_FAILED,NSURLErrorSecureConnectionFailed);
MAKE_SYSTEM_PROP(URL_ERROR_FILE,NSURLErrorCannotOpenFile);
MAKE_SYSTEM_PROP(URL_ERROR_FILE_NOT_FOUND,NSURLErrorFileDoesNotExist);
MAKE_SYSTEM_PROP(URL_ERROR_HOST_LOOKUP,NSURLErrorCannotFindHost);
MAKE_SYSTEM_PROP(URL_ERROR_REDIRECT_LOOP,NSURLErrorHTTPTooManyRedirects);
MAKE_SYSTEM_PROP(URL_ERROR_TIMEOUT,NSURLErrorTimedOut);
MAKE_SYSTEM_PROP(URL_ERROR_UNKNOWN,NSURLErrorUnknown);
MAKE_SYSTEM_PROP(URL_ERROR_UNSUPPORTED_SCHEME,NSURLErrorUnsupportedURL);

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_NORMAL,kCGBlendModeNormal, @"UI.BLEND_MODE_NORMAL", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_NORMAL");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_MULTIPLY,kCGBlendModeMultiply, @"UI.BLEND_MODE_MULTIPLY", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_MULTIPLY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_SCREEN,kCGBlendModeScreen, @"UI.BLEND_MODE_SCREEN", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_SCREEN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_OVERLAY,kCGBlendModeOverlay, @"UI.BLEND_MODE_OVERLAY", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_OVERLAY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_DARKEN,kCGBlendModeDarken, @"UI.BLEND_MODE_DARKEN", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_DARKEN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_LIGHTEN,kCGBlendModeLighten, @"UI.BLEND_MODE_LIGHTEN", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_LIGHTEN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_COLOR_DODGE,kCGBlendModeColorDodge, @"UI.BLEND_MODE_COLOR_DODGE", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_COLOR_DODGE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_COLOR_BURN,kCGBlendModeColorBurn, @"UI.BLEND_MODE_COLOR_BURN", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_COLOR_BURN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_SOFT_LIGHT,kCGBlendModeSoftLight, @"UI.BLEND_MODE_SOFT_LIGHT", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_SOFT_LIGHT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_HARD_LIGHT,kCGBlendModeHardLight, @"UI.BLEND_MODE_HARD_LIGHT", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_HARD_LIGHT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_DIFFERENCE,kCGBlendModeDifference, @"UI.BLEND_MODE_DIFFERENCE", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_DIFFERENCE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_EXCLUSION,kCGBlendModeExclusion, @"UI.BLEND_MODE_NORMAL", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_NORMAL");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_HUE,kCGBlendModeHue, @"UI.BLEND_MODE_HUE", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_HUE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_SATURATION,kCGBlendModeSaturation, @"UI.BLEND_MODE_SATURATION", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_SATURATION");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_COLOR,kCGBlendModeColor, @"UI.BLEND_MODE_COLOR", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_COLOR");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_LUMINOSITY,kCGBlendModeLuminosity, @"UI.BLEND_MODE_LUMINOSITY", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_LUMINOSITY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_CLEAR,kCGBlendModeClear, @"UI.BLEND_MODE_CLEAR", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_CLEAR");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_COPY,kCGBlendModeCopy, @"UI.BLEND_MODE_COPY", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_COPY");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_SOURCE_IN,kCGBlendModeSourceIn, @"UI.BLEND_MODE_SOURCE_IN", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_SOURCE_IN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_SOURCE_OUT,kCGBlendModeSourceOut, @"UI.BLEND_MODE_SOURCE_OUT", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_SOURCE_OUT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_SOURCE_ATOP,kCGBlendModeSourceAtop, @"UI.BLEND_MODE_SOURCE_ATOP", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_SOURCE_ATOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_DESTINATION_OVER,kCGBlendModeDestinationOver, @"UI.BLEND_MODE_DESTINATION_OVER", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_DESTINATION_OVER");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_DESTINATION_IN,kCGBlendModeDestinationIn, @"UI.BLEND_MODE_DESTINATION_IN", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_DESTINATION_IN");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_DESTINATION_OUT,kCGBlendModeDestinationOut, @"UI.BLEND_MODE_DESTINATION_OUT", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_DESTINATION_OUT");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_DESTINATION_ATOP,kCGBlendModeDestinationAtop, @"UI.BLEND_MODE_DESTINATION_ATOP", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_DESTINATION_ATOP");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_XOR,kCGBlendModeXOR, @"UI.BLEND_MODE_XOR", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_XOR");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_PLUS_DARKER,kCGBlendModePlusDarker, @"UI.BLEND_MODE_PLUS_DARKER", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_PLUS_DARKER");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(BLEND_MODE_PLUS_LIGHTER,kCGBlendModePlusLighter, @"UI.BLEND_MODE_PLUS_LIGHTER", @"1.8.0", @"Ti.UI.iOS.BLEND_MODE_PLUS_LIGHTER");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_NONE,UIDataDetectorTypeNone, @"UI.AUTODETECT_NONE", @"1.8.0", @"Ti.UI.iOS.AUTODETECT_NONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_ALL,UIDataDetectorTypeAll, @"UI.AUTODETECT_ALL", @"1.8.0", @"Ti.UI.iOS.AUTODETECT_ALL");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_PHONE,UIDataDetectorTypePhoneNumber, @"UI.AUTODETECT_PHONE", @"1.8.0", @"Ti.UI.iOS.AUTODETECT_PHONE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_LINK,UIDataDetectorTypeLink, @"UI.AUTODETECT_LINK", @"1.8.0", @"Ti.UI.iOS.AUTODETECT_LINK");

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_ADDRESS,UIDataDetectorTypeAddress, @"UI.AUTODETECT_ADDRESS", @"1.8.0", @"Ti.UI.iOS.AUTODETECT_ADDRESS");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(AUTODETECT_CALENDAR,UIDataDetectorTypeCalendarEvent, @"UI.AUTODETECT_CALENDAR", @"1.8.0", @"Ti.UI.iOS.AUTODETECT_CALENDAR");


-(void)setBackgroundColor:(id)color
{
	TiRootViewController *controller = [[TiApp app] controller];
	[controller setBackgroundColor:[Webcolor webColorNamed:color]];
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
	return [[[TiAnimation alloc] _initWithPageContext:[self executionContext]] autorelease];
}
#endif

-(void)setOrientation:(id)mode
{
	UIInterfaceOrientation orientation = (UIInterfaceOrientation)[TiUtils orientationValue:mode def:(UIDeviceOrientation)UIInterfaceOrientationPortrait];
	TiThreadPerformOnMainThread(^{
		[[TiApp controller] manuallyRotateToOrientation:orientation duration:[[TiApp controller] suggestedRotationDuration]];
	}, NO);
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
		iphone = [[TiUIiPhoneProxy alloc] _initWithPageContext:[self executionContext]];
        [self rememberProxy:iphone];
	}
	return iphone;
}
#endif

#ifdef USE_TI_UIIPAD
-(id)iPad
{
	if (ipad==nil)
	{
        ipad = [[TiUIiPadProxy alloc] _initWithPageContext:[self executionContext]];
        [self rememberProxy:ipad];
	}
	return ipad;
}
#endif

#ifdef USE_TI_UIIOS
-(id)iOS
{
	if (ios==nil)
	{
        ios = [[TiUIiOSProxy alloc] _initWithPageContext:[self executionContext]];
        [self rememberProxy:ios];
	}
	return ios;
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

#ifdef USE_TI_UICLIPBOARD
-(id)Clipboard
{
	if (clipboard==nil)
	{
		clipboard = [[TiUIClipboardProxy alloc] _initWithPageContext:[self executionContext]];
        [self rememberProxy:clipboard];
	}
	return clipboard;
}
#endif

#ifdef USE_TI_UICOVERFLOWVIEW
-(id)createCoverFlowView:(id)args
{
	DEPRECATED_REPLACED(@"UI.createCoverFlowView()",@"1.8.0",@"Ti.UI.iOS.createCoverFlowView()");
	return [[[TiUIiOSCoverFlowViewProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UITOOLBAR
-(id)createToolbar:(id)args
{
	DEPRECATED_REPLACED(@"UI.createToolBar()",@"1.8.0",@"Ti.UI.iOS.createToolbar()");
	return [[[TiUIiOSToolbarProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}
#endif

#ifdef USE_TI_UITABBEDBAR
-(id)createTabbedBar:(id)args
{
    DEPRECATED_REPLACED(@"UI.createTabbedBar()", @"1.8.0",@"Ti.UI.iOS.createTabbedBar()");
    return [[[TiUIiOSTabbedBarProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
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
#ifdef USE_TI_UIIOS
	RELEASE_TO_NIL(ios);
#endif
#ifdef USE_TI_UICLIPBOARD
	RELEASE_TO_NIL(clipboard);
#endif
	[super didReceiveMemoryWarning:notification];
}

-(NSString*)SIZE
{
    return kTiBehaviorSize;
}
-(NSString*)FILL
{
    return kTiBehaviorFill;
}
-(NSString*)UNIT_PX
{
    return kTiUnitPixel;
}
-(NSString*)UNIT_CM
{
    return kTiUnitCm;
}
-(NSString*)UNIT_MM
{
    return kTiUnitMm;
}
-(NSString*)UNIT_IN
{
    return kTiUnitInch;
}
-(NSString*)UNIT_DIP
{
    return kTiUnitDip;
}

-(NSNumber*)convertUnits:(id)args
{
    ENSURE_ARG_COUNT(args, 2);
    
	NSString* convertFromValue;
	NSString* convertToUnits;
    
	ENSURE_ARG_AT_INDEX(convertFromValue, args, 0, NSString);
	ENSURE_ARG_AT_INDEX(convertToUnits, args, 1, NSString);  
    
    float result = 0.0;
    if (convertFromValue != nil && convertToUnits != nil) {
        //Convert to DIP first
        TiDimension fromVal = TiDimensionFromObject(convertFromValue);
        
        if (TiDimensionIsDip(fromVal)) {
            if ([convertToUnits caseInsensitiveCompare:kTiUnitDip]==NSOrderedSame) {
                result = fromVal.value;
            }
            else if ([convertToUnits caseInsensitiveCompare:kTiUnitPixel]==NSOrderedSame) {
                if ([TiUtils isRetinaDisplay]) {
                    result = fromVal.value*2;
                }
                else {
                    result = fromVal.value;
                }
            }
            else if ([convertToUnits caseInsensitiveCompare:kTiUnitInch]==NSOrderedSame) {
                result = convertDipToInch(fromVal.value);
            }
            else if ([convertToUnits caseInsensitiveCompare:kTiUnitCm]==NSOrderedSame) {
                result = convertDipToInch(fromVal.value)*INCH_IN_CM;
            }
            else if ([convertToUnits caseInsensitiveCompare:kTiUnitMm]==NSOrderedSame) {
                result = convertDipToInch(fromVal.value)*INCH_IN_MM;
            }
        }
    }
    
    return [NSNumber numberWithFloat:result];
}


@end

#endif