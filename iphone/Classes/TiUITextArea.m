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
	[super frameSizeChanged:frame bounds:bounds];
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
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
	}
	return textWidgetView;
}

#pragma mark Public APIs

-(void)setEnabled_:(id)value
{
	[(UITextView *)[self textWidgetView] setEditable:[TiUtils boolValue:value]];
}

-(void)setEditable_:(id)editable
{
	[(UITextView *)[self textWidgetView] setEditable:[TiUtils boolValue:editable]];
}

-(void)setBorderStyle_:(id)value
{
	//TODO
}


-(void)setBackgroundColor_:(id)color
{
	[[self textWidgetView] setBackgroundColor:UIColorWebColorNamed(color)];
}

#pragma mark Public Method

-(BOOL)hasText
{
	return [(UITextView *)[self textWidgetView] hasText];
}

-(BOOL)becomeFirstResponder
{
	BOOL result = [super becomeFirstResponder];
	[self makeRootViewFirstResponder];
	return result;
}

//TODO: scrollRangeToVisible

#pragma mark UITextViewDelegate

- (void)textViewDidBeginEditing:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"focus"])
	{
		[self.proxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"]];
	}
}

- (void)textViewDidEndEditing:(UITextView *)tv
{
	if (returnActive && [self.proxy _hasListeners:@"return"])
	{
		[self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"]];
	}	

	returnActive = NO;

	if ([self.proxy _hasListeners:@"blur"])
	{
		[self.proxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"]];
	}
}

- (void)textViewDidChange:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"change"])
	{
		[self.proxy fireEvent:@"change" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"]];
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

- (BOOL)textView:(UITextView *)tv shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
	NSString *curText = [tv text];
	
	if ([text isEqualToString:@""])
	{
		// this is delete
		curText = [curText substringToIndex:[curText length]-range.length];
	}
	else
	{
		curText = [NSString stringWithFormat:@"%@%@",curText,text];
	}
	
	[self.proxy replaceValue:curText forKey:@"value" notification:NO];

	return TRUE;
}

@end
