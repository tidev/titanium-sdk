/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTAREA

#import "TiUITextArea.h"
#import "TiUITextAreaProxy.h"

#import "TiUtils.h"
#import "TiRange.h"
#import "Webcolor.h"
#import "TiApp.h"

@implementation TiUITextArea

#pragma mark Internal

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[textWidgetView sizeToFit];
	[super frameSizeChanged:frame bounds:bounds];
}

-(UIView<UITextInputTraits>*)textWidgetView
{
	if (textWidgetView==nil)
	{
		textWidgetView = [[UITextView alloc] initWithFrame:CGRectMake(0, 0, 100, 100)];
		((UITextView *)textWidgetView).delegate = self;
		[self addSubview:textWidgetView];
		WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
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
	[[self textWidgetView] setBackgroundColor:[Webcolor webColorNamed:color]];
}

#pragma mark Public Method

-(BOOL)hasText
{
	return [(UITextView *)[self textWidgetView] hasText];
}

-(BOOL)becomeFirstResponder
{
	if ([textWidgetView isFirstResponder])
	{
		return NO;
	}

	[self makeRootViewFirstResponder];
	BOOL result = [super becomeFirstResponder];
	return result;
}

//TODO: scrollRangeToVisible

#pragma mark UITextViewDelegate

- (void)textViewDidBeginEditing:(UITextView *)tv
{
	if ([self.proxy _hasListeners:@"focus"])
	{
		[self.proxy fireEvent:@"focus" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"] propagate:NO];
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
		[self.proxy fireEvent:@"blur" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"] propagate:NO];
	}
	
	// In order to capture gestures properly, we need to force the root view to become the first responder.
	[[[[TiApp app] controller] view] becomeFirstResponder];
}

- (void)textViewDidChange:(UITextView *)tv
{
	[(TiUITextAreaProxy *)[self proxy] noteValueChange:[(UITextView *)textWidgetView text]];
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
	NSString *curText = [[tv text] stringByReplacingCharactersInRange:range withString:text];
	if ([text isEqualToString:@"\n"])
	{
		[self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:[(UITextView *)textWidgetView text] forKey:@"value"]];
		if (suppressReturn)
		{
			[tv resignFirstResponder];
			return NO;
		}
	}
	
	[(TiUITextAreaProxy *)self.proxy noteValueChange:curText];
	return TRUE;
}

@end

#endif