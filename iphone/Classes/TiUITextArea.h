/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTAREA

#import "TiUITextWidget.h"

@interface TiUITextViewImpl : UITextView {
  @private
  TiUIView *touchHandler;
  UIView *touchedContentView;
}
- (void)setTouchHandler:(TiUIView *)handler;
@end

@interface TiUITextArea : TiUITextWidget <UITextViewDelegate> {
  @private
  BOOL returnActive;
  BOOL handleLinks;
  NSRange lastSelectedRange;
}

- (void)setShowUndoRedoActions:(id)value;

- (UIView<UITextInputTraits> *)textWidgetView;
- (void)checkLinkForTouch:(UITouch *)touch;

@end

#endif
