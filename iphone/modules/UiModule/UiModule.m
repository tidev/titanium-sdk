/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef MODULE_TI_UI

#import "UiModule.h"
#import "Webcolor.h"
#import "TitaniumHost.h"
#import "TitaniumBlobWrapper.h"

#import "TitaniumWebViewController.h"

#import <MessageUI/MessageUI.h>
#import <MessageUI/MFMailComposeViewController.h>


NSDictionary * barButtonSystemItemForStringDict = nil;

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


int barButtonSystemItemForString(NSString * inputString){
	if (barButtonSystemItemForStringDict == nil) {
		barButtonSystemItemForStringDict = [[NSDictionary alloc] initWithObjectsAndKeys:
				[NSNumber numberWithInt:UIBarButtonSystemItemAction],@"action",
				[NSNumber numberWithInt:UIBarButtonSystemItemBookmarks],@"bookmarks",
				[NSNumber numberWithInt:UIBarButtonSystemItemCamera],@"camera",
				[NSNumber numberWithInt:UIBarButtonSystemItemCompose],@"compose",
				[NSNumber numberWithInt:UIBarButtonSystemItemDone],@"done",
				[NSNumber numberWithInt:UIBarButtonSystemItemCancel],@"cancel",
				[NSNumber numberWithInt:UIBarButtonSystemItemEdit],@"edit",
				[NSNumber numberWithInt:UIBarButtonSystemItemSave],@"save",
				[NSNumber numberWithInt:UIBarButtonSystemItemAdd],@"add",
				[NSNumber numberWithInt:UIBarButtonSystemItemFlexibleSpace],@"flexiblespace",
				[NSNumber numberWithInt:UIBarButtonSystemItemFixedSpace],@"fixedspace",
				[NSNumber numberWithInt:UIBarButtonSystemItemReply],@"reply",
				[NSNumber numberWithInt:UIBarButtonSystemItemOrganize],@"organize",
				[NSNumber numberWithInt:UIBarButtonSystemItemSearch],@"search",
				[NSNumber numberWithInt:UIBarButtonSystemItemRefresh],@"refresh",
				[NSNumber numberWithInt:UIBarButtonSystemItemStop],@"stop",
				[NSNumber numberWithInt:UIBarButtonSystemItemTrash],@"trash",
				[NSNumber numberWithInt:UIBarButtonSystemItemPlay],@"play",
				[NSNumber numberWithInt:UIBarButtonSystemItemPause],@"pause",
				[NSNumber numberWithInt:UIBarButtonSystemItemRewind],@"rewind",
				[NSNumber numberWithInt:UIBarButtonSystemItemFastForward],@"fastforward",
				[NSNumber numberWithInt:UITitaniumNativeItemSpinner],@"activity",
				[NSNumber numberWithInt:UITitaniumNativeItemSlider],@"slider",
				[NSNumber numberWithInt:UITitaniumNativeItemSwitch],@"switch",
				[NSNumber numberWithInt:UITitaniumNativeItemPicker],@"picker",
				[NSNumber numberWithInt:UITitaniumNativeItemDatePicker],@"datepicker",
				[NSNumber numberWithInt:UITitaniumNativeItemTextField],@"text",
				[NSNumber numberWithInt:UITitaniumNativeItemTextView],@"textarea",
				[NSNumber numberWithInt:UITitaniumNativeItemSearchBar],@"search",
				[NSNumber numberWithInt:UITitaniumNativeItemMultiButton],@"multibutton",
				[NSNumber numberWithInt:UITitaniumNativeItemSegmented],@"segmented",
				[NSNumber numberWithInt:UITitaniumNativeItemInfoLight],@"infolight",
				[NSNumber numberWithInt:UITitaniumNativeItemInfoDark],@"infodark",
				[NSNumber numberWithInt:UITitaniumNativeItemProgressBar],@"progressbar",
				nil];
	}
	NSNumber * result = [barButtonSystemItemForStringDict objectForKey:[inputString lowercaseString]];
	if (result != nil) return [result intValue];
	return UITitaniumNativeItemNone;
}

@implementation UIButtonProxy
@synthesize nativeBarButton, segmentLabelArray, segmentImageArray, segmentSelectedIndex;
@synthesize titleString, iconPath, templateValue, buttonStyle, nativeView, labelView, wrapperView;
@synthesize minValue,maxValue,floatValue,stringValue, placeholderText, isHidden;
@synthesize elementColor, elementBorderColor, elementBackgroundColor, messageString;
@synthesize leftViewProxy, rightViewProxy, leftViewMode, rightViewMode, surpressReturnCharacter;
@synthesize backgroundImagePath, backgroundDisabledImagePath, backgroundSelectedImagePath;

- (id) init;
{
	if ((self = [super init])){
		templateValue = UITitaniumNativeItemNone;
		maxValue = 1.0;
		segmentSelectedIndex = -1;
		buttonStyle = -1; 
	}
	return self;
}

#define GRAB_IF_SELECTOR(keyString,methodName,resultOutput)	\
	{id newObject=[newDict objectForKey:keyString];	\
	if ([newObject respondsToSelector:@selector(methodName)]){	\
		resultOutput = [newObject methodName];	\
		needsRefreshing = YES;	\
	}}

#define GRAB_IF_STRING(keyString,resultOutput)	\
	{id newObject=[newDict objectForKey:keyString];	\
	if ([newObject isKindOfClass:[NSString class]] && ![resultOutput isEqualToString:newObject]) {	\
		self.resultOutput = newObject;	\
		needsRefreshing = YES;	\
	}}

- (void) setPropertyDict: (NSDictionary *) newDict;
{	
//General purpose
	GRAB_IF_STRING(@"title",titleString);
	GRAB_IF_STRING(@"message",messageString);
	GRAB_IF_STRING(@"image",iconPath);
	GRAB_IF_STRING(@"backgroundImage",backgroundImagePath);
	GRAB_IF_STRING(@"backgroundDisabledImage",backgroundDisabledImagePath);
	GRAB_IF_STRING(@"backgroundSelectedImage",backgroundSelectedImagePath);
	
//Sliders and other value-based things.
	GRAB_IF_SELECTOR(@"min",floatValue,minValue);
	GRAB_IF_SELECTOR(@"max",floatValue,maxValue);

	id valueObject = [newDict objectForKey:@"value"];
	if (valueObject == nil) valueObject = [newDict objectForKey:@"pos"];

	if ([valueObject respondsToSelector:@selector(floatValue)]){
		floatValue = [valueObject floatValue];
		needsRefreshing = YES;
	}
	if ([valueObject respondsToSelector:@selector(stringValue)]){
		[self setStringValue:[valueObject stringValue]];
		needsRefreshing = YES;
	} else if ([valueObject isKindOfClass:[NSString class]]) {
		[self setStringValue:valueObject];
		needsRefreshing = YES;
	}

//Segmented
	GRAB_IF_SELECTOR(@"index",intValue,segmentSelectedIndex);

	id labelArray = [newDict objectForKey:@"labels"];
	if ([labelArray isKindOfClass:[NSArray class]]){
		[self setSegmentLabelArray:labelArray];
	} else if (labelArray == [NSNull null]){
		[self setSegmentLabelArray:nil];
	}

	id imageArray = [newDict objectForKey:@"images"];
	if ([imageArray isKindOfClass:[NSArray class]]){
		[self setSegmentImageArray:imageArray];
	} else if (imageArray == [NSNull null]) {
		[self setSegmentImageArray:nil];
	}

//Colors
	id bgColorObject = [newDict objectForKey:@"backgroundColor"];
	if (bgColorObject != nil)[self setElementBackgroundColor:UIColorWebColorNamed(bgColorObject)];

	id colorObject = [newDict objectForKey:@"color"];
	if (colorObject != nil)[self setElementColor:UIColorWebColorNamed(colorObject)];

	id borderColorObject = [newDict objectForKey:@"borderColor"];
	if (borderColorObject != nil)[self setElementBorderColor:UIColorWebColorNamed(borderColorObject)];

//Sizes
	GRAB_IF_SELECTOR(@"width",floatValue,frame.size.width);
	GRAB_IF_SELECTOR(@"height",floatValue,frame.size.height);
	GRAB_IF_SELECTOR(@"x",floatValue,frame.origin.x);
	GRAB_IF_SELECTOR(@"y",floatValue,frame.origin.y);

//System button	
	id newTemplate = [newDict objectForKey:@"systemButton"];
	if ([newTemplate isKindOfClass:[NSString class]]) {
		[self setTemplateValue:barButtonSystemItemForString(newTemplate)];
		needsRefreshing = YES;
	} else if ([newTemplate isKindOfClass:[NSNumber class]]) {
		[self setTemplateValue:[newTemplate intValue]];
		needsRefreshing = YES;
	}
	
//Tab bar stuff
	GRAB_IF_SELECTOR(@"style",intValue,buttonStyle);

//Text view/field stuff
	GRAB_IF_SELECTOR(@"autocapitalize",intValue,autocapitalizationType);

	GRAB_IF_SELECTOR(@"enableReturnKey",boolValue,enablesReturnKeyAutomatically);
	GRAB_IF_SELECTOR(@"noReturnCharacter",boolValue,surpressReturnCharacter);

	GRAB_IF_SELECTOR(@"returnKeyType",intValue,returnKeyType);
	GRAB_IF_SELECTOR(@"keyboardType",intValue,keyboardType);

	id autoCorrectObject = [newDict objectForKey:@"autocorrect"];
	if ([autoCorrectObject respondsToSelector:@selector(boolValue)]){
		autocorrectionType = ([autoCorrectObject boolValue]?UITextAutocorrectionTypeYes:UITextAutocorrectionTypeNo);
	} else if (autoCorrectObject == [NSNull null]) {
		autocorrectionType = UITextAutocorrectionTypeDefault;
	}
	
	GRAB_IF_STRING(@"hintText",placeholderText);

	id alignmentObject = [newDict objectForKey:@"textAlign"];
	if ([alignmentObject isKindOfClass:[NSString class]]){
		alignmentObject = [alignmentObject lowercaseString];
		if ([alignmentObject isEqualToString:@"left"]) textAlignment = UITextAlignmentLeft;
		else if ([alignmentObject isEqualToString:@"center"]) textAlignment = UITextAlignmentCenter;
		else if ([alignmentObject isEqualToString:@"right"]) textAlignment = UITextAlignmentRight;
	}

	GRAB_IF_SELECTOR(@"clearOnEdit",boolValue,clearsOnBeginEditing);
	GRAB_IF_SELECTOR(@"hidden",boolValue,isHidden);

	GRAB_IF_SELECTOR(@"passwordMask",boolValue,passwordMask);

	GRAB_IF_SELECTOR(@"borderStyle",intValue,borderStyle);
	
	GRAB_IF_SELECTOR(@"clearButtonMode",intValue,clearButtonMode);
	GRAB_IF_SELECTOR(@"leftButtonMode",intValue,leftViewMode);
	GRAB_IF_SELECTOR(@"rightButtonMode",intValue,rightViewMode);
	
	//Because the proxies are best from the UIModule itself, we don't check here.
}

