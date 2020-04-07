/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2019 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADPOPOVER

#import "TiUIiPadPopoverProxy.h"
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiUtils.h>
#import <TitaniumKit/TiWindowProxy.h>
#import <libkern/OSAtomic.h>

#ifdef USE_TI_UITABLEVIEW
#import "TiUITableViewRowProxy.h"
#endif

static NSCondition *popOverCondition;
static BOOL currentlyDisplaying = NO;
TiUIiPadPopoverProxy *currentPopover;

@implementation TiUIiPadPopoverProxy

static NSArray *popoverSequence;

#pragma mark Internal

- (NSArray *)keySequence
{
  if (popoverSequence == nil) {
    popoverSequence = [[NSArray arrayWithObjects:@"contentView", @"width", @"height", nil] retain];
  }
  return popoverSequence;
}
#pragma mark Setup

- (id)init
{
  if (self = [super init]) {
    closingCondition = [[NSCondition alloc] init];
    directions = UIPopoverArrowDirectionAny;
    poWidth = TiDimensionUndefined;
    poHeight = TiDimensionUndefined;
  }
  return self;
}

- (void)dealloc
{
  if (currentPopover == self) {
    //This shouldn't happen because we clear it on hide.
    currentPopover = nil;
  }
  [viewController.view removeObserver:self forKeyPath:@"safeAreaInsets"];
  RELEASE_TO_NIL(viewController);
  RELEASE_TO_NIL(popoverView);
  RELEASE_TO_NIL(closingCondition);
  RELEASE_TO_NIL(contentViewProxy);
  [super dealloc];
}

#pragma mark Public API
- (NSString *)apiName
{
  return @"Ti.UI.iPad.Popover";
}

#pragma mark Public Constants

- (NSNumber *)arrowDirection
{
  return NUMINTEGER(directions);
}

- (void)setArrowDirection:(id)args
{
  if (popoverInitialized) {
    DebugLog(@"[ERROR] Arrow Directions can only be set before showing the popover.") return;
  }

  ENSURE_SINGLE_ARG(args, NSNumber)
  UIPopoverArrowDirection theDirection = [TiUtils intValue:args];
  if ((theDirection != UIPopoverArrowDirectionAny) && (theDirection != UIPopoverArrowDirectionLeft)
      && (theDirection != UIPopoverArrowDirectionRight) && (theDirection != UIPopoverArrowDirectionUp)
      && (theDirection != UIPopoverArrowDirectionDown)) {
    theDirection = UIPopoverArrowDirectionAny;
  }
  directions = theDirection;
}

- (void)setContentView:(id)value
{
  if (popoverInitialized) {
    DebugLog(@"[ERROR] Changing contentView when the popover is showing is not supported");
    return;
  }
  ENSURE_SINGLE_ARG(value, TiViewProxy);

  if (contentViewProxy != nil) {
    RELEASE_TO_NIL(contentViewProxy);
  }
  contentViewProxy = [(TiViewProxy *)value retain];
  [self replaceValue:contentViewProxy forKey:@"contentView" notification:NO];
}

- (void)setPassthroughViews:(id)args
{
  ENSURE_TYPE(args, NSArray);
  NSArray *actualArgs = nil;
  if ([[args objectAtIndex:0] isKindOfClass:[NSArray class]]) {
    actualArgs = (NSArray *)[args objectAtIndex:0];
  } else {
    actualArgs = args;
  }
  for (TiViewProxy *proxy in actualArgs) {
    if (![proxy isKindOfClass:[TiViewProxy class]]) {
      [self throwException:[NSString stringWithFormat:@"Passed non-view object %@ as passthrough view", proxy]
                 subreason:nil
                  location:CODELOCATION];
    }
  }
  [self replaceValue:actualArgs forKey:@"passthroughViews" notification:NO];

  if (popoverInitialized) {
    TiThreadPerformOnMainThread(^{
      [self updatePassThroughViews];
    },
        NO);
  }
}

#pragma mark Public Methods

