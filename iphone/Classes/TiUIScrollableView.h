/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLABLEVIEW

#import <TitaniumKit/TiUIView.h>

@interface TiUIScrollableView : TiUIView <UIScrollViewDelegate> {
  @private
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *_scrollView;
  UIView *_contentView;
  BOOL _constraintAdded;
  NSUInteger _childrenCount;
  NSInteger _currentPage;
  UIPageControl *_dotsView;
#else
  UIScrollView *scrollview;
  UIPageControl *pageControl;

  // See the code for why we need this...
  NSInteger lastPage;
  BOOL enforceCacheRecalculation;
  NSInteger cacheSize;
  BOOL pageChanged;
  NSInteger currentPage; // Duplicate some info, just in case we're not showing the page control
#endif
  BOOL showPageControl;
  UIColor *pageControlBackgroundColor;
  UIColor *pageIndicatorColor;
  UIColor *currentPageIndicatorColor;
  CGFloat pagingControlAlpha;
  CGFloat pagingControlHeight;
  BOOL handlingPageControlEvent;
  BOOL scrollingEnabled;
  BOOL pagingControlOnTop;
  BOOL overlayEnabled;
  // Have to correct for an apple goof; rotation stops scrolling, AND doesn't move to the next page.
  BOOL rotatedWhileScrolling;
}

#pragma mark - Titanium Internal Use Only
- (void)manageRotation;
- (UIScrollView *)scrollview;
- (void)setCurrentPage:(id)page animated:(NSNumber *)animate;
- (void)addView:(id)viewproxy;
- (void)removeView:(id)args;
- (void)refreshScrollView:(CGRect)visibleBounds readd:(BOOL)readd;

@end

#endif
