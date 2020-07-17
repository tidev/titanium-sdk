/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLABLEVIEW

#import "TiUIScrollableView.h"
#import "TiUIScrollableViewProxy.h"
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIScrollableView (redefiningProxy)
@property (nonatomic, readonly) TiUIScrollableViewProxy *proxy;
@end

@implementation TiUIScrollableView

#pragma mark Internal

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
#ifdef TI_USE_AUTOLAYOUT
  RELEASE_TO_NIL(_scrollView);
  RELEASE_TO_NIL(_dotsView);
#else
  RELEASE_TO_NIL(scrollview);
  RELEASE_TO_NIL(pageControl);
#endif
  RELEASE_TO_NIL(pageControlBackgroundColor);
  RELEASE_TO_NIL(pageIndicatorColor);
  RELEASE_TO_NIL(currentPageIndicatorColor);
  [super dealloc];
}

- (id)init
{
  if (self = [super init]) {
#ifndef TI_USE_AUTOLAYOUT
    cacheSize = 3;
#endif
    pagingControlHeight = 20;
    pageControlBackgroundColor = nil;
    pageIndicatorColor = nil;
    currentPageIndicatorColor = nil;
    pagingControlAlpha = 1.0;
    pagingControlOnTop = NO;
    overlayEnabled = NO;
    showPageControl = YES;
  }
  return self;
}

#ifndef TI_USE_AUTOLAYOUT
- (CGRect)pageControlRect
{

  if (!pagingControlOnTop) {
    CGRect boundsRect = [self bounds];
    return CGRectMake(boundsRect.origin.x,
        boundsRect.origin.y + boundsRect.size.height - pagingControlHeight,
        boundsRect.size.width,
        pagingControlHeight);
  } else {
    CGRect boundsRect = [self bounds];
    CGRect finalRect = CGRectMake(0, 0,
        boundsRect.size.width,
        pagingControlHeight);
    return finalRect;
  }
}
#endif

