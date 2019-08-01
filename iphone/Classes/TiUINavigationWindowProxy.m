/**
 * Axway Titanium
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_UINAVIGATIONWINDOW) || defined(USE_TI_UIIOSNAVIGATIONWINDOW)

#import "TiUINavigationWindowProxy.h"
#import "TiUINavigationWindowInternal.h"
#import <TitaniumKit/TiApp.h>

@implementation TiUINavigationWindowProxy

- (void)_destroy
{
  RELEASE_TO_NIL(rootWindow);
  RELEASE_TO_NIL(navController);
  RELEASE_TO_NIL(current);
  [super _destroy];
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  [super _initWithProperties:properties];
}

- (NSString *)apiName
{
  return @"Ti.UI.NavigationWindow";
}

- (void)popGestureStateHandler:(UIGestureRecognizer *)recognizer
{
  UIGestureRecognizerState curState = recognizer.state;

  switch (curState) {
  case UIGestureRecognizerStateBegan:
    transitionWithGesture = YES;
    break;
  case UIGestureRecognizerStateEnded:
  case UIGestureRecognizerStateCancelled:
  case UIGestureRecognizerStateFailed:
    transitionWithGesture = NO;
    break;
  default:
    break;
  }
}

#pragma mark - TiOrientationController

- (TiOrientationFlags)orientationFlags
{
  if ([self isModal]) {
    return [super orientationFlags];
  } else {
    for (id thisController in [[navController viewControllers] reverseObjectEnumerator]) {
      if (![thisController isKindOfClass:[TiViewController class]]) {
        continue;
      }
      TiWindowProxy *thisProxy = (TiWindowProxy *)[(TiViewController *)thisController proxy];
      if ([thisProxy conformsToProtocol:@protocol(TiOrientationController)]) {
        TiOrientationFlags result = [thisProxy orientationFlags];
        if (result != TiOrientationNone) {
          return result;
        }
      }
    }
    return _supportedOrientations;
  }
}

#pragma mark - TiTab Protocol

- (id)tabGroup
{
  return nil;
}

- (UINavigationController *)controller
{
  if (navController == nil) {
    navController = [[UINavigationController alloc] initWithRootViewController:[self rootController]];
    ;
    navController.delegate = self;
    [TiUtils configureController:navController withObject:self];
    [navController.interactivePopGestureRecognizer addTarget:self action:@selector(popGestureStateHandler:)];
    [[navController interactivePopGestureRecognizer] setDelegate:self];
  }
  return navController;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  BOOL isRootWindow = (current == rootWindow);

  if (current != nil && !isRootWindow) {
    return [TiUtils boolValue:[current valueForKey:@"swipeToClose"] def:YES];
  }
  return !isRootWindow;
}

- (void)openWindow:(NSArray *)args
{
  TiWindowProxy *window = [args objectAtIndex:0];
  ENSURE_TYPE(window, TiWindowProxy);

  if (window == rootWindow) {
    [rootWindow windowWillOpen];
    [rootWindow windowDidOpen];
    return;
  }
  [window setIsManaged:YES];
  [window setTab:(TiViewProxy<TiTab> *)self];
  [window setParentOrientationController:self];
  //Send to open. Will come back after _handleOpen returns true.
  if (![window opening]) {
    args = ([args count] > 1) ? [args objectAtIndex:1] : nil;
    if (args != nil) {
      args = [NSArray arrayWithObject:args];
    }
    [window open:args];
    return;
  }

  [[[TiApp app] controller] dismissKeyboard];
  TiThreadPerformOnMainThread(^{
    [self pushOnUIThread:args];
  },
      YES);
}

- (void)closeWindow:(NSArray *)args
{
  TiWindowProxy *window = [args objectAtIndex:0];
  ENSURE_TYPE(window, TiWindowProxy);
  if (window == rootWindow && ![[TiApp app] willTerminate]) {
    DebugLog(@"[ERROR] Can not close the root window of the NavigationWindow. Close the NavigationWindow instead.");
    return;
  }
  TiThreadPerformOnMainThread(^{
    [self popOnUIThread:args];
  },
      YES);
}

- (void)popToRootWindow:(id)args
{
  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);

  TiThreadPerformOnMainThread(^{
    [navController popToRootViewControllerAnimated:[TiUtils boolValue:@"animated" properties:args def:NO]];
  },
      YES);
}

- (void)windowClosing:(TiWindowProxy *)window animated:(BOOL)animated
{
  //NO OP NOW
}

#pragma mark - UINavigationControllerDelegate

#ifdef USE_TI_UIIOSTRANSITIONANIMATION
- (id<UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController
                                  animationControllerForOperation:(UINavigationControllerOperation)operation
                                               fromViewController:(UIViewController *)fromVC
                                                 toViewController:(UIViewController *)toVC
{
  if ([toVC isKindOfClass:[TiViewController class]]) {
    TiViewController *toViewController = (TiViewController *)toVC;
    if ([[toViewController proxy] isKindOfClass:[TiWindowProxy class]]) {
      TiWindowProxy *windowProxy = (TiWindowProxy *)[toViewController proxy];
      return [windowProxy transitionAnimation];
    }
  }
  return nil;
}
#endif

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  if ([TiUtils isIOSVersionOrGreater:@"11.2"]) {
    navigationController.navigationBar.tintAdjustmentMode = UIViewTintAdjustmentModeNormal;
    navigationController.navigationBar.tintAdjustmentMode = UIViewTintAdjustmentModeAutomatic;
  }

  if (!transitionWithGesture) {
    transitionIsAnimating = YES;
  }
  if (current != nil) {
    UIViewController *curController = [current hostingController];
    NSArray *curStack = [navController viewControllers];
    BOOL winclosing = NO;
    if (![curStack containsObject:curController]) {
      winclosing = YES;
    } else {
      NSUInteger curIndex = [curStack indexOfObject:curController];
      if (curIndex > 1) {
        UIViewController *currentPopsTo = [curStack objectAtIndex:(curIndex - 1)];
        if (currentPopsTo == viewController) {
          winclosing = YES;
        }
      }
    }
    if (winclosing) {
      //TIMOB-15033. Have to call windowWillClose so any keyboardFocussedProxies resign
      //as first responders. This is ok since tab is not nil so no message will be sent to
      //hosting controller.
      [current windowWillClose];
    }
  }
  TiWindowProxy *theWindow = (TiWindowProxy *)[(TiViewController *)viewController proxy];
  [theWindow processForSafeArea];
  if ((theWindow != rootWindow) && [theWindow opening]) {
    [theWindow windowWillOpen];
    [theWindow windowDidOpen];
  }
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  transitionIsAnimating = NO;
  transitionWithGesture = NO;
  if (current != nil) {
    UIViewController *oldController = [current hostingController];

    if (![[navController viewControllers] containsObject:oldController]) {
      [current setTab:nil];
      [current setParentOrientationController:nil];
      [current close:nil];
    }
  }
  RELEASE_TO_NIL(current);
  TiWindowProxy *theWindow = (TiWindowProxy *)[(TiViewController *)viewController proxy];
  current = [theWindow retain];
  [self childOrientationControllerChangedFlags:current];
  if (focussed) {
    [current gainFocus];
  }
}

#pragma mark - Private API

- (void)_setFrame:(CGRect)bounds
{
  if (navController != nil) {
    [[navController view] setFrame:bounds];
  }
}

- (UIViewController *)rootController
{
  if (rootWindow == nil) {
    id window = [self valueForKey:@"window"];
    ENSURE_TYPE(window, TiWindowProxy);
    rootWindow = [window retain];
    [rootWindow setIsManaged:YES];
    [rootWindow setTab:(TiViewProxy<TiTab> *)self];
    [rootWindow setParentOrientationController:self];
    [rootWindow open:nil];
  }
  return [rootWindow hostingController];
}

- (void)pushOnUIThread:(NSArray *)args
{
  if (transitionIsAnimating || transitionWithGesture || !navController) {
    [self performSelector:_cmd withObject:args afterDelay:0.1];
    return;
  }
  if (!transitionWithGesture) {
    transitionIsAnimating = YES;
  }

  @try {
    TiWindowProxy *window = [args objectAtIndex:0];
    BOOL animated = args != nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;

    // Prevent UIKit  crashes when trying to push a window while it's already in the nav stack (e.g. on really slow devices)
    if ([[[self rootController].navigationController viewControllers] containsObject:window.hostingController]) {
      NSLog(@"[WARN] Trying to push a view controller that is already in the navigation window controller stack. Skipping open …");
      return;
    }

    [navController pushViewController:[window hostingController] animated:animated];
  } @catch (NSException *ex) {
    NSLog(@"[ERROR] %@", ex.description);
  }
}

- (void)popOnUIThread:(NSArray *)args
{
  if (transitionIsAnimating || transitionWithGesture) {
    [self performSelector:_cmd withObject:args afterDelay:0.1];
    return;
  }
  TiWindowProxy *window = [args objectAtIndex:0];

  if (window == current) {
    BOOL animated = args != nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
    if (animated && !transitionWithGesture) {
      transitionIsAnimating = YES;
    }
    [navController popViewControllerAnimated:animated];
  } else {
    [self closeWindow:window animated:NO];
  }
}

- (void)closeWindow:(TiWindowProxy *)window animated:(BOOL)animated
{
  [window retain];
  UIViewController *windowController = [[window hostingController] retain];

  // Manage the navigation controller stack
  NSMutableArray *newControllerStack = [NSMutableArray arrayWithArray:[navController viewControllers]];
  [newControllerStack removeObject:windowController];
  [navController setViewControllers:newControllerStack animated:animated];
  [window setTab:nil];
  [window setParentOrientationController:nil];

  // for this to work right, we need to sure that we always have the tab close the window
  // and not let the window simply close by itself. this will ensure that we tell the
  // tab that we're doing that
  [window close:nil];
  RELEASE_TO_NIL_AUTORELEASE(window);
  RELEASE_TO_NIL(windowController);
}

- (void)cleanNavStack
{
  TiThreadPerformOnMainThread(^{
    if (navController != nil) {
      [navController setDelegate:nil];
      NSArray *currentControllers = [navController viewControllers];
      [navController setViewControllers:[NSArray array]];

      for (UIViewController *viewController in currentControllers) {
        TiWindowProxy *win = (TiWindowProxy *)[(TiViewController *)viewController proxy];
        [win setTab:nil];
        [win setParentOrientationController:nil];
        [win close:nil];
      }
      [navController.view removeFromSuperview];
      RELEASE_TO_NIL(navController);
      RELEASE_TO_NIL(rootWindow);
      RELEASE_TO_NIL(current);
    }
  },
      YES);
}

#pragma mark - TiWindowProtocol
- (void)viewWillAppear:(BOOL)animated
{
  if ([self viewAttached]) {
    [navController viewWillAppear:animated];
  }
  [super viewWillAppear:animated];
}
- (void)viewWillDisappear:(BOOL)animated
{
  if ([self viewAttached]) {
    [navController viewWillDisappear:animated];
  }
  [super viewWillDisappear:animated];
}

- (void)viewDidAppear:(BOOL)animated
{
  if ([self viewAttached]) {
    [navController viewDidAppear:animated];
  }
  [super viewDidAppear:animated];
}
- (void)viewDidDisappear:(BOOL)animated
{
  if ([self viewAttached]) {
    [navController viewDidDisappear:animated];
  }
  [super viewDidDisappear:animated];
}

- (BOOL)homeIndicatorAutoHide
{
  UIViewController *topVC = [navController topViewController];
  if ([topVC isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVC proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      return [(id<TiWindowProtocol>)theProxy homeIndicatorAutoHide];
    }
  }
  return [super homeIndicatorAutoHide];
}

- (BOOL)hidesStatusBar
{
  UIViewController *topVC = [navController topViewController];
  if ([topVC isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVC proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      return [(id<TiWindowProtocol>)theProxy hidesStatusBar];
    }
  }
  return [super hidesStatusBar];
}

- (UIStatusBarStyle)preferredStatusBarStyle;
{
  UIViewController *topVC = [navController topViewController];
  if ([topVC isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVC proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      return [(id<TiWindowProtocol>)theProxy preferredStatusBarStyle];
    }
  }
  return [super preferredStatusBarStyle];
}

- (void)gainFocus
{
  UIViewController *topVC = [navController topViewController];
  if ([topVC isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVC proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      [(id<TiWindowProtocol>)theProxy gainFocus];
    }
  }
  [super gainFocus];
}

- (void)resignFocus
{
  UIViewController *topVC = [navController topViewController];
  if ([topVC isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVC proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      [(id<TiWindowProtocol>)theProxy resignFocus];
    }
  }
  [super resignFocus];
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  if ([self viewAttached]) {
    [navController viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
  }
  [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
}

- (void)systemLayoutFittingSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  if ([self viewAttached]) {
    [navController systemLayoutFittingSizeDidChangeForChildContentContainer:container];
  }
  [super systemLayoutFittingSizeDidChangeForChildContentContainer:container];
}

- (void)willTransitionToTraitCollection:(UITraitCollection *)newCollection withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  if ([self viewAttached]) {
    [navController willTransitionToTraitCollection:newCollection withTransitionCoordinator:coordinator];
  }
  [super willTransitionToTraitCollection:newCollection withTransitionCoordinator:coordinator];
}

- (void)preferredContentSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  if ([self viewAttached]) {
    [navController preferredContentSizeDidChangeForChildContentContainer:container];
  }
  [super preferredContentSizeDidChangeForChildContentContainer:container];
}

#pragma mark - TiViewProxy overrides
- (TiUIView *)newView
{
  CGRect frame = [self appFrame];
  TiUINavigationWindowInternal *win = [[TiUINavigationWindowInternal alloc] initWithFrame:frame];
  return win;
}

- (void)windowWillOpen
{
  UIView *nview = [[self controller] view];
  [nview setFrame:[[self view] bounds]];
  [[self view] addSubview:nview];
  return [super windowWillOpen];
}

- (void)windowDidClose
{
  [self cleanNavStack];
  [super windowDidClose];
}

- (void)willChangeSize
{
  [super willChangeSize];

  //TODO: Shouldn't this be not through UI? Shouldn't we retain the windows ourselves?
  for (UIViewController *thisController in [navController viewControllers]) {
    if ([thisController isKindOfClass:[TiViewController class]]) {
      TiViewProxy *thisProxy = [(TiViewController *)thisController proxy];
      [thisProxy willChangeSize];
    }
  }
}

@end

#endif
