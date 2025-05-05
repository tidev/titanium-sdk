/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiScrollableView.h"

@interface TiScrollableView () {
  UIScrollView *_scrollView;
  UIView *_contentView;
  BOOL _constraintAdded;
  NSUInteger _childrenCount;
  NSInteger _currentPage;
  UIPageControl *_dotsView;
}
@end

@implementation TiScrollableView

- (instancetype)init
{
  self = [super init];
  if (self) {
    [self setDefaultHeight:TiDimensionFromObject(@"FILL")];
    [self setDefaultWidth:TiDimensionFromObject(@"FILL")];

    _contentView = [[UIView alloc] init];
    [_contentView setTranslatesAutoresizingMaskIntoConstraints:NO];

    _scrollView = [[UIScrollView alloc] init];
    [_scrollView setDelegate:self];
    [_scrollView setPagingEnabled:YES];
    [_scrollView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [_scrollView setShowsHorizontalScrollIndicator:NO];
    [_scrollView setShowsVerticalScrollIndicator:NO];
    [_scrollView addSubview:_contentView];

    _dotsView = [[UIPageControl alloc] init];
    [_dotsView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [_dotsView addTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];

    [super addSubview:_scrollView];
    [super addSubview:_dotsView];
  }
  return self;
}

- (void)layoutSubviews
{
  [super layoutSubviews];
  if (!_constraintAdded) {
    _constraintAdded = YES;
    NSDictionary *views = NSDictionaryOfVariableBindings(_contentView, _scrollView, _dotsView);
    [_scrollView addConstraints:TI_CONSTR(@"V:|[_contentView(_scrollView)]|", views)];
    [_scrollView addConstraints:TI_CONSTR(@"H:|[_contentView(>=_scrollView)]|", views)];
    [self addConstraints:TI_CONSTR(@"V:[_dotsView]-|", views)];
    [self addConstraint:[NSLayoutConstraint constraintWithItem:self attribute:NSLayoutAttributeCenterX relatedBy:NSLayoutRelationEqual toItem:_dotsView attribute:NSLayoutAttributeCenterX multiplier:1 constant:0]];
  }

  NSArray *children = [_contentView subviews];
  NSUInteger length = [children count];
  if (length != _childrenCount) {
    _childrenCount = length;
    for (NSUInteger index = 0; index < length; index++) {
      TiLayoutView *child = [children objectAtIndex:index];
      [TiLayoutView removeConstraints:_contentView fromChild:child];

      NSDictionary *views;
      if (index == 0) {
        views = NSDictionaryOfVariableBindings(_contentView, child, _scrollView);
        [_contentView addConstraints:TI_CONSTR(@"H:|[child]", views)];
      } else {
        UIView *prev = [children objectAtIndex:index - 1];
        views = NSDictionaryOfVariableBindings(_contentView, child, prev, _scrollView);
        [_contentView addConstraints:TI_CONSTR(@"H:[prev][child]", views)];
      }

      if (index == length - 1) {
        [_contentView addConstraints:TI_CONSTR(@"H:[child]|", views)];
      }
      [_contentView addConstraints:TI_CONSTR(@"V:|[child]|", views)];
      [_scrollView addConstraints:TI_CONSTR(@"H:[child(_scrollView)]", views)];
    }
  }
  [_dotsView setNumberOfPages:length];
  [_dotsView setCurrentPage:_currentPage];

  [_scrollView setContentOffset:CGPointMake(_currentPage * self.frame.size.width, 0) animated:NO];
}

- (void)addSubview:(nonnull UIView *)view
{
  TiLayoutView *wrapperView = [[TiLayoutView alloc] init];
  [wrapperView setViewName:TI_STRING(@"scrollable.wrapper.view%lu", (unsigned long)[[self subviews] count])];
  [wrapperView setHeight_:@"SIZE"];
  [wrapperView addSubview:view];
  [_contentView addSubview:wrapperView];
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
  CGPoint contentOffset = [scrollView contentOffset];
  _currentPage = ceil(contentOffset.x / self.frame.size.width);
  [_dotsView setCurrentPage:_currentPage];
}

- (void)pageControlTouched:(UIPageControl *)sender
{
  _currentPage = [sender currentPage];
  [_scrollView setContentOffset:CGPointMake(self.bounds.size.width * _currentPage, 0) animated:YES];
}
@end