- (UIPageControl *)pagecontrol
{
#ifdef TI_USE_AUTOLAYOUT
  if (_dotsView == nil) {
    _dotsView = [[UIPageControl alloc] init];
    [_dotsView setBackgroundColor:pageControlBackgroundColor];
    [_dotsView setPageIndicatorTintColor:pageIndicatorColor];
    [_dotsView setCurrentPageIndicatorTintColor:currentPageIndicatorColor];
    [_dotsView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [_dotsView addTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];
    [super addSubview:_dotsView];
  }
  return _dotsView;
#else
  if (pageControl == nil) {
    pageControl = [[UIPageControl alloc] initWithFrame:[self pageControlRect]];
    [pageControl setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin];
    [pageControl addTarget:self action:@selector(pageControlTouched:) forControlEvents:UIControlEventValueChanged];
    [pageControl setBackgroundColor:pageControlBackgroundColor];
    [pageControl setPageIndicatorTintColor:pageIndicatorColor];
    [pageControl setCurrentPageIndicatorTintColor:currentPageIndicatorColor];
    [self addSubview:pageControl];
  }
  return pageControl;
#endif
}

#ifdef TI_USE_AUTOLAYOUT
- (UIView *)contentView
{
  if (_contentView == nil) {
    _contentView = [[UIView alloc] init];
    [_contentView setTranslatesAutoresizingMaskIntoConstraints:NO];
  }
  return _contentView;
}
- (void)layoutSubviews
{
  [super layoutSubviews];
  if (!_constraintAdded) {
    _constraintAdded = YES;
    _scrollView = [self scrollview];
    _dotsView = [self pagecontrol];
    _contentView = [self contentView];
    NSDictionary *views = NSDictionaryOfVariableBindings(_contentView, _scrollView, _dotsView);
    [_scrollView addConstraints:TI_CONSTR(@"V:|[_contentView(_scrollView)]|", views)];
    [_scrollView addConstraints:TI_CONSTR(@"H:|[_contentView(>=_scrollView)]|", views)];
    NSString *dotsViewHeightConstraints = [NSString stringWithFormat:@"V:[_dotsView(%f)]", pagingControlHeight];
    [self addConstraints:TI_CONSTR(dotsViewHeightConstraints, views)];
    [NSLayoutConstraint deactivateConstraints:[_dotsView constraints]];
    [self addConstraint:[NSLayoutConstraint constraintWithItem:_dotsView attribute:NSLayoutAttributeLeft relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeLeft multiplier:1 constant:0]];
    [self addConstraint:[NSLayoutConstraint constraintWithItem:_dotsView attribute:NSLayoutAttributeRight relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeRight multiplier:1 constant:0]];
    [self addConstraint:[NSLayoutConstraint constraintWithItem:_dotsView attribute:NSLayoutAttributeBottom relatedBy:NSLayoutRelationEqual toItem:self attribute:NSLayoutAttributeBottom multiplier:1 constant:0]];
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

#define WRAP_TI_VIEW(view)                                                                                    \
  TiLayoutView *wrapperView = [[[TiLayoutView alloc] init] autorelease];                                      \
  [wrapperView setViewName:TI_STRING(@"scrollable.wrapper.view%lu", (unsigned long)[[self subviews] count])]; \
  [wrapperView addSubview:view];

- (void)removeSubview:(nonnull UIView *)view
{
  [[view superview] removeFromSuperview];
}

- (void)addSubview:(nonnull UIView *)view
{
  WRAP_TI_VIEW(view)
      [[self contentView] addSubview:wrapperView];
}

- (void)insertSubview:(UIView *)view aboveSubview:(UIView *)siblingSubview
{
  WRAP_TI_VIEW(view)
      [[self contentView] insertSubview:wrapperView
                           aboveSubview:siblingSubview];
}

- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index
{
  WRAP_TI_VIEW(view)
      [[self contentView] insertSubview:wrapperView
                                atIndex:index];
}
- (void)insertSubview:(UIView *)view belowSubview:(UIView *)siblingSubview
{
  WRAP_TI_VIEW(view)
      [[self contentView] insertSubview:wrapperView
                           belowSubview:siblingSubview];
}
#endif

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = _scrollView;
#endif
  id value = [self.proxy valueForKey:@"hitRect"];

  if (value != nil) {
    CGRect hitRect = [TiUtils rectValue:value];
    // As long as we're inside of hitRect..
    if (CGRectContainsPoint(hitRect, point)) {
      UIView *test = [super hitTest:point withEvent:event];

      // If it misses super's hitTest then it's outside of the
      // scrollview.  Just return scrollview; at least the scrolling
      // events can be processed, though no touches will go through
      // to the view inside of scrollview. otherwise just return
      // whatever super got.

      return test == nil ? scrollview : test;
    } else {
      return nil;
    }
  } else {
    return [super hitTest:point withEvent:event];
  }
}

- (UIScrollView *)scrollview
{
#ifdef TI_USE_AUTOLAYOUT
  if (_scrollView == nil) {
    _scrollView = [[UIScrollView alloc] init];
    [_scrollView setDelegate:self];
    [_scrollView setPagingEnabled:YES];
    [_scrollView setTranslatesAutoresizingMaskIntoConstraints:NO];
    [_scrollView setShowsHorizontalScrollIndicator:NO];
    [_scrollView setShowsVerticalScrollIndicator:NO];
    [_scrollView addSubview:[self contentView]];
    [super addSubview:_scrollView];
  }
  return _scrollView;
#else
  if (scrollview == nil) {
    scrollview = [[UIScrollView alloc] initWithFrame:[self bounds]];
    [scrollview setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
    [scrollview setPagingEnabled:YES];
    [scrollview setDelegate:self];
    [scrollview setBackgroundColor:[UIColor clearColor]];
    [scrollview setShowsVerticalScrollIndicator:NO];
    [scrollview setShowsHorizontalScrollIndicator:NO];
    [scrollview setDelaysContentTouches:NO];
    [scrollview setScrollsToTop:NO];
    BOOL clipsToBounds = [TiUtils boolValue:[self.proxy valueForKey:@"clipViews"] def:YES];
    [scrollview setClipsToBounds:clipsToBounds];
    [self insertSubview:scrollview atIndex:0];

    //Update clips to bounds only if cornerRadius and backgroundImage are not set
    if ((self.layer.cornerRadius == 0) && (self.backgroundImage == nil)) {
      [self setClipsToBounds:clipsToBounds];
    }
  }
  return scrollview;
#endif
}

- (void)refreshPageControl
{
  if (showPageControl) {
    UIPageControl *pg = [self pagecontrol];
#ifdef TI_USE_AUTOLAYOUT
    NSInteger currentPage = _currentPage;
#else
    [pg setFrame:[self pageControlRect]];
#endif
    [pg setNumberOfPages:[[self proxy] viewCount]];
    [pg setBackgroundColor:pageControlBackgroundColor];
    [pg setCurrentPageIndicatorTintColor:currentPageIndicatorColor];
    [pg setPageIndicatorTintColor:pageIndicatorColor];
    [pg setAlpha:pagingControlAlpha];
    [pg setCurrentPage:currentPage];
    [pg setBackgroundColor:pageControlBackgroundColor];
  }
}

- (void)renderViewForIndex:(int)index
{
  UIScrollView *sv = [self scrollview];
  NSArray *svSubviews = [sv subviews];
  NSUInteger svSubviewsCount = [svSubviews count];

  if ((index < 0) || (index >= svSubviewsCount)) {
    return;
  }

  UIView *wrapper = [svSubviews objectAtIndex:index];
  TiViewProxy *viewproxy = [[self proxy] viewAtIndex:index];
  if (![viewproxy viewAttached]) {
    if ([[viewproxy view] superview] != wrapper) {
      [wrapper addSubview:[viewproxy view]];
    }
    [viewproxy windowWillOpen];
    [viewproxy windowDidOpen];
    [viewproxy layoutChildrenIfNeeded];
  } else {
    if ([[viewproxy view] superview] != wrapper) {
      [wrapper addSubview:[viewproxy view]];
      [viewproxy layoutChildrenIfNeeded];
    } else if (!CGRectEqualToRect([viewproxy sandboxBounds], [wrapper bounds])) {
      [viewproxy parentSizeWillChange];
    }
  }
}

#ifndef TI_USE_AUTOLAYOUT
- (NSRange)cachedFrames:(NSInteger)page
{
  NSInteger startPage;
  NSInteger endPage;
  NSUInteger viewsCount = [[self proxy] viewCount];

  // Step 1: Check to see if we're actually smaller than the cache range:
  if (cacheSize >= viewsCount) {
    startPage = 0;
    endPage = viewsCount - 1;
  } else {
    startPage = (page - (cacheSize - 1) / 2);
    endPage = (page + (cacheSize - 1) / 2);

    // Step 2: Check to see if we're rendering outside the bounds of the array, and if so, adjust accordingly.
    if (startPage < 0) {
      endPage -= startPage;
      startPage = 0;
    }
    if (endPage >= viewsCount) {
      NSInteger diffPage = endPage - viewsCount;
      endPage = viewsCount - 1;
      startPage += diffPage;
    }
    if (startPage > endPage) {
      startPage = endPage;
    }
  }

  return NSMakeRange(startPage, endPage - startPage + 1);
}

- (void)manageCache:(NSInteger)page
{
  if ([(TiUIScrollableViewProxy *)[self proxy] viewCount] == 0) {
    return;
  }

  NSRange renderRange = [self cachedFrames:page];
  NSUInteger viewsCount = [[self proxy] viewCount];

  for (int i = 0; i < viewsCount; i++) {
    TiViewProxy *viewProxy = [[self proxy] viewAtIndex:i];
    if (i >= renderRange.location && i < NSMaxRange(renderRange)) {
      [self renderViewForIndex:i];
    } else {
      if ([viewProxy viewAttached]) {
        [viewProxy windowWillClose];
        [viewProxy windowDidClose];
      }
    }
  }
}
#endif
- (void)listenerAdded:(NSString *)event count:(int)count
{
  [super listenerAdded:event count:count];
  NSArray *childrenArray = [[[self proxy] views] retain];
  for (id child in childrenArray) {
    if ([child respondsToSelector:@selector(parentListenersChanged)]) {
      [child performSelector:@selector(parentListenersChanged)];
    }
  }
  [childrenArray release];
}

- (void)listenerRemoved:(NSString *)event count:(int)count
{
  [super listenerRemoved:event count:count];
  NSArray *childrenArray = [[[self proxy] views] retain];
  for (id child in childrenArray) {
    if ([child respondsToSelector:@selector(parentListenersChanged)]) {
      [child performSelector:@selector(parentListenersChanged)];
    }
  }
  [childrenArray release];
}

- (NSInteger)currentPage
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
  NSInteger currentPage = _currentPage;
#endif
  NSInteger result = currentPage;
  if (scrollview != nil) {
    CGPoint offset = [[self scrollview] contentOffset];
    if (offset.x > 0) {
      CGSize scrollFrame = [self bounds].size;
      if (scrollFrame.width != 0) {
        result = round(offset.x / scrollFrame.width);
      }
    }
  }
#ifdef TI_USE_AUTOLAYOUT
  [[self pagecontrol] setCurrentPage:result];
#endif
  return result;
}

- (void)refreshScrollView:(CGRect)visibleBounds readd:(BOOL)readd
{
#ifndef TI_USE_AUTOLAYOUT
  CGRect viewBounds;
  viewBounds.size.width = visibleBounds.size.width;
  viewBounds.size.height = visibleBounds.size.height - (showPageControl ? pagingControlHeight : 0);
  if (overlayEnabled && showPageControl) {
    viewBounds.size.height = visibleBounds.size.height;
    viewBounds.origin = CGPointMake(0, 0);
  } else {
    viewBounds.size.height = visibleBounds.size.height - (showPageControl ? pagingControlHeight : 0);
    if (!pagingControlOnTop) {
      viewBounds.origin = CGPointMake(0, 0);
    } else {
      viewBounds.origin = CGPointMake(0, pagingControlHeight);
    }
  }
  UIScrollView *sv = [self scrollview];

  NSInteger page = [self currentPage];

  [self refreshPageControl];

  if (readd) {
    for (UIView *view in [sv subviews]) {
      [view removeFromSuperview];
    }
  }

  NSUInteger viewsCount = [[self proxy] viewCount];
  /*
	Reset readd here since refreshScrollView is called from
	frameSizeChanged with readd false and the views might 
	not yet have been added on first launch
	*/
  readd = ([[sv subviews] count] == 0);

  for (int c = 0; c < viewsCount; c++) {
    viewBounds.origin.x = c * visibleBounds.size.width;

    if (readd) {
      UIView *view = [[UIView alloc] initWithFrame:viewBounds];
      [sv addSubview:view];
      [view release];
    } else {
      UIView *view = [[sv subviews] objectAtIndex:c];
      view.frame = viewBounds;
    }
  }

  [self manageCache:page];

  CGSize contentBounds;
  contentBounds.width = viewBounds.size.width * viewsCount;
  contentBounds.height = viewBounds.size.height - (showPageControl ? pagingControlHeight : 0);

  [sv setContentSize:contentBounds];
  [sv setFrame:CGRectMake(0, 0, visibleBounds.size.width, visibleBounds.size.height)];
#endif
}
#ifndef TI_USE_AUTOLAYOUT
// We have to cache the current page because we need to scroll to the new (logical) position of the view
// within the scrollable view.  Doing so, if we're resizing to a SMALLER frame, causes a content offset
// reset internally, which screws with the currentPage number (since -[self scrollViewDidScroll:] is called).
// Looks a little ugly, though...
- (void)setFrame:(CGRect)frame_
{
  lastPage = [self currentPage];
  enforceCacheRecalculation = YES;
  [super setFrame:frame_];
  [self setCurrentPage_:NUMINTEGER(lastPage)];
  enforceCacheRecalculation = NO;
}

- (void)setBounds:(CGRect)bounds_
{
  lastPage = [self currentPage];
  [super setBounds:bounds_];
}
- (void)frameSizeChanged:(CGRect)frame bounds:(CGRect)visibleBounds
{
  if (!CGRectIsEmpty(visibleBounds)) {
    [self refreshScrollView:visibleBounds readd:NO];
    [scrollview setContentOffset:CGPointMake(lastPage * visibleBounds.size.width, 0)];
    [self manageCache:[self currentPage]];
  }
  //To make sure all subviews are properly resized.
  UIScrollView *sv = [self scrollview];
  for (UIView *view in [sv subviews]) {
    for (TiUIView *sView in [view subviews]) {
      [sView checkBounds];
    }
  }

  [super frameSizeChanged:frame bounds:visibleBounds];
}
#endif
#pragma mark Public APIs

- (void)setCacheSize_:(id)args
{
#ifndef TI_USE_AUTOLAYOUT
  ENSURE_SINGLE_ARG(args, NSNumber);
  int newCacheSize = [args intValue];
  if (newCacheSize < 3) {
    // WHAT.  Let's make it something sensible.
    newCacheSize = 3;
  }
  if (newCacheSize % 2 == 0) {
    DebugLog(@"[WARN] Even scrollable cache size %d; setting to %d", newCacheSize, newCacheSize - 1);
    newCacheSize -= 1;
  }
  cacheSize = newCacheSize;
  [self manageCache:[self currentPage]];
#endif
}

#ifndef TI_USE_AUTOLAYOUT
- (void)setViews_:(id)args
{
  if ((scrollview != nil) && ([scrollview subviews] > 0)) {
    [self refreshScrollView:[self bounds] readd:YES];
  }
}
#endif

- (void)setShowPagingControl_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
  UIPageControl *pageControl = [self pagecontrol];
#endif
  showPageControl = [TiUtils boolValue:args];

  if (pageControl != nil) {
    if (!showPageControl) {
#ifndef TI_USE_AUTOLAYOUT
      [pageControl removeFromSuperview];
      RELEASE_TO_NIL(pageControl);
    }
#else
      [_dotsView setHidden:YES];
    } else {
      [_dotsView setHidden:NO];
    }
#endif
  }

  if ((scrollview != nil) && ([[scrollview subviews] count] > 0)) {
    //No need to readd. Just set up the correct frame bounds
    [self refreshScrollView:[self bounds] readd:NO];
  }
}

