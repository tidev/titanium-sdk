/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import <Foundation/Foundation.h>
#import "TitaniumModule.h"
#import "WebFont.h"

#define PICKER_SELECTROW	0


BOOL TitaniumPrepareAnimationsForView(NSDictionary * optionObject, UIView * view);

@interface NativeControlProxy : TitaniumProxyObject<UITextViewDelegate,UITextFieldDelegate,UIPickerViewDelegate,UIPickerViewDataSource,UIWebViewDelegate>
{
	//Properties that are stored until the time is right
	BOOL needsLayout;
	BOOL isInBar;
	CGRect	frame;
	BOOL isHidden;




	UIView * view;
	UIBarButtonItem * barButton;



//These need to go into appropriate subclasses.	
	NSString * titleString;
	NSString * messageString;
	TitaniumFontDescription *fontDesc;

	NSString * iconPath;
	int templateValue;
	
	//For buttons
	int buttonStyle;
	
	//Tinting or BG controls
	UIColor * elementColor; //The text color
	UIColor * elementSelectedColor; //The text color on a button being pressed
	UIColor * elementBackgroundColor; //The color that fills the element.
	UIColor * elementBorderColor; //Actually, the color that appears behind the element.
	
	//For Multibutton/segmented
	NSArray * segmentLabelArray;
	NSArray * segmentImageArray;
	int		segmentSelectedIndex;
	
	//Background images
	NSString * backgroundImagePath;
	NSString * backgroundDisabledImagePath;
	NSString * backgroundSelectedImagePath;
	
	//For texts
	UITextAutocapitalizationType autocapitalizationType; // default is UITextAutocapitalizationTypeNone
	UITextAutocorrectionType autocorrectionType;         // default is UITextAutocorrectionTypeDefault
	UIKeyboardType keyboardType;                         // default is UIKeyboardTypeDefault
	UIKeyboardAppearance keyboardAppearance;             // default is UIKeyboardAppearanceDefault
	UIReturnKeyType returnKeyType;                       // default is UIReturnKeyDefault (See note under UIReturnKeyType enum)
	BOOL enablesReturnKeyAutomatically;                  // default is NO (when YES, will automatically disable return key when text widget has zero-length contents, and will automatically enable when text widget has non-zero-length contents)
	BOOL secureTextEntry;      // default is NO
	UITextAlignment         textAlignment;
	UITextBorderStyle       borderStyle;
	BOOL                    clearsOnBeginEditing;
	BOOL					surpressReturnCharacter;
	BOOL                    passwordMask;
	UITextFieldViewMode	clearButtonMode;
	NativeControlProxy	*leftViewProxy;
	UITextFieldViewMode	leftViewMode;   
	NativeControlProxy	*rightViewProxy;
	UITextFieldViewMode	rightViewMode;  
	
	
	
	NSString * placeholderText;
	
	//Yes, even integer and bools are represented as floats.
	float minValue;		//Default is 0
	float maxValue;		//Default is 1
	float floatValue;	//Default is 0
	NSString * stringValue;
	
	//Connections to the native side
	UILabel * labelView;
	UIView * nativeView;
	
	//Pickers, date:
	NSDate * dateValue;		//Countdown duration is floatValue
//	NSDate * oldDateValue; //For some reason, datepicker gets strange when you ask it for its date
	NSDate * minDate;
	NSDate * maxDate;
	UIDatePickerMode datePickerMode;
	int		minuteInterval;
	
	//Pickers, general purpose
	BOOL	showSelectionIndicator;
	NSMutableArray * pickerColumnsArray;
	NSURL * baseURL;
	
	// Keyboard toolbar proxies
	NSMutableArray *keyboardToolbarProxies;
	int keyboardToolbarHeight;
	UIColor *keyboardToolbarColor;
}

//Class methods. Do not override.
+ (void) registerAsClassNamed: (NSString *)JSClassName;

