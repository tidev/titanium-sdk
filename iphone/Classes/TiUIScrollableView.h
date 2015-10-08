/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLABLEVIEW

#import "TiUIView.h"

@interface TiUIScrollableView : TiUIView<UIScrollViewDelegate> {
@private
	UIScrollView *_scrollView;
	UIPageControl *_dotsView;
    UIView *_contentView;
    BOOL _constraintAdded;
    NSUInteger _childrenCount;
    NSInteger _currentPage;
    NSLayoutConstraint* _dotsViewHeight;
    UIView* _backgroundView;
}

#pragma mark - Titanium Internal Use Only

-(UIScrollView*)scrollview;
-(void)setCurrentPage:(id)page animated:(NSNumber*)animate;
-(void)addView:(id)viewproxy;
-(void)removeView:(id)args;
@end

#endif