- (void)setPagingControlHeight_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  pagingControlHeight = [TiUtils floatValue:args def:20.0];
  if (pagingControlHeight < 5.0) {
    pagingControlHeight = 20.0;
  }

  if (showPageControl && (scrollview != nil) && ([[scrollview subviews] count] > 0)) {
    //No need to readd. Just set up the correct frame bounds
    [self refreshScrollView:[self bounds] readd:NO];
  }
}

- (void)setPagingControlColor_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  TiColor *val = [TiUtils colorValue:args];
  if (val != nil) {
    RELEASE_TO_NIL(pageControlBackgroundColor);
    pageControlBackgroundColor = [[val _color] retain];
    if (showPageControl && (scrollview != nil) && ([[scrollview subviews] count] > 0)) {
      [[self pagecontrol] setBackgroundColor:pageControlBackgroundColor];
    }
  }
}
- (void)setPageIndicatorColor_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  TiColor *val = [TiUtils colorValue:args];
  if (val != nil) {
    RELEASE_TO_NIL(pageIndicatorColor);
    pageIndicatorColor = [[val _color] retain];
    if (showPageControl && (scrollview != nil) && ([[scrollview subviews] count] > 0)) {
      [[self pagecontrol] setPageIndicatorTintColor:pageIndicatorColor];
    }
  }
}