- (void) setLabelViewFrame: (CGRect) newFrame background: (UIColor *) bgColor;
{
	if(labelView == nil){
		labelView = [[UILabel alloc] initWithFrame:newFrame];
		[labelView setAdjustsFontSizeToFitWidth:YES];
		[labelView setMinimumFontSize:9.0];
	} else {
		[labelView setFrame:newFrame];
	}
	
	[labelView setText:messageString];
	[labelView setFont:[UIFont systemFontOfSize:newFrame.size.height-4]];
	[labelView setBackgroundColor:((bgColor != nil)?bgColor:[UIColor clearColor])];
	[labelView setTextColor:((elementColor != nil)?elementColor:[UIColor whiteColor])];
	
	if([labelView superview]!=wrapperView){
		[wrapperView addSubview:labelView];
	}
}

- (BOOL) updateNativeView;
{
	UIView * resultView=nil;
	BOOL customPlacement = NO;

	if(wrapperView == nil){
		wrapperView = [[UIView alloc] init];
	}
	

	CGRect viewFrame=frame;
	if (placedInBar){
		viewFrame.size.height = 30.0;
		if (wrapperView != nil) viewFrame.origin = [wrapperView frame].origin;
	} else if (viewFrame.size.height < 2) viewFrame.size.height = 20;
	if (viewFrame.size.width < 2) viewFrame.size.width = 30;

	if (templateValue == UITitaniumNativeItemSpinner){
		UIActivityIndicatorViewStyle spinnerStyle;
		switch (buttonStyle) {
			case UITitaniumNativeStyleBig:
				spinnerStyle = UIActivityIndicatorViewStyleWhiteLarge;
				break;
			case UITitaniumNativeStyleDark:
				spinnerStyle = UIActivityIndicatorViewStyleGray;
				break;
			default:
				spinnerStyle = UIActivityIndicatorViewStyleWhite;
				break;
		}
		if ([nativeView isKindOfClass:[UIActivityIndicatorView class]]){
			resultView = [nativeView retain];
			[(UIActivityIndicatorView *)resultView setActivityIndicatorViewStyle:spinnerStyle];
		} else {
			resultView = [[UIActivityIndicatorView alloc] initWithActivityIndicatorStyle:spinnerStyle];
			[(UIActivityIndicatorView *)resultView startAnimating];
		}
		if(titleString != nil){
			CGRect newResultFrame = [resultView frame];
			viewFrame.size.height = newResultFrame.size.height;
			newResultFrame.origin = CGPointZero;
			[resultView setFrame:newResultFrame];
			newResultFrame.origin.x = newResultFrame.size.width + 5;
			newResultFrame.size.width = viewFrame.size.width - newResultFrame.origin.x;
			[self setLabelViewFrame:newResultFrame background:elementBorderColor];
			[labelView setTextAlignment:UITextAlignmentLeft];
			customPlacement = YES;
		} else {
			viewFrame.size = [(UIView *)resultView frame].size;
		}
		[resultView setBackgroundColor:elementBorderColor];

	} else if (templateValue == UITitaniumNativeItemSlider){
		if ([nativeView isKindOfClass:[UISlider class]]){
			resultView = [nativeView retain];
		} else {
			resultView = [[UISlider alloc] initWithFrame:viewFrame];
			[(UISlider *)resultView addTarget:self action:@selector(onValueChange:) forControlEvents:UIControlEventValueChanged];
		}
		[(UISlider *)resultView setMinimumValue:minValue];
		[(UISlider *)resultView setMaximumValue:maxValue];
		[(UISlider *)resultView setValue:floatValue];
		[resultView setBackgroundColor:elementBorderColor];
		

	} else if (templateValue == UITitaniumNativeItemSwitch){
		if ([nativeView isKindOfClass:[UISwitch class]]){
			resultView = [nativeView retain];
		} else {
			resultView = [[UISwitch alloc] initWithFrame:viewFrame];
			[(UISwitch *)resultView addTarget:self action:@selector(onSwitchChange:) forControlEvents:UIControlEventValueChanged];
		}
		[(UISwitch *)resultView setOn:(floatValue > ((minValue + maxValue)/2))];
		[resultView setBackgroundColor:elementBorderColor];

	} else if ((templateValue == UITitaniumNativeItemTextField) || (templateValue == UITitaniumNativeItemTextView)){
		if (viewFrame.size.height < 20) viewFrame.size.height = 20;
		
		if (templateValue == UITitaniumNativeItemTextField){
			if ([nativeView isKindOfClass:[UITextField class]]){
				resultView = [nativeView retain];
			} else {
				resultView = [[UITextField alloc] initWithFrame:viewFrame];
				[(UITextField *)resultView setDelegate:self];
			}
			[(UITextField *)resultView setPlaceholder:placeholderText];
			[(UITextField *)resultView setBorderStyle:borderStyle];
			[(UITextField *)resultView setClearsOnBeginEditing:clearsOnBeginEditing];
			[(UITextField *)resultView setClearButtonMode:clearButtonMode];
			[(UITextField *)resultView setLeftViewMode:leftViewMode];
			[(UITextField *)resultView setLeftView:[leftViewProxy nativeView]];
			[(UITextField *)resultView setRightViewMode:rightViewMode];
			[(UITextField *)resultView setRightView:[rightViewProxy nativeView]];
			[(UITextField *)resultView setSecureTextEntry:passwordMask];
			
			TitaniumHost * theHost = [TitaniumHost sharedHost];
			UIImage * bgImage = [theHost stretchableImageForResource:backgroundImagePath];
			[(UITextField *)resultView setBackground:bgImage];

			if(bgImage != nil){
				UIImage * bgDisImage = [theHost stretchableImageForResource:backgroundDisabledImagePath];
				[(UITextField *)resultView setDisabledBackground:bgDisImage];
			} else if (borderStyle == UITextBorderStyleRoundedRect){
				[resultView setBackgroundColor:elementBorderColor];
			} else {
				[resultView setBackgroundColor:elementBackgroundColor];
			}
			
		} else {
			if ([nativeView isKindOfClass:[UITextView class]]){
				resultView = [nativeView retain];
			} else {
				resultView = [[UITextView alloc] initWithFrame:viewFrame];
				[(UITextView *)resultView setDelegate:self];
			}
			[resultView setBackgroundColor:elementBackgroundColor];
		}
		if (elementColor != nil) [(UITextField *)resultView setTextColor:elementColor];
		[(UITextField *)resultView setText:stringValue];
		[(UITextField *)resultView setAutocorrectionType:autocorrectionType];
		[(UITextField *)resultView setAutocapitalizationType:autocapitalizationType];
		[(UITextField *)resultView setTextAlignment:textAlignment];
		[(UITextField *)resultView setKeyboardType:keyboardType];
		[(UITextField *)resultView setReturnKeyType:returnKeyType];
		[(UITextField *)resultView setEnablesReturnKeyAutomatically:enablesReturnKeyAutomatically];
		

	} else if ((templateValue == UITitaniumNativeItemMultiButton) || (templateValue == UITitaniumNativeItemSegmented)){
//		if (placedInBar) viewFrame.size.height = 30;
		int imageCount = [segmentImageArray count];
		int titleCount = [segmentLabelArray count];
		int segmentCount = MAX(imageCount,titleCount);
		
		TitaniumHost * theHost = [TitaniumHost sharedHost];
		NSMutableArray * thingArray = [[NSMutableArray alloc] initWithCapacity:segmentCount];
		for(int segmentIndex=0; segmentIndex < segmentCount; segmentIndex ++){
			UIImage * thisImage;
			if(segmentIndex < imageCount){
				thisImage = [theHost imageForResource:[segmentImageArray objectAtIndex:segmentIndex]];
			} else {
				thisImage = nil;
			}
			
			NSString * thisTitle;
			if(segmentIndex < titleCount){
				thisTitle = [segmentLabelArray objectAtIndex:segmentIndex];
			} else {
				thisTitle = nil;
			}
			
			if(thisImage != nil){
				[thingArray addObject:thisImage];
//				[(UISegmentedControl *)resultView insertSegmentWithImage:thisImage atIndex:segmentIndex animated:NO];
			} else if ([thisTitle isKindOfClass:[NSString class]]){
				[thingArray addObject:thisTitle];
//				[(UISegmentedControl *)resultView insertSegmentWithTitle:thisTitle atIndex:segmentIndex animated:NO];
			} else {
				[thingArray addObject:@""];
//				[(UISegmentedControl *)resultView insertSegmentWithTitle:@"" atIndex:segmentIndex animated:NO];
			}
		}
		
		resultView = [[UISegmentedControl alloc] initWithItems:thingArray];
		[thingArray release];
		
		[(UISegmentedControl *)resultView addTarget:self action:@selector(onSegmentChange:) forControlEvents:UIControlEventValueChanged];
		
//		if ([nativeView isKindOfClass:[UISegmentedControl class]]){
//			resultView = [nativeView retain];
//			[(UISegmentedControl *)resultView removeAllSegments];
//		} else {
//			resultView = [[UISegmentedControl alloc] initWithFrame:viewFrame];
//			[(UISegmentedControl *)resultView addTarget:self action:@selector(onSegmentChange:) forControlEvents:UIControlEventValueChanged];
//		}
		if(templateValue==UITitaniumNativeItemMultiButton){
			[(UISegmentedControl *)resultView setMomentary:YES];
		} else {
			[(UISegmentedControl *)resultView setMomentary:NO];
			[(UISegmentedControl *)resultView setSelectedSegmentIndex:segmentSelectedIndex];
		}
		if (placedInBar || (buttonStyle == UITitaniumNativeStyleBar)){
			[(UISegmentedControl *)resultView setSegmentedControlStyle:UISegmentedControlStyleBar];
		} else {
			[(UISegmentedControl *)resultView setSegmentedControlStyle:((buttonStyle==UIBarButtonItemStyleBordered)?UISegmentedControlStyleBar:UISegmentedControlStylePlain)];
		}
		
		if (elementBackgroundColor != nil) [(UISegmentedControl *)resultView setTintColor:elementBackgroundColor];

		CGRect oldFrame = [resultView frame];
		if (viewFrame.size.height < 15) viewFrame.size.height = oldFrame.size.height;
		if (viewFrame.size.width < oldFrame.size.width) viewFrame.size.width = oldFrame.size.width;
		if(elementBorderColor != nil)[resultView setBackgroundColor:elementBorderColor];

	} else if ((templateValue == UITitaniumNativeItemInfoLight) || (templateValue == UITitaniumNativeItemInfoDark)){
		UIButtonType resultType = (templateValue == UITitaniumNativeItemInfoLight)?UIButtonTypeInfoLight:UIButtonTypeInfoDark;

		if([nativeView isKindOfClass:[UIButton class]] && ([(UIButton *)nativeView buttonType]==resultType)){
			resultView = [nativeView retain];
		} else {
			resultView = [[UIButton buttonWithType:resultType] retain];
			[(UIButton *)resultView addTarget:self action:@selector(onClick:) forControlEvents:UIControlEventTouchUpInside];
		}
		
		[resultView setBackgroundColor:elementBorderColor];

//	} else if (templateValue == UITitaniumNativeItemPicker){
//		if ([nativeView isKindOfClass:[UIPickerView class]]){
//			resultView = [nativeView retain];
//		} else {
//			resultView = [[UISwitch alloc] initWithFrame:viewFrame];
//		}
//		[(UISwitch *)resultView setOn:(floatValue > ((minValue + maxValue)/2))];
//		[(UISwitch *)resultView addTarget:self action:@selector(onSwitchChange:) forControlEvents:UIControlEventValueChanged];
	} else if (templateValue == UITitaniumNativeItemProgressBar) {
		UIProgressViewStyle progressStyle = (placedInBar || (buttonStyle == UITitaniumNativeStyleBar))?UIProgressViewStyleBar:UIProgressViewStyleDefault;
		if([nativeView isKindOfClass:[UIProgressView class]]){
			resultView = [nativeView retain];
			[(UIProgressView *)resultView setProgressViewStyle:progressStyle];
		} else {
			resultView = [[UIProgressView alloc] initWithProgressViewStyle:progressStyle];
		}
		[(UIProgressView *)resultView setProgress:(floatValue - minValue)/(maxValue - minValue)];
		
		if(titleString != nil){
			CGRect newResultFrame = [resultView frame];
			
			newResultFrame.size.width = viewFrame.size.width;
			newResultFrame.origin.x = 0;
			newResultFrame.origin.y = viewFrame.size.height - newResultFrame.size.height;
			
			[resultView setFrame:newResultFrame];
			
			newResultFrame.size.height = newResultFrame.origin.y-2;
			newResultFrame.origin.y = 0;
			[self setLabelViewFrame:newResultFrame background:elementBorderColor];
			[labelView setTextAlignment:UITextAlignmentCenter];
			customPlacement = YES;
		} else {
			viewFrame.size.height = [resultView frame].size.height;
		}
		
		
	}
	
	
	if (resultView == nil) {
		TitaniumHost * theHost = [TitaniumHost sharedHost];
		UIImage * bgImage = [theHost stretchableImageForResource:backgroundImagePath];

		UIButtonType resultType = ((bgImage==nil) && (buttonStyle != UIBarButtonItemStylePlain))?UIButtonTypeRoundedRect:UIButtonTypeCustom;

		if([nativeView isKindOfClass:[UIButton class]] && ([(UIButton *)nativeView buttonType]==resultType)){
			resultView = [nativeView retain];
		} else {
			resultView = [[UIButton buttonWithType:resultType] retain];
			[(UIButton *)resultView addTarget:self action:@selector(onClick:) forControlEvents:UIControlEventTouchUpInside];
		}
	
		if(bgImage != nil){
			[(UIButton *)resultView setBackgroundImage:bgImage forState:UIControlStateNormal];

			UIImage * bgSelImage = [theHost stretchableImageForResource:backgroundSelectedImagePath];
			if(bgSelImage != nil){
				[(UIButton *)resultView setBackgroundImage:bgSelImage forState:UIControlStateHighlighted];
//				[(UIButton *)resultView setAdjustsImageWhenHighlighted:YES];
			} else {
				[(UIButton *)resultView setBackgroundImage:nil forState:UIControlStateHighlighted];
//				[(UIButton *)resultView setAdjustsImageWhenHighlighted:NO];
			}
			
			UIImage * bgDisImage = [theHost stretchableImageForResource:backgroundDisabledImagePath];
			if(bgDisImage != nil){
				[(UIButton *)resultView setBackgroundImage:bgDisImage forState:UIControlStateDisabled];
//				[(UIButton *)resultView setAdjustsImageWhenDisabled:NO];
			} else {
				[(UIButton *)resultView setBackgroundImage:nil forState:UIControlStateDisabled];
//				[(UIButton *)resultView setAdjustsImageWhenDisabled:YES];
			}
		}
		
		UIImage * iconImage = [theHost imageForResource:iconPath];
		[(UIButton *)resultView setImage:iconImage forState:UIControlStateNormal];
		[(UIButton *)resultView setTitle:titleString forState:UIControlStateNormal];
		if (elementColor != nil) [(UIButton *)resultView setTitleColor:elementColor forState:UIControlStateNormal];
		else if(resultType == UIButtonTypeCustom)[(UIButton *)resultView setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
		
		if (elementSelectedColor != nil) [(UIButton *)resultView setTitleColor:elementSelectedColor forState:UIControlStateHighlighted];
		else if(resultType == UIButtonTypeCustom)[(UIButton *)resultView setTitleColor:[UIColor whiteColor] forState:UIControlStateHighlighted];
		
		[resultView setBackgroundColor:elementBorderColor];
	}
	
	[wrapperView setFrame:viewFrame];
	if(!customPlacement){
		[labelView removeFromSuperview];
		viewFrame.origin = CGPointZero;
		[resultView setFrame:viewFrame];
	}
	[resultView setHidden:isHidden];
	[labelView setHidden:isHidden];
	BOOL isNewView = (nativeView != resultView);
	if(isNewView){
		[wrapperView addSubview:resultView];
		[nativeView removeFromSuperview];
	}
	[nativeView autorelease];
	nativeView = resultView;
	needsRefreshing = NO;
	return isNewView;
}

- (void) updateNativeBarButton;
{
	placedInBar = YES;

	UIBarButtonItem * result = nil;
	UIBarButtonItemStyle barButtonStyle = ((buttonStyle<0)?UIBarButtonItemStylePlain:buttonStyle);
	SEL onClickSel = @selector(onClick:);
	
	if (templateValue <= UITitaniumNativeItemSpinner){
		[self updateNativeView];
		if ([nativeBarButton customView]==wrapperView) {
			result = [nativeBarButton retain]; //Why waste a good bar button?
		} else {
			result = [[UIBarButtonItem alloc] initWithCustomView:wrapperView];
		}

		[result setStyle:barButtonStyle];

	} else if (templateValue != UITitaniumNativeItemNone){
		result = [[UIBarButtonItem alloc] initWithBarButtonSystemItem:templateValue target:self action:onClickSel];

	} else if (iconPath != nil) {
		UIImage * iconImage = [[TitaniumHost sharedHost] imageForResource:iconPath];
		if (iconImage != nil) {
			result = [[UIBarButtonItem alloc] initWithImage:iconImage style:barButtonStyle target:self action:onClickSel];
		}
	} //Because a possibly wrong url, we break the ifelse chain.
	
	if (result == nil) { //Still failed? Use the title.
		result = [[UIBarButtonItem alloc] initWithTitle:titleString style:barButtonStyle target:self action:onClickSel];
	}
	
	[result setWidth:frame.size.width];
	[nativeBarButton autorelease];
	nativeBarButton = result;
	needsRefreshing = NO;
}

- (UIBarButtonItem *) nativeBarButton;
{
	if ((nativeBarButton == nil) || needsRefreshing) {
		[self updateNativeBarButton];
	}
	return nativeBarButton;
}

- (UIView *) nativeBarView;
{
	if ((nativeView == nil) || needsRefreshing){
		placedInBar = YES;
		[self updateNativeView];
	}
	return wrapperView;
}

- (UIView *) nativeView;
{
	if ((nativeView == nil) || needsRefreshing){
		placedInBar = NO;
		[self updateNativeView];
	}
	return wrapperView;
}

- (BOOL) hasNativeView;
{
	return (nativeView != nil);
}

- (BOOL) hasNativeBarButton;
{
	return (nativeBarButton != nil);
}

- (void) updateWithOptions: (NSDictionary *) optionObject;
{
	BOOL animated = NO;
	
	if([optionObject isKindOfClass:[NSDictionary class]]){
		id animatedObject = [optionObject objectForKey:@"animated"];
		if ([animatedObject respondsToSelector:@selector(boolValue)])animated=[animatedObject boolValue];
		
		if (animated) {
			[UIView beginAnimations:nil context:nil];
			if(nativeView != nil){
				id animatedStyleObject = [optionObject objectForKey:@"animationStyle"];
				if ([animatedStyleObject respondsToSelector:@selector(intValue)]){
					[UIView setAnimationTransition:[animatedStyleObject intValue] forView:nativeView cache:YES];
				}
			}

			id animatedDurationObject = [optionObject objectForKey:@"animationDuration"];
			if([animatedDurationObject respondsToSelector:@selector(floatValue)]){
				[UIView setAnimationDuration:[animatedDurationObject floatValue]/1000.0];
			}
		}
	}
	
	[self updateNativeView];


	if (animated){
		[UIView commitAnimations];
	}

}

- (void) reportEvent: (NSString *) eventType value: (NSString *) newValue index: (int) index;
{
	if (newValue == nil) newValue = @"null";
	NSString * handleClickCommand = [NSString stringWithFormat:@"(function(){Titanium.UI._BTN.%@.onClick({type:'%@',value:%@,index:%d});}).call(Titanium.UI._BTN.%@);",token,eventType,newValue,index,token];
	[[TitaniumHost sharedHost] sendJavascript:handleClickCommand toPageWithToken:parentPageToken];
}

- (IBAction) onClick: (id) sender;
{
	[self reportEvent:@"click" value:nil index:0];
}

- (IBAction) onSwitchChange: (id) sender;
{
	[self reportEvent:@"change" value:([(UISwitch *)sender isOn] ? @"true":@"false") index:0];
}

- (void)textFieldDidEndEditing:(UITextField *)textField;
{
	[self reportEvent:@"blur" value:[SBJSON stringify:[textField text]] index:0];
}

- (void)textViewDidEndEditing:(UITextView *)textView;
{
	[self reportEvent:@"blur" value:[SBJSON stringify:[textView text]] index:0];
}

- (void)textFieldDidBeginEditing:(UITextField *)textField;           // became first responder
{
	[self reportEvent:@"focus" value:[SBJSON stringify:[textField text]] index:0];
}

- (void)textViewDidBeginEditing:(UITextView *)textView;
{
	[self reportEvent:@"focus" value:[SBJSON stringify:[textView text]] index:0];
}

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string;   // return NO to not change text
{
	NSString * newText = [[textField text] stringByReplacingCharactersInRange:range withString:string];
	[self reportEvent:@"change" value:[SBJSON stringify:newText] index:0];
	return YES;
}

- (void)textViewDidChange:(UITextView *)textView;
{
	[self reportEvent:@"change" value:[SBJSON stringify:[textView text]] index:0];
}

- (BOOL)textFieldShouldClear:(UITextField *)textField;               // called when clear button pressed. return NO to ignore (no notifications)
{
	[self reportEvent:@"change" value:@"''" index:0];
	return YES;
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField;              // called when 'return' key pressed. return NO to ignore.
{
	[self reportEvent:@"return" value:[SBJSON stringify:[textField text]] index:0];
	return !surpressReturnCharacter;
}


- (IBAction) onSegmentChange: (id) sender;
{
	[self reportEvent:@"click" value:nil index:[(UISegmentedControl *)sender selectedSegmentIndex]];
}

- (IBAction) onValueChange: (id) sender;
{
	NSString * newValue = [[NSString alloc] initWithFormat:@"%f",[(UISlider *)sender value]];
	[self reportEvent:@"change" value:newValue index:0];
	[newValue release];
}
		


- (void) dealloc
{
	[titleString release];
	[iconPath release];
	[nativeBarButton release];
	[super dealloc];
}


@end

@interface ModalProxy : NSObject<UIActionSheetDelegate,UIAlertViewDelegate>
{
	UIActionSheet * actionSheet;
	UIAlertView * alertView;
	UIView * parentView;
	NSString * tokenString;
	NSString * contextString;
}
@property(nonatomic,copy,readwrite)	NSString * tokenString;
@property(nonatomic,copy,readwrite)	NSString * contextString;
@property(nonatomic,retain,readwrite)	UIView * parentView;

- (void) showActionSheetWithDict: (NSDictionary *) inputDict;
- (void) showAlertViewWithDict: (NSDictionary *) inputDict;

@end

@implementation ModalProxy
@synthesize tokenString,contextString,parentView;

- (BOOL) takeToken: (NSDictionary *) inputDict;
{
	NSString * tokenStringObject = [inputDict objectForKey:@"_TOKEN"];
	if (![tokenStringObject isKindOfClass:[NSString class]])return NO;
	[self setTokenString:tokenStringObject];
	
	TitaniumHost * theTH = [TitaniumHost sharedHost];
	[self setContextString:[[theTH currentThread] magicToken]];
	[self setParentView:[[theTH titaniumViewControllerForToken:contextString] view]];
	
	return YES;
}

- (void) showActionSheetWithDict: (NSDictionary *) inputDict;
{
	if (![self takeToken:inputDict])return;

	Class NSStringClass = [NSString class];

	[actionSheet release];
	actionSheet = [[UIActionSheet alloc] init];
	[actionSheet setDelegate:self];
	
	id titleString = [inputDict objectForKey:@"title"];
	if ([titleString respondsToSelector:@selector(stringValue)])titleString = [titleString stringValue];
	if ([titleString isKindOfClass:NSStringClass]) [actionSheet setTitle:titleString];

	BOOL needsCancel = YES;
	NSArray * optionObjectArray = [inputDict objectForKey:@"options"];
	if ([optionObjectArray isKindOfClass:[NSArray class]]){
		for (id buttonTitle in optionObjectArray){
			if([buttonTitle respondsToSelector:@selector(stringValue)])buttonTitle = [buttonTitle stringValue];
			if([buttonTitle isKindOfClass:NSStringClass]){
				[actionSheet addButtonWithTitle:buttonTitle];
				needsCancel = NO;
			} else {
				//Error?
			}
		}
	}

	id destructiveObject = [inputDict objectForKey:@"destructive"];
	if ([destructiveObject respondsToSelector:@selector(intValue)]){
		[actionSheet setDestructiveButtonIndex:[destructiveObject intValue]];
	}

	if (needsCancel) {
		[actionSheet setCancelButtonIndex:[actionSheet addButtonWithTitle:@"OK"]];
	} else {
		id cancelObject = [inputDict objectForKey:@"cancel"];
		if ([cancelObject respondsToSelector:@selector(intValue)]){
			[actionSheet setCancelButtonIndex:[cancelObject intValue]];
		}
	}
	
	UIView * doomedView = [[[TitaniumAppDelegate sharedDelegate] viewController] view];
	[actionSheet performSelectorOnMainThread:@selector(showInView:) withObject:doomedView waitUntilDone:NO];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[self retain];
}

- (void) showAlertViewWithDict: (NSDictionary *) inputDict;
{
	if (![self takeToken:inputDict])return;

	Class NSStringClass = [NSString class];
	
	[alertView release];
	alertView = [[UIAlertView alloc] init];
	[alertView setDelegate:self];
	
	id titleString = [inputDict objectForKey:@"title"];
	if ([titleString respondsToSelector:@selector(stringValue)])titleString = [titleString stringValue];
	if ([titleString isKindOfClass:NSStringClass]) [alertView setTitle:titleString];

	id messageString = [inputDict objectForKey:@"message"];
	if ([messageString respondsToSelector:@selector(stringValue)])messageString = [messageString stringValue];
	if ([messageString isKindOfClass:NSStringClass]) [alertView setMessage:messageString];
	
	BOOL needsCancel = YES;
	NSArray * optionObjectArray = [inputDict objectForKey:@"options"];
	if ([optionObjectArray isKindOfClass:[NSArray class]]){
		for (id buttonTitle in optionObjectArray){
			if([buttonTitle respondsToSelector:@selector(stringValue)])buttonTitle = [buttonTitle stringValue];
			if([buttonTitle isKindOfClass:NSStringClass]){
				[alertView addButtonWithTitle:buttonTitle];
				needsCancel = NO;
			} else {
				//Error?
			}
		}
	}
	
	if (needsCancel) {
		[alertView setCancelButtonIndex:[alertView addButtonWithTitle:@"OK"]];
	} else {
		id cancelObject = [inputDict objectForKey:@"cancel"];
		if ([cancelObject respondsToSelector:@selector(intValue)]){
			[alertView setCancelButtonIndex:[cancelObject intValue]];
		}
	}
	
	[alertView performSelectorOnMainThread:@selector(show) withObject:nil waitUntilDone:NO];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:YES];
	[self retain];
}

- (void)actionSheet:(UIActionSheet *)anActionSheet clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick("
			"{type:'click',index:%d,cancel:%d,destructive:%d})",tokenString,buttonIndex,
			[anActionSheet cancelButtonIndex],[anActionSheet destructiveButtonIndex]];
	
	[[TitaniumHost sharedHost] sendJavascript:result toPageWithToken:contextString];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}