+ (NSString *) requestToken;
+ (id) controlProxyForToken: (NSString *) tokenString;
+ (id) controlProxyWithDictionary: (NSDictionary *) inputDict relativeToUrl: (NSURL *) baseUrl;


//This is the initializer you should overwrite.
- (void) readState: (id) inputState relativeToUrl: (NSURL *) baseUrl;

//Convenience properties that all subclasses can use.
@property(nonatomic,readwrite,assign)	CGRect	frame;
@property(nonatomic,readwrite,assign)	BOOL isHidden;
@property(nonatomic,readwrite,assign)	BOOL needsLayout;
@property(nonatomic,readwrite,assign)	BOOL isInBar;
//- (void) setNeedsLayout;	//TODO: improve implementation.





@property(nonatomic,readonly)	UIView * view;
@property(nonatomic,readonly)	UIBarButtonItem * barButton;
@property(nonatomic,readonly)	UIView * barButtonView;
- (BOOL) hasView;
- (BOOL) hasBarButton;

- (BOOL) isFirstResponder;
- (BOOL) becomeFirstResponder;
- (BOOL) resignFirstResponder;










//The following need exporting into subclasses:
@property(nonatomic,readwrite,copy)		NSString * titleString;
@property(nonatomic,readwrite,copy)		NSString * messageString;
@property(nonatomic,readwrite,copy)		NSString * iconPath;
@property(nonatomic,readwrite,assign)	int templateValue;
@property(nonatomic,readwrite,assign)	int buttonStyle;
@property(nonatomic,readwrite,assign)	BOOL surpressReturnCharacter;

@property(nonatomic,readwrite,copy)		NSString * backgroundImagePath;
@property(nonatomic,readwrite,copy)		NSString * backgroundDisabledImagePath;
@property(nonatomic,readwrite,copy)		NSString * backgroundSelectedImagePath;

@property(nonatomic,readwrite,copy)		NSArray * segmentLabelArray;
@property(nonatomic,readwrite,copy)		NSArray * segmentImageArray;
@property(nonatomic,readwrite,assign)	int segmentSelectedIndex;

@property(nonatomic,readwrite,retain)	UIColor * elementColor;
@property(nonatomic,readwrite,retain)	UIColor * elementBackgroundColor;
@property(nonatomic,readwrite,retain)	UIColor * elementBorderColor;

@property(nonatomic,readwrite,assign)	float minValue;	
@property(nonatomic,readwrite,assign)	float maxValue;	
@property(nonatomic,readwrite,assign)	float floatValue;
@property(nonatomic,readwrite,copy)		NSString * stringValue;

@property(nonatomic,readwrite,copy)		NSString * placeholderText;

@property(nonatomic,readwrite,assign)	UITextFieldViewMode	leftViewMode;	
@property(nonatomic,readwrite,assign)	UITextFieldViewMode	rightViewMode;	
@property(nonatomic,readwrite,retain)	NativeControlProxy	*leftViewProxy;
@property(nonatomic,readwrite,retain)	NativeControlProxy	*rightViewProxy;

@property(nonatomic,readwrite,copy)		NSDate * dateValue;
//@property(nonatomic,readwrite,copy)		NSDate * oldDateValue;
@property(nonatomic,readwrite,copy)		NSDate * minDate;
@property(nonatomic,readwrite,copy)		NSDate * maxDate;
@property(nonatomic,readwrite,assign)	UIDatePickerMode datePickerMode;
@property(nonatomic,readwrite,assign)	int		minuteInterval;


- (IBAction) onClick: (id) sender;

- (void) refreshPositionWithWebView: (UIWebView *) webView animated:(BOOL)animated;

- (void) reportEvent: (NSString *) eventType value: (NSString *) newValue index: (int) index init:(NSString *)customInit arguments:(NSString *)extraArgs;

@end

extern NSString * const systemButtonString;

extern NSString * const createButtonString;
extern NSString * const createActivityIndicatorString;
extern NSString * const createDatePickerString;
extern NSString * const createPickerString;

extern NSString * const createModalDatePickerString;
extern NSString * const createModalPickerString;
