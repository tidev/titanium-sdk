/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTFIELD

#import "TiUITextWidget.h"

@interface TiTextField : UITextField {
  BOOL enableCopy;
  CGFloat paddingLeft;
  CGFloat paddingRight;
  CGFloat leftButtonPadding;
  CGFloat rightButtonPadding;
  UITextFieldViewMode leftMode;
  UITextFieldViewMode rightMode;
  UIView *left;
  UIView *right;
  UIView *leftView;
  UIView *rightView;
  TiUIView *touchHandler;
}

@property (nonatomic, readwrite, assign) BOOL enableCopy;
@property (nonatomic, readwrite, assign) CGFloat paddingLeft;
@property (nonatomic, readwrite, assign) CGFloat paddingRight;
@property (nonatomic, readwrite, assign) CGFloat leftButtonPadding;
@property (nonatomic, readwrite, assign) CGFloat rightButtonPadding;

- (void)setTouchHandler:(TiUIView *)handler;

@end

@interface TiUITextField : TiUITextWidget <UITextFieldDelegate> {
  @private
}

@end

#endif
