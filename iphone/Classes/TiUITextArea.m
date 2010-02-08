/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITextArea.h"
#import "TiUtils.h"
#import "TiRange.h"
#import "Webcolor.h"

@implementation TiUITextArea

#pragma mark Internal

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[TiUtils setView:textView positionRect:bounds];
	[textView sizeToFit];
}

-(UITextView*)textview
{
	if (textView==nil)
	{
		textView = [[UITextView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
		textView.delegate = self;
		textView.contentInset = UIEdgeInsetsMake(2, 2, 2, 2);
		[self addSubview:textView];
	}
	return textView;
}

#pragma mark Public APIs

-(void)setEnabled_:(id)value
{
	[[self textview] setEditable:[TiUtils boolValue:value]];
}

-(void)setValue_:(id)text
{
	[[self textview] setText:[TiUtils stringValue:text]];
}

-(void)setEditable_:(id)editable
{
	[[self textview] setEditable:[TiUtils boolValue:editable]];
}

-(void)setColor_:(id)color
{
	[[self textview] setTextColor:[[TiUtils colorValue:color] _color]];
}

-(void)setFont_:(id)font
{
	[[self textview] setFont:[[TiUtils fontValue:font] font]];
}

// <0.9 is textAlign
-(void)setTextAlign_:(id)alignment
{
	[[self textview] setTextAlignment:[TiUtils textAlignmentValue:alignment]];
}

-(void)setReturnKeyType_:(id)value
{
	[[self textview] setReturnKeyType:[TiUtils intValue:value]];
}

-(void)setEnableReturnKey_:(id)value
{
	[[self textview] setEnablesReturnKeyAutomatically:[TiUtils boolValue:value]];
}

-(void)setKeyboardType_:(id)value
{
	[[self textview] setKeyboardType:[TiUtils intValue:value]];
}

-(void)setAutocorrect_:(id)value
{
	[[self textview] setAutocorrectionType:[TiUtils boolValue:value] ? UITextAutocorrectionTypeYes : UITextAutocorrectionTypeNo];
}

-(void)setBorderStyle_:(id)value
{
	//TODO
}


-(void)setPasswordMask_:(id)value
{
	[[self textview] setSecureTextEntry:[TiUtils boolValue:value]];
}

-(void)setAppearance_:(id)value
{
	[[self textview] setKeyboardAppearance:[TiUtils intValue:value]];
}

-(void)setAutocapitalization_:(id)value
{
	[[self textview] setAutocapitalizationType:[TiUtils intValue:value]];
}

-(void)setBackgroundColor_:(id)color
{
	[[self textview] setBackgroundColor:UIColorWebColorNamed(color)];
}

#pragma mark Public Method

-(BOOL)hasText
{
	return [[self textview] hasText];
}

-(void)blur
{
	[[self textview] resignFirstResponder];
	[self makeRootViewFirstResponder];
}

-(void)focus
{
	[[self textview] becomeFirstResponder];
}

//TODO: scrollRangeToVisible

#pragma mark UITextViewDelegate

- (void)textViewDidBeginEditing:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"focus"])
	{
		[self.proxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:[textView text] forKey:@"value"]];
	}
}

- (void)textViewDidEndEditing:(UITextView *)tv
{
	if (returnActive && [self.proxy _hasListeners:@"return"])
	{
		[self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:[textView text] forKey:@"value"]];
	}	

	returnActive = NO;

	if ([self.proxy _hasListeners:@"blur"])
	{
		[self.proxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:[textView text] forKey:@"value"]];
	}
}

- (void)textViewDidChange:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:[textView text] forKey:@"value"]];
	}
}

- (void)textViewDidChangeSelection:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"selected"])
	{
		NSRange range = tv.selectedRange;
		TiRange *r = [[[TiRange alloc] initWithRange:range] autorelease];
		NSDictionary *event = [NSDictionary dictionaryWithObject:r forKey:@"range"];
		[self.proxy fireEvent:@"selected" withObject:event];
	}
}

- (BOOL)textViewShouldEndEditing:(UITextView *)tv
{
	return YES;
}

//- (BOOL)textFieldShouldClear:(UITextField *)textField;               // called when clear button pressed. return NO to ignore (no notifications)
//{
////	[self setStringValue:@""];
////	[self reportEvent:@"change" value:@"''" index:-1 init:nil arguments:nil];
//	return YES;
//}

- (BOOL)textView:(UITextView *)tv shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
	if ([text isEqualToString:@"\n"]) 
	{
		returnActive = YES;

		[textView resignFirstResponder];
		[self makeRootViewFirstResponder];

		// Return FALSE so that the final '\n' character doesn't get added
		return FALSE;
	}
	return TRUE;
}

@end
