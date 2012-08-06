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
#import "Webcolor.h"
#import "TiApp.h"

@implementation TiUITextViewImpl

-(void)setTouchHandler:(TiUIView*)handler
{
    //Assign only. No retain
    touchHandler = handler;
}

- (BOOL)touchesShouldBegin:(NSSet *)touches withEvent:(UIEvent *)event inContentView:(UIView *)view
{
    //If the content view is of type TiUIView touch events will automatically propagate
    //If it is not of type TiUIView we will fire touch events with ourself as source
    if ([view isKindOfClass:[TiUIView class]]) {
        touchedContentView= view;
    }
    else {
        touchedContentView = nil;
    }
    return [super touchesShouldBegin:touches withEvent:event inContentView:view];
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event 
{
    //When userInteractionEnabled is false we do nothing since touch events are automatically
    //propagated. If it is dragging do not do anything.
    //The reason we are not checking tracking (like in scrollview) is because for some 
    //reason UITextView always returns true for tracking after the initial focus
    if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesBegan:touches withEvent:event];
 	}		
	[super touchesBegan:touches withEvent:event];
}
- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesMoved:touches withEvent:event];
    }		
	[super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesEnded:touches withEvent:event];
    }		
	[super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event 
{
    if (!self.dragging && self.userInteractionEnabled && (touchedContentView == nil) ) {
        [touchHandler processTouchesCancelled:touches withEvent:event];
    }
    [super touchesCancelled:touches withEvent:event];
}
@end


@implementation TiUITextArea

#pragma mark Internal

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	[[self textWidgetView] sizeToFit];
	[super frameSizeChanged:frame bounds:bounds];
}

-(UIView<UITextInputTraits>*)textWidgetView
{
    if (textWidgetView==nil)
    {
        TiUITextViewImpl *textViewImpl = [[TiUITextViewImpl alloc] initWithFrame:CGRectZero];
        textViewImpl.delaysContentTouches = NO;
        [textViewImpl setTouchHandler:self];
        textViewImpl.delegate = self;
        [self addSubview:textViewImpl];
        [textViewImpl setContentInset:UIEdgeInsetsZero];
        self.clipsToBounds = YES;
        textViewImpl.text = @""; //Setting TextArea text to empty string 
        
        textWidgetView = textViewImpl;
    }
    return textWidgetView;
}

#pragma mark Public APIs

-(void)setEnabled_:(id)value
{
	[(UITextView *)[self textWidgetView] setEditable:[TiUtils boolValue:value]];
}

-(void)setScrollable_:(id)value
{
	[(UITextView *)[self textWidgetView] setScrollEnabled:[TiUtils boolValue:value]];
}

-(void)setEditable_:(id)editable
{
	[(UITextView *)[self textWidgetView] setEditable:[TiUtils boolValue:editable]];
}

-(void)setAutoLink_:(id)type_
{
	[(UITextView *)[self textWidgetView] setDataDetectorTypes:[TiUtils intValue:type_ def:UIDataDetectorTypeNone]];
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
	[self textWidget:tv didFocusWithText:[tv text]];
}

- (void)textViewDidEndEditing:(UITextView *)tv
{
	NSString * text = [(UITextView *)textWidgetView text];

	if (returnActive && [self.proxy _hasListeners:@"return"])
	{
		[self.proxy fireEvent:@"return" withObject:[NSDictionary dictionaryWithObject:text forKey:@"value"]];
	}	

	returnActive = NO;

	[self textWidget:tv didBlurWithText:text];
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
        NSDictionary* rangeDict = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(range.location),@"location",
                                   NUMINT(range.length),@"length", nil];
		NSDictionary *event = [NSDictionary dictionaryWithObject:rangeDict forKey:@"range"];
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
	
    if ( (maxLength > -1) && ([curText length] > maxLength) ) {
        [self setValue_:curText];
        return NO;
    }

	[(TiUITextAreaProxy *)self.proxy noteValueChange:curText];
	return TRUE;
}

/*
Text area constrains the text event though the content offset and edge insets are set to 0 
*/
#define TXT_OFFSET 20
-(CGFloat)contentWidthForWidth:(CGFloat)value
{
    UITextView* ourView = (UITextView*)[self textWidgetView];
    NSString* txt = ourView.text;
    //sizeThatFits does not seem to work properly.
    CGFloat txtWidth = [txt sizeWithFont:ourView.font constrainedToSize:CGSizeMake(value, 1E100) lineBreakMode:UILineBreakModeWordWrap].width;
    if (value - txtWidth >= TXT_OFFSET) {
        return (txtWidth + TXT_OFFSET);
    }
    return txtWidth + 2 * self.layer.borderWidth;
}

-(CGFloat)contentHeightForWidth:(CGFloat)value
{
    CGFloat constrainedWidth = value - TXT_OFFSET;
    if (constrainedWidth < 0) {
        constrainedWidth = 0;
    }
    UITextView* ourView = (UITextView*)[self textWidgetView];
    NSString* txt = ourView.text;
    if (txt.length == 0) {
        txt = @" ";
    }
    
    return [ourView sizeThatFits:CGSizeMake(constrainedWidth, 1E100)].height;
}

- (void)scrollViewDidScroll:(id)scrollView
{
    //Ensure that system messages that cause the scrollView to 
    //scroll are ignored if scrollable is set to false
    UITextView* ourView = (UITextView*)[self textWidgetView];
    if (![ourView isScrollEnabled]) {
        CGPoint origin = [scrollView contentOffset]; 
        if ( (origin.x != 0) || (origin.y != 0) ) {
            [scrollView setContentOffset:CGPointZero animated:NO];
        }
    }
}


@end

#endif