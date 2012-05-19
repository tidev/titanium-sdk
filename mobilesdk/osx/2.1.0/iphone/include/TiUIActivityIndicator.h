/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIACTIVITYINDICATOR

#import "TiUIView.h"

@class WebFont;
@interface TiUIActivityIndicator : TiUIView<LayoutAutosizing> {
@private
	UIActivityIndicatorView *indicatorView;
	UIActivityIndicatorViewStyle style;
	
	WebFont * fontDesc;
	UIColor * textColor;
	UILabel * messageLabel;
}

-(UIActivityIndicatorView*)indicatorView;
-(UILabel *)messageLabel;

@end

#endif