- (void)alertView:(UIAlertView *)anAlertView clickedButtonAtIndex:(NSInteger)buttonIndex;
{
	NSString * result = [NSString stringWithFormat:@"Ti.UI._MODAL.%@.onClick("
			"{type:'click',index:%d,cancel:%d})",tokenString,buttonIndex,[anAlertView cancelButtonIndex]];

	[[TitaniumHost sharedHost] sendJavascript:result toPageWithToken:contextString];
	[[TitaniumAppDelegate sharedDelegate] setIsShowingDialog:NO];
	[self autorelease];
}

- (void) dealloc
{
	[actionSheet release];
	[alertView release];
	[parentView release];
	[tokenString release];
	[contextString release];
	[super dealloc];
}


@end

@interface EmailComposerProxy : TitaniumProxyObject<MFMailComposeViewControllerDelegate>
{
	BOOL animated;
	MFMailComposeViewController * emailComposer;
	NSURL * urlVersion;
}

@property(nonatomic,readwrite,assign)	BOOL animated;

- (void) setPropertyDict: (NSDictionary *) newDict;
- (void) performComposition;

@end

@implementation EmailComposerProxy
@synthesize animated;

- (id) init
{
	self = [super init];
	if (self != nil) {
		animated = YES;
	}
	return self;
}

