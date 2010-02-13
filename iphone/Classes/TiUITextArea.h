/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITextWidget.h"

@interface TiUITextArea : TiUITextWidget <UITextViewDelegate>
{
@private
	UITextView *textView;
	BOOL returnActive;
}

#pragma mark Public APIs

-(BOOL)hasText;
-(void)blur;
-(void)focus;

@end