- (void)show:(id)args
{
  if (popOverCondition == nil) {
    popOverCondition = [[NSCondition alloc] init];
  }

  if (popoverInitialized) {
    DebugLog(@"Popover is already showing. Ignoring call") return;
  }

  if (contentViewProxy == nil) {
    DebugLog(@"[ERROR] Popover presentation without contentView property set is no longer supported. Ignoring call") return;
  }

  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);
  [self rememberSelf];
  [self retain];

  [closingCondition lock];
  if (isDismissing) {
    [closingCondition wait];
  }
  [closingCondition unlock];

  animated = [TiUtils boolValue:@"animated" properties:args def:YES];
  popoverView = [[args objectForKey:@"view"] retain];
  NSDictionary *rectProps = [args objectForKey:@"rect"];
  if (IS_NULL_OR_NIL(rectProps)) {
    popoverRect = CGRectZero;
  } else {
    popoverRect = [TiUtils rectValue:rectProps];
  }

  if (IS_NULL_OR_NIL(popoverView)) {
    DebugLog(@"[ERROR] Popover presentation without view property in the arguments is not supported. Ignoring call")
        RELEASE_TO_NIL(popoverView);
    return;
  }

  [popOverCondition lock];
  if (currentlyDisplaying) {
    [currentPopover hide:nil];
    [popOverCondition wait];
  }
  currentlyDisplaying = YES;
  [popOverCondition unlock];
  popoverInitialized = YES;

  TiThreadPerformOnMainThread(^{
    [self initAndShowPopOver];
  },
      YES);
}

- (void)hide:(id)args
{
  if (!popoverInitialized) {
    DebugLog(@"Popover is not showing. Ignoring call") return;
  }

  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);

  [closingCondition lock];
  isDismissing = YES;
  [closingCondition unlock];

  TiThreadPerformOnMainThread(^{
    [contentViewProxy windowWillClose];
    animated = [TiUtils boolValue:@"animated" properties:args def:NO];
    [[self viewController] dismissViewControllerAnimated:animated
                                              completion:^{
                                                [self cleanup];
                                              }];
  },
      NO);
}

#pragma mark Internal Methods

- (void)cleanup
{
  [popOverCondition lock];
  currentlyDisplaying = NO;
  if (currentPopover == self) {
    currentPopover = nil;
  }
  [popOverCondition broadcast];
  [popOverCondition unlock];

  if (!popoverInitialized) {
    [closingCondition lock];
    isDismissing = NO;
    [closingCondition signal];
    [closingCondition unlock];

    return;
  }
  [contentViewProxy setProxyObserver:nil];
  [contentViewProxy windowWillClose];

  popoverInitialized = NO;
  [self fireEvent:@"hide" withObject:nil]; //Checking for listeners are done by fireEvent anyways.
  [[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
  [contentViewProxy windowDidClose];

  if ([contentViewProxy isKindOfClass:[TiWindowProxy class]]) {
    UIView *topWindowView = [[[TiApp app] controller] topWindowProxyView];
    if ([topWindowView isKindOfClass:[TiUIView class]]) {
      TiViewProxy *theProxy = (TiViewProxy *)[(TiUIView *)topWindowView proxy];
      if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)theProxy gainFocus];
      }
    }
  }

  [self forgetSelf];
  [viewController.view removeObserver:self forKeyPath:@"safeAreaInsets"];
  RELEASE_TO_NIL(viewController);
  RELEASE_TO_NIL(popoverView);
  [self performSelector:@selector(release) withObject:nil afterDelay:0.5];
  [closingCondition lock];
  isDismissing = NO;
  [closingCondition signal];
  [closingCondition unlock];
}

