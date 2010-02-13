/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"

@protocol TiUITextWidget

#pragma mark Factory methods

-(UIView<UITextInputTraits>*)textWidgetView;

#pragma mark Public APIs

-(BOOL)hasText;
-(void)blur;
-(void)focus;

@end


@interface TiUITextWidget : TiUIView<TiUITextWidget> {

@protected

	UIView<UITextInputTraits>*	textWidgetView;

	UIToolbar *toolbar;
	CGFloat toolbarHeight;
	NSArray *toolbarItems;
	BOOL toolbarVisible;

@private

}

@end