- (NSString *) sanitizeString:(id) inputObject;
{
	if ([inputObject isKindOfClass:[NSString class]]) return inputObject;
	return nil;
}

- (NSArray *) sanitizeArray:(id) inputObject;
{
	Class stringClass = [NSString class];

	if ([inputObject isKindOfClass:[NSArray class]]){
		for (NSString * thisEntry in inputObject){
			if (![thisEntry isKindOfClass:stringClass]) return nil;
		}
		return inputObject;
	}
	
	if ([inputObject isKindOfClass:stringClass]){
		return [NSArray arrayWithObject:inputObject];
	}
	
	return nil;
}

- (void) setPropertyDict: (NSDictionary *) newDict;
{
	[self setToken:[self sanitizeString:[newDict objectForKey:@"_TOKEN"]]];
	Class mailClass = NSClassFromString(@"MFMailComposeViewController");
	NSString * subject = [self sanitizeString:[newDict objectForKey:@"subject"]];
	NSArray * toArray = [self sanitizeArray:[newDict objectForKey:@"toRecipients"]];
	NSArray * bccArray = [self sanitizeArray:[newDict objectForKey:@"bccRecipients"]];
	NSArray * ccArray = [self sanitizeArray:[newDict objectForKey:@"ccRecipients"]];
	NSString * message = [self sanitizeString:[newDict objectForKey:@"messageBody"]];
	NSArray * attachmentArray = [newDict objectForKey:@"attachments"];
	
	if ((mailClass != nil) && [mailClass canSendMail]){
		if(emailComposer==nil){
			emailComposer = [[mailClass alloc] init];
			[emailComposer setMailComposeDelegate:self];
		}
		[emailComposer setSubject:subject];
		[emailComposer setToRecipients:toArray];
		[emailComposer setBccRecipients:bccArray];
		[emailComposer setCcRecipients:ccArray];
		[emailComposer setMessageBody:message isHTML:NO];
		if([attachmentArray isKindOfClass:[NSArray class]]){
			for (id thisAttachment in attachmentArray){
				if ([thisAttachment isKindOfClass:[TitaniumBlobWrapper class]]){
					[emailComposer addAttachmentData:[(TitaniumBlobWrapper *)thisAttachment dataBlob]
							mimeType:[(TitaniumBlobWrapper *)thisAttachment mimeType]
							fileName:[(TitaniumBlobWrapper *)thisAttachment virtualFileName]];
				}
			}
		}
		return;
	}

	[urlVersion release];
	NSMutableString * resultString = [[NSMutableString alloc] initWithString:@"mailto:"];
	urlVersion = [[NSURL alloc] initWithString:resultString];
	[resultString release];
}

