/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiScrollView.h"

@interface TiScrollView () {
  UIScrollView *scrollView;
  TiLayoutView *contentView;
  BOOL _constraintAdded;
}
@end

@implementation TiScrollView

- (instancetype)init
{
  self = [super init];
  if (self) {

    scrollView = [[UIScrollView alloc] init];
    contentView = [[TiLayoutView alloc] init];
    [contentView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [scrollView setTranslatesAutoresizingMaskIntoConstraints:NO];

    [contentView setBackgroundColor:[UIColor greenColor]];
    [contentView setViewName:@"TiScrollView.ContentView"];

    [contentView setDefaultHeight:TiDimensionAutoSize];
    [contentView setDefaultWidth:TiDimensionAutoSize];

    [scrollView addSubview:contentView];

    [self setDefaultHeight:TiDimensionAutoFill];
    [self setDefaultWidth:TiDimensionAutoFill];

    [super addSubview:scrollView];

    [self setHorizontalWrap:NO];
  }
  return self;
}

- (void)setViewName:(NSString *)viewName
{
  [contentView setViewName:TI_STRING(@"TiScrollView.ContentView.%@", viewName)];
  [super setViewName:viewName];
}

- (void)setHorizontalWrap:(BOOL)horizontalWrap
{
  [contentView setHorizontalWrap:horizontalWrap];
  [super setHorizontalWrap:horizontalWrap];
}

- (BOOL)horizontalWrap
{
  return [contentView horizontalWrap];
}

- (void)addSubview:(nonnull UIView *)view
{
  [contentView addSubview:view];
}

- (void)insertSubview:(nonnull UIView *)view aboveSubview:(nonnull UIView *)siblingSubview
{
  [contentView insertSubview:view aboveSubview:siblingSubview];
}

- (void)insertSubview:(nonnull UIView *)view atIndex:(NSInteger)index
{
  [contentView insertSubview:view atIndex:index];
}

- (void)insertSubview:(nonnull UIView *)view belowSubview:(nonnull UIView *)siblingSubview
{
  [contentView insertSubview:view belowSubview:siblingSubview];
}

- (TiLayoutView *)contentView
{
  return contentView;
}

- (void)setLayout_:(id)val
{
  [contentView setLayout_:val];
}

- (void)setContentWidth_:(id)val
{
  [contentView setWidth_:val];
}

- (void)setContentHeight_:(id)val
{
  [contentView setHeight_:val];
}

- (void)setOnContentLayout:(void (^)(TiLayoutView *sender, CGRect rect))onContentLayout
{
  [contentView setOnLayout:onContentLayout];
}

- (void)setBackgroundColor:(UIColor *)backgroundColor
{
  [[self contentView] setBackgroundColor:backgroundColor];
  [super setBackgroundColor:backgroundColor];
}
@end
