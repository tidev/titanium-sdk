/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITextField.h"
#import "TiUtils.h"
#import "TiRange.h"
#import "TiViewProxy.h"
#import "TitaniumApp.h"

// we need to track our active textfield so we can
// use it to determine if a textfield in the toolbar is being focused (below)
static TiTextField* focusedTextField;

@implementation TiTextField

@synthesize leftButtonPadding, rightButtonPadding, paddingLeft, paddingRight, focused;

-(void)configure
{
	// defaults
	leftMode = UITextFieldViewModeAlways;
	rightMode = UITextFieldViewModeAlways;
	leftButtonPadding = 0;
	rightButtonPadding = 0;
	paddingLeft = 0;
	paddingRight = 0;
	focused = NO;
	[super setLeftViewMode:UITextFieldViewModeAlways];
	[super setRightViewMode:UITextFieldViewModeAlways];	
}

-(void)dealloc
{
	RELEASE_TO_NIL(left);
	RELEASE_TO_NIL(right);
	RELEASE_TO_NIL(leftView);
	RELEASE_TO_NIL(rightView);
	[super dealloc];
}

-(UIView*)newPadView:(CGFloat)width height:(CGFloat)height
{
	UIView *view = [[UIView alloc] initWithFrame:CGRectMake(0, 0, width, height)];
	view.backgroundColor = [UIColor clearColor];
	return view;
}

-(void)updateLeftView
{
	if (left == nil)
	{
		left = [self newPadView:leftButtonPadding + paddingLeft height:10];
		left.frame = CGRectMake(0, 0, left.frame.size.width, left.frame.size.height);
		[super setLeftView:left];
	}
	else 
	{
		CGFloat width = leftButtonPadding + paddingLeft;
		CGFloat height = 10;
		if (leftView!=nil)
		{
			width += leftView.frame.size.width;
			height = leftView.frame.size.height;
		}
		left.frame = CGRectMake(leftButtonPadding, 0, width, height);
	}
}

-(void)updateRightView
{
	if (right == nil)
	{
		right = [self newPadView:rightButtonPadding + paddingRight height:10];
		right.frame = CGRectMake(0, 0, right.frame.size.width, right.frame.size.height);
		[super setRightView:right];
	}
	else 
	{
		CGFloat width = rightButtonPadding + paddingRight;
		CGFloat height = 10;
		if (rightView!=nil)
		{
			width += rightView.frame.size.width;
			height = rightView.frame.size.height;
		}
		right.frame = CGRectMake(rightButtonPadding, 0, width, height);
	}
}

-(void)setPaddingLeft:(CGFloat)left_
{
	paddingLeft = left_;
	[self updateLeftView];
}

-(void)setPaddingRight:(CGFloat)right_
{
	paddingRight = right_;
	[self updateRightView];
}

-(void)setLeftButtonPadding:(CGFloat)left_
{
	leftButtonPadding = left_;
	[self updateLeftView];
}

-(void)setRightButtonPadding:(CGFloat)right_
{
	rightButtonPadding = right_;
	[self updateRightView];
}

-(void)setSubviewVisibility:(UIView*)view hidden:(BOOL)hidden
{
	for (UIView *v in [view subviews])
	{
		v.hidden = hidden;
	}	
}

-(void)updateMode:(UITextFieldViewMode)mode forView:(UIView*)view
{
	switch(mode)
	{
		case UITextFieldViewModeNever:
		{
			[self setSubviewVisibility:view hidden:YES];
			break;
		}
		case UITextFieldViewModeWhileEditing:
		{
			[self setSubviewVisibility:view hidden:![self isEditing]];
			break;
		}
		case UITextFieldViewModeUnlessEditing:
		{
			[self setSubviewVisibility:view hidden:[self isEditing]];
			break;
		}
		case UITextFieldViewModeAlways:
		default:
		{
			[self setSubviewVisibility:view hidden:NO];
			break;
		}
	}
}

-(void)repaintMode
{
	if (left!=nil)
	{
		[self updateMode:leftMode forView:left];
	}
	if (right!=nil)
	{
		[self updateMode:rightMode forView:right];
	}
}

-(BOOL)canBecomeFirstResponder
{
	return YES;
}

-(BOOL)resignFirstResponder
{
	focused = NO;
	focusedTextField = nil;
	if ([super resignFirstResponder])
	{
		[self repaintMode];
		return YES;
	}
	return NO;
}

