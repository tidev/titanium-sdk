/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITEXTAREA

#import "TiUITextWidget.h"

@interface TiUITextViewImpl : UITextView {
  @private
  BOOL enableCopy;
  TiUIView *touchHandler;
  UIView *touchedContentView;
}

@property (nonatomic, readwrite, assign) BOOL enableCopy;

- (void)setTouchHandler:(TiUIView *)handler;
- (NSComparisonResult)comparePosition:(UITextPosition *)position toPosition:(UITextPosition *)other;

@end

@interface TiUITextArea : TiUITextWidget <UITextViewDelegate> {
  @private
  BOOL returnActive;
  BOOL handleLinks;
  NSRange lastSelectedRange;
  UIControlContentVerticalAlignment verticalAlign;
  NSInteger linesCount;
  NSInteger maxRows;
}

- (void)setShowUndoRedoActions:(id)value;

- (UIView<UITextInputTraits> *)textWidgetView;
- (void)checkLinkForTouch:(UITouch *)touch;
- (void)updateVerticalAlignment;
- (void)setPadding_:(id)args;
- (void)setVerticalAlign_:(id)value;
- (void)setScrollable_:(id)value;
- (void)setLines_:(id)value;
- (void)setMaxLines_:(id)value;

@end

#endif
