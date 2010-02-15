/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITextWidget.h"

#import "TiViewProxy.h"
#import "TitaniumApp.h"
#import "TiUtils.h"

@implementation TiUITextWidget

- (void) dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
	RELEASE_TO_NIL(textWidgetView);
	RELEASE_TO_NIL(toolbar);
	RELEASE_TO_NIL(toolbarItems);
	[super dealloc];
}

#pragma mark Must override
-(BOOL)hasText
{
	return NO;
}


#pragma mark Common values

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[TiUtils setView:textWidgetView positionRect:bounds];
}

-(void)setColor_:(id)color
{
	[(id)[self textWidgetView] setTextColor:[[TiUtils colorValue:color] _color]];
}

-(void)setFont_:(id)font
{
	[(id)[self textWidgetView] setFont:[[TiUtils fontValue:font] font]];
}

// <0.9 is textAlign
-(void)setTextAlign_:(id)alignment
{
	[(id)[self textWidgetView] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
}

-(void)setReturnKeyType_:(id)value
{
	[[self textWidgetView] setReturnKeyType:[TiUtils intValue:value]];
}

-(void)setEnableReturnKey_:(id)value
{
	[[self textWidgetView] setEnablesReturnKeyAutomatically:[TiUtils boolValue:value]];
}

-(void)setKeyboardType_:(id)value
{
	[[self textWidgetView] setKeyboardType:[TiUtils intValue:value]];
}

-(void)setAutocorrect_:(id)value
{
	[[self textWidgetView] setAutocorrectionType:[TiUtils boolValue:value] ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo];
}

#pragma mark Responder methods
//These used to be blur/focus, but that's moved to the proxy only.
//The reason for that is so checking the toolbar can use UIResponder methods.

-(BOOL)resignFirstResponder
{
	return [[self textWidgetView] resignFirstResponder];
}

-(BOOL)becomeFirstResponder
{
	return [[self textWidgetView] becomeFirstResponder];
}

-(BOOL)isFirstResponder
{
	return [textWidgetView isFirstResponder];
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

-(void)setValue_:(id)text
{
	[(id)[self textWidgetView] setText:[TiUtils stringValue:text]];
}

#pragma mark Toolbar

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
			toolbar = [(UIToolbar*)[value view] retain];
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

#pragma mark Keyboard Delegates

- (void)keyboardWillShow:(NSNotification*)notification 
{
	if (![textWidgetView isFirstResponder])
	{
		return;
	}

	NSDictionary *userInfo = notification.userInfo;
	NSValue *v = [userInfo valueForKey:UIKeyboardBoundsUserInfoKey];
	CGRect kbBounds = [v CGRectValue];

	NSValue *v2 = [userInfo valueForKey:UIKeyboardCenterEndUserInfoKey];
	CGPoint kbEndPoint = [v2 CGPointValue];
	
	NSValue *v3 = [userInfo valueForKey:UIKeyboardCenterBeginUserInfoKey];
	CGPoint kbStartPoint = [v3 CGPointValue];
	
	CGFloat kbStartTop = kbStartPoint.y - (kbBounds.size.height / 2);
	CGFloat kbEndTop = kbEndPoint.y - (kbBounds.size.height / 2);

	if ((toolbar!=nil) && !toolbarVisible)
	{
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

		kbEndTop -= height;	//This also affects tweaking the scroll view.
		
		if ([[TitaniumApp app] isKeyboardShowing])
		{
			toolbar.frame = CGRectMake(0, kbEndTop, kbBounds.size.width, height);
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
			toolbar.frame = CGRectMake(0, kbEndTop, kbBounds.size.width, height);
			[UIView commitAnimations];
		}
		toolbarVisible = YES;
		
	}

	if (parentScrollView == nil)
	{
		UIView * possibleScrollView = [self superview];
		while (possibleScrollView != nil)
		{
			if ([possibleScrollView conformsToProtocol:@protocol(TiUIScrollView)])
			{
				parentScrollView = [possibleScrollView retain];
				break;
			}
			possibleScrollView = [possibleScrollView superview];
		}
		
		[parentScrollView keyboardDidShowAtHeight:kbEndTop forView:self];
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
		for (UIView * view in [toolbar subviews])
		{
			if ([view isFirstResponder])
			{
				[view setNeedsDisplay];
				[view setNeedsLayout];
				return;
			}
		}
		[toolbar removeFromSuperview];
		toolbarVisible = NO;
	}

	[parentScrollView keyboardDidHide];
	RELEASE_TO_NIL(parentScrollView);
}


@end
