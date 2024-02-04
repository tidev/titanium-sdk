/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(deviceRotated:)
                                               name:UIDeviceOrientationDidChangeNotification
                                             object:nil];
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
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
    DebugLog(@"[ERROR] Changing contentView when the popover is showing is not supported") return;
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
    TiThreadPerformOnMainThread(
        ^{
          [self updatePassThroughViews];
        },
        NO);
  }
}

#pragma mark Public Methods

- (void)show:(id)args
{
  [closingCondition lock];
  while (isDismissing) {
    [closingCondition wait];
  }
  [closingCondition unlock];

  if (popoverInitialized) {
    DebugLog(@"Popover is already showing. Ignoring call") return;
  }

  if (contentViewProxy == nil) {
    DebugLog(@"[ERROR] Popover presentation without contentView property set is no longer supported. Ignoring call") return;
  }

  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);
  [self rememberSelf];
  [self retain];
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

  deviceRotated = NO;

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
    [(TiWindowProxy *)contentViewProxy windowWillOpen];

    [(TiWindowProxy *)contentViewProxy open:nil];
    [(TiWindowProxy *)contentViewProxy gainFocus];
  } else {
    [contentViewProxy windowWillOpen];
  }

  TiThreadPerformOnMainThread(
      ^{
        [self updateContentSize];

        UIViewController *theController = [self viewController];
        theController.modalPresentationStyle = UIModalPresentationPopover;
        theController.popoverPresentationController.permittedArrowDirections = directions;
        theController.popoverPresentationController.delegate = self;

        if ([self valueForKey:@"backgroundColor"]) {
          theController.popoverPresentationController.backgroundColor = [[TiColor colorNamed:[self valueForKey:@"backgroundColor"]] _color];
        }

        [TiApp.app.controller.topPresentedController presentViewController:theController
                                                                  animated:animated
                                                                completion:^{
                                                                  popoverInitialized = YES;
                                                                  [contentViewProxy windowDidOpen];
                                                                }];
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
  [closingCondition signal];
  [closingCondition unlock];

  TiThreadPerformOnMainThread(
      ^{
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
  if (!popoverInitialized) {
    [closingCondition lock];
    isDismissing = NO;
    [closingCondition signal];
    [closingCondition unlock];

    return;
  }
  [contentViewProxy setProxyObserver:nil];

  popoverInitialized = NO;
  [self fireEvent:@"hide" withObject:nil]; //Checking for listeners are done by fireEvent anyways.
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
  [self release];
  [closingCondition lock];
  isDismissing = NO;
  [closingCondition signal];
  [closingCondition unlock];
}

- (CGSize)contentSize
{
#ifndef TI_USE_AUTOLAYOUT
  CGSize screenSize = [[UIScreen mainScreen] bounds].size;
  if (poWidth.type != TiDimensionTypeUndefined) {
    [contentViewProxy layoutProperties]->width.type = poWidth.type;
    [contentViewProxy layoutProperties]->width.value = poWidth.value;
    poWidth = TiDimensionUndefined;
  }

  if (poHeight.type != TiDimensionTypeUndefined) {
    [contentViewProxy layoutProperties]->height.type = poHeight.type;
    [contentViewProxy layoutProperties]->height.value = poHeight.value;
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

- (UIViewController *)viewController
{
  if (viewController == nil) {
    if ([contentViewProxy isKindOfClass:[TiWindowProxy class]]) {
      [(TiWindowProxy *)contentViewProxy setIsManaged:YES];
      viewController = [[(TiWindowProxy *)contentViewProxy hostingController] retain];
    } else {
      viewController = [[TiViewController alloc] initWithViewProxy:contentViewProxy];
    }

    [viewController.view addObserver:self forKeyPath:@"safeAreaInsets" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
  }

  viewController.view.clipsToBounds = YES;
  return viewController;
}

- (void)updateContentViewWithSafeAreaInsets:(NSValue *)insetsValue
{
  TiThreadPerformOnMainThread(
      ^{
        UIViewController *viewController = [self viewController];
        contentViewProxy.view.frame = viewController.view.frame;
        UIEdgeInsets edgeInsets = [insetsValue UIEdgeInsetsValue];
        viewController.view.frame = CGRectMake(viewController.view.frame.origin.x + edgeInsets.left, viewController.view.frame.origin.y + edgeInsets.top, viewController.view.frame.size.width - edgeInsets.left - edgeInsets.right, viewController.view.frame.size.height - edgeInsets.top - edgeInsets.bottom);
      },
      YES);
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

- (UIModalPresentationStyle)adaptivePresentationStyleForPresentationController:(UIPresentationController *)controller
{
  return UIModalPresentationNone;
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
      popoverPresentationController.permittedArrowDirections = directions;
      popoverPresentationController.sourceView = view;
      popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, popoverRect) ? [view bounds] : popoverRect);
      return;
    }
  }

  //Fell through.
  UIViewController *presentingController = [[self viewController] presentingViewController];
  popoverPresentationController.permittedArrowDirections = directions;
  popoverPresentationController.sourceView = [presentingController view];
  popoverPresentationController.sourceRect = (CGRectEqualToRect(CGRectZero, popoverRect) ? CGRectMake(presentingController.view.bounds.size.width / 2, presentingController.view.bounds.size.height / 2, 1, 1) : popoverRect);
}

- (BOOL)presentationControllerShouldDismiss:(UIPopoverPresentationController *)popoverPresentationController
{
  if (viewController.presentedViewController != nil) {
    return NO;
  }
  [contentViewProxy windowWillClose];
  return YES;
}

- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController
{
  [self cleanup];
}

- (void)popoverPresentationController:(UIPopoverPresentationController *)popoverPresentationController willRepositionPopoverToRect:(inout CGRect *)rect inView:(inout UIView *_Nonnull *)view
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
  if (object == viewController.view && [keyPath isEqualToString:@"safeAreaInsets"]) {
    UIEdgeInsets newInsets = [[change objectForKey:@"new"] UIEdgeInsetsValue];
    UIEdgeInsets oldInsets = [[change objectForKey:@"old"] UIEdgeInsetsValue];
    NSValue *insetsValue = [NSValue valueWithUIEdgeInsets:newInsets];

    if (!UIEdgeInsetsEqualToEdgeInsets(oldInsets, newInsets) || deviceRotated) {
      deviceRotated = NO;
      [self updateContentViewWithSafeAreaInsets:insetsValue];
    }
  }
}

- (void)deviceRotated:(NSNotification *)sender
{
  deviceRotated = YES;
}

@end

#endif