-(BOOL)becomeFirstResponder
{
	focused = YES;
	focusedTextField = self;
	if ([super becomeFirstResponder])
	{
		[self repaintMode];
		return YES;
	}
	return NO;
}

-(void)setLeftViewMode:(UITextFieldViewMode)mode
{
	leftMode = mode;
	[self updateMode:mode forView:left];
}

-(void)setRightViewMode:(UITextFieldViewMode)mode
{
	rightMode = mode;
	[self updateMode:mode forView:right];
}

-(void)setLeftView:(UIView*)value
{
	RELEASE_TO_NIL(leftView);
	leftView = [value retain];
	[self updateLeftView];
	for (UIView *view in [NSArray arrayWithArray:[left subviews]])
	{
		[view removeFromSuperview];
	}
	
	leftView.frame = CGRectMake(paddingLeft, 0, leftView.frame.size.width, leftView.frame.size.height);
	[left addSubview:leftView];
	
	//TODO: get with blain to figure out the appropriate way to handle this
	//[(TiUIView*)value insertIntoView:leftView bounds:leftView.frame];
	
	[self repaintMode];
}

-(void)setRightView:(UIView*)value
{
	//TODO:
}


@end



@implementation TiUITextField

#pragma mark Internal

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
	RELEASE_TO_NIL(textWidgetView);
	RELEASE_TO_NIL(toolbar);
	RELEASE_TO_NIL(toolbarItems);
	[super dealloc];
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[TiUtils setView:textWidgetView positionRect:bounds];
}

-(UIView<UITextInputTraits>*)textWidgetView
{
	if (textWidgetView==nil)
	{
		textWidgetView = [[TiTextField alloc] initWithFrame:CGRectZero];
		((TiTextField *)textWidgetView).delegate = self;
		((TiTextField *)textWidgetView).text = @"";
		((TiTextField *)textWidgetView).textAlignment = UITextAlignmentLeft;
		((TiTextField *)textWidgetView).contentVerticalAlignment = UIControlContentVerticalAlignmentCenter;
		[(TiTextField *)textWidgetView configure];
		[self addSubview:textWidgetView];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
	}
	return textWidgetView;
}

#pragma mark Public APIs

-(void)setPaddingLeft_:(id)value
{
	[self textWidgetView].paddingLeft = [TiUtils floatValue:value];
}

-(void)setLeftButtonPadding_:(id)value
{
	[self textWidgetView].leftButtonPadding = [TiUtils floatValue:value];
}

-(void)setPaddingRight_:(id)value
{
	[self textWidgetView].paddingRight = [TiUtils floatValue:value];
}

-(void)setRightButtonPadding_:(id)value
{
	[self textWidgetView].rightButtonPadding = [TiUtils floatValue:value];
}

-(void)setEnabled_:(id)value
{
	[[self textWidgetView] setEnabled:[TiUtils boolValue:value]];
}

-(void)setBackgroundImage_:(id)image
{
	UITextField *tf = [self textWidgetView];
	
	if (image!=nil && tf.borderStyle == UITextBorderStyleRoundedRect)
	{
		// if you have a backround image and your border style is rounded, we
		// need to force into no border or it won't render
		[tf setBorderStyle:UITextBorderStyleNone];
	}
	[tf setBackground:[self loadImage:image]];
}

-(void)setBackgroundDisabledImage_:(id)image
{
	[[self textWidgetView] setDisabledBackground:[self loadImage:image]];
}

-(void)setValue_:(id)text
{
	[[self textWidgetView] setText:[TiUtils stringValue:text]];
}

-(void)setHintText_:(id)value
{
	[[self textWidgetView] setPlaceholder:[TiUtils stringValue:value]];
}

-(void)setClearOnEdit_:(id)value
{
	[[self textWidgetView] setClearsOnBeginEditing:[TiUtils boolValue:value]];
}

-(void)setBorderStyle_:(id)value
{
	[[self textWidgetView] setBorderStyle:[TiUtils intValue:value]];
}

-(void)setClearButtonMode_:(id)value
{
	[[self textWidgetView] setClearButtonMode:[TiUtils intValue:value]];
}

//TODO: rename

-(void)setLeftButton_:(id)value
{
	if ([value isKindOfClass:[TiViewProxy class]])
	{
		TiViewProxy *vp = (TiViewProxy*)value;
		TiUIView *leftview = [vp view];
		[[self textWidgetView] setLeftView:leftview];
	}
	else
	{
		//TODO:
	}
}

