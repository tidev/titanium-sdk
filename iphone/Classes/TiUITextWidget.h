/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITEXTWIDGET) || defined(USE_TI_UITEXTAREA) || defined(USE_TI_UITEXTFIELD)

#import "TiUIView.h"

@protocol TiUITextWidget

#pragma mark Factory methods

-(UIView<UITextInputTraits>*)textWidgetView;

#pragma mark Public APIs

-(BOOL)hasText;
@end


@interface TiUITextWidget : TiUIView<TiUITextWidget> {

@protected
	UIView<UITextInputTraits>*	textWidgetView;
	BOOL suppressReturn;
	NSInteger maxLength;

	TiUIView<TiScrolling> *	parentScrollView;
@private

}

-(void)textWidget:(UIView<UITextInputTraits>*)tw didFocusWithText:(NSString *)value;
-(void)textWidget:(UIView<UITextInputTraits>*)tw didBlurWithText:(NSString *)value;
-(void)setValue_:(id)text;
-(void)setSelectionFrom:(id)start to:(id)end;

@end

#endif