- (void) performComposition;
{
	if (urlVersion != nil){
		[[UIApplication sharedApplication] openURL:urlVersion];
		[self autorelease];
		return;
	}
	UIViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:[self parentPageToken]];
	[[ourVC navigationController] presentModalViewController:emailComposer animated:animated];
}

- (void)mailComposeController:(MFMailComposeViewController *)controller didFinishWithResult:(MFMailComposeResult)result error:(NSError *)error;
{

	if(error){
		NSLog(@"Unexpected composing error: %@",error);
	}

	switch (result) {
		case MFMailComposeResultSent:
			break;
		case MFMailComposeResultSaved:
			break;
		case MFMailComposeResultCancelled:
			break;
		case MFMailComposeResultFailed:
			break;
		default:
			break;
	}
	
	UIViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:[self parentPageToken]];
	[[ourVC navigationController] dismissModalViewControllerAnimated:animated];
	[self autorelease];
}

@end




@implementation UiModule
#pragma mark Utility methods
//- (TitaniumViewController *) titaniumViewControllerForToken: (NSString *) tokenString;
//{
//	if (![tokenString isKindOfClass:[NSString class]]) return nil;
//	TitaniumViewController * ourVC = [virtualWindowsDict objectForKey:tokenString];
//	if(ourVC == nil) {
//		ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
//	}
//	return ourVC;
//}

#pragma mark button

- (NSString *) makeButtonToken;
{
	UIButtonProxy * newProxy = [[UIButtonProxy alloc] init];
	NSString * buttonToken = [NSString stringWithFormat:@"BTN%X",nextButtonToken++];
	[newProxy setToken:buttonToken];
	[buttonContexts setObject:newProxy forKey:buttonToken];
	[newProxy release];
	return buttonToken;
}

- (UIButtonProxy *) proxyForObject: (id) proxyObject scan: (BOOL) scanning recurse: (BOOL) recursion;
{
	NSString * token = nil;
	if ([proxyObject isKindOfClass:[NSDictionary class]]){
		token = [proxyObject objectForKey:@"_TOKEN"];
		if (![token isKindOfClass:[NSString class]]) return nil;
		UIButtonProxy * result = [buttonContexts objectForKey:token];

		if(!scanning)return result;

		NSDictionary * divAttributeDict = [proxyObject objectForKey:@"divAttr"];
		if ([divAttributeDict isKindOfClass:[NSDictionary class]])[result setPropertyDict:divAttributeDict];
		
		[result setPropertyDict:proxyObject];
		
		if (recursion){
			id leftProxy = [proxyObject objectForKey:@"leftButton"];
			if (leftProxy != nil){
				[result setLeftViewProxy:[self proxyForObject:leftProxy scan:YES recurse:NO]];
			}
			id rightProxy = [proxyObject objectForKey:@"rightButton"];
			if (rightProxy != nil){
				[result setLeftViewProxy:[self proxyForObject:rightProxy scan:YES recurse:NO]];
			}
		}
		
		return result;

	} else if ([proxyObject isKindOfClass:[NSString class]]){
		return [buttonContexts objectForKey:proxyObject];
	}

	return nil;
}

- (void) updateButton: (id)proxyObject options: (id) optionObject;
{
	UIButtonProxy * ourProxy = [self proxyForObject:proxyObject scan:YES recurse:YES];
	[ourProxy performSelectorOnMainThread:@selector(updateWithOptions:) withObject:optionObject waitUntilDone:NO];

}

- (void) setButton: (id)proxyObject focus:(id) isFocusObject;
{
	if(![isFocusObject respondsToSelector:@selector(boolValue)]) return;
	
	UIButtonProxy * target = [self proxyForObject:proxyObject scan:NO recurse:YES];
	if (![target hasNativeView]) return;
	
	if ([isFocusObject boolValue]){
		[[target nativeView] performSelectorOnMainThread:@selector(becomeFirstResponder) withObject:nil waitUntilDone:NO];
	} else {
		[[target nativeView] performSelectorOnMainThread:@selector(resignFirstResponder) withObject:nil waitUntilDone:NO];
	}
}

#pragma mark Window actions

- (NSString *) openWindow: (id)windowObject animated: (id) animatedObject; //Defaults to true.
{
	if (![windowObject isKindOfClass:[NSDictionary class]]){
		return nil;
	}
	NSString * token = [windowObject objectForKey:@"_TOKEN"];
	if ([token isKindOfClass:[NSString class]]) return token; //So that it doesn't drop its token.
		
	TitaniumContentViewController * thisVC = [[TitaniumHost sharedHost] currentTitaniumContentViewController];
	TitaniumViewController * resultVC = [TitaniumViewController viewControllerForState:windowObject relativeToUrl:[thisVC currentContentURL]];
	token = [resultVC primaryToken];
	
//	[virtualWindowsDict setObject:resultVC forKey:token];
	id leftNavButton=[windowObject objectForKey:@"lNavBtn"];
	if (leftNavButton != nil){
		[self setWindow:token navSide:[NSNumber numberWithBool:YES] button:leftNavButton options:nil];
	}

	id rightNavButton=[windowObject objectForKey:@"rNavBtn"];
	if (rightNavButton != nil){
		[self setWindow:token navSide:[NSNumber numberWithBool:NO] button:rightNavButton options:nil];
	}
	
	id toolbarObject = [windowObject objectForKey:@"toolbar"];
	if (toolbarObject != nil){
		[self setWindow:token toolbar:toolbarObject options:nil];
	}
	
	BOOL animated = YES;

	if ([animatedObject isKindOfClass:[NSDictionary class]]) animatedObject = [animatedObject objectForKey:@"animated"];
	if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];

	SEL action = animated ? @selector(pushViewControllerAnimated:) : @selector(pushViewControllerNonAnimated:);

	[[thisVC titaniumWindowController] performSelectorOnMainThread:action withObject:resultVC waitUntilDone:NO];
	return token;
}

- (void) closeWindow: (NSString *) tokenString animated: (id) animatedObject; //Defaults to true.
{
	TitaniumViewController * doomedVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[doomedVC setCancelOpening:YES]; //Just in case of race conditions.
	[doomedVC performSelectorOnMainThread:@selector(close:) withObject:animatedObject waitUntilDone:NO];
}

#pragma mark Window Accessors

