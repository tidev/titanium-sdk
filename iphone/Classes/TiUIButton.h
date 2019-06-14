/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import <TitaniumKit/TiUIView.h>

@interface TiUIButton : TiUIView {
  @private
  UIButton *button;

#ifndef TI_USE_AUTOLAYOUT
  //In the rare case where the button is treated as a view group, we must have
  //an empty wrapper for -[parentViewForChild:]
  UIView *viewGroupWrapper;
#endif
  UIImage *backgroundImageCache;
  UIImage *backgroundImageUnstretchedCache;

  int style;

  BOOL touchStarted;
}

- (UIButton *)button;
#ifndef TI_USE_AUTOLAYOUT
- (UIView *)viewGroupWrapper;
#endif

- (void)setEnabled_:(id)value;

@end

#endif
