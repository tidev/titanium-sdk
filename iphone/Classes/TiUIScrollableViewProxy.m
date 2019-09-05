/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UISCROLLABLEVIEW

#import "TiUIScrollableViewProxy.h"
#import "TiUIScrollableView.h"

@implementation TiUIScrollableViewProxy
@synthesize viewProxies;

- (void)_initWithProperties:(NSDictionary *)properties
{
  pthread_rwlock_init(&viewsLock, NULL);
  [self initializeProperty:@"currentPage" defaultValue:NUMINT(0)];
  [self initializeProperty:@"pagingControlColor" defaultValue:nil];
  [self initializeProperty:@"pageIndicatorTintColor" defaultValue:nil];
  [self initializeProperty:@"currentPageIndicatorTintColor" defaultValue:nil];
  [self initializeProperty:@"pagingControlHeight" defaultValue:NUMINT(20)];
  [self initializeProperty:@"showPagingControl" defaultValue:NUMBOOL(NO)];
  [self initializeProperty:@"pagingControlAlpha" defaultValue:NUMFLOAT(1.0)];
  [self initializeProperty:@"overlayEnabled" defaultValue:NUMBOOL(NO)];
  [self initializeProperty:@"pagingControlOnTop" defaultValue:NUMBOOL(NO)];
  [super _initWithProperties:properties];
}

- (void)dealloc
{
  pthread_rwlock_destroy(&viewsLock);
  [viewProxies makeObjectsPerformSelector:@selector(setParent:) withObject:nil];
  [viewProxies release];
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.UI.ScrollableView";
}

- (void)lockViews
{
  pthread_rwlock_rdlock(&viewsLock);
}

- (void)lockViewsForWriting
{
  pthread_rwlock_wrlock(&viewsLock);
}

- (void)unlockViews
{
  pthread_rwlock_unlock(&viewsLock);
}

- (NSArray *)views
{
  [self lockViews];
  NSArray *result = [viewProxies copy];
  [self unlockViews];
  return [result autorelease] ?: @[];
}

- (NSUInteger)viewCount
{
  [self lockViews];
  NSUInteger result = [viewProxies count];
  [self unlockViews];
  return result;
}

- (void)setViews:(id)args
{
  ENSURE_ARRAY(args);
  for (id newViewProxy in args) {
    [self rememberProxy:newViewProxy];
    [newViewProxy setParent:self];
  }
  [self lockViewsForWriting];
  for (id oldViewProxy in viewProxies) {
#ifdef TI_USE_AUTOLAYOUT
    [self makeViewPerformSelector:@selector(removeSubview:)
                       withObject:[oldViewProxy view]
                   createIfNeeded:NO
                    waitUntilDone:NO];
#else
    TiThreadPerformOnMainThread(^{
      [[oldViewProxy view] removeFromSuperview];
    },
        YES);
#endif
    if (![args containsObject:oldViewProxy]) {
      [oldViewProxy setParent:nil];
      TiThreadPerformOnMainThread(^{
        [oldViewProxy detachView];
      },
          YES);
      [self forgetProxy:oldViewProxy];
    }
  }
  [viewProxies autorelease];
  viewProxies = [args mutableCopy];

#ifdef TI_USE_AUTOLAYOUT
  for (TiViewProxy *proxy in viewProxies) {
    [self makeViewPerformSelector:@selector(addView:) withObject:proxy createIfNeeded:YES waitUntilDone:NO];
  }
#endif
  [self unlockViews];
  [self replaceValue:args forKey:@"views" notification:YES];
}

- (void)insertViewsAt:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  ENSURE_UI_THREAD(insertViewsAt, args);
  ENSURE_TYPE([args objectAtIndex:0], NSNumber);

  NSUInteger insertIndex = [TiUtils intValue:[args objectAtIndex:0]];
  id arg = [args objectAtIndex:1];

  if ([arg isKindOfClass:[TiViewProxy class]]) {
    [self _addView:arg atIndex:insertIndex];
  } else if ([arg isKindOfClass:[NSArray class]]) {
    for (id newViewProxy in arg) {
      [self _addView:newViewProxy atIndex:insertIndex++];
    }
  }
}

- (void)addView:(id)args
{
  ENSURE_SINGLE_ARG(args, TiViewProxy);
  [self _addView:args atIndex:viewProxies ? [viewProxies count] : 0];
}

// Private, used to have only one method repsonsible for adding views
- (void)_addView:(TiViewProxy *)proxy atIndex:(NSUInteger)index
{
  [self lockViewsForWriting];
  [self rememberProxy:proxy];
  [proxy setParent:self];

  if (viewProxies != nil) {
    [viewProxies insertObject:proxy atIndex:index];
  } else {
    viewProxies = [[NSMutableArray alloc] initWithObjects:proxy, nil];
  }

  [self unlockViews];
  [self makeViewPerformSelector:@selector(addView:) withObject:proxy createIfNeeded:YES waitUntilDone:NO];
}