- (void)setCurrentPageIndicatorColor_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  TiColor *val = [TiUtils colorValue:args];
  if (val != nil) {
    RELEASE_TO_NIL(currentPageIndicatorColor);
    currentPageIndicatorColor = [[val _color] retain];
    if (showPageControl && (scrollview != nil) && ([[scrollview subviews] count] > 0)) {
      [[self pagecontrol] setCurrentPageIndicatorTintColor:currentPageIndicatorColor];
    }
  }
}

- (void)setPagingControlAlpha_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  pagingControlAlpha = [TiUtils floatValue:args def:1.0];
  if (pagingControlAlpha > 1.0) {
    pagingControlAlpha = 1;
  }
  if (pagingControlAlpha < 0.0) {
    pagingControlAlpha = 0;
  }
  if (showPageControl && (scrollview != nil) && ([[scrollview subviews] count] > 0)) {
    [[self pagecontrol] setAlpha:pagingControlAlpha];
  }
}

#if IS_SDK_IOS_14
- (void)setPreferredIndicatorImage_:(id)args
{
  if (![TiUtils isIOSVersionOrGreater:@"14.0"]) {
    DebugLog(@"[WARN] Supported on iOS 14.0+");
    return;
    ;
  }

  if (showPageControl) {
    [[self pagecontrol] setPreferredIndicatorImage:[TiUtils toImage:args proxy:self.proxy]];
  }
}