- (void) setWindow:(NSString *)tokenString URL:(NSString *)newURLString baseURL:(NSString *)baseURLString;
{
	if (![newURLString isKindOfClass:[NSString class]]) return;
	TitaniumWebViewController * ourVC = (id)[[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if(![ourVC isKindOfClass:[TitaniumWebViewController class]])return;

	NSURL * baseURL = nil;
	if ([newURLString isKindOfClass:[NSString class]] && ([newURLString length]>0)){
		baseURL = [NSURL URLWithString:newURLString];
	}

	NSURL * newURL;
	if (baseURL != nil) {
		newURL = [NSURL URLWithString:newURLString relativeToURL:baseURL];
	} else {
		newURL = [NSURL URLWithString:newURLString];
	}

	[ourVC performSelectorOnMainThread:@selector(currentContentURL:) withObject:newURL waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString fullscreen:(id) fullscreenObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setFullscreenObject:) withObject:fullscreenObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString title: (NSString *) newTitle;
{
	if (![newTitle isKindOfClass:[NSString class]]){
		if([newTitle respondsToSelector:@selector(stringValue)]) newTitle = [(id)newTitle stringValue];
		else newTitle = nil;
	}

	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitle:) withObject:newTitle waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString titleImage: (id) newTitleImagePath;
{
	if (![newTitleImagePath isKindOfClass:[NSString class]]){
		newTitleImagePath = nil;
	}

	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitleViewImagePath:) withObject:newTitleImagePath waitUntilDone:NO];	
}

- (void) setWindow:(NSString *)tokenString titleProxy: (id) newTitleProxyObject;
{
	UIButtonProxy * newTitleProxy = [self proxyForObject:newTitleProxyObject scan:YES recurse:YES];
	
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(setTitleViewProxy:) withObject:newTitleProxy waitUntilDone:NO];	
}

- (void) setWindow:(NSString *)tokenString showNavBar: (id) animatedObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(showNavBarWithAnimation:) withObject:animatedObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString hideNavBar: (id) animatedObject;
{
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	[ourVC performSelectorOnMainThread:@selector(hideNavBarWithAnimation:) withObject:animatedObject waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString barColor: (NSString *) newColorName;
{
	UIColor * newColor = UIColorWebColorNamed(newColorName);
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	
	[ourVC performSelectorOnMainThread:@selector(setNavBarTint:) withObject:newColor waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString navSide:(id) isLeftObject button: (NSDictionary *) buttonObject options: (NSDictionary *) optionsObject;
{	
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if ((ourVC == nil) || (![isLeftObject respondsToSelector:@selector(boolValue)])) return;
	
	UIButtonProxy * ourButton = nil;
	if ([buttonObject isKindOfClass:[NSDictionary class]]){
		ourButton = [self proxyForObject:buttonObject scan:YES recurse:YES];
		if (ourButton == nil) return;
	} else if ((buttonObject != nil) && (buttonObject != (id)[NSNull null])) {
		return;
	}
	
	BOOL animated = NO;	
	if([optionsObject isKindOfClass:[NSDictionary class]]){
		id animatedObject = [optionsObject objectForKey:@"animated"];
		if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	}

	SEL actionSelector;
	if([isLeftObject boolValue]){
		actionSelector = animated ? @selector(setLeftNavButtonAnimated:)
				: @selector(setLeftNavButtonNonAnimated:);
	} else {
		actionSelector = animated ? @selector(setRightNavButtonAnimated:)
				: @selector(setRightNavButtonNonAnimated:);
	}
//TODO: Edge cases with the button being applied to a different window?
	[ourVC performSelectorOnMainThread:actionSelector withObject:[ourButton nativeBarButton] waitUntilDone:NO];
}

- (void) setWindow:(NSString *)tokenString toolbar: (id) barObject options: (id) optionsObject;
{
	//OptionsObject is ignored for now.
	//	BOOL animated=NO;
	//	if ([optionsObject isKindOfClass:[NSDictionary class]]){
	//		id animatedObject = [optionsObject objectForKey:@"animated"];
	//		if ([animatedObject respondsToSelector:@selector(boolValue)]) animated = [animatedObject boolValue];
	//	}
	TitaniumViewController * ourVC = [[TitaniumHost sharedHost] titaniumViewControllerForToken:tokenString];
	if (ourVC == nil) return;
	
	if ([barObject isKindOfClass:[NSArray class]]){
		NSMutableArray *result = [NSMutableArray arrayWithCapacity:[barObject count]];
		for (NSDictionary * thisButtonDict in barObject){
			UIButtonProxy * thisProxy = [self proxyForObject:thisButtonDict scan:YES recurse:YES];
			if (thisProxy == nil) return;
			[result addObject:thisProxy];
		}
		
		[ourVC performSelectorOnMainThread:@selector(setToolbarProxies:) withObject:result waitUntilDone:NO];
	} else if ((barObject == nil) || (barObject == [NSNull null])) {
		[ourVC performSelectorOnMainThread:@selector(setToolbarItems:) withObject:nil waitUntilDone:NO];
	}
}

- (void) addWindow: (NSString *) tokenString nativeView: (id) viewObject options: (id) optionsObject;
{
	Class dictClass = [NSDictionary class];
	TitaniumContentViewController * ourVC = [[TitaniumHost sharedHost] titaniumContentViewControllerForToken:tokenString];
	if (![ourVC isKindOfClass:[TitaniumWebViewController class]] || ![viewObject isKindOfClass:dictClass]) return;
	
	UIButtonProxy * ourNativeViewProxy = [self proxyForObject:viewObject scan:YES recurse:YES];
	if (ourNativeViewProxy == nil) return;
	
	[ourVC performSelectorOnMainThread:@selector(addNativeViewProxy:) withObject:ourNativeViewProxy waitUntilDone:NO];
}


#pragma mark Current Window actions

- (void) setTabBadge: (id) newBadge;
{
	NSString * result = nil;
	
	if ([newBadge isKindOfClass:[NSDictionary class]])newBadge=[newBadge objectForKey:@"badge"];
	
	if ([newBadge isKindOfClass:[NSString class]])result=newBadge;
	if ([newBadge respondsToSelector:@selector(stringValue)])result=[newBadge stringValue];
	
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[[currentViewController tabBarItem] performSelectorOnMainThread:@selector(setBadgeValue:) withObject:result waitUntilDone:NO];
}

- (void) setStatusBarStyle: (id) newValue;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[currentViewController performSelectorOnMainThread:@selector(setStatusBarStyleObject:) withObject:newValue waitUntilDone:NO];
}

- (void) setbarStyle: (id) newValue;
{
	TitaniumViewController * currentViewController = [[TitaniumHost sharedHost] currentTitaniumViewController];
	[currentViewController performSelectorOnMainThread:@selector(setNavBarStyleObject:) withObject:newValue waitUntilDone:NO];
}

#pragma mark App-wide actions

- (void) setAppBadge: (id) newBadge;
{
	NSInteger newNumber = 0;
	if([newBadge respondsToSelector:@selector(intValue)]) newNumber=[newBadge intValue];

	[[UIApplication sharedApplication] setApplicationIconBadgeNumber:newNumber];
}

#pragma mark Modal things (alert and options)

- (void) showModal: (NSDictionary *) modalObject isAlert: (id) isAlertObject;
{
	if ((![isAlertObject respondsToSelector:@selector(boolValue)]) || (![modalObject isKindOfClass:[NSDictionary class]])) return;
	ModalProxy * result = [[ModalProxy alloc] init];
	if ([isAlertObject boolValue]){
		[result showAlertViewWithDict:modalObject];
	} else {
		[result showActionSheetWithDict:modalObject];
	}
	
	[result release];
}

#pragma mark Email thingy generation

- (void) openEmailComposer: (NSDictionary *) emailComposerObject options: (NSDictionary *) optionsObject;
{
	Class dictClass = [NSDictionary class];
	if (![emailComposerObject isKindOfClass:dictClass]) return;
	
	EmailComposerProxy * ourProxy = [[EmailComposerProxy alloc] init];
	[ourProxy setPropertyDict:emailComposerObject];
	
	if([optionsObject isKindOfClass:dictClass]){
		NSNumber * isAnimatedObject = [optionsObject objectForKey:@"animated"];
		if ([isAnimatedObject respondsToSelector:@selector(boolValue)]){
			[ourProxy setAnimated:[isAnimatedObject boolValue]];
		}
	}
	
	[ourProxy performSelectorOnMainThread:@selector(performComposition) withObject:nil waitUntilDone:NO];
}


#pragma mark startModule

- (BOOL) startModule;
{
	TitaniumInvocationGenerator * invocGen = [TitaniumInvocationGenerator generatorWithTarget:self];
	
	[(UiModule *)invocGen setWindow:nil title:nil];
	NSInvocation * setTitleInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil titleImage:nil];
	NSInvocation * setTitleImageInvoc = [invocGen invocation];

	[(UiModule *)invocGen setWindow:nil titleProxy:nil];
	NSInvocation * setTitleImageProxyInvoc = [invocGen invocation];

	[(UiModule *)invocGen openWindow:nil animated:nil];
	NSInvocation * openWinInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen closeWindow:nil animated:nil];
	NSInvocation * closeWinInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil URL:nil baseURL:nil];
	NSInvocation * changeWinUrlInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil fullscreen:nil];
	NSInvocation * changeWinFullScreenInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil barColor:nil];
	NSInvocation * changeWinNavColorInvoc = [invocGen invocation];	

	[(UiModule *)invocGen setWindow:nil showNavBar:nil];
	NSInvocation * showNavBarInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil hideNavBar:nil];
	NSInvocation * hideNavBarInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil navSide:nil button:nil options:nil];
	NSInvocation * setNavButtonInvoc = [invocGen invocation];

	[(UiModule *)invocGen makeButtonToken];
	NSInvocation * buttonTokenGen = [invocGen invocation];

	[(UiModule *)invocGen setButton:nil focus:nil];
	NSInvocation * setButtonFocusInvoc = [invocGen invocation];

	[(UiModule *)invocGen setAppBadge:nil];
	NSInvocation * appBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setTabBadge:nil];
	NSInvocation * tabBadgeInvoc = [invocGen invocation];

	[(UiModule *)invocGen setStatusBarStyle:nil];
	NSInvocation * statusBarStyleInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen setWindow:nil toolbar:nil options:nil];
	NSInvocation * updateToolbarInvoc = [invocGen invocation];

	[(UiModule *)invocGen showModal:nil isAlert:nil];
	NSInvocation * showModalInvoc = [invocGen invocation];

	[(UiModule *)invocGen addWindow:nil nativeView:nil options:nil];
	NSInvocation * insertNativeViewInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen openEmailComposer:nil options:nil];
	NSInvocation * emailComposeInvoc = [invocGen invocation];
	
	[(UiModule *)invocGen updateButton:nil options:nil];
	NSInvocation * updateButtonInvoc = [invocGen invocation];
	
	buttonContexts = [[NSMutableDictionary alloc] init];
	
	//NOTE: createWindow doesn't actually create a native-side window. Instead, it simply sets up the dict.
	//The actual actions are performed at open time.
	
	NSString * createEmailString = @"function(args){var res={};for(property in args){res[property]=args[property];};"
			"res.attachments=[];"
			"res.setSubject=function(arg){this.subject=arg;};"
			"res.setToRecipients=function(arg){this.toRecipients=arg;};"
			"res.setCcRecipients=function(arg){this.ccRecipients=arg;};"
			"res.setBccRecipients=function(arg){this.bccRecipients=arg;};"
			"res.setMessageBody=function(arg){this.messageBody=arg;};"
			"res.addAttachment=function(arg){this.attachments.push(arg);};"
			"res.open=function(arg){if(!this._TOKEN){var tkn='eml'+Ti.UI._NEXTTKN++;this._TOKEN=tkn;Ti.UI._EMAIL[tkn]=this;}Ti.UI._OPNEMAIL(this,arg);};"
			"return res;}";
	
	NSString * currentWindowString = @"{"
			"toolbar:{},_EVT:{close:[],unfocused:[],focused:[]},doEvent:Ti._ONEVT,"
			"addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
			"close:function(args){Ti.UI._CLS(Ti._TOKEN,args);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"setBarColor:function(args){Ti.UI._WNAVTNT(Ti._TOKEN,args);},"
			"setURL:function(newUrl){Ti.UI._WURL(Ti._TOKEN,newUrl,document.location);},"
			"setFullscreen:function(newBool){Ti.UI._WFSCN(Ti._TOKEN,newBool);},"
			"setTitle:function(args){Ti.UI._WTITLE(Ti._TOKEN,args);},"
			"showNavBar:function(args){Ti.UI._WSHNAV(Ti._TOKEN,args);},"
			"hideNavBar:function(args){Ti.UI._WHDNAV(Ti._TOKEN,args);},"
			"setTitleImage:function(args){Ti.UI._WTITLEIMG(Ti._TOKEN,args);},"
			"setTitleControl:function(args){if(args)args.ensureToken();Ti.UI._WTITLEPXY(Ti._TOKEN,args);},"
			"setLeftNavButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WNAVBTN(Ti._TOKEN,true,btn,args);},"
			"setRightNavButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WNAVBTN(Ti._TOKEN,false,btn,args);},"
			"setToolbar:function(bar,args){if(bar){var i=bar.length;while(i>0){i--;bar[i].ensureToken();};};"
				"Ti.UI._WTOOL(Ti._TOKEN,bar,args);},"
			"insertButton:function(btn,args){if(btn)btn.ensureToken();Ti.UI._WINSBTN(Ti._TOKEN,btn,args);}"
			"}";

	NSString * createWindowString = @"function(args){var res={};"
			"for(property in args){res[property]=args[property];res['_'+property]=args[property];};"