- (void)removeView:(id)args
{ //TODO: Refactor this properly.
#if defined(TI_USE_AUTOLAYOUT)
  ENSURE_UI_THREAD(removeView, args)
#endif
  ENSURE_SINGLE_ARG(args, NSObject);

  [self lockViewsForWriting];
  TiViewProxy *doomedView;
  if ([args isKindOfClass:[TiViewProxy class]]) {
    doomedView = args;

    if (![viewProxies containsObject:doomedView]) {
      [self unlockViews];
      [self throwException:@"view not in the scrollableView" subreason:nil location:CODELOCATION];
      return;
    }
  } else if ([args respondsToSelector:@selector(intValue)]) {
    int doomedIndex = [args intValue];
    if ((doomedIndex >= 0) && (doomedIndex < [viewProxies count])) {
      doomedView = [viewProxies objectAtIndex:doomedIndex];
    } else {
      [self unlockViews];
      [self throwException:TiExceptionRangeError subreason:@"invalid view index" location:CODELOCATION];
      return;
    }
  } else {
    [self unlockViews];
    [self throwException:TiExceptionInvalidType
               subreason:
                   [NSString stringWithFormat:@"argument needs to be a number or view, but was %@ instead.",
                             [args class]]
                location:CODELOCATION];
    return;
  }
#ifdef TI_USE_AUTOLAYOUT
  args = doomedView;
#endif
  TiThreadPerformOnMainThread(^{
    [doomedView detachView];
  },
      NO);
  [self forgetProxy:doomedView];
  [viewProxies removeObject:doomedView];
  [self unlockViews];
  [self makeViewPerformSelector:@selector(removeView:) withObject:args createIfNeeded:NO waitUntilDone:NO];
}

- (NSInteger)indexFromArg:(id)args
{
  NSInteger pageNum = 0;
  if ([args isKindOfClass:[TiViewProxy class]]) {
    [self lockViews];
    pageNum = [[self viewProxies] indexOfObject:args];
    [self unlockViews];
  } else {
    pageNum = [TiUtils intValue:args];
  }

  return pageNum;
}

- (void)scrollToView:(id)args
{
  ENSURE_SINGLE_ARG(args, NSObject);
  NSInteger index = [self indexFromArg:args];
  if (index >= 0 && index < [self viewCount]) {
    if ([self viewAttached]) {
      TiThreadPerformOnMainThread(^{
        [((TiUIScrollableView *)self.view) setCurrentPage:NUMINTEGER(index) animated:NUMBOOL(YES)];
      },
          NO);
    } else {
      [self replaceValue:NUMINTEGER(index) forKey:@"currentPage" notification:NO];
    }
  }
}

- (void)moveNext:(id)unused
{
  int index = [TiUtils intValue:[self valueForUndefinedKey:@"currentPage"]];
  [self scrollToView:NUMINT(++index)];
}

- (void)movePrevious:(id)unused
{
  int index = [TiUtils intValue:[self valueForUndefinedKey:@"currentPage"]];
  [self scrollToView:NUMINT(--index)];
}

- (void)willChangeSize
{
  //Ensure the size change signal goes to children
  NSArray *curViews = [self views];
  for (TiViewProxy *child in curViews) {
    [child parentSizeWillChange];
  }
  [super willChangeSize];
}

- (void)childWillResize:(TiViewProxy *)child
{
  BOOL hasChild = [[self children] containsObject:child];

  if (!hasChild) {
    return;
    //In the case of views added with addView, as they are not part of children, they should be ignored.
  }
  [super childWillResize:child];
}

- (TiViewProxy *)viewAtIndex:(NSInteger)index
{
  [self lockViews];
  // force index to be in range in case the scrollable view is rotated while scrolling
  if (index < 0) {
    index = 0;
  } else if (index >= [viewProxies count]) {
    index = [viewProxies count] - 1;
  }
  TiViewProxy *result = [viewProxies objectAtIndex:index];
  [self unlockViews];
  return result;
}

#ifndef TI_USE_AUTOLAYOUT
- (UIView *)parentViewForChild:(TiViewProxy *)child
{
  [self lockViews];
  NSUInteger index = [viewProxies indexOfObject:child];
  [self unlockViews];

  if (index != NSNotFound) {
    TiUIScrollableView *ourView = (TiUIScrollableView *)[self view];
    NSArray *scrollWrappers = [[ourView scrollview] subviews];
    if (index < [scrollWrappers count]) {
      return [scrollWrappers objectAtIndex:index];
    }
    //Hideous hack is hideous. This should stave off the bugs until layout is streamlined
    [ourView refreshScrollView:[[self view] bounds] readd:YES];
    scrollWrappers = [[ourView scrollview] subviews];
    if (index < [scrollWrappers count]) {
      return [scrollWrappers objectAtIndex:index];
    }
  }
  //Adding the view to a scrollable view is invalid.
  return nil;
}
#endif
- (CGFloat)autoWidthForSize:(CGSize)size
{
  CGFloat result = 0.0;
  NSArray *theChildren = [self views];
  for (TiViewProxy *thisChildProxy in theChildren) {
    CGFloat thisWidth = [thisChildProxy minimumParentWidthForSize:size];
    if (result < thisWidth) {
      result = thisWidth;
    }
  }
  return result;
}

- (CGFloat)autoHeightForSize:(CGSize)size
{
  CGFloat result = 0.0;
  NSArray *theChildren = [self views];
  for (TiViewProxy *thisChildProxy in theChildren) {
    CGFloat thisHeight = [thisChildProxy minimumParentHeightForSize:size];
    if (result < thisHeight) {
      result = thisHeight;
    }
  }
  return result;
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  if ([self viewAttached]) {
    [(TiUIScrollableView *)[self view] manageRotation];
  }
}

- (void)systemLayoutFittingSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
}

- (void)willTransitionToTraitCollection:(UITraitCollection *)newCollection withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
}

- (void)preferredContentSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
}

- (void)willChangeLayout
{
#ifndef TI_USE_AUTOLAYOUT
  if (layoutProperties.layoutStyle != TiLayoutRuleAbsolute) {
    layoutProperties.layoutStyle = TiLayoutRuleAbsolute;
  }
#endif
  [super willChangeLayout];
}

@end

#endif