- (void)setIndicatorImage:(UIImage *)image forPage:(NSInteger)page
{
  if (page > [self pagecontrol].numberOfPages) {
    DebugLog(@"[WARN] Page no. can not be greater than total no of pages");
    return;
  }
  if (showPageControl) {
    [[self pagecontrol] setIndicatorImage:image forPage:page];
  }
}
#endif

- (void)setPagingControlOnTop_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  pagingControlOnTop = [TiUtils boolValue:args def:NO];
  if (showPageControl && (scrollview != nil) && ([[scrollview subviews] count] > 0)) {
    //No need to readd. Just set up the correct frame bounds
    [self refreshScrollView:[self bounds] readd:NO];
  }
}

- (void)setOverlayEnabled_:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  overlayEnabled = [TiUtils boolValue:args def:NO];
  if (showPageControl && (scrollview != nil) && ([[scrollview subviews] count] > 0)) {
    //No need to readd. Just set up the correct frame bounds
    [self refreshScrollView:[self bounds] readd:NO];
  }
}

- (void)addView:(id)viewproxy
{
#ifndef TI_USE_AUTOLAYOUT
  [self refreshScrollView:[self bounds]
                    readd:YES];
#else
  [self addSubview:[viewproxy view]];
  [self layoutSubviews];
  [self refreshPageControl];
#endif
}

