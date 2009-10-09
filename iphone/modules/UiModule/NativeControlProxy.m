/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "NativeControlProxy.h"
#import "TitaniumCellWrapper.h"
#import "PickerImageTextCell.h"

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

@interface PickerColumnWrapper : NSObject
{
	CGFloat	width;
	CGFloat	rowHeight;
	int selectedRow;
	NSMutableArray * data;
}

@property(nonatomic,readwrite,assign)	CGFloat	width;
@property(nonatomic,readwrite,assign)	CGFloat	rowHeight;
@property(nonatomic,readwrite,retain)	NSMutableArray * data;
@property(nonatomic,readwrite,assign)	int selectedRow;

@end

@implementation PickerColumnWrapper
@synthesize width,rowHeight,data, selectedRow;

- (void) readState: (NSDictionary *) inputState relativeToUrl: (NSURL *) baseUrl;
{
//	selectedRow = -1;
	selectedRow = 0;
	SEL floatVal=@selector(floatValue);
	id widthObject = [inputState objectForKey:@"width"];
	if([widthObject respondsToSelector:floatVal])width=[widthObject floatValue];
	
	id heightObject = [inputState objectForKey:@"height"];
	if([heightObject respondsToSelector:floatVal])rowHeight=[heightObject floatValue];
	if(rowHeight < 1.0)rowHeight=40;
	
	NSArray * dataObject = [inputState objectForKey:@"data"];
	if ([dataObject isKindOfClass:[NSArray class]]){
		if(data==nil){
			data = [[NSMutableArray alloc] initWithCapacity:[dataObject count]];
		} else {
			[data removeAllObjects];
		}
		Class dictClass = [NSDictionary class];
		SEL boolSel = @selector(boolValue);
		
		for(NSDictionary * thisCellObject in dataObject){
			if(![thisCellObject isKindOfClass:dictClass])continue;
			TitaniumCellWrapper * thisCell = [[TitaniumCellWrapper alloc] init];
			[thisCell useProperties:thisCellObject withUrl:baseUrl];
			NSNumber * isSelected = [thisCellObject objectForKey:@"selected"];
			if([isSelected respondsToSelector:boolSel] && [isSelected boolValue])selectedRow=[data count];
			[data addObject:thisCell];
		}
	}
}

@end








@implementation NativeControlProxy
@synthesize nativeBarButton, segmentLabelArray, segmentImageArray, segmentSelectedIndex;
@synthesize titleString, iconPath, templateValue, buttonStyle, nativeView, labelView, wrapperView;
@synthesize minValue,maxValue,floatValue,stringValue, placeholderText, isHidden;
@synthesize elementColor, elementBorderColor, elementBackgroundColor, messageString;
@synthesize leftViewProxy, rightViewProxy, leftViewMode, rightViewMode, surpressReturnCharacter;
@synthesize backgroundImagePath, backgroundDisabledImagePath, backgroundSelectedImagePath;

@synthesize dateValue, minDate, maxDate, datePickerMode, minuteInterval;


#pragma mark Initilization and getting properties
- (id) init;
{
	if ((self = [super init])){
		templateValue = UITitaniumNativeItemNone;
		maxValue = 1.0;
		segmentSelectedIndex = -1;
		buttonStyle = -1;
		datePickerMode = UIDatePickerModeDateAndTime;
		fontDesc.isBold = NO;
		fontDesc.size = [UIFont systemFontSize];
	}
	return self;
}

- (void) dealloc
{
	[titleString release];
	[iconPath release];
	[nativeBarButton release];
	[super dealloc];
}


#define GRAB_IF_SELECTOR(keyString,methodName,resultOutput)	\
{id newObject=[newDict objectForKey:keyString];	\
if ([newObject respondsToSelector:@selector(methodName)]){	\
resultOutput = [newObject methodName];	\
needsRefreshing = YES;	\
}}

#define GRAB_IF_CLASS(keyString,classy,resultOutput)	\
{id newObject=[newDict objectForKey:keyString];	\
if ([newObject isKindOfClass:classy] && ![resultOutput isEqual:newObject]) {	\
self.resultOutput = newObject;	\
needsRefreshing = YES;	\
}}

#define GRAB_IF_STRING(keyString,resultOutput)	GRAB_IF_CLASS(keyString,stringClass,resultOutput)

- (void) setPropertyDict: (NSDictionary *) newDict;
{
	BOOL handleChange = NO;
	NSString * changeEvent = nil;

	Class stringClass = [NSString class];
	Class dateClass = [NSDate class];
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
	
	if ([valueObject isKindOfClass:dateClass]){
		handleChange = ![valueObject isEqualToDate:dateValue];
		[self setDateValue:valueObject];
		needsRefreshing = YES;
	}
	
	if ([valueObject respondsToSelector:@selector(floatValue)]){
		float newValue = [valueObject floatValue];
		handleChange = newValue != floatValue;
		floatValue = newValue;
		needsRefreshing = YES;
	}
	if ([valueObject respondsToSelector:@selector(stringValue)]){
		NSString * newString = [valueObject stringValue];
		handleChange = ![newString isEqualToString:stringValue];
		[self setStringValue:newString];
		needsRefreshing = YES;
	} else if ([valueObject isKindOfClass:[NSString class]]) {
		handleChange = ![valueObject isEqualToString:stringValue];
		[self setStringValue:valueObject];
		needsRefreshing = YES;
	}
	
	if(handleChange){
		switch (templateValue) {
			case UITitaniumNativeItemNone:
				break;
			case UITitaniumNativeItemDatePicker:
				changeEvent = [NSString stringWithFormat:@",value:new Date(%f)",[dateValue timeIntervalSince1970]*1000.0];
				break;
			default:
				changeEvent = [NSString stringWithFormat:@",value:%@",[SBJSON stringify:valueObject]];
				break;
		}
	}
	
	//Segmented
	int oldIndex = segmentSelectedIndex;
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
		needsRefreshing = YES;
	} else if (imageArray == [NSNull null]) {
		[self setSegmentImageArray:nil];
		needsRefreshing = YES;
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
	if ([alignmentObject isKindOfClass:stringClass]){
		alignmentObject = [alignmentObject lowercaseString];
		if ([alignmentObject isEqualToString:@"left"]) textAlignment = UITextAlignmentLeft;
		else if ([alignmentObject isEqualToString:@"center"]) textAlignment = UITextAlignmentCenter;
		else if ([alignmentObject isEqualToString:@"right"]) textAlignment = UITextAlignmentRight;
		needsRefreshing = YES;
	}
	
	GRAB_IF_SELECTOR(@"clearOnEdit",boolValue,clearsOnBeginEditing);
	GRAB_IF_SELECTOR(@"hidden",boolValue,isHidden);
	
	GRAB_IF_SELECTOR(@"passwordMask",boolValue,passwordMask);
	
	GRAB_IF_SELECTOR(@"borderStyle",intValue,borderStyle);
	
	GRAB_IF_SELECTOR(@"clearButtonMode",intValue,clearButtonMode);
	GRAB_IF_SELECTOR(@"leftButtonMode",intValue,leftViewMode);
	GRAB_IF_SELECTOR(@"rightButtonMode",intValue,rightViewMode);
	
	//Pickers!
	GRAB_IF_CLASS(@"minDate",dateClass,minDate);
	GRAB_IF_CLASS(@"maxDate",dateClass,maxDate);
	GRAB_IF_SELECTOR(@"mode",intValue,datePickerMode);
	GRAB_IF_SELECTOR(@"minuteInterval",intValue,minuteInterval);

	GRAB_IF_SELECTOR(@"selectionIndicator",boolValue,showSelectionIndicator);
	
	id dataObject = [newDict objectForKey:@"data"];
	if ([dataObject isKindOfClass:[NSArray class]]){
		if(pickerColumnsArray == nil){
			pickerColumnsArray = [[NSMutableArray alloc] initWithCapacity:[dataObject count]];
		} else {
			[pickerColumnsArray removeAllObjects];
		}
		Class dictClass = [NSDictionary class];
		TitaniumHost * theHost = [TitaniumHost sharedHost];
		[baseURL release];
		baseURL = [[(TitaniumWebViewController *)[theHost currentTitaniumContentViewController] currentContentURL] retain];
		
		int missingWidthColumns = 0;
		float remainingSpace = 290.0;
		
		for(NSDictionary * thisColumnObject in dataObject){
			if(![thisColumnObject isKindOfClass:dictClass])continue;
			PickerColumnWrapper * thisColumn = [[PickerColumnWrapper alloc] init];
			[thisColumn readState:thisColumnObject relativeToUrl:baseURL];
			float thisColumnWidth = [thisColumn width];
			if(thisColumnWidth<1.0){
				missingWidthColumns++;
			} else {
				remainingSpace -= thisColumnWidth;
			}
			[pickerColumnsArray addObject:thisColumn];
		}
		if(missingWidthColumns > 0){
			remainingSpace = remainingSpace/missingWidthColumns;
			for(PickerColumnWrapper * thisColumn in pickerColumnsArray){
				if([thisColumn width]>=1.0)continue;
				[thisColumn setWidth:remainingSpace];
				missingWidthColumns--;
				if(missingWidthColumns < 1)break;
			}
		}
		needsRefreshing = YES;
	}


//	NSArray * selections = [

//	if([nativeView isKindOfClass:[UIPickerView class]])[(UIPickerView *)nativeView reloadAllComponents];
	
	if(UpdateFontDescriptionFromDict(newDict, &fontDesc)){
		needsRefreshing = YES;
	}
	
	//System button	
	id newTemplate = [newDict objectForKey:@"systemButton"];
	if ([newTemplate isKindOfClass:[NSString class]]) {
		[self setTemplateValue:barButtonSystemItemForString(newTemplate)];
		needsRefreshing = YES;
	} else if ([newTemplate isKindOfClass:[NSNumber class]]) {
		[self setTemplateValue:[newTemplate intValue]];
		needsRefreshing = YES;
	}	
	//Because the proxies are best from the UIModule itself, we don't check here.
	
	if(changeEvent != nil){
		[self reportEvent:@"change" value:nil index:-1 init:nil arguments:changeEvent];
	} else if((templateValue == UITitaniumNativeItemSegmented) && (oldIndex != segmentSelectedIndex)){
		[self reportEvent:@"click" value:nil index:segmentSelectedIndex init:nil arguments:nil];
	}
	
}

