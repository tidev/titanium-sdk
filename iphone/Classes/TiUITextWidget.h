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
-(void)windowClosing;

@end


@interface TiUITextWidget : TiUIView<TiUITextWidget> {

@protected

	UIView<UITextInputTraits>*	textWidgetView;

	UIToolbar *toolbar;
	CGFloat toolbarHeight;
	NSArray *toolbarItems;
	BOOL toolbarVisible;
	BOOL suppressReturn;
	
	TiUIView<TiUIScrollView> *	parentScrollView;
@private



}
@property(nonatomic,readwrite,retain) NSDictionary* keyboardUserInfo;
@end

// Okay, here's why we need this.  In 3.2, Apple made the awesome mistake of no longer firing
// UIKeyboardWillHideNotification (OR UIKeyboardWillShowNotification) when the first responder changes.  
// This means that for these iOSes and later, we have to fire our OWN notification that indicates 
// the first responder changed and the keyboard needs to "hide".
// FIXME: Every new OS, see if Apple's fixed this obnoxious bug.
extern NSString* const TiKeyboardHideNotification;
extern NSString* const TiKeyboardShowNotification;



#endif