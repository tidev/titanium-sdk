/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiModule.h"

// because alert is linked in Kroll and the user can use that
// in their code instead of the full API, we need to create
// an explicit compile time dependency to UI
#import "TiUIAlertDialogProxy.h"

@interface UIModule : TiModule {

@private
	TiProxy *iphone;
}

//TODO: review these, maybe they need to go on iPhone Animation Style - however, they are platform generic

@property(nonatomic,readonly) NSNumber *ANIMATION_CURVE_EASE_IN_OUT;
@property(nonatomic,readonly) NSNumber *ANIMATION_CURVE_EASE_IN;
@property(nonatomic,readonly) NSNumber *ANIMATION_CURVE_EASE_OUT;
@property(nonatomic,readonly) NSNumber *ANIMATION_CURVE_LINEAR;

@property(nonatomic,readonly) NSNumber *TEXT_ALIGNMENT_LEFT;
@property(nonatomic,readonly) NSNumber *TEXT_ALIGNMENT_CENTER;
@property(nonatomic,readonly) NSNumber *TEXT_ALIGNMENT_RIGHT;

@property(nonatomic,readonly) NSNumber *TEXT_VERTICAL_ALIGNMENT_TOP;
@property(nonatomic,readonly) NSNumber *TEXT_VERTICAL_ALIGNMENT_CENTER;
@property(nonatomic,readonly) NSNumber *TEXT_VERTICAL_ALIGNMENT_BOTTOM;

@property(nonatomic,readonly) NSNumber *RETURNKEY_DEFAULT;
@property(nonatomic,readonly) NSNumber *RETURNKEY_GO;
@property(nonatomic,readonly) NSNumber *RETURNKEY_GOOGLE;
@property(nonatomic,readonly) NSNumber *RETURNKEY_JOIN;
@property(nonatomic,readonly) NSNumber *RETURNKEY_NEXT;
@property(nonatomic,readonly) NSNumber *RETURNKEY_ROUTE;
@property(nonatomic,readonly) NSNumber *RETURNKEY_SEARCH;
@property(nonatomic,readonly) NSNumber *RETURNKEY_SEND;
@property(nonatomic,readonly) NSNumber *RETURNKEY_YAHOO;
@property(nonatomic,readonly) NSNumber *RETURNKEY_DONE;
@property(nonatomic,readonly) NSNumber *RETURNKEY_EMERGENCY_CALL;

@property(nonatomic,readonly) NSNumber *KEYBOARD_DEFAULT;
@property(nonatomic,readonly) NSNumber *KEYBOARD_ASCII;
@property(nonatomic,readonly) NSNumber *KEYBOARD_NUMBERS_PUNCTUATION;
@property(nonatomic,readonly) NSNumber *KEYBOARD_URL;
@property(nonatomic,readonly) NSNumber *KEYBOARD_NUMBER_PAD;
@property(nonatomic,readonly) NSNumber *KEYBOARD_PHONE_PAD;
@property(nonatomic,readonly) NSNumber *KEYBOARD_NAMEPHONE_PAD;
@property(nonatomic,readonly) NSNumber *KEYBOARD_EMAIL;

@property(nonatomic,readonly) NSNumber *KEYBOARD_APPEARANCE_DEFAULT;
@property(nonatomic,readonly) NSNumber *KEYBOARD_APPEARANCE_ALERT;

@property(nonatomic,readonly) NSNumber *TEXT_AUTOCAPITALIZATION_NONE;
@property(nonatomic,readonly) NSNumber *TEXT_AUTOCAPITALIZATION_WORDS;
@property(nonatomic,readonly) NSNumber *TEXT_AUTOCAPITALIZATION_SENTENCES;
@property(nonatomic,readonly) NSNumber *TEXT_AUTOCAPITALIZATION_ALL;

@property(nonatomic,readonly) NSNumber *INPUT_BUTTONMODE_NEVER;
@property(nonatomic,readonly) NSNumber *INPUT_BUTTONMODE_ALWAYS;
@property(nonatomic,readonly) NSNumber *INPUT_BUTTONMODE_ONFOCUS;
@property(nonatomic,readonly) NSNumber *INPUT_BUTTONMODE_ONBLUR;

@property(nonatomic,readonly) NSNumber *INPUT_BORDERSTYLE_NONE;
@property(nonatomic,readonly) NSNumber *INPUT_BORDERSTYLE_LINE;
@property(nonatomic,readonly) NSNumber *INPUT_BORDERSTYLE_BEZEL;
@property(nonatomic,readonly) NSNumber *INPUT_BORDERSTYLE_ROUNDED;

@property(nonatomic,readonly) NSNumber *PORTRAIT;
@property(nonatomic,readonly) NSNumber *LANDSCAPE_LEFT;
@property(nonatomic,readonly) NSNumber *LANDSCAPE_RIGHT;
@property(nonatomic,readonly) NSNumber *UPSIDE_PORTRAIT;
@property(nonatomic,readonly) NSNumber *UNKNOWN;
@property(nonatomic,readonly) NSNumber *FACE_UP;
@property(nonatomic,readonly) NSNumber *FACE_DOWN;

-(id)create2DMatrix:(id)args;
-(id)create3DMatrix:(id)args;
-(id)createAnimation:(id)args;

@property(nonatomic,readonly)			TiProxy* iPhone;



@end
