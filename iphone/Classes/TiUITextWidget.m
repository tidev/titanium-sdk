/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITEXTWIDGET) || defined(USE_TI_UITEXTAREA) || defined(USE_TI_UITEXTFIELD)

#import "TiUITextWidget.h"
#import "TiUITextWidgetProxy.h"
#import "TiViewProxy.h"
#import "TiApp.h"
#import "TiUtils.h"

@implementation TiUITextWidget

- (id) init
{
	self = [super init];
	if (self != nil)
	{
		suppressReturn = YES;
		maxLength = -1;
        [self textWidgetView];
	}
	return self;
}


-(void)setValue_:(id)value
{
    NSString* string = [TiUtils stringValue:value];
    if (string == nil)
	{
		return;
	}
    if (maxLength > -1 && [string length] > maxLength) {
        string = [string substringToIndex:maxLength];
    }
    [(id)[self textWidgetView] setText:string];
    [(TiUITextWidgetProxy*)[self proxy] noteValueChange:string];
}

-(void)setMaxLength_:(id)value
{
    maxLength = [TiUtils intValue:value def:-1];
    [self setValue_:[[self proxy] valueForUndefinedKey:@"value"]];
    [[self proxy] replaceValue:value forKey:@"maxLength" notification:NO];
}

-(void)setSuppressReturn_:(id)value
{
	suppressReturn = [TiUtils boolValue:value def:YES];
}

- (void) dealloc
{
	TiThreadRemoveFromSuperviewOnMainThread(textWidgetView, YES);
	TiThreadReleaseOnMainThread(textWidgetView, NO);
	//Because text fields MUST be played with on main thread, we cannot release if there's the chance we're on a BG thread
	textWidgetView = nil;	//Wasted action, yes.
	[super dealloc];
}

-(BOOL)hasTouchableListener
{
	// since this guy only works with touch events, we always want them
	// just always return YES no matter what listeners we have registered
	return YES;
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

- (id)accessibilityElement
{
	return [self textWidgetView];
}

#pragma mark Common values

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[textWidgetView setFrame:[self bounds]];
    [super frameSizeChanged:frame bounds:bounds];
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

#pragma mark Keyboard Delegates

-(void)textWidget:(UIView<UITextInputTraits>*)tw didFocusWithText:(NSString *)value
{
	TiUITextWidgetProxy * ourProxy = (TiUITextWidgetProxy *)[self proxy];

	if ([ourProxy suppressFocusEvents]) {
		return;
	}

	[[TiApp controller] didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)ourProxy];

	if ([ourProxy _hasListeners:@"focus"])
	{
		[ourProxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:value forKey:@"value"] propagate:NO];
	}
}

-(void)textWidget:(UIView<UITextInputTraits>*)tw didBlurWithText:(NSString *)value
{
	TiUITextWidgetProxy * ourProxy = (TiUITextWidgetProxy *)[self proxy];

	if ([ourProxy suppressFocusEvents]) {
		return;
	}

	[[TiApp controller] didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)ourProxy];

	if ([ourProxy _hasListeners:@"blur"])
	{
		[ourProxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:value forKey:@"value"] propagate:NO];
	}
	
	// In order to capture gestures properly, we need to force the root view to become the first responder.
	[self makeRootViewFirstResponder];
}

@end

#endif