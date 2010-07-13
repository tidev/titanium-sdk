/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITEXTWIDGET) || defined(USE_TI_UITEXTAREA) || defined(USE_TI_UITEXTFIELD)

#import "TiUITextWidget.h"

#import "TiViewProxy.h"
#import "TiApp.h"
#import "TiUtils.h"

NSString* const TiKeyboardHideNotification = @"TiHideKeyboard";
NSString* const TiKeyboardShowNotification = @"TiShowKeyboard";

NSDictionary* keyboardUserInfo;

@implementation TiUITextWidget

- (id) init
{
	self = [super init];
	if (self != nil)
	{
		suppressReturn = YES;
	}
	return self;
}


-(void)setSuppressReturn_:(id)value
{
	suppressReturn = [TiUtils boolValue:value def:YES];
}

-(void)windowClosing
{
	[self performSelectorOnMainThread:@selector(removeToolbar) withObject:nil waitUntilDone:[NSThread isMainThread]];
}

- (void) dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardDidHideNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
	if ([TiUtils isiPhoneOS3_2OrGreater]) {
		[[NSNotificationCenter defaultCenter] removeObserver:self name:TiKeyboardHideNotification object:nil];
		[[NSNotificationCenter defaultCenter] removeObserver:self name:TiKeyboardShowNotification object:nil];
	}
	RELEASE_TO_NIL(textWidgetView);
	[toolbar removeFromSuperview];
	RELEASE_TO_NIL(toolbar);
	RELEASE_TO_NIL(toolbarItems);
	RELEASE_TO_NIL(keyboardUserInfo);
	[super dealloc];
}

-(BOOL)hasTouchableListener
{
	// since this guy only works with touch events, we always want them
	// just always return YES no matter what listeners we have registered
	return YES;
}

-(NSDictionary*)keyboardUserInfo
{
	return keyboardUserInfo;
}

-(void)setKeyboardUserInfo:(NSDictionary *)userInfo
{
	if (keyboardUserInfo != userInfo) {
		[keyboardUserInfo release];
		keyboardUserInfo = [userInfo retain];
	}
}

#pragma mark Must override
-(BOOL)hasText
{
	return NO;
}

-(UIView *)textWidgetView
{
	return nil;
}

#pragma mark Common values

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[textWidgetView setFrame:[self bounds]];
}

