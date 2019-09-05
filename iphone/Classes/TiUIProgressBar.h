/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPROGRESSBAR

#import <TitaniumKit/TiUIView.h>

@class WebFont;
@interface TiUIProgressBar : TiUIView {
  @private
  UIProgressView *progress;
  UIProgressViewStyle style;
  CGFloat max;
  CGFloat min;

  UILabel *messageLabel;

#ifdef TI_USE_AUTOLAYOUT
  UIView *backgroundView;
  BOOL _constraintsAdded;
#endif
}

- (id)initWithStyle:(UIProgressViewStyle)_style andMinimumValue:(CGFloat)_min maximumValue:(CGFloat)_max;

@end

#endif