- (void)removeView:(id)args
{
#ifdef TI_USE_AUTOLAYOUT
  UIPageControl *pageControl = [self pagecontrol];
  NSInteger currentPage = _currentPage;
#endif
  NSInteger page = [self currentPage];
  NSUInteger pageCount = [[self proxy] viewCount];
  if (page == pageCount) {
    currentPage = pageCount - 1;
    [pageControl setCurrentPage:currentPage];
    [self.proxy replaceValue:NUMINTEGER(currentPage) forKey:@"currentPage" notification:NO];
  }
#ifndef TI_USE_AUTOLAYOUT
  [self refreshScrollView:[self bounds]
                    readd:YES];
#else
  TiViewProxy *viewProxy = (TiViewProxy *)args;
  [self removeSubview:[viewProxy view]];
  [self refreshPageControl];
#endif
}

- (void)setCurrentPage:(id)page animated:(NSNumber *)animate
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
  UIPageControl *pageControl = [self pagecontrol];
  NSInteger currentPage = _currentPage;
#endif
  int newPage = [TiUtils intValue:page];
  NSUInteger viewsCount = [[self proxy] viewCount];

  if (newPage >= 0 && newPage < viewsCount) {
    [scrollview setContentOffset:CGPointMake([self bounds].size.width * newPage, 0) animated:[animate boolValue]];
    currentPage = newPage;
    pageControl.currentPage = newPage;
#ifndef TI_USE_AUTOLAYOUT
    [self manageCache:newPage];
#endif
    [self.proxy replaceValue:NUMINT(newPage)
                      forKey:@"currentPage"
                notification:NO];
  }
}

- (void)setCurrentPage_:(id)page
{
  [self setCurrentPage:page animated:NUMBOOL(NO)];
}

- (void)setScrollingEnabled_:(id)enabled
{
  scrollingEnabled = [TiUtils boolValue:enabled];
  [[self scrollview] setScrollEnabled:scrollingEnabled];
}

- (void)setDisableBounce_:(id)value
{
  [[self scrollview] setBounces:![TiUtils boolValue:value]];
}

#pragma mark Rotation

- (void)manageRotation
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
#endif
  if ([scrollview isDecelerating] || [scrollview isDragging]) {
    rotatedWhileScrolling = YES;
  }
}

#pragma mark Delegate calls

- (void)pageControlTouched:(id)sender
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
  NSInteger currentPage = _currentPage;
#endif
  NSInteger pageNum = [(UIPageControl *)sender currentPage];
  [scrollview setContentOffset:CGPointMake([self bounds].size.width * pageNum, 0) animated:YES];
  handlingPageControlEvent = YES;
  currentPage = pageNum;
#ifndef TI_USE_AUTOLAYOUT
  [self manageCache:currentPage];
#endif
  [self.proxy replaceValue:NUMINTEGER(pageNum)
                    forKey:@"currentPage"
              notification:NO];

  if ([self.proxy _hasListeners:@"click"]) {
    [self.proxy fireEvent:@"click"
               withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                            NUMINTEGER(pageNum), @"currentPage",
                                        [[self proxy] viewAtIndex:pageNum], @"view", nil]];
  }
}

- (void)scrollViewDidScroll:(UIScrollView *)sender
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
  UIPageControl *pageControl = [self pagecontrol];
  NSInteger currentPage = _currentPage;