#pragma mark Generating views

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
//	[labelView setFont:[UIFont systemFontOfSize:newFrame.size.height-4]];
	[labelView setFont:FontFromDescription(&fontDesc)];
	[labelView setBackgroundColor:((bgColor != nil)?bgColor:[UIColor clearColor])];
	[labelView setTextColor:((elementColor != nil)?elementColor:[UIColor whiteColor])];
	
	if([labelView superview]!=wrapperView){
		[wrapperView addSubview:labelView];
	}
}

- (BOOL) updateNativeView: (BOOL) animated;
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
	
	switch (templateValue) {
		case UITitaniumNativeItemSpinner:{
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
		}break;

		case UITitaniumNativeItemSlider:{
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
		}break;
		
		case UITitaniumNativeItemSwitch:{
			if ([nativeView isKindOfClass:[UISwitch class]]){
				resultView = [nativeView retain];
			} else {
				resultView = [[UISwitch alloc] initWithFrame:CGRectZero];
				[(UISwitch *)resultView addTarget:self action:@selector(onSwitchChange:) forControlEvents:UIControlEventValueChanged];
			}
			[(UISwitch *)resultView setOn:(floatValue > ((minValue + maxValue)/2))];
			[resultView setBackgroundColor:elementBorderColor];
			viewFrame.size = [resultView frame].size;			
		}break;

		case UITitaniumNativeItemTextField:	case UITitaniumNativeItemTextView:{
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
			[(UITextField *)resultView setFont:FontFromDescription(&fontDesc)];
			[(UITextField *)resultView setAutocorrectionType:autocorrectionType];
			[(UITextField *)resultView setAutocapitalizationType:autocapitalizationType];
			[(UITextField *)resultView setTextAlignment:textAlignment];
			[(UITextField *)resultView setKeyboardType:keyboardType];
			[(UITextField *)resultView setReturnKeyType:returnKeyType];
			[(UITextField *)resultView setEnablesReturnKeyAutomatically:enablesReturnKeyAutomatically];			
		}break;

		case UITitaniumNativeItemMultiButton:	case UITitaniumNativeItemSegmented:{
			int imageCount = [segmentImageArray count]; int titleCount = [segmentLabelArray count];
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
				} else if ([thisTitle isKindOfClass:[NSString class]]){
					[thingArray addObject:thisTitle];
				} else {
					[thingArray addObject:@""];
				}
			}
			
			resultView = [[UISegmentedControl alloc] initWithItems:thingArray];
			[thingArray release];
			
			[(UISegmentedControl *)resultView addTarget:self action:@selector(onSegmentChange:) forControlEvents:UIControlEventValueChanged];
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
		}break;
		
		case UITitaniumNativeItemInfoLight:	case UITitaniumNativeItemInfoDark:{
			UIButtonType resultType = (templateValue == UITitaniumNativeItemInfoLight)?UIButtonTypeInfoLight:UIButtonTypeInfoDark;
			
			if([nativeView isKindOfClass:[UIButton class]] && ([(UIButton *)nativeView buttonType]==resultType)){
				resultView = [nativeView retain];
			} else {
				resultView = [[UIButton buttonWithType:resultType] retain];
				[(UIButton *)resultView addTarget:self action:@selector(onClick:) forControlEvents:UIControlEventTouchUpInside];
			}
			
			[resultView setBackgroundColor:elementBorderColor];
			
		}break;
		
		case UITitaniumNativeItemDatePicker:{
			if ([nativeView isKindOfClass:[UIDatePicker class]]){
				resultView = [nativeView retain];
			} else {
				resultView = [[UIDatePicker alloc] initWithFrame:CGRectZero];
				[(UIDatePicker *)resultView addTarget:self action:@selector(dateChanged:) forControlEvents:UIControlEventValueChanged];
			}
			if(datePickerMode != [(UIDatePicker *) resultView datePickerMode])[(UIDatePicker *)resultView setDatePickerMode:datePickerMode];
			
			if(minuteInterval != [(UIDatePicker *) resultView minuteInterval])[(UIDatePicker *)resultView setMinuteInterval:minuteInterval];

			if(datePickerMode == UIDatePickerModeCountDownTimer){
				if(floatValue != [(UIDatePicker *) resultView countDownDuration])[(UIDatePicker *)resultView setCountDownDuration:floatValue];
			} else {
				NSDate * oldMinDate = [(UIDatePicker *) resultView minimumDate];
				if((minDate != oldMinDate) && ![minDate isEqualToDate:oldMinDate])[(UIDatePicker *)resultView setMinimumDate:minDate];
				
				NSDate * oldMaxDate = [(UIDatePicker *) resultView maximumDate];
				if((maxDate != oldMaxDate) && ![maxDate isEqualToDate:oldMaxDate])[(UIDatePicker *)resultView setMaximumDate:maxDate];
				
				NSDate * oldValue = [(UIDatePicker *) resultView date];
				if((dateValue!=nil) && ![dateValue isEqualToDate:oldValue]){
					[(UIDatePicker *)resultView setDate:dateValue animated:animated];
				}
			}
			
			viewFrame.size = [resultView frame].size;
		}break;
		
		case UITitaniumNativeItemPicker:{
			if ([nativeView isKindOfClass:[UIPickerView class]]){
				resultView = [nativeView retain];
				[(UIPickerView *)resultView reloadAllComponents];
			} else {
				resultView = [[UIPickerView alloc] initWithFrame:CGRectZero];
				[(UIPickerView *)resultView setDelegate:self];
				[(UIPickerView *)resultView setDataSource:self];
			}
			viewFrame.size = [resultView frame].size;
			
			[(UIPickerView *)resultView setShowsSelectionIndicator:showSelectionIndicator];
			int thisColumnIndex = 0;
			for(PickerColumnWrapper * pickerColumn in pickerColumnsArray){
				int neededSelection = [pickerColumn selectedRow];
				if(neededSelection >= 0){
					int currentSelection = [(UIPickerView *)resultView selectedRowInComponent:thisColumnIndex];
					if(neededSelection != currentSelection)[(UIPickerView *)resultView selectRow:neededSelection inComponent:thisColumnIndex animated:animated];
				}

				thisColumnIndex ++;
			}			
		}break;

		case UITitaniumNativeItemProgressBar:{
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
		}break;

		default:
			break;
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
		
		[(id)resultView setFont:FontFromDescription(&fontDesc)];
		[resultView setBackgroundColor:elementBorderColor];
	}
	
	if((viewFrame.origin.x > 1.0) || (viewFrame.origin.y > 1.0) || ![[wrapperView superview] isKindOfClass:[UITableViewCell class]]){
		[wrapperView setFrame:viewFrame];
	}
	
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
		[self updateNativeView:NO];
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