//			"delete res._TOKEN;"
			"res.setURL=function(newUrl){this.url=newUrl;if(this._TOKEN){Ti.UI._WURL(this._TOKEN,newUrl,document.location);};};"
			"res.setFullscreen=function(newBool){this.fullscreen=newBool;if(this._TOKEN){Ti.UI._WFSCN(this._TOKEN,newBool);};};"
			"res.setTitle=function(args){this.title=args;if(this._TOKEN){Ti.UI._WTITLE(this._TOKEN,args);};};"
			"res.showNavBar=function(args){this._hideNavBar=false;if(this._TOKEN){Ti.UI._WSHNAV(this._TOKEN,args);};};"
			"res.hideNavBar=function(args){this._hideNavBar=true;if(this._TOKEN){Ti.UI._WHDNAV(this._TOKEN,args);};};"
			"res.setTitleControl=function(args){if(args)args.ensureToken();this.titleControl=args;if(this._TOKEN){Ti.UI._WTITLEPXY(this._TOKEN,args);}};"
			"res.setTitleImage=function(args){this.titleImage=args;if(this._TOKEN){Ti.UI._WTITLEIMG(this._TOKEN,args);};};"
			"res.setBarColor=function(args){this.barColor=args;if(this._TOKEN){Ti.UI._WNAVTNT(this._TOKEN,args);};};"
			"res.setLeftNavButton=function(btn,args){if(btn)btn.ensureToken();this.lNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,true,btn,args);};};"
			"res.setRightNavButton=function(btn,args){if(btn)btn.ensureToken();this.rNavBtn=btn;if(this._TOKEN){Ti.UI._WNAVBTN(this._TOKEN,false,btn,args);};};"
			"res.close=function(args){Ti.UI._CLS(this._TOKEN,args);};"
			"res.open=function(args){"
				"if(this.data){var data=this.data;var i=data.length;while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}};"
				"if(this._GRP){var grp=this._GRP;var j=grp.length;while(j>0){j--;var data=grp[j].data;var i=data.length;"
					"while(i>0){i--;var inp=data[i].input;if(inp)inp.ensureToken();}"
				"}};"
				"var res=Ti.UI._OPN(this,args);this._TOKEN=res;};"
			"res.setToolbar=function(bar,args){if(bar){var i=bar.length;while(i>0){i--;bar[i].ensureToken();};};"
				"this.toolbar=bar;"
				"if(this._TOKEN){"
					"Ti.UI._WTOOL(this._TOKEN,bar,args);}};"
			"res.insertButton=function(btn,args){if(btn)btn.ensureToken();Ti.UI._WINSBTN(this._TOKEN,btn,args);};"
			"return res;}";

	NSString * createTableWindowString = @"function(args,callback){var res=Ti.UI.createWindow(args);res._TYPE='table';res._WINTKN=Ti._TOKEN;res.onClick=callback;"
			"var tkn='TBL'+(Ti.UI._NEXTTKN++);Ti.UI._TBL[tkn]=res;res._PATH='Ti.UI._TBL.'+tkn;return res;}";	

	NSString * createGroupedViewString = @"function(args,callback){var res=Ti.UI.createTableView(args,callback);res.grouped=true;"
			"res._GRP=[];res.addSection=function(section){this._GRP.push(section);};return res;}";
	
	NSString * createGroupedSectionString = @"function(args){var res={header:null};for(prop in args){res[prop]=args[prop]};"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;res.onClick=Ti._ONEVT;return res;}";

	NSString * systemButtonStyleString = [NSString stringWithFormat:@"{PLAIN:%d,BORDERED:%d,DONE:%d,BAR:%d,BIG:%d,DARK:%d}",
										  UIBarButtonItemStylePlain,UIBarButtonItemStyleBordered,UIBarButtonItemStyleDone,UITitaniumNativeStyleBar,UITitaniumNativeStyleBig,UITitaniumNativeStyleDark];
	NSString * systemIconString = @"{BOOKMARKS:'ti:bookmarks',CONTACTS:'ti:contacts',DOWNLOADS:'ti:downloads',"
			"FAVORITES:'ti:favorites',DOWNLOADS:'ti:downloads',FEATURED:'ti:featured',MORE:'ti:more',MOST_RECENT:'ti:most_recent',"
			"MOST_VIEWED:'ti:most_viewed',RECENTS:'ti:recents',SEARCH:'ti:search',TOP_RATED:'ti:top_rated'}";
	NSString * systemButtonString = @"{ACTION:'action',ACTIVITY:'activity',CAMERA:'camera',COMPOSE:'compose',BOOKMARKS:'bookmarks',"
			"SEARCH:'search',ADD:'add',TRASH:'trash',ORGANIZE:'organize',REPLY:'reply',STOP:'stop',REFRESH:'refresh',"
			"PLAY:'play',FAST_FORWARD:'fastforward',PAUSE:'pause',REWIND:'rewind',EDIT:'edit',CANCEL:'cancel',"
			"SAVE:'save',DONE:'done',FLEXIBLE_SPACE:'flexiblespace',FIXED_SPACE:'fixedspace',INFO_LIGHT:'infolight',INFO_DARK:'infodark'}";

	NSString * statusBarString = [NSString stringWithFormat:@"{GREY:%d,GRAY:%d,DEFAULT:%d,OPAQUE_BLACK:%d,TRANSLUCENT_BLACK:%d}",
								  UIStatusBarStyleDefault,UIStatusBarStyleDefault,UIStatusBarStyleDefault,UIStatusBarStyleBlackOpaque,UIStatusBarStyleBlackTranslucent];
	
	NSString * animationStyleString = [NSString stringWithFormat:@"{CURL_UP:%d,CURL_DOWN:%d,FLIP_FROM_LEFT:%d,FLIP_FROM_RIGHT:%d}",
				UIViewAnimationTransitionCurlUp,UIViewAnimationTransitionCurlDown,UIViewAnimationTransitionFlipFromLeft,UIViewAnimationTransitionFlipFromRight];
	
	NSString * createButtonString = @"function(args,btnType){var res={"
			"onClick:Ti._ONEVT,_EVT:{click:[],change:[],focus:[],blur:[],'return':[]},addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
//			"onClick:Ti._ONEVT,_EVT:{click:[],change:[],focus:[],blur:[],return:[]},addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
			"focus:function(){Ti.UI._BTNFOC(this,true);},blur:function(){Ti.UI._BTNFOC(this,false);},"
			"update:function(arg){if(!this._TOKEN)return;"
				"if(this.rightButton)this.rightButton.ensureToken();if(this.leftButton)this.leftButton.ensureToken();"
				"Ti.UI._BTNUPD(this,arg);},"
			"ensureToken:function(){"
				"if(!this._TOKEN){var tkn=Ti.UI._BTNTKN();this._TOKEN=tkn;Ti.UI._BTN[tkn]=this;}"
				"if(this.rightButton)this.rightButton.ensureToken();if(this.leftButton)this.leftButton.ensureToken();},"
			"setId:function(div){this.id=div;divObj=document.getElementById(div);this.divObj=divObj;divAttr={};this.divAttr=divAttr;if(!divObj)return;"
