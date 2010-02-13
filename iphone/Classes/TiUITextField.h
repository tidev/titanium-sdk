/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITextWidget.h"


@interface TiTextField : UITextField
{
	CGFloat paddingLeft;
	CGFloat paddingRight;
	CGFloat leftButtonPadding;
	CGFloat rightButtonPadding;
	UITextFieldViewMode leftMode;
	UITextFieldViewMode rightMode;
	UIView *left;
	UIView *right;
	UIView *leftView;
	UIView *rightView;
	BOOL focused;
}

@property(nonatomic,readwrite,assign) CGFloat paddingLeft;
@property(nonatomic,readwrite,assign) CGFloat paddingRight;
@property(nonatomic,readwrite,assign) CGFloat leftButtonPadding;
@property(nonatomic,readwrite,assign) CGFloat rightButtonPadding;
@property(nonatomic,readonly) BOOL focused;

@end

@interface TiUITextField : TiUITextWidget <UITextFieldDelegate>
{
@private
}

#pragma mark Internal 

-(TiTextField*)textWidgetView;

@end

