/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLVIEW

#import "TiUIScrollView.h"
#import "TiUIScrollViewProxy.h"
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiWindowProxy.h>

@implementation TiUIScrollViewImpl

- (void)setTouchHandler:(TiUIView *)handler
{
  //Assign only. No retain
  touchHandler = handler;
}

- (BOOL)touchesShouldBegin:(NSSet *)touches withEvent:(UIEvent *)event inContentView:(UIView *)view
{
  //If the content view is of type TiUIView touch events will automatically propagate
  //If it is not of type TiUIView we will fire touch events with ourself as source
  if ([view isKindOfClass:[TiUIView class]]) {
    touchedContentView = view;
  } else {
    touchedContentView = nil;
  }
  return [super touchesShouldBegin:touches withEvent:event inContentView:view];
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
  //When userInteractionEnabled is false we do nothing since touch events are automatically
  //propagated. If it is dragging,tracking or zooming do not do anything.
  if (!self.dragging && !self.zooming && !self.tracking
      && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesBegan:touches withEvent:event];
  }
  [super touchesBegan:touches withEvent:event];
}
- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event
{
  if (!self.dragging && !self.zooming && !self.tracking
      && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesMoved:touches withEvent:event];
  }
  [super touchesMoved:touches withEvent:event];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event
{
  if (!self.dragging && !self.zooming && !self.tracking
      && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesEnded:touches withEvent:event];
  }
  [super touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event
{
  if (!self.dragging && !self.zooming && !self.tracking
      && self.userInteractionEnabled && (touchedContentView == nil)) {
    [touchHandler processTouchesCancelled:touches withEvent:event];
  }
  [super touchesCancelled:touches withEvent:event];
}
@end

@implementation TiUIScrollView
@synthesize contentWidth;

#ifdef TI_USE_AUTOLAYOUT
- (void)initializeTiLayoutView
{
  [super initializeTiLayoutView];
  [self setDefaultHeight:TiDimensionAutoFill];
  [self setDefaultWidth:TiDimensionAutoFill];
}
#endif

- (void)dealloc
{
#ifndef TI_USE_AUTOLAYOUT
  RELEASE_TO_NIL(wrapperView);
#endif
#ifdef USE_TI_UIREFRESHCONTROL
  RELEASE_TO_NIL(refreshControl);
#endif
  RELEASE_TO_NIL(scrollView);
  [super dealloc];
}

#ifndef TI_USE_AUTOLAYOUT
- (UIView *)wrapperView
{
  if (wrapperView == nil) {
    CGRect wrapperFrame;
    wrapperFrame.size = [[self scrollView] contentSize];
    wrapperFrame.origin = CGPointZero;
    wrapperView = [[UIView alloc] initWithFrame:wrapperFrame];
    [wrapperView setUserInteractionEnabled:YES];
    [scrollView addSubview:wrapperView];
  }
  return wrapperView;
}
#endif

- (TiUIScrollViewImpl *)scrollView
{
  if (scrollView == nil) {
#ifdef TI_USE_AUTOLAYOUT
    scrollView = [[TiUIScrollViewImpl alloc] init];
    contentView = [[TiLayoutView alloc] init];
    [contentView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [scrollView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [scrollView setDelegate:self];

    [contentView setViewName:@"TiScrollView.ContentView"];

    [contentView setDefaultHeight:TiDimensionAutoSize];
    [contentView setDefaultWidth:TiDimensionAutoSize];

    [scrollView addSubview:contentView];

    [super addSubview:scrollView];

    [self setHorizontalWrap:NO];
#else
    scrollView = [[TiUIScrollViewImpl alloc] initWithFrame:[self bounds]];
    [scrollView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
    [scrollView setBackgroundColor:[UIColor clearColor]];
    [scrollView setShowsHorizontalScrollIndicator:NO];
    [scrollView setShowsVerticalScrollIndicator:NO];
    [scrollView setDelegate:self];
    [scrollView setTouchHandler:self];
    [self addSubview:scrollView];
#endif
  }
  if ([TiUtils isIOSVersionOrGreater:@"11.0"]) {
    [self adjustScrollViewInsets];
  }
  return scrollView;
}

- (void)adjustScrollViewInsets
{
  id viewProxy = self.proxy;
  while (viewProxy && ![viewProxy isKindOfClass:[TiWindowProxy class]]) {
    viewProxy = [viewProxy parent];
  }
  if (viewProxy != nil) {
    id autoAdjust = [(TiProxy *)viewProxy valueForUndefinedKey:@"autoAdjustScrollViewInsets"];
    if ([TiUtils boolValue:autoAdjust def:NO]) {
      [scrollView setContentInsetAdjustmentBehavior:UIScrollViewContentInsetAdjustmentAlways];
    } else {
      [scrollView setContentInsetAdjustmentBehavior:UIScrollViewContentInsetAdjustmentNever];
    }
  }
}

- (id)accessibilityElement
{
  return [self scrollView];
}

#ifdef TI_USE_AUTOLAYOUT
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

#endif

- (void)setNeedsHandleContentSizeIfAutosizing
{
#ifndef TI_USE_AUTOLAYOUT
  if (TiDimensionIsAuto(contentWidth) || TiDimensionIsAuto(contentHeight) || TiDimensionIsAutoSize(contentWidth) || TiDimensionIsAutoSize(contentHeight) || TiDimensionIsUndefined(contentWidth) || TiDimensionIsUndefined(contentHeight)) {
    [self setNeedsHandleContentSize];
  }
#endif
}

- (void)setNeedsHandleContentSize
{
#ifndef TI_USE_AUTOLAYOUT
  if (!needsHandleContentSize) {
    needsHandleContentSize = YES;
    TiThreadPerformOnMainThread(^{
      [self handleContentSize];
    },
        NO);
  }
#endif
}

- (BOOL)handleContentSizeIfNeeded
{
#ifndef TI_USE_AUTOLAYOUT
  if (needsHandleContentSize) {
    [self handleContentSize];
    return YES;
  }
#endif
  return NO;
}

- (void)handleContentSize
{
#ifndef TI_USE_AUTOLAYOUT
  if (!needsHandleContentSize) {
    return;
  }
  CGSize newContentSize = [self bounds].size;
  CGFloat scale = [scrollView zoomScale];

  switch (contentWidth.type) {
  case TiDimensionTypeDip: {
    newContentSize.width = MAX(newContentSize.width, contentWidth.value);
    break;
  }
  case TiDimensionTypeUndefined:
  case TiDimensionTypeAutoSize:
  case TiDimensionTypeAuto: // TODO: This may break the layout spec for content "auto"
  {
    newContentSize.width = MAX(newContentSize.width, [(TiViewProxy *)[self proxy] autoWidthForSize:[self bounds].size]);
    break;
  }
  case TiDimensionTypeAutoFill: // Assume that "fill" means "fill scrollview bounds"; not in spec
  default: {
    break;
  }
  }

  switch (contentHeight.type) {
  case TiDimensionTypeDip: {
    minimumContentHeight = contentHeight.value;
    break;
  }
  case TiDimensionTypeUndefined:
  case TiDimensionTypeAutoSize:
  case TiDimensionTypeAuto: // TODO: This may break the layout spec for content "auto"
  {
    minimumContentHeight = [(TiViewProxy *)[self proxy] autoHeightForSize:[self bounds].size];
    break;
  }
  case TiDimensionTypeAutoFill: // Assume that "fill" means "fill scrollview bounds"; not in spec
  default:
    minimumContentHeight = newContentSize.height;
    break;
  }
  newContentSize.width *= scale;
  newContentSize.height = scale * MAX(newContentSize.height, minimumContentHeight);

  [scrollView setContentSize:newContentSize];
  CGRect wrapperBounds;
  wrapperBounds.origin = CGPointZero;
  wrapperBounds.size = newContentSize;
  [wrapperView setFrame:wrapperBounds];
  [self scrollViewDidZoom:scrollView];
  needsHandleContentSize = NO;
  [(TiUIScrollViewProxy *)[self proxy] layoutChildrenAfterContentSize:NO];
#endif
}

- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)visibleBounds
{
  //Treat this as a size change
  [(TiViewProxy *)[self proxy] willChangeSize];
  [super frameSizeChanged:frame bounds:visibleBounds];
}

- (void)scrollToBottom
{
  /*
     * Calculate the bottom height & width and, sets the offset from the
     * content view’s origin that corresponds to the receiver’s origin.
     */
  UIScrollView *currScrollView = [self scrollView];

  CGSize svContentSize = currScrollView.contentSize;
  CGSize svBoundSize = currScrollView.bounds.size;
  CGFloat svBottomInsets = currScrollView.contentInset.bottom;

  CGFloat bottomHeight = svContentSize.height - svBoundSize.height + svBottomInsets;
  CGFloat bottomWidth = svContentSize.width - svBoundSize.width;

  CGPoint newOffset = CGPointMake(bottomWidth, bottomHeight);

  [currScrollView setContentOffset:newOffset animated:YES];
}

- (void)scrollToTop
{
  [[self scrollView] setContentOffset:CGPointMake(0, -[[self scrollView] contentInset].top) animated:YES];
}

- (void)setDecelerationRate_:(id)value
{
  [self.proxy replaceValue:value forKey:@"decelerationRate" notification:NO];
  [[self scrollView] setDecelerationRate:[TiUtils floatValue:value def:UIScrollViewDecelerationRateNormal]];
}

#ifndef TI_USE_AUTOLAYOUT
- (void)setContentWidth_:(id)value
{
  contentWidth = [TiUtils dimensionValue:value];
  [self.proxy replaceValue:value forKey:@"contentWidth" notification:NO];
  [self performSelector:@selector(setNeedsHandleContentSize) withObject:nil afterDelay:.1];
}

- (void)setContentHeight_:(id)value
{
  contentHeight = [TiUtils dimensionValue:value];
  [self.proxy replaceValue:value forKey:@"contentHeight" notification:NO];
  [self performSelector:@selector(setNeedsHandleContentSize) withObject:nil afterDelay:.1];
}
#endif

- (void)setRefreshControl_:(id)args
{
#ifdef USE_TI_UIREFRESHCONTROL
  ENSURE_SINGLE_ARG_OR_NIL(args, TiUIRefreshControlProxy);
  [[refreshControl control] removeFromSuperview];
  RELEASE_TO_NIL(refreshControl);
  [[self proxy] replaceValue:args forKey:@"refreshControl" notification:NO];
  if (args != nil) {
    refreshControl = [args retain];
    [[self scrollView] setRefreshControl:refreshControl.control];
  }
#endif
}

- (void)setShowHorizontalScrollIndicator_:(id)value
{
  [[self scrollView] setShowsHorizontalScrollIndicator:[TiUtils boolValue:value]];
}

- (void)setShowVerticalScrollIndicator_:(id)value
{
  [[self scrollView] setShowsVerticalScrollIndicator:[TiUtils boolValue:value]];
}

- (void)setScrollIndicatorStyle_:(id)value
{
  [[self scrollView] setIndicatorStyle:[TiUtils intValue:value def:UIScrollViewIndicatorStyleDefault]];
}

- (void)setDisableBounce_:(id)value
{
  [[self scrollView] setBounces:![TiUtils boolValue:value]];
}

- (void)setScrollingEnabled_:(id)enabled
{
  BOOL scrollingEnabled = [TiUtils boolValue:enabled def:YES];
  [[self scrollView] setScrollEnabled:scrollingEnabled];
  [[self proxy] replaceValue:NUMBOOL(scrollingEnabled) forKey:@"scrollingEnabled" notification:NO];
}

- (void)setKeyboardDismissMode_:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  [[self scrollView] setKeyboardDismissMode:[TiUtils intValue:value def:UIScrollViewKeyboardDismissModeNone]];
  [[self proxy] replaceValue:value forKey:@"keyboardDismissMode" notification:NO];
}

- (void)setScrollsToTop_:(id)value
{
  [[self scrollView] setScrollsToTop:[TiUtils boolValue:value def:YES]];
}

- (void)setHorizontalBounce_:(id)value
{
  [[self scrollView] setAlwaysBounceHorizontal:[TiUtils boolValue:value]];
}

- (void)setVerticalBounce_:(id)value
{
  [[self scrollView] setAlwaysBounceVertical:[TiUtils boolValue:value]];
}

- (void)setContentOffset_:(id)value withObject:(id)property
{
  CGPoint newOffset = [TiUtils pointValue:value];
  BOOL animated = [TiUtils boolValue:@"animated" properties:property def:(scrollView != nil)];
  [[self scrollView] setContentOffset:newOffset animated:animated];
}

- (void)setZoomScale_:(id)value withObject:(id)property
{
  CGFloat scale = [TiUtils floatValue:value def:1.0];
  BOOL animated = [TiUtils boolValue:@"animated" properties:property def:NO];
  [[self scrollView] setZoomScale:scale animated:animated];
  scale = [[self scrollView] zoomScale]; //Why are we doing this? Because of minZoomScale or maxZoomScale.
  [[self proxy] replaceValue:NUMFLOAT(scale) forKey:@"zoomScale" notification:NO];
  if ([self.proxy _hasListeners:@"scale"]) {
    [self.proxy fireEvent:@"scale"
               withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                            NUMFLOAT(scale), @"scale",
                                        nil]];
  }
}

- (void)setMaxZoomScale_:(id)args
{
  CGFloat val = [TiUtils floatValue:args def:1.0];
  [[self scrollView] setMaximumZoomScale:val];
  if ([[self scrollView] zoomScale] > val) {
    [self setZoomScale_:args withObject:nil];
  } else if ([[self scrollView] zoomScale] < [[self scrollView] minimumZoomScale]) {
    [self setZoomScale_:[NSNumber numberWithFloat:[[self scrollView] minimumZoomScale]] withObject:nil];
  }
}

- (void)setMinZoomScale_:(id)args
{
  CGFloat val = [TiUtils floatValue:args def:1.0];
  [[self scrollView] setMinimumZoomScale:val];
  if ([[self scrollView] zoomScale] < val) {
    [self setZoomScale_:args withObject:nil];
  }
}

- (void)setCanCancelEvents_:(id)args
{
  [[self scrollView] setCanCancelContentTouches:[TiUtils boolValue:args def:YES]];
}

#pragma mark scrollView delegate stuff

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView_ // any offset changes
{
  [(id<UIScrollViewDelegate>)[self proxy] scrollViewDidEndDecelerating:scrollView_];
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView_ // any offset changes
{
  [(id<UIScrollViewDelegate>)[self proxy] scrollViewDidScroll:scrollView_];
}

#ifndef TI_USE_AUTOLAYOUT
- (UIView *)viewForZoomingInScrollView:(UIScrollView *)scrollView
{
  return [self wrapperView];
}
#endif

- (void)scrollViewDidEndZooming:(UIScrollView *)scrollView_ withView:(UIView *)view atScale:(CGFloat)scale
{
  // scale between minimum and maximum. called after any 'bounce' animations
  [(id<UIScrollViewDelegate>)[self proxy] scrollViewDidEndZooming:scrollView withView:(UIView *)view atScale:scale];
}

- (void)scrollViewDidZoom:(UIScrollView *)scrollView_
{
#ifndef TI_USE_AUTOLAYOUT
  CGSize boundsSize = scrollView.bounds.size;
  CGRect frameToCenter = wrapperView.frame;
  if (TiDimensionIsAuto(contentWidth) || TiDimensionIsAutoSize(contentWidth) || TiDimensionIsUndefined(contentWidth)) {
    if (frameToCenter.size.width < boundsSize.width) {
      frameToCenter.origin.x = (boundsSize.width - frameToCenter.size.width) / 2;
    } else {
      frameToCenter.origin.x = 0;
    }
  }
  if (TiDimensionIsAuto(contentHeight) || TiDimensionIsAutoSize(contentHeight) || TiDimensionIsUndefined(contentHeight)) {
    if (frameToCenter.size.height < boundsSize.height) {
      frameToCenter.origin.y = (boundsSize.height - frameToCenter.size.height) / 2;
    } else {
      frameToCenter.origin.y = 0;
    }
  }
  wrapperView.frame = frameToCenter;
#endif
}

- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView_
{
  // Tells the delegate when the scroll view is about to start scrolling the content.
  [(id<UIScrollViewDelegate>)[self proxy] scrollViewWillBeginDragging:scrollView_];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView_ willDecelerate:(BOOL)decelerate
{
  //Tells the delegate when dragging ended in the scroll view.
  [(id<UIScrollViewDelegate>)[self proxy] scrollViewDidEndDragging:scrollView_ willDecelerate:decelerate];
}

#pragma mark Keyboard delegate stuff

- (void)keyboardDidShowAtHeight:(CGFloat)keyboardTop
{
  InsetScrollViewForKeyboard(scrollView, keyboardTop, minimumContentHeight);
}

- (void)scrollToShowView:(TiUIView *)firstResponderView withKeyboardHeight:(CGFloat)keyboardTop
{
#ifndef TI_USE_AUTOLAYOUT
  if ([scrollView isScrollEnabled]) {
    CGRect responderRect = [wrapperView convertRect:[firstResponderView bounds] fromView:firstResponderView];
    OffsetScrollViewForRect(scrollView, keyboardTop, minimumContentHeight, responderRect);
  }
#endif
}

@end

#endif