#endif
  //switch page control at 50% across the center - this visually looks better
  CGFloat pageWidth = scrollview.frame.size.width;
  NSInteger page = currentPage;
  float nextPageAsFloat = ((scrollview.contentOffset.x - pageWidth / 2) / pageWidth) + 0.5;
  int nextPage = floor(nextPageAsFloat - 0.5) + 1;
  if ([self.proxy _hasListeners:@"scroll"]) {
    [self.proxy fireEvent:@"scroll"
               withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                            NUMINT(nextPage), @"currentPage",
                                        NUMFLOAT(nextPageAsFloat), @"currentPageAsFloat",
                                        [[self proxy] viewAtIndex:nextPage], @"view", nil]];
  }
  if (page != nextPage) {
#ifndef TI_USE_AUTOLAYOUT
    NSInteger curCacheSize = cacheSize;
    NSInteger minCacheSize = cacheSize;
    if (enforceCacheRecalculation) {
      minCacheSize = ABS(page - nextPage) * 2 + 1;
      if (minCacheSize < cacheSize) {
        minCacheSize = cacheSize;
      }
    }
    pageChanged = YES;
    cacheSize = minCacheSize;
#endif
    [pageControl setCurrentPage:nextPage];
    currentPage = nextPage;
    [self.proxy replaceValue:NUMINTEGER(currentPage) forKey:@"currentPage" notification:NO];
#ifndef TI_USE_AUTOLAYOUT
    cacheSize = curCacheSize;
#endif
  }
}

#ifndef TI_USE_AUTOLAYOUT
- (void)scrollViewWillBeginDragging:(UIScrollView *)scrollView
{
  if (pageChanged) {
    [self manageCache:currentPage];
  }
}
#endif

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
#ifdef TI_USE_AUTOLAYOUT
  UIScrollView *scrollview = [self scrollview];
  UIPageControl *pageControl = [self pagecontrol];
#else
  //Since we are now managing cache at end of scroll, ensure quick scroll is disabled to avoid blank screens.
  if (pageChanged) {
#endif
  [scrollview setUserInteractionEnabled:!decelerate];
#ifndef TI_USE_AUTOLAYOUT
}
#endif
}

- (void)scrollViewDidEndScrollingAnimation:(UIScrollView *)scrollView
{
  // called when setContentOffset/scrollRectVisible:animated: finishes. not called if not animating
  [self scrollViewDidEndDecelerating:scrollView];
}

- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
#ifndef TI_USE_AUTOLAYOUT
  if (rotatedWhileScrolling) {
    CGFloat pageWidth = [self bounds].size.width;
    [[self scrollview] setContentOffset:CGPointMake(pageWidth * [self currentPage], 0) animated:YES];
    rotatedWhileScrolling = NO;
  }
  // At the end of scroll animation, reset the boolean used when scrolls originate from the UIPageControl
  NSInteger pageNum = [self currentPage];
  handlingPageControlEvent = NO;
#else
    UIScrollView *scrollview = _scrollView;
    UIPageControl *pageControl = _dotsView;
    NSInteger pageNum = _currentPage;
    NSInteger currentPage = _currentPage;
#endif

  [self.proxy replaceValue:NUMINTEGER(pageNum)
                    forKey:@"currentPage"
              notification:NO];

  if ([self.proxy _hasListeners:@"scrollEnd"]) { //TODO: Deprecate old event.
    [self.proxy fireEvent:@"scrollEnd"
               withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                            NUMINTEGER(pageNum), @"currentPage",
                                        [[self proxy] viewAtIndex:pageNum], @"view", nil]];
  }
  if ([self.proxy _hasListeners:@"scrollend"]) {
    [self.proxy fireEvent:@"scrollend"
               withObject:[NSDictionary dictionaryWithObjectsAndKeys:
                                            NUMINTEGER(pageNum), @"currentPage",
                                        [[self proxy] viewAtIndex:pageNum], @"view", nil]];
  }
  [scrollview setUserInteractionEnabled:YES];
#ifndef TI_USE_AUTOLAYOUT
  pageChanged = NO;
  currentPage = pageNum;
  [self manageCache:currentPage];
  [pageControl setCurrentPage:pageNum];
#else
    currentPage = pageNum;
    CGPoint contentOffset = [scrollView contentOffset];
    _currentPage = ceil(contentOffset.x / self.frame.size.width);
    [_dotsView setCurrentPage:_currentPage];
#endif
}

@end

#endif