-(void)setColor_:(id)color
{
	UIColor * newColor = [[TiUtils colorValue:color] _color];
	[(id)[self textWidgetView] setTextColor:(newColor != nil)?newColor:[UIColor darkTextColor]];
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

#pragma mark Responder methods
//These used to be blur/focus, but that's moved to the proxy only.
//The reason for that is so checking the toolbar can use UIResponder methods.

-(BOOL)resignFirstResponder
{
	if (![textWidgetView isFirstResponder])
	{
		return NO;
	}
	return [[self textWidgetView] resignFirstResponder];
}

-(BOOL)becomeFirstResponder
{
	if ([textWidgetView isFirstResponder])
	{
		return NO;
	}
	
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

#pragma mark Keyboard Delegates

-(void)removeToolbar
{
	[toolbar removeFromSuperview];
	toolbarVisible = NO;
}

- (void)keyboardWillShow:(NSNotification*)notification 
{
	if (![textWidgetView isFirstResponder] || (notification.userInfo == nil))
	{
		return;
	}
	
	self.keyboardUserInfo = notification.userInfo;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
	NSValue *v = [keyboardUserInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
#else
	NSValue *v = [keyboardUserInfo valueForKey:UIKeyboardBoundsUserInfoKey];
#endif
	CGRect kbBounds = [v CGRectValue];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
	NSValue *v2 = [keyboardUserInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
	CGPoint kbEndPoint = [v2 CGRectValue].origin;
#else
	NSValue *v2 = [keyboardUserInfo valueForKey:UIKeyboardCenterEndUserInfoKey];
	CGPoint kbEndPoint = [v2 CGPointValue];
#endif
	
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
	NSValue *v3 = [keyboardUserInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
	CGPoint kbStartPoint = [v3 CGRectValue].origin;
#else
	NSValue *v3 = [keyboardUserInfo valueForKey:UIKeyboardCenterBeginUserInfoKey];
	CGPoint kbStartPoint = [v3 CGPointValue];
#endif
	CGFloat kbEndTop = kbEndPoint.y - (kbBounds.size.height / 2);
	

	if ((toolbar!=nil) && !toolbarVisible)
	{
		CGFloat height = MAX(toolbarHeight,40);

#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_4_0
		kbEndTop -= height;	//This also affects tweaking the scroll view.
		toolbar.bounds = CGRectMake(0, 0, kbBounds.size.width, height);
#else
		toolbar.frame = CGRectMake(kbStartPoint.x, kbStartPoint.y, kbBounds.size.width, height);
#endif
		
		[[self window] addSubview:toolbar];

		[toolbar setHidden:NO];

		
		// start at the top
#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_4_0
		toolbar.center = CGPointMake(kbStartPoint.x, kbStartPoint.y - (kbBounds.size.height - height)/2);
#endif
		[self attachKeyboardToolbar];
		
		// now animate with the keyboard as it moves up
		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:[[keyboardUserInfo valueForKey:UIKeyboardAnimationCurveUserInfoKey] intValue]];
		[UIView setAnimationDuration:[[keyboardUserInfo valueForKey:UIKeyboardAnimationDurationUserInfoKey] floatValue]];
#if __IPHONE_OS_VERSION_MAX_ALLOWED < __IPHONE_4_0
		toolbar.center = CGPointMake(kbEndPoint.x, kbEndPoint.y - (kbBounds.size.height + height)/2);
#else
		toolbar.frame = CGRectMake(kbEndPoint.x, kbEndPoint.y-height, kbBounds.size.width, height);
#endif
		[UIView commitAnimations];

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

- (void)keyboardDidHide:(NSNotification*)notification
{
	[self removeToolbar];
}

- (void)keyboardWillHideForReal:(NSNotification*)notification 
{
	BOOL stillIsResponder = NO;
	if ([self isFirstResponder])
	{
		[self setNeedsDisplay];
		[self setNeedsLayout];
		stillIsResponder = YES;
		if (toolbarVisible)
		{
			// coming back in focus from a child view
			// and we're still in focus, just return
			return;
		}
	}

	if (toolbarVisible)
	{
		for (UIView * view in [toolbar subviews])
		{
			if ([view isFirstResponder])
			{
				[view setNeedsDisplay];
				[view setNeedsLayout];
				stillIsResponder = YES;
				// going from a toolbar parent to child view on toolbar
				// we don't need to do anything
				return;
			}
		}
		
		NSDictionary *userInfo = notification.userInfo;
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
		NSValue *v = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
#else
		NSValue *v = [userInfo valueForKey:UIKeyboardBoundsUserInfoKey];
#endif
		CGRect kbBounds = [v CGRectValue];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
		NSValue *v2 = [userInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
		CGPoint kbEndPoint = [v2 CGRectValue].origin;
#else
		NSValue *v2 = [userInfo valueForKey:UIKeyboardCenterEndUserInfoKey];
		CGPoint kbEndPoint = [v2 CGPointValue];
#endif

		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:[[userInfo valueForKey:UIKeyboardAnimationCurveUserInfoKey] intValue]];
		[UIView setAnimationDuration:[[userInfo valueForKey:UIKeyboardAnimationDurationUserInfoKey] floatValue]];
		
		CGFloat height = [toolbar bounds].size.height;
		
		CGPoint newCenter;
		newCenter.x = kbEndPoint.x;

		if (stillIsResponder)
		{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
			NSValue *v3 = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
			CGPoint kbStartPoint = [v3 CGRectValue].origin;
#else
			NSValue *v3 = [userInfo valueForKey:UIKeyboardCenterBeginUserInfoKey];
			CGPoint kbStartPoint = [v3 CGPointValue];
#endif
			newCenter.y = kbStartPoint.y - (kbBounds.size.height + height)/2;
		}
		else
		{
			newCenter.y = kbEndPoint.y - (kbBounds.size.height - height)/2;
			
			// We can't do this under iOS3.2/4 because otherwise it screws up due
			// to the fact that we're in the wrong place in the responder chain.
			if (![TiUtils isiPhoneOS3_2OrGreater]) {
				[UIView setAnimationDelegate:self];
				[UIView setAnimationDidStopSelector:@selector(removeToolbar)];
			}
		}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
		toolbar.frame = CGRectMake(kbEndPoint.x, kbEndPoint.y, kbBounds.size.width, height);
#else
		toolbar.center = newCenter;
#endif
		[UIView commitAnimations];

		toolbarVisible = stillIsResponder;
	}
}

- (void)keyboardWillHide:(NSNotification*)notification 
{
	[self performSelector:@selector(keyboardWillHideForReal:) withObject:notification afterDelay:0.0 inModes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
}



@end

#endif