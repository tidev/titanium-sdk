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
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
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

-(void)extractKeyboardInfo:(NSDictionary *)userInfo fromRect:(CGRect *)startingFramePtr toRect:(CGRect *)endingFramePtr
{
	NSValue *v = nil;
	CGRect endingFrame;
	BOOL canUse32Constants = [TiUtils isiPhoneOS3_2OrGreater];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	if (canUse32Constants)
	{
		v = [userInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
	}
#endif
	
	if (v != nil)
	{
		endingFrame = [v CGRectValue];
	}
	else
	{
		v = [userInfo valueForKey:UIKeyboardBoundsUserInfoKey];
		endingFrame = [v CGRectValue];
		v = [userInfo valueForKey:UIKeyboardCenterEndUserInfoKey];
		CGPoint endingCenter = [v CGPointValue];
		endingFrame.origin.x = endingCenter.x - endingFrame.size.width/2.0;
		endingFrame.origin.y = endingCenter.y - endingFrame.size.height/2.0;
	}

	CGRect startingFrame;
	v = nil;
	
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	if (canUse32Constants)
	{
		v = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
	}
#endif

	if (v != nil)
	{
		startingFrame = [v CGRectValue];
	}
	else
	{
		startingFrame.size = endingFrame.size;
		v = [userInfo valueForKey:UIKeyboardCenterBeginUserInfoKey];
		CGPoint startingCenter = [v CGPointValue];
		startingFrame.origin.x = startingCenter.x - startingFrame.size.width/2.0;
		startingFrame.origin.y = startingCenter.y - startingFrame.size.height/2.0;
	}

	*startingFramePtr = startingFrame;
	*endingFramePtr = endingFrame;
}

- (void)keyboardWillShow:(NSNotification*)notification 
{
	if (![textWidgetView isFirstResponder] || (notification.userInfo == nil))
	{
		return;
	}
	
	self.keyboardUserInfo = notification.userInfo;
	
	CGRect startingFrame;
	CGRect endingFrame;
	[self extractKeyboardInfo:keyboardUserInfo fromRect:&startingFrame toRect:&endingFrame];

	if ((toolbar!=nil) && !toolbarVisible)
	{
		CGFloat height = MAX(toolbarHeight,40);
		endingFrame.origin.y -= height;	//So that the effective keyboard top is accounted for below.

		toolbar.frame = CGRectMake(startingFrame.origin.x, startingFrame.origin.y, startingFrame.size.width, height);
		
		[[self window] addSubview:toolbar];

		[toolbar setHidden:NO];

		[self attachKeyboardToolbar];
		
		// now animate with the keyboard as it moves up
		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:[[keyboardUserInfo valueForKey:UIKeyboardAnimationCurveUserInfoKey] intValue]];
		[UIView setAnimationDuration:[[keyboardUserInfo valueForKey:UIKeyboardAnimationDurationUserInfoKey] floatValue]];
		toolbar.frame = CGRectMake(endingFrame.origin.x, endingFrame.origin.y, endingFrame.size.width, height);
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
		
		[parentScrollView keyboardDidShowAtHeight:endingFrame.origin.y forView:self];
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

		CGRect startingFrame;
		CGRect endingFrame;
		[self extractKeyboardInfo:userInfo fromRect:&startingFrame toRect:&endingFrame];

		[UIView beginAnimations:nil context:nil];
		[UIView setAnimationCurve:[[userInfo valueForKey:UIKeyboardAnimationCurveUserInfoKey] intValue]];
		[UIView setAnimationDuration:[[userInfo valueForKey:UIKeyboardAnimationDurationUserInfoKey] floatValue]];
		
		CGFloat height = [toolbar bounds].size.height;
		
		if (stillIsResponder)
		{
			endingFrame.origin.y = startingFrame.origin.y;
		}
		else if (![TiUtils isiPhoneOS3_2OrGreater])
		{
			[UIView setAnimationDelegate:self];
			[UIView setAnimationDidStopSelector:@selector(removeToolbar)];
		}

		toolbar.frame = CGRectMake(endingFrame.origin.x,endingFrame.origin.y,endingFrame.size.width,height);
		[UIView commitAnimations];

		toolbarVisible = stillIsResponder;
	}
	
	if (parentScrollView != nil)
	{
		[parentScrollView keyboardDidHideForView:self];
		parentScrollView = nil;
	}
}

- (void)keyboardWillHide:(NSNotification*)notification 
{
	[self performSelector:@selector(keyboardWillHideForReal:) withObject:notification afterDelay:0.0 inModes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
}



@end

#endif