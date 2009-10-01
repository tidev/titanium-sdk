/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import <Foundation/Foundation.h>
#import "TitaniumModule.h"
#import "WebFont.h"

enum {
	UITitaniumNativeStyleBar = -32,
	UITitaniumNativeStyleBig = -33,
	UITitaniumNativeStyleDark = -34,
};

enum { //MUST BE NEGATIVE, as it inhabits the same space as UIBarButtonSystemItem
	UITitaniumNativeItemNone = -1, //Also is a bog-standard button.
	UITitaniumNativeItemSpinner = -2,
	UITitaniumNativeItemProgressBar = -3,
	
	UITitaniumNativeItemSlider = -4,
	UITitaniumNativeItemSwitch = -5,
	UITitaniumNativeItemMultiButton = -6,
	UITitaniumNativeItemSegmented = -7,
	
	UITitaniumNativeItemTextView = -8,
	UITitaniumNativeItemTextField = -9,
	UITitaniumNativeItemSearchBar = -10,
	
	UITitaniumNativeItemPicker = -11,
	UITitaniumNativeItemDatePicker = -12,
	
	UITitaniumNativeItemInfoLight = -13,
	UITitaniumNativeItemInfoDark = -14,
};

BOOL TitaniumPrepareAnimationsForView(NSDictionary * optionObject, UIView * view);

@interface NativeControlProxy : TitaniumProxyObject<UITextViewDelegate,UITextFieldDelegate,UIPickerViewDelegate,UIPickerViewDataSource,UIWebViewDelegate>
{
	//Properties that are stored until the time is right
	BOOL needsRefreshing;
	BOOL placedInBar;
	
	NSString * titleString;
	NSString * messageString;
	TitaniumFontDescription fontDesc;

	NSString * iconPath;
	CGRect	frame;
	int templateValue;
	
	//For buttons
	int buttonStyle;
	
	//Tinting or BG controls
	UIColor * elementColor; //The text color
	UIColor * elementSelectedColor; //The text color on a button being pressed
	UIColor * elementBackgroundColor; //The color that fills the element.
	UIColor * elementBorderColor; //Actually, the color that appears behind the element.
	BOOL isHidden;
	
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
	UIView * wrapperView;
	UIView * nativeView;
	UIBarButtonItem * nativeBarButton;
	
	//Pickers, date:
	NSDate * dateValue;		//Countdown duration is floatValue
	NSDate * minDate;
	NSDate * maxDate;
	UIDatePickerMode datePickerMode;
	int		minuteInterval;
	
	//Pickers, general purpose
	BOOL	showSelectionIndicator;
	NSMutableArray * pickerColumnsArray;
	NSURL * baseURL;
}

@property(nonatomic,readwrite,copy)		NSString * titleString;
@property(nonatomic,readwrite,copy)		NSString * messageString;
@property(nonatomic,readwrite,copy)		NSString * iconPath;
@property(nonatomic,readwrite,assign)	int templateValue;
@property(nonatomic,readwrite,assign)	int buttonStyle;
@property(nonatomic,readwrite,assign)	BOOL surpressReturnCharacter;
@property(nonatomic,readwrite,assign)	BOOL isHidden;

@property(nonatomic,readwrite,copy)		NSString * backgroundImagePath;
@property(nonatomic,readwrite,copy)		NSString * backgroundDisabledImagePath;
@property(nonatomic,readwrite,copy)		NSString * backgroundSelectedImagePath;

@property(nonatomic,readwrite,copy)		NSArray * segmentLabelArray;
@property(nonatomic,readwrite,copy)		NSArray * segmentImageArray;
@property(nonatomic,readwrite,assign)	int segmentSelectedIndex;

@property(nonatomic,readwrite,retain)	UIColor * elementColor;
@property(nonatomic,readwrite,retain)	UIColor * elementBackgroundColor;
@property(nonatomic,readwrite,retain)	UIColor * elementBorderColor;

@property(nonatomic,readwrite,retain)	UILabel * labelView;
@property(nonatomic,readwrite,retain)	UIView * wrapperView;
@property(nonatomic,readwrite,retain)	UIView * nativeView;
@property(nonatomic,readwrite,retain)	UIBarButtonItem * nativeBarButton;
- (UIView *) nativeBarView;

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
@property(nonatomic,readwrite,copy)		NSDate * minDate;
@property(nonatomic,readwrite,copy)		NSDate * maxDate;
@property(nonatomic,readwrite,assign)	UIDatePickerMode datePickerMode;
@property(nonatomic,readwrite,assign)	int		minuteInterval;


- (BOOL) hasNativeView;
- (BOOL) hasNativeBarButton;

- (IBAction) onClick: (id) sender;
- (void) setPropertyDict: (NSDictionary *) newDict;

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