-(void)setLeftButtonMode_:(id)value
{
	[[self textWidgetView] setLeftViewMode:[TiUtils intValue:value]];
}

-(void)setRightButton_:(id)value
{
	if ([value isKindOfClass:[TiViewProxy class]])
	{
		TiViewProxy *vp = (TiViewProxy*)value;
		[[self textWidgetView] setRightView:[vp view]];
	}
	else
	{
		//TODO:
	}
}

-(void)setRightButtonMode_:(id)value
{
	[[self textWidgetView] setRightViewMode:[TiUtils intValue:value]];
}

-(void)setPasswordMask_:(id)value
{
	[[self textWidgetView] setSecureTextEntry:[TiUtils boolValue:value]];
}

-(void)setAppearance_:(id)value
{
	[[self textWidgetView] setKeyboardAppearance:[TiUtils intValue:value]];
}

-(void)setAutocapitalization_:(id)value
{
	[[self textWidgetView] setAutocapitalizationType:[TiUtils intValue:value]];
}

-(void)setVerticalAlign_:(id)value
{
	if ([value isKindOfClass:[NSString class]])
	{
		if ([value isEqualToString:@"top"])
		{
			[[self textWidgetView] setContentVerticalAlignment:UIControlContentVerticalAlignmentTop];
		}
		else if ([value isEqualToString:@"middle"] || [value isEqualToString:@"center"])
		{
			[[self textWidgetView] setContentVerticalAlignment:UIControlContentVerticalAlignmentCenter];
		}
		else 
		{
			[[self textWidgetView] setContentVerticalAlignment:UIControlContentVerticalAlignmentBottom];
		}
	}
	else
	{
		[[self textWidgetView] setContentVerticalAlignment:[TiUtils intValue:value]];
	}
}

-(UIToolbar*)keyboardToolbar
{
	if (toolbar==nil)
	{
		toolbar = [[UIToolbar alloc] initWithFrame:CGRectZero];
	}
	return toolbar;
}

-(void)attachKeyboardToolbar
{
	if (toolbar!=nil)
	{
		if (toolbarItems!=nil)
		{
			NSMutableArray *items = [NSMutableArray arrayWithCapacity:[toolbarItems count]];
			for (TiViewProxy *proxy in toolbarItems)
			{
				if ([proxy supportsNavBarPositioning])
				{
					UIBarButtonItem* button = [proxy barButtonItem];
					[items addObject:button];
				}
			}
			toolbar.items = items;
		}
	}
}

-(void)setKeyboardToolbar_:(id)value
{
	if (value == nil)
	{
		RELEASE_TO_NIL(toolbar);
	}
	else
	{
		//TODO: make this more efficient
		if ([value isKindOfClass:[NSArray class]])
		{
			[self keyboardToolbar];
			toolbarItems = [value retain];
		}
		else if ([value isKindOfClass:[TiViewProxy class]])
		{
			UIColor *color = (toolbar!=nil) ? [toolbar tintColor] : nil;
			RELEASE_TO_NIL(toolbar);
			RELEASE_TO_NIL(toolbarItems);
			toolbar = (UIToolbar*)[value view];
			if (color!=nil)
			{
				toolbar.tintColor = color;
			}
		}
	}
}

-(void)setKeyboardToolbarColor_:(id)value
{
	[[self keyboardToolbar] setTintColor:[[TiUtils colorValue:value] _color]];
}

-(void)setKeyboardToolbarHeight_:(id)value
{
	toolbarHeight = [TiUtils floatValue:value];
}

#pragma mark Public Method

-(BOOL)hasText
{
	UITextField *f = [self textWidgetView];
	return ![[f text] isEqualToString:@""];
}

-(void)blur
{
	[[self textWidgetView] resignFirstResponder];
}

-(void)focus
{
	[[self textWidgetView] becomeFirstResponder];
}

#pragma mark UITextFieldDelegate

- (void)textFieldDidBeginEditing:(UITextField *)tf
{
	[self.proxy replaceValue:NUMBOOL(YES) forKey:@"focused" notification:NO];
	if ([self.proxy _hasListeners:@"focus"])
	{
		[self.proxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:[tf text] forKey:@"value"]];
	}
}

- (BOOL)textField:(UITextField *)tf shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
	NSString *value = [NSString stringWithFormat:@"%@%@",[tf text],string];
	[self.proxy replaceValue:value forKey:@"value" notification:NO];
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:value forKey:@"value"]];
	}
	return YES;
}

