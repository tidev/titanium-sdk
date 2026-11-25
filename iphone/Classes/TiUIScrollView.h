/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#ifdef USE_TI_UIREFRESHCONTROL
#import "TiUIRefreshControlProxy.h"
#endif

#import <TitaniumKit/TiUIView.h>

@interface TiUIScrollViewImpl : UIScrollView {
  @private
  TiUIView *touchHandler;
  UIView *touchedContentView;
}
- (void)setTouchHandler:(TiUIView *)handler;
@end

@interface TiUIScrollView : TiUIView <TiScrolling, UIScrollViewDelegate> {

  @private
  TiUIScrollViewImpl *scrollView;
#ifdef TI_USE_AUTOLAYOUT
  TiLayoutView *contentView;
#else
  UIView *wrapperView;
  TiDimension contentWidth;
  TiDimension contentHeight;
#endif
  CGFloat minimumContentHeight;

#ifdef USE_TI_UIREFRESHCONTROL
  TiUIRefreshControlProxy *refreshControl;
#endif

  BOOL needsHandleContentSize;
#ifndef TI_USE_AUTOLAYOUT
  // Left/right safe-area insets the content is laid out within. See handleContentSize.
  UIEdgeInsets contentSafeAreaInsets;
#endif
}

@property (nonatomic, retain, readonly) TiUIScrollViewImpl *scrollView;

@property (nonatomic, readonly) TiDimension contentWidth;

- (void)setNeedsHandleContentSize;
- (void)setNeedsHandleContentSizeIfAutosizing;
- (BOOL)handleContentSizeIfNeeded;
- (void)handleContentSize;
- (void)setContentOffset_:(id)value withObject:(id)property;
- (void)setZoomScale_:(id)value withObject:(id)property;
#ifndef TI_USE_AUTOLAYOUT
- (UIView *)wrapperView;
- (CGRect)contentLayoutBounds;
#endif
- (void)scrollToBottom:(BOOL)animated;
- (void)scrollToTop:(BOOL)animated;

@end

#endif