#pragma mark Accessors

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
		[self updateNativeView:NO];
	}
	return wrapperView;
}

- (UIView *) nativeView;
{
	if ((nativeView == nil) || needsRefreshing){
		placedInBar = NO;
		[self updateNativeView:NO];
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

#pragma mark Buck passing for firstResponder
- (BOOL)becomeFirstResponder;
{
	return [nativeView becomeFirstResponder];
}

- (BOOL)resignFirstResponder;
{
	return [nativeView resignFirstResponder];
}

#pragma mark Updating
- (void) updateWithOptions: (NSDictionary *) optionObject;
{
	BOOL animated = TitaniumPrepareAnimationsForView(optionObject,wrapperView);
	
	[self updateNativeView:animated];
	
	if (animated){
		[UIView commitAnimations];
	}
	
}

- (void) refreshPositionWithWebView: (UIWebView *) webView animated:(BOOL)animated;
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
	
	if(changed)[self updateNativeView:animated];
}

#pragma mark Javascript calls
//TODO: Make not ugly
- (void) selectRowColumn: (NSArray *) arguments;
{
	NSNumber * columnObject = [arguments objectAtIndex:1];
	NSNumber * rowObject = [arguments objectAtIndex:0];
	if(![columnObject respondsToSelector:@selector(intValue)] || ![rowObject respondsToSelector:@selector(intValue)])return;

	BOOL animated = NO;
	if([arguments count]>2){
		NSDictionary * optionObject = [arguments objectAtIndex:2];
		if([optionObject isKindOfClass:[NSDictionary class]]){
			NSNumber * animatedObject = [optionObject objectForKey:@"animated"];
			if([animatedObject respondsToSelector:@selector(boolValue)])animated = [animatedObject boolValue];
		}
	}
	
	int column = [columnObject intValue];
	int row = [rowObject intValue];
	if(column >= [pickerColumnsArray count])return;
	PickerColumnWrapper * ourColumn = [pickerColumnsArray objectAtIndex:column];
	[ourColumn setSelectedRow:row];
	if([nativeView isKindOfClass:[UIPickerView class]]){
		[(UIPickerView *)nativeView selectRow:row inComponent:column animated:animated];
		
		NSMutableString * ourArgs = [NSMutableString stringWithFormat:@",column:%d,row:%d,selectedValue:[",column,row];
		BOOL needsComma = NO;
		for(PickerColumnWrapper * thisColumn in pickerColumnsArray){
			if(needsComma){
				[ourArgs appendFormat:@",%d",[thisColumn selectedRow]];
			} else {
				[ourArgs appendFormat:@"%d",[thisColumn selectedRow]];
				needsComma = YES;
			}
		}
		[ourArgs appendString:@"]"];
		
		[self reportEvent:@"change" value:nil index:-1 init:nil arguments:ourArgs];
	}
}

#pragma mark Picker data source callbacks
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView;
{
	return [pickerColumnsArray count];
}

- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component;
{
	PickerColumnWrapper * ourColumn = [pickerColumnsArray objectAtIndex:component];
	return [[ourColumn data] count];
}

- (CGFloat)pickerView:(UIPickerView *)pickerView widthForComponent:(NSInteger)component;
{
	PickerColumnWrapper * ourColumn = [pickerColumnsArray objectAtIndex:component];
	return [ourColumn width];
}

- (CGFloat)pickerView:(UIPickerView *)pickerView rowHeightForComponent:(NSInteger)component;
{
	PickerColumnWrapper * ourColumn = [pickerColumnsArray objectAtIndex:component];
	return [ourColumn rowHeight];
}

- (UIView *)pickerView:(UIPickerView *)pickerView viewForRow:(NSInteger)row forComponent:(NSInteger)component reusingView:(UIView *)view;
{
	PickerColumnWrapper * ourColumn = [pickerColumnsArray objectAtIndex:component];
	TitaniumCellWrapper * ourRow = [[ourColumn data] objectAtIndex:row];
	CGRect ourFrame = CGRectMake(0, 0, [ourColumn width],[ourColumn rowHeight]);

	NSString * html = [ourRow html];
	
	if([html isKindOfClass:[NSString class]] && ([html length]>0)){
		if([view isKindOfClass:[UIWebView class]]){
			[(UIWebView *)view stopLoading];
			[view setFrame:ourFrame];
		}else{
			view = [[[UIWebView alloc] initWithFrame:ourFrame] autorelease];
			[(UIWebView *)view setDelegate:self];
			[view setBackgroundColor:[UIColor clearColor]];
			[view setOpaque:NO];
		}
		[view setAlpha:0.0];
		[(UIWebView *)view loadHTMLString:html baseURL:baseURL];
		return view;
	}
	
	if([view isKindOfClass:[PickerImageTextCell class]]){
		[view setFrame:ourFrame];
	} else {
		view = [[[PickerImageTextCell alloc] initWithFrame:ourFrame] autorelease];
	}
	NSString * thisTitle = [ourRow title];
	if([thisTitle length] > 0){
		UILabel * ourLabel = [(PickerImageTextCell *)view textLabel];
		[ourLabel setText:thisTitle];
		[ourLabel setFont:[ourRow font]];
	} else {
		[(PickerImageTextCell *)view setTextLabel:nil];
	}
	
	UIImage * thisImage = [ourRow image];
	if(thisImage != nil){
		UIImageView * ourImageView = [(PickerImageTextCell *)view imageView];
		[ourImageView setImage:thisImage];
		CGRect imageFrame;
		imageFrame.size=[thisImage size];
		imageFrame.origin=CGPointZero;
		[ourImageView setFrame:imageFrame];
	} else {
		[(PickerImageTextCell *)view setImageView:nil];
	}
	return view;
}

- (void)webViewDidFinishLoad:(UIWebView *)webView;
{
	[UIView beginAnimations:@"webView" context:nil];
	[UIView setAnimationDuration:0.1];
	[webView setAlpha:1.0];
	[UIView commitAnimations];
}

#pragma mark Events sent to Javascript

- (void) reportEvent: (NSString *) eventType value: (NSString *) newValue index: (int) index init:(NSString *)customInit arguments:(NSString *)extraArgs;
{
	NSString * initalizer;
	NSString * arguments;
	if(newValue != nil){
		initalizer = [NSString stringWithFormat:@"Titanium.UI._BTN.%@.value=%@;",token,newValue];
		arguments = [NSString stringWithFormat:@",value:%@",newValue];
	} else if(index > -1){
		initalizer = [NSString stringWithFormat:@"Titanium.UI._BTN.%@.index=%d;",token,index];
		arguments = [NSString stringWithFormat:@",index:%d",index];
	} else {
		initalizer = @"";
		arguments = @"";
	}
	if(customInit == nil)customInit = @"";
	if(extraArgs == nil)extraArgs = @"";
	
	NSString * handleClickCommand = [NSString stringWithFormat:
			@"(function(){%@%@Titanium.UI._BTN.%@.onClick('%@',{type:'%@'%@%@});}).call(Titanium.UI._BTN.%@);",
			customInit,initalizer,token,eventType,eventType,arguments,extraArgs,token];
#ifdef VERBOSE_DEBUG
	NSLog(@"[DEBUG] Sending '%@' to the page.",handleClickCommand);
#endif
	[[TitaniumHost sharedHost] sendJavascript:handleClickCommand toPageWithToken:parentPageToken];
}

- (IBAction) onClick: (id) sender;
{
	[self reportEvent:@"click" value:nil index:-1 init:nil arguments:nil];
}

- (IBAction) onSwitchChange: (id) sender;
{
	floatValue = [(UISwitch *)sender isOn];
	[self reportEvent:@"change" value:(floatValue ? @"true":@"false") index:-1 init:nil arguments:nil];
}

- (void)textFieldDidEndEditing:(UITextField *)textField;
{
	[self setStringValue:[textField text]];
	[self reportEvent:@"blur" value:[SBJSON stringify:stringValue] index:-1 init:nil arguments:nil];
}

- (void)textViewDidEndEditing:(UITextView *)textView;
{
	[self setStringValue:[textView text]];
	[self reportEvent:@"blur" value:[SBJSON stringify:stringValue] index:-1 init:nil arguments:nil];
}

- (void)textFieldDidBeginEditing:(UITextField *)textField;           // became first responder
{
	[self setStringValue:[textField text]];
	[self reportEvent:@"focus" value:[SBJSON stringify:stringValue] index:-1 init:nil arguments:nil];
}

- (void)textViewDidBeginEditing:(UITextView *)textView;
{
	[self setStringValue:[textView text]];
	[self reportEvent:@"focus" value:[SBJSON stringify:stringValue] index:-1 init:nil arguments:nil];
}

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string;   // return NO to not change text
{
	[self setStringValue:[[textField text] stringByReplacingCharactersInRange:range withString:string]];
	[self reportEvent:@"change" value:[SBJSON stringify:stringValue] index:-1 init:nil arguments:nil];
	return YES;
}

- (BOOL)textView:(UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text;
{
	return YES; //TODO: Handle return?
}

- (void)textViewDidChange:(UITextView *)textView;
{
	[self setStringValue:[textView text]];
	[self reportEvent:@"change" value:[SBJSON stringify:stringValue] index:-1 init:nil arguments:nil];
}

- (BOOL)textFieldShouldClear:(UITextField *)textField;               // called when clear button pressed. return NO to ignore (no notifications)
{
	[self setStringValue:@""];
	[self reportEvent:@"change" value:@"''" index:-1 init:nil arguments:nil];
	return YES;
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField;              // called when 'return' key pressed. return NO to ignore.
{
	[self setStringValue:[textField text]];
	[self reportEvent:@"return" value:[SBJSON stringify:stringValue] index:-1 init:nil arguments:nil];
	return !surpressReturnCharacter;
}


- (IBAction) onSegmentChange: (id) sender;
{
	segmentSelectedIndex = [(UISegmentedControl *)sender selectedSegmentIndex];
	[self reportEvent:@"click" value:nil index:segmentSelectedIndex init:nil arguments:nil];
}

- (IBAction) onValueChange: (id) sender;
{
	floatValue = [(UISlider *)sender value];
	NSString * newValue = [[NSString alloc] initWithFormat:@"%f",floatValue];
	[self reportEvent:@"change" value:newValue index:-1 init:nil arguments:nil];
	[newValue release];
}

- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component;
{
	PickerColumnWrapper * ourColumn = [pickerColumnsArray objectAtIndex:component];

	int oldSelectedValue = [ourColumn selectedRow];
	[ourColumn setSelectedRow:row];

	NSString * ourInit;
	if(oldSelectedValue >= 0){
		ourInit = [NSString stringWithFormat:@"Titanium.UI._BTN.%@.data[%d].data[%d].selected=false;"
				"Titanium.UI._BTN.%@.data[%d].data[%d].selected=true;",token,component,oldSelectedValue,
				token,component,row];
	} else {
		ourInit = [NSString stringWithFormat:@"Titanium.UI._BTN.%@.data[%d].data[%d].selected=true;",token,component,row];
	}

	NSMutableString * ourArgs = [NSMutableString stringWithFormat:@",column:%d,row:%d,selectedValue:[",component,row];
	BOOL needsComma = NO;
	for(PickerColumnWrapper * thisColumn in pickerColumnsArray){
		if(needsComma){
			[ourArgs appendFormat:@",%d",[thisColumn selectedRow]];
		} else {
			[ourArgs appendFormat:@"%d",[thisColumn selectedRow]];
			needsComma = YES;
		}
	}
	[ourArgs appendString:@"]"];

	[self reportEvent:@"change" value:nil index:-1 init:ourInit arguments:ourArgs];
}

- (IBAction) dateChanged: (id) sender;
{
	NSString * newValue;
	if(datePickerMode==UIDatePickerModeCountDownTimer){
		[self setFloatValue:[(UIDatePicker *)sender countDownDuration]];
		newValue = [[NSString alloc] initWithFormat:@"%f",floatValue];
	} else {
		[self setDateValue:[(UIDatePicker *)sender date]];
		newValue = [[NSString alloc] initWithFormat:@"new Date(%f)",[dateValue timeIntervalSince1970]*1000.0];		
	}
	[self reportEvent:@"change" value:newValue index:-1 init:nil arguments:nil];
	[newValue release];
}

@end

#define STRINGIFY(foo)	# foo
#define STRINGVAL(foo)	STRINGIFY(foo)

NSString * const systemButtonString = @"{ACTION:'action',ACTIVITY:'activity',CAMERA:'camera',COMPOSE:'compose',BOOKMARKS:'bookmarks',"
	"SEARCH:'search',ADD:'add',TRASH:'trash',ORGANIZE:'organize',REPLY:'reply',STOP:'stop',REFRESH:'refresh',"
	"PLAY:'play',FAST_FORWARD:'fastforward',PAUSE:'pause',REWIND:'rewind',EDIT:'edit',CANCEL:'cancel',"
	"SAVE:'save',DONE:'done',FLEXIBLE_SPACE:'flexiblespace',FIXED_SPACE:'fixedspace',INFO_LIGHT:'infolight',INFO_DARK:'infodark'}";


NSString * const createButtonString = @"function(args,btnType){var res={"
	"onClick:Ti._ONEVT,_EVT:{click:[],change:[],focus:[],blur:[],'return':[]},addEventListener:Ti._ADDEVT,removeEventListener:Ti._REMEVT,"
	"focus:function(){Ti.UI._BTNFOC(this,true);},blur:function(){Ti.UI._BTNFOC(this,false);},"
	"update:function(arg){if(!this._TOKEN)return;"
		"if(this.rightButton)this.rightButton.ensureToken();if(this.leftButton)this.leftButton.ensureToken();"
		"Ti.UI._BTNUPD(this,arg);},"
	"ensureToken:function(){"
		"if(!this._TOKEN){var tkn=Ti.UI._BTNTKN();this._TOKEN=tkn;Ti.UI._BTN[tkn]=this;}"
		"if(this.rightButton)this.rightButton.ensureToken();if(this.leftButton)this.leftButton.ensureToken();},"
	"setId:function(div){this.id=div;this.divObj=document.getElementById(div);if(!this.findDivPos())return;Ti.UI.currentWindow.insertButton(this);},"
	"findDivPos:function(){var divObj=this.divObj;if(!divObj)return '';if(!this.divAttr)this.divAttr={};var A=this.divAttr;"
		"A.y=0;A.x=0;A.width=divObj.offsetWidth;A.height=divObj.offsetHeight;"
		"while(divObj){A.x+=divObj.offsetLeft;A.y+=divObj.offsetTop;divObj=divObj.offsetParent;}"
		"if(this.x!=undefined)A.x=this.x;if(this.y!=undefined)A.y=this.y;"
		"if(this.width!=undefined)A.width=this.width;if(this.height!=undefined)A.height=this.height;"
		"return A.x+','+A.y+','+A.width+','+A.height;},"
	"hide:function(args){this.hidden=true;this.update(args);},"
	"show:function(arts){this.hidden=false;this.update(args);},"
	"setValue:function(newValue,args){this.value=newValue;this.update(args);},"
	"setIndex:function(newIndex,args){this.index=newValue;this.update(args);},"
	"setMin:function(newMin,args){this.min=newMin;this.update(args);},"
	"setMax:function(newMax,args){this.max=newMax;this.update(args);},"
	"};"
	"if(args){for(prop in args){res[prop]=args[prop];}};"
	"if(btnType)res.systemButton=btnType;"
	"if(res.id){res.setId(res.id);}"
	"return res;}";


NSString * const createActivityIndicatorString = @"function(args,btnType){if(!btnType)btnType='activity';var res=Ti.UI.createButton(args,btnType);"
	"res.setType=function(val){if(val)this.systemButton='progressbar';else this.systemButton='activity';};res.setMessage=function(val,args){this.message=val;this.update(args);};"
	"res.DETERMINATE=true;res.INDETERMINATE=false;"
	"return res;}";

NSString * const createDatePickerString = @"function(args){var res=Ti.UI.createButton(args,'datepicker');return res;}";

NSString * const createPickerString = @"function(args){var res=Ti.UI.createButton(args,'picker');"
	"res.selectRow=function(row,col,options){var colDat=this.data[col].data;var cnt=colDat.length;"
		"for(var i=0;i<cnt;i++){colDat[i].selected=i==row;}if(this._TOKEN){Ti.UI._PICACT(this._TOKEN," STRINGVAL(PICKER_SELECTROW) ",[row,col,options])}};"
	"res.getSelectedRow=function(col){var colDat=this.data[col].data;var cnt=colDat.length;for(var i=0;i<cnt;i++){if(colDat[i].selected)return i;}return 0;};"
	"res.setColumnData=function(col,dat){this.data[col].data=dat;this.update();};"
	"res.setData=function(dat){this.data=dat;this.update();};"
	"return res;}";

NSString * const createModalDatePickerString = @"function(args){var res=Ti.UI.createButton(args,'datepicker');"
	"res.show=function(args){Ti.UI._DISPMODAL(this,true,args);};res.hide=function(args){Ti.UI._DISPMODAL(this,false,args);};return res;}";

NSString * const createModalPickerString = @"function(args){var res=Ti.UI.createButton(args,'picker');"
	"res.show=function(args){Ti.UI._DISPMODAL(this,true,args);};res.hide=function(args){Ti.UI._DISPMODAL(this,false,args);};return res;}";

