/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPROGRESSBAR

#import "TiUIView.h"

@class WebFont;
@interface TiUIProgressBar : TiUIView {
@private
	UIProgressView *progress;
	UIProgressViewStyle style;
	CGFloat max;
	CGFloat min;
	
	UILabel * messageLabel;
}

-(id)initWithStyle:(UIProgressViewStyle)style;

@end

#endif