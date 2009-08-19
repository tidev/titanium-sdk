//
//  NativeControlProxy.m
//  Titanium
//
//  Created by Blain Hamon on 8/19/09.
//  Copyright 2009 __MyCompanyName__. All rights reserved.
//

#import "NativeControlProxy.h"

BOOL TitaniumPrepareAnimationsForView(NSDictionary * optionObject, UIView * view)
{
	if(![optionObject isKindOfClass:[NSDictionary class]])return NO;
	id animatedObject = [optionObject objectForKey:@"animated"];
	if((![animatedObject respondsToSelector:@selector(boolValue)]) || (![animatedObject boolValue]))return NO;
	
	[UIView beginAnimations:nil context:nil];
	
	if(view != nil){
		id animatedStyleObject = [optionObject objectForKey:@"animationStyle"];
		if ([animatedStyleObject respondsToSelector:@selector(intValue)]){
			[UIView setAnimationTransition:[animatedStyleObject intValue] forView:view cache:YES];
		}
	}
	
	id animatedDurationObject = [optionObject objectForKey:@"animationDuration"];
	if([animatedDurationObject respondsToSelector:@selector(floatValue)]){
		[UIView setAnimationDuration:[animatedDurationObject floatValue]/1000.0];
	}
	return YES;
}

NSDictionary * barButtonSystemItemForStringDict = nil;

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

@implementation NativeControlProxy
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
		if(messageString != nil){
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
			viewFrame.size = [resultView frame].size;
		}
		[resultView setBackgroundColor:elementBorderColor];
		
	} else if (templateValue == UITitaniumNativeItemSlider){
		CGRect sliderFrame;
		sliderFrame.origin = CGPointZero; sliderFrame.size=viewFrame.size;
		if ([nativeView isKindOfClass:[UISlider class]]){
			resultView = [nativeView retain];
		} else {
			resultView = [[UISlider alloc] initWithFrame:sliderFrame];
			[(UISlider *)resultView addTarget:self action:@selector(onValueChange:) forControlEvents:UIControlEventValueChanged];
		}
		[(UISlider *)resultView setMinimumValue:minValue];
		[(UISlider *)resultView setMaximumValue:maxValue];
		[(UISlider *)resultView setValue:floatValue];
		[resultView setBackgroundColor:elementBorderColor];
		viewFrame.size.height = [resultView frame].size.height;
		
	} else if (templateValue == UITitaniumNativeItemSwitch){
		if ([nativeView isKindOfClass:[UISwitch class]]){
			resultView = [nativeView retain];
		} else {
			resultView = [[UISwitch alloc] initWithFrame:CGRectZero];
			[(UISwitch *)resultView addTarget:self action:@selector(onSwitchChange:) forControlEvents:UIControlEventValueChanged];
		}
		[(UISwitch *)resultView setOn:(floatValue > ((minValue + maxValue)/2))];
		[resultView setBackgroundColor:elementBorderColor];
		viewFrame.size = [resultView frame].size;
		
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
		UIProgressViewStyle progressStyle;
		if(placedInBar){
			progressStyle = (buttonStyle != UIBarButtonItemStylePlain)?UIProgressViewStyleBar:UIProgressViewStyleDefault;
		}else{
			progressStyle = (buttonStyle == UITitaniumNativeStyleBar)?UIProgressViewStyleBar:UIProgressViewStyleDefault;			
		}
		if([nativeView isKindOfClass:[UIProgressView class]]){
			resultView = [nativeView retain];
			[(UIProgressView *)resultView setProgressViewStyle:progressStyle];
		} else {
			resultView = [[UIProgressView alloc] initWithProgressViewStyle:progressStyle];
		}
		[(UIProgressView *)resultView setProgress:(floatValue - minValue)/(maxValue - minValue)];
		
		if(messageString != nil){
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
			CGRect resultFrame;
			resultFrame.origin = CGPointZero;
			resultFrame.size.width = viewFrame.size.width;
			resultFrame.size.height = [resultView frame].size.height;
			[resultView setFrame:resultFrame];
			viewFrame.size.height = resultFrame.size.height;
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
	[wrapperView setHidden:isHidden];
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

- (BOOL)becomeFirstResponder;
{
	return [nativeView becomeFirstResponder];
}

- (BOOL)resignFirstResponder;
{
	return [nativeView resignFirstResponder];
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
	BOOL animated = TitaniumPrepareAnimationsForView(optionObject,wrapperView);
	
	[self updateNativeView];
	
	if (animated){
		[UIView commitAnimations];
	}
	
}

- (void) refreshPositionWithWebView: (UIWebView *) webView;
{
	NSString * commandString = [NSString stringWithFormat:@"Titanium.UI._BTN.%@.findDivPos()",token];
	NSArray * valueArray = [[webView stringByEvaluatingJavaScriptFromString:commandString] componentsSeparatedByString:@","];
	if([valueArray count]!=4)return;
	BOOL changed=NO;
	float value;
	
	value = [[valueArray objectAtIndex:0] floatValue];
	if(value != frame.origin.x){
		frame.origin.x = value;
		changed = YES;
	}
	
	value = [[valueArray objectAtIndex:1] floatValue];
	if(value != frame.origin.y){
		frame.origin.y = value;
		changed = YES;
	}
	
	value = [[valueArray objectAtIndex:2] floatValue];
	if(value != frame.size.width){
		frame.size.width = value;
		changed = YES;
	}
	
	value = [[valueArray objectAtIndex:3] floatValue];
	if(value != frame.size.height){
		frame.size.height = value;
		changed = YES;
	}
	
	if(changed)[self updateNativeView];
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

