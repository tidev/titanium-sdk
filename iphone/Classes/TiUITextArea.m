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
	[textWidgetView sizeToFit];
}

-(UIView<UITextInputTraits>*)textWidgetView
{
	if (textWidgetView==nil)
	{
		textWidgetView = [[UITextView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
		((UITextView *)textWidgetView).delegate = self;
		((UITextView *)textWidgetView).contentInset = UIEdgeInsetsMake(2, 2, 2, 2);
		[self addSubview:textWidgetView];
	}
	return textWidgetView;
}

#pragma mark Public APIs

-(void)setEnabled_:(id)value
{
	[[self textWidgetView] setEditable:[TiUtils boolValue:value]];
}

-(void)setValue_:(id)text
{
	[[self textWidgetView] setText:[TiUtils stringValue:text]];
}

-(void)setEditable_:(id)editable
{
	[[self textWidgetView] setEditable:[TiUtils boolValue:editable]];
}

-(void)setBorderStyle_:(id)value
{
	//TODO
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

-(void)setBackgroundColor_:(id)color
{
	[[self textWidgetView] setBackgroundColor:UIColorWebColorNamed(color)];
}

#pragma mark Public Method

-(BOOL)hasText
{
	return [[self textWidgetView] hasText];
}

-(void)blur
{
	[[self textWidgetView] resignFirstResponder];
	[self makeRootViewFirstResponder];
}

-(void)focus
{
	[[self textWidgetView] becomeFirstResponder];
}

//TODO: scrollRangeToVisible

#pragma mark UITextViewDelegate

- (void)textViewDidBeginEditing:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"focus"])
	{
		[self.proxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:[textWidgetView text] forKey:@"value"]];
	}
}

- (void)textViewDidEndEditing:(UITextView *)tv
{
	if (returnActive && [self.proxy _hasListeners:@"return"])
	{
		[self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:[textWidgetView text] forKey:@"value"]];
	}	

	returnActive = NO;

	if ([self.proxy _hasListeners:@"blur"])
	{
		[self.proxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:[textWidgetView text] forKey:@"value"]];
	}
}

- (void)textViewDidChange:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:[textWidgetView text] forKey:@"value"]];
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
	NSString *value = [NSString stringWithFormat:@"%@%@",[tv text],text];
	[self.proxy replaceValue:value forKey:@"value" notification:NO];

	if ([text isEqualToString:@"\n"]) 
	{
		returnActive = YES;

		[textWidgetView resignFirstResponder];
		[self makeRootViewFirstResponder];

		// Return FALSE so that the final '\n' character doesn't get added
		return FALSE;
	}
	return TRUE;
}

@end