- (void)textFieldDidEndEditing:(UITextField *)tf
{
	[self.proxy replaceValue:NUMBOOL(NO) forKey:@"focused" notification:NO];
	if ([self.proxy _hasListeners:@"blur"])
	{
		[self.proxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:[tf text] forKey:@"value"]];
	}
}

- (void)textFieldDidChange:(UITextField *)tf
{
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:[tf text] forKey:@"value"]];
	}
}

- (BOOL)textFieldShouldEndEditing:(UITextField *)tf
{
	return YES;
}

- (BOOL)textFieldShouldClear:(UITextField *)tf
{
	// we notify proxy so he can serialize in the model
	[self.proxy setValue:@"" forKey:@"text"];
	
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:@"" forKey:@"value"]];
	}
	return YES;
}

-(BOOL)textFieldShouldReturn:(UITextField *)tf 
{
	[tf resignFirstResponder];
	if ([self.proxy _hasListeners:@"return"])
	{
		[self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:[tf text] forKey:@"value"]];
	}
	[self makeRootViewFirstResponder];
	return YES;
}

#pragma mark Keyboard Delegates

- (void)keyboardWillShow:(NSNotification*)notification 
{
	if (toolbar!=nil && ((TiTextField *)textWidgetView).focused && toolbarVisible==NO)
	{
		NSDictionary *userInfo = notification.userInfo;
		NSValue *v = [userInfo valueForKey:UIKeyboardBoundsUserInfoKey];
		CGRect kbBounds = [v CGRectValue];
		
		NSValue *v2 = [userInfo valueForKey:UIKeyboardCenterEndUserInfoKey];
		CGPoint kbEndPoint = [v2 CGPointValue];
		
		NSValue *v3 = [userInfo valueForKey:UIKeyboardCenterBeginUserInfoKey];
		CGPoint kbStartPoint = [v3 CGPointValue];
		
		CGFloat kbStartTop = kbStartPoint.y - (kbBounds.size.height / 2);
		CGFloat kbEndTop = kbEndPoint.y - (kbBounds.size.height / 2);

		CGFloat height = MAX(toolbarHeight,40);

		NSArray *windows = [[UIApplication sharedApplication] windows];
		UIWindow *window = nil;
		
		// in a keyboard situation, a new UIWindow is insert into the heirarchy
		// temporarily and we need to find that view.  in testing, it seems to 
		// be on the 2nd index from our window
		if ([windows count] > 1)
		{
			window = [windows objectAtIndex:1];
		}
		else
		{
			window = [windows objectAtIndex:0];
		}

		[window addSubview:toolbar];
		[toolbar setHidden:NO];
		
		if ([[TitaniumApp app] isKeyboardShowing])
		{
			toolbar.frame = CGRectMake(0, kbEndTop-height, kbBounds.size.width, height);
			[self attachKeyboardToolbar];
		}
		else
		{
			// start at the top
			toolbar.frame = CGRectMake(0, kbStartTop-height, kbBounds.size.width , height);
			[self attachKeyboardToolbar];
			
			// now animate with the keyboard as it moves up
			[UIView beginAnimations:nil context:nil];
			[UIView setAnimationCurve:[[userInfo valueForKey:UIKeyboardAnimationCurveUserInfoKey] intValue]];
			[UIView setAnimationDuration:[[userInfo valueForKey:UIKeyboardAnimationDurationUserInfoKey] floatValue]];
			toolbar.frame = CGRectMake(0, kbEndTop-height, kbBounds.size.width, height);
			[UIView commitAnimations];
		}
		toolbarVisible = YES;
	}
}

- (void)keyboardHiddenAnimationComplete:(id)note
{
	if (toolbar!=nil)
	{
		[toolbar setHidden:YES];
	}
}

- (void)keyboardWillHide:(NSNotification*)notification 
{
	if (toolbarVisible)
	{
		// we have to check to make sure that our toolbar doesn't contain
		// a textfield that is focused
		if (focusedTextField!=nil)
		{
			for (UIView *view in [toolbar subviews])
			{
				if ([view isKindOfClass:[TiUITextField class]])
				{
					TiUITextField *tf = (TiUITextField*)view;
					if ([tf textWidgetView]==focusedTextField)
					{
						[tf setNeedsDisplay];
						[tf setNeedsLayout];
						return;
					}
				}
			}
		}
		[toolbar removeFromSuperview];
		toolbarVisible = NO;
	}
}
	
@end