- (void)initAndShowPopOver
{
  currentPopover = self;
  [contentViewProxy setProxyObserver:self];
  if ([contentViewProxy isKindOfClass:[TiWindowProxy class]]) {
    UIView *topWindowView = [[[TiApp app] controller] topWindowProxyView];
    if ([topWindowView isKindOfClass:[TiUIView class]]) {
      TiViewProxy *theProxy = (TiViewProxy *)[(TiUIView *)topWindowView proxy];
      if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)theProxy resignFocus];
      }
    }
    [(TiWindowProxy *)contentViewProxy setIsManaged:YES];
    [(TiWindowProxy *)contentViewProxy open:nil];
    [(TiWindowProxy *)contentViewProxy gainFocus];
    [self updatePopoverNow];
  } else {
    [contentViewProxy windowWillOpen];
    [contentViewProxy reposition];
    [self updatePopoverNow];
    [contentViewProxy windowDidOpen];
  }
}

- (void)updatePopover:(NSNotification *)notification;
{
  //This may be due to a possible race condition of rotating the iPad while another popover is coming up.
  if ((currentPopover != self)) {
    return;
  }
  [self performSelector:@selector(updatePopoverNow) withObject:nil afterDelay:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration] inModes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
}

- (CGSize)contentSize
{
#ifndef TI_USE_AUTOLAYOUT
  CGSize screenSize = [[UIScreen mainScreen] bounds].size;
  if (poWidth.type != TiDimensionTypeUndefined) {
    [contentViewProxy layoutProperties] -> width.type = poWidth.type;
    [contentViewProxy layoutProperties] -> width.value = poWidth.value;
    poWidth = TiDimensionUndefined;
  }

  if (poHeight.type != TiDimensionTypeUndefined) {
    [contentViewProxy layoutProperties] -> height.type = poHeight.type;
    [contentViewProxy layoutProperties] -> height.value = poHeight.value;
    poHeight = TiDimensionUndefined;
  }

  return SizeConstraintViewWithSizeAddingResizing([contentViewProxy layoutProperties], contentViewProxy, screenSize, NULL);
#else
  return CGSizeZero;
#endif
}

- (void)updatePassThroughViews
{
  NSArray *theViewProxies = [self valueForKey:@"passthroughViews"];
  if (IS_NULL_OR_NIL(theViewProxies)) {
    return;
  }
  NSMutableArray *theViews = [NSMutableArray arrayWithCapacity:[theViewProxies count]];
  for (TiViewProxy *proxy in theViewProxies) {
    [theViews addObject:[proxy view]];
  }

  [[[self viewController] popoverPresentationController] setPassthroughViews:theViews];
}

- (void)updateContentSize
{
  CGSize newSize = [self contentSize];
  [[self viewController] setPreferredContentSize:newSize];
  [contentViewProxy reposition];
}

- (void)updatePopoverNow
{
  // We're in the middle of playing cleanup while a hide() is happening.
  [closingCondition lock];
  if (isDismissing) {
    [closingCondition unlock];
    return;
  }
  [closingCondition unlock];
  [self updateContentSize];
  UIViewController *theController = [self viewController];
  [theController setModalPresentationStyle:UIModalPresentationPopover];
  UIPopoverPresentationController *thePresentationController = [theController popoverPresentationController];
  thePresentationController.permittedArrowDirections = directions;
  thePresentationController.delegate = self;
  [thePresentationController setBackgroundColor:[[TiColor colorNamed:[self valueForKey:@"backgroundColor"]] _color]];

  [[TiApp app] showModalController:theController animated:animated];
}

- (UIViewController *)viewController
{
  if (viewController == nil) {
    if ([contentViewProxy isKindOfClass:[TiWindowProxy class]]) {
      [(TiWindowProxy *)contentViewProxy setIsManaged:YES];
      viewController = [[(TiWindowProxy *)contentViewProxy hostingController] retain];
      [viewController.view addObserver:self forKeyPath:@"safeAreaInsets" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
    } else {
      viewController = [[TiViewController alloc] initWithViewProxy:contentViewProxy];
      [viewController.view addObserver:self forKeyPath:@"safeAreaInsets" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
    }
  }
  return viewController;
}

- (void)updateContentViewWithSafeAreaInsets:(UIEdgeInsets)edgeInsets
{
  CGFloat oldTop = [[contentViewProxy valueForKey:@"top"] floatValue];
  CGFloat oldLeft = [[contentViewProxy valueForKey:@"left"] floatValue];
  CGFloat oldRight = [[contentViewProxy valueForKey:@"right"] floatValue];
  CGFloat oldBottom = [[contentViewProxy valueForKey:@"bottom"] floatValue];

  if (oldTop != edgeInsets.top) {
    [contentViewProxy setTop:NUMFLOAT(edgeInsets.top)];
  }
  if (oldBottom != edgeInsets.bottom) {
    [contentViewProxy setBottom:NUMFLOAT(edgeInsets.bottom)];
  }
  if (oldLeft != edgeInsets.left) {
    [contentViewProxy setLeft:NUMFLOAT(edgeInsets.left)];
  }
  if (oldRight != edgeInsets.right) {
    [contentViewProxy setRight:NUMFLOAT(edgeInsets.right)];
  }
}

#pragma mark Delegate methods

- (void)proxyDidRelayout:(id)sender
{
  if (sender == contentViewProxy) {
    if (viewController != nil) {
      CGSize newSize = [self contentSize];
      if (!CGSizeEqualToSize([viewController preferredContentSize], newSize)) {
        [self updateContentSize];
      }
    }
  }
}

- (void)prepareForPopoverPresentation:(UIPopoverPresentationController *)popoverPresentationController
{
  [self updatePassThroughViews];
  if (popoverView != nil) {
    if ([popoverView supportsNavBarPositioning] && [popoverView isUsingBarButtonItem]) {
      UIBarButtonItem *theItem = [popoverView barButtonItem];
      if (theItem != nil) {
        popoverPresentationController.barButtonItem = [popoverView barButtonItem];
        return;
      }
    }

    UIView *view = [popoverView view];
    if (view != nil && (view.window != nil)) {
      popoverPresentationController.sourceView = view;
      popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, popoverRect) ? [view bounds] : popoverRect);
      return;
    }
  }

  //Fell through.
  UIViewController *presentingController = [[self viewController] presentingViewController];
  popoverPresentationController.sourceView = [presentingController view];
  popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, popoverRect) ? CGRectMake(presentingController.view.bounds.size.width / 2, presentingController.view.bounds.size.height / 2, 1, 1) : popoverRect);
}

- (BOOL)popoverPresentationControllerShouldDismissPopover:(UIPopoverPresentationController *)popoverPresentationController
{
  if ([[self viewController] presentedViewController] != nil) {
    return NO;
  }
  [contentViewProxy windowWillClose];
  return YES;
}

- (void)popoverPresentationControllerDidDismissPopover:(UIPopoverPresentationController *)popoverPresentationController
{
  [self cleanup];
}

- (void)popoverPresentationController:(UIPopoverPresentationController *)popoverPresentationController willRepositionPopoverToRect:(inout CGRect *)rect inView:(inout UIView **)view
{
  //This will never be called when using bar button item
  BOOL canUseDialogRect = !CGRectEqualToRect(CGRectZero, popoverRect);
  UIView *theSourceView = *view;

  if (!canUseDialogRect) {
    rect->origin = [theSourceView bounds].origin;
    rect->size = [theSourceView bounds].size;
  }

  popoverPresentationController.sourceRect = *rect;
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey, id> *)change context:(void *)context
{
  if ([TiUtils isIOSVersionOrGreater:@"13.0"] && object == viewController.view && [keyPath isEqualToString:@"safeAreaInsets"]) {
    UIEdgeInsets newInsets = [[change objectForKey:@"new"] UIEdgeInsetsValue];
    UIEdgeInsets oldInsets = [[change objectForKey:@"old"] UIEdgeInsetsValue];
    if (!UIEdgeInsetsEqualToEdgeInsets(oldInsets, newInsets)) {
      [self updateContentViewWithSafeAreaInsets:newInsets];
    }
  }
}

@end

#endif