//				"var attr=divObj.attributes;if(attr){var i=attr.length;while(i>0){i--;divAttr[attr[i].name]=attr[i].value;}};"
				"divAttr.y=0;divAttr.x=0;divAttr.width=divObj.offsetWidth;divAttr.height=divObj.offsetHeight;"
				"while(divObj){divAttr.x+=divObj.offsetLeft;divAttr.y+=divObj.offsetTop;divObj=divObj.offsetParent;}"
				"Ti.UI.currentWindow.insertButton(this);},"
			"hide:function(args){this.hidden=true;this.update(args);},"
			"show:function(arts){this.hidden=false;this.update(args);},"
			"};"
			"if(args){for(prop in args){res[prop]=args[prop];}};"
			"if(btnType)res.systemButton=btnType;"
			"if(res.id){res.setId(res.id);}"
			"return res;}";

	NSString * createOptionDialogString = @"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"res._TOKEN='MDL'+(Ti.UI._NEXTTKN++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setOptions=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setDestructive=function(args){this.destructive=args;};"
			"res.setCancel=function(args){this.cancel=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,false)};"
			"return res;}";
	TitaniumJSCode * createAlertCode = [TitaniumJSCode codeWithString:
			@"function(args){var res={};for(prop in args){res[prop]=args[prop];};"
			"if(args && args.buttonNames){res.options=args.buttonNames;}"
			"res._TOKEN='MDL'+(Ti.UI._NEXTTKN++);Ti.UI._MODAL[res._TOKEN]=res;res.onClick=Ti._ONEVT;"
			"res._EVT={click:[]};res.addEventListener=Ti._ADDEVT;res.removeEventListener=Ti._REMEVT;"
			"res.setButtonNames=function(args){this.options=args;};"
			"res.setTitle=function(args){this.title=args;};"
			"res.setMessage=function(args){this.message=args;};"
			"res.show=function(){Ti.UI._MSHOW(this,true)};"
			"return res;}"];
	[createAlertCode setEpilogueCode:@"window.alert=function(args){Ti.API.log('alert',args);};"];

	NSString * createActivityIndicatorString = @"function(args,btnType){if(!btnType)btnType='activity';var res=Ti.UI.createButton(args,btnType);"
			"res.setMin=function(val){this.min=val;};res.setMax=function(val){this.max=val;};res.setPos=function(val,args){this.value=val;this.pos=val;this.update(args)};"
			"res.setType=function(val){if(val)this.systemButton='progressbar';else this.systemButton='activity';};res.setMessage=function(val,args){this.message=val;this.update(args);};"
			"res.DETERMINATE=true;res.INDETERMINATE=false;"
			"return res;}";

	NSString * createProgressBarString = @"function(args){var res=Ti.UI.createActivityIndicator(args,'progressbar');return res;}";

	NSDictionary * uiDict = [NSDictionary dictionaryWithObjectsAndKeys:
			closeWinInvoc,@"_CLS",
			openWinInvoc,@"_OPN",
			changeWinUrlInvoc,@"_WURL",
			changeWinFullScreenInvoc,@"_WFSCN",
			showNavBarInvoc,@"_WSHNAV",
			hideNavBarInvoc,@"_WHDNAV",
			setTitleInvoc,@"_WTITLE",
			setTitleImageInvoc,@"_WTITLEIMG",
			setTitleImageProxyInvoc,@"_WTITLEPXY",
			changeWinNavColorInvoc,@"_WNAVTNT",
			setNavButtonInvoc,@"_WNAVBTN",
			updateToolbarInvoc,@"_WTOOL",
			insertNativeViewInvoc,@"_WINSBTN",
			
			buttonContexts, @"_BTN",
			buttonTokenGen,@"_BTNTKN",
			setButtonFocusInvoc,@"_BTNFOC",
			updateButtonInvoc,@"_BTNUPD",
			[TitaniumJSCode codeWithString:createButtonString],@"createButton",

			[TitaniumJSCode codeWithString:createActivityIndicatorString],@"createActivityIndicator",
			[TitaniumJSCode codeWithString:createProgressBarString],@"createProgressBar",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'switch');}"],@"createSwitch",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'slider');}"],@"createSlider",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'text');}"],@"createTextField",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'textarea');}"],@"createTextArea",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'multibutton');}"],@"createButtonBar",
			[TitaniumJSCode codeWithString:@"function(args){return Ti.UI.createButton(args,'segmented');}"],@"createTabbedBar",

			[NSNumber numberWithInt:1],@"_NEXTTKN",
			showModalInvoc,@"_MSHOW",
			[TitaniumJSCode codeWithString:createOptionDialogString],@"createOptionDialog",
			createAlertCode,@"createAlertDialog",

			
			appBadgeInvoc,@"setAppBadge",
			tabBadgeInvoc,@"setTabBadge",

			[TitaniumJSCode codeWithString:@"{}"],@"_MODAL",
			[TitaniumJSCode codeWithString:@"{}"],@"_TBL",
			[TitaniumJSCode codeWithString:@"{}"],@"_EMAIL",
			emailComposeInvoc,@"_OPNEMAIL",
			[TitaniumJSCode codeWithString:createEmailString],@"createEmailDialog",
			[TitaniumJSCode codeWithString:currentWindowString],@"currentWindow",
			[TitaniumJSCode codeWithString:createWindowString],@"createWindow",
			[TitaniumJSCode codeWithString:createTableWindowString],@"createTableView",
			
			[NSNumber numberWithInt:TitaniumViewControllerPortrait],@"PORTRAIT",
			[NSNumber numberWithInt:TitaniumViewControllerLandscape],@"LANDSCAPE",
			[NSNumber numberWithInt:TitaniumViewControllerLandscapeOrPortrait],@"PORTRAIT_AND_LANDSCAPE",
			[NSNumber numberWithInt:UIReturnKeyGo],@"RETURNKEY_GO",
			[NSNumber numberWithInt:UIReturnKeyGoogle],@"RETURNKEY_GOOGLE",
			[NSNumber numberWithInt:UIReturnKeyJoin],@"RETURNKEY_JOIN",
			[NSNumber numberWithInt:UIReturnKeyNext],@"RETURNKEY_NEXT",
			[NSNumber numberWithInt:UIReturnKeySearch],@"RETURNKEY_SEARCH",
			[NSNumber numberWithInt:UIReturnKeySend],@"RETURNKEY_SEND",
			[NSNumber numberWithInt:UIReturnKeyDone],@"RETURNKEY_DONE",
			[NSNumber numberWithInt:UIReturnKeyDefault],@"RETURNKEY_DEFAULT",
			[NSNumber numberWithInt:UIReturnKeyRoute],@"RETURNKEY_ROUTE",
			[NSNumber numberWithInt:UIReturnKeyYahoo],@"RETURNKEY_YAHOO",
			[NSNumber numberWithInt:UIReturnKeyEmergencyCall],@"RETURNKEY_EMERGENCY_CALL",

			[NSNumber numberWithInt:UIKeyboardTypeASCIICapable],@"KEYBOARD_ASCII",
			[NSNumber numberWithInt:UIKeyboardTypeURL],@"KEYBOARD_URL",
			[NSNumber numberWithInt:UIKeyboardTypePhonePad],@"KEYBOARD_PHONE_PAD",
			[NSNumber numberWithInt:UIKeyboardTypeNumbersAndPunctuation],@"KEYBOARD_NUMBERS_PUNCTUATION",
			[NSNumber numberWithInt:UIKeyboardTypeNumberPad],@"KEYBOARD_NUMBER_PAD",
			[NSNumber numberWithInt:UIKeyboardTypeEmailAddress],@"KEYBOARD_EMAIL_ADDRESS",
			[NSNumber numberWithInt:UIKeyboardTypeDefault],@"KEYBOARD_DEFAULT",

			[NSNumber numberWithInt:UITextFieldViewModeNever],@"INPUT_BUTTONMODE_NEVER",
			[NSNumber numberWithInt:UITextFieldViewModeAlways],@"INPUT_BUTTONMODE_ALWAYS",
			[NSNumber numberWithInt:UITextFieldViewModeWhileEditing],@"INPUT_BUTTONMODE_ONFOCUS",
			[NSNumber numberWithInt:UITextFieldViewModeUnlessEditing],@"INPUT_BUTTONMODE_ONBLUR",

			[NSNumber numberWithInt:UITextBorderStyleNone],@"INPUT_BORDERSTYLE_NONE",
			[NSNumber numberWithInt:UITextBorderStyleLine],@"INPUT_BORDERSTYLE_LINE",
			[NSNumber numberWithInt:UITextBorderStyleBezel],@"INPUT_BORDERSTYLE_BEZEL",
			[NSNumber numberWithInt:UITextBorderStyleRoundedRect],@"INPUT_BORDERSTYLE_ROUNDED",

			[NSDictionary dictionaryWithObjectsAndKeys:
					[TitaniumJSCode codeWithString:createGroupedViewString],@"createGroupedView",
					[TitaniumJSCode codeWithString:createGroupedSectionString],@"createGroupedSection",
					statusBarStyleInvoc,@"setStatusBarStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"SystemButtonStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"ProgressBarStyle",
					[TitaniumJSCode codeWithString:systemButtonStyleString],@"ActivityIndicatorStyle",
					[TitaniumJSCode codeWithString:systemButtonString],@"SystemButton",
					[TitaniumJSCode codeWithString:systemIconString],@"SystemIcon",
					[TitaniumJSCode codeWithString:statusBarString],@"StatusBar",
					[TitaniumJSCode codeWithString:animationStyleString],@"AnimationStyle",
					nil],@"iPhone",
			nil];
	[[[TitaniumHost sharedHost] titaniumObject] setObject:uiDict forKey:@"UI"];
	
	return YES;
}

- (void) dealloc
{
//	[virtualWindowsDict release];
	[buttonContexts release];
	[super dealloc];
}


@end

#endif