/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiUITabProxy.h"
#import "TiUITabGroup.h"
#import "TiUITabGroupProxy.h"
#import <TitaniumKit/ImageLoader.h>
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiProxy.h>
#import <TitaniumKit/TiUtils.h>

//NOTE: this proxy is a little different than normal Proxy/View pattern
//since it's not really backed by a view in the normal way.  It's given
//a root level window proxy (and view) that are passed as the root controller
//to the Nav Controller.  So, we do a few things that you'd normally not
//have to do in a Proxy/View pattern.

@interface TiUITabProxy ()
- (void)openOnUIThread:(NSArray *)args;
@end

@implementation TiUITabProxy

- (void)_destroy
{
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiTraitCollectionChanged object:nil];

  if (rootWindow != nil) {
    [self cleanNavStack:YES];
  }
  RELEASE_TO_NIL(controllerStack);
  RELEASE_TO_NIL(rootWindow);
  RELEASE_TO_NIL(controller);
  RELEASE_TO_NIL(current);
  [super _destroy];
}

- (NSMutableDictionary *)langConversionTable
{
  return [NSMutableDictionary dictionaryWithObject:@"title" forKey:@"titleid"];
}

- (void)_configure
{
  // since we're special proxy type instead of normal, we force in values
  [self replaceValue:nil forKey:@"title" notification:NO];
  [self replaceValue:nil forKey:@"icon" notification:NO];
  [self replaceValue:nil forKey:@"badge" notification:NO];
  [self replaceValue:NUMBOOL(YES) forKey:@"iconIsMask" notification:NO];
  [self replaceValue:NUMBOOL(YES) forKey:@"activeIconIsMask" notification:NO];
  [self replaceValue:nil forKey:@"titleColor" notification:NO];
  [self replaceValue:nil forKey:@"activeTitleColor" notification:NO];
  [self replaceValue:nil forKey:@"tintColor" notification:NO];
  [self replaceValue:nil forKey:@"activeTintColor" notification:NO];
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(didChangeTraitCollection:)
                                               name:kTiTraitCollectionChanged
                                             object:nil];
  [super _configure];
}

- (void)didChangeTraitCollection:(NSNotification *)info
{
  [self updateTabBarItem];
}

- (NSString *)apiName
{
  return @"Ti.UI.Tab";
}

#pragma mark - Private methods

- (void)cleanNavStack:(BOOL)removeTab
{
  TiThreadPerformOnMainThread(^{
    UIViewController *rootController = [self rootController];
    [controller setDelegate:nil];
    if ([[controller viewControllers] count] > 1) {
      NSMutableArray *doomedVcs = [[controller viewControllers] mutableCopy];
      [doomedVcs removeObject:rootController];
      [controller setViewControllers:[NSArray arrayWithObject:rootController]];
      if (current != nil) {
        RELEASE_TO_NIL(current);
        current = [(TiWindowProxy *)[(TiViewController *)rootController proxy] retain];
      }
      for (TiViewController *doomedVc in doomedVcs) {
        [self closeWindowProxy:(TiWindowProxy *)[doomedVc proxy] animated:NO];
      }
      RELEASE_TO_NIL(doomedVcs);
    }
    if (removeTab) {
      [self closeWindowProxy:rootWindow animated:NO];
      RELEASE_TO_NIL(controller);
      RELEASE_TO_NIL(current);
    } else {
      [controller setDelegate:self];
    }
  },
      YES);
}

- (UIViewController *)rootController
{
  if (rootWindow == nil) {
    id window = [self valueForKey:@"window"];
    ENSURE_TYPE(window, TiWindowProxy);
    rootWindow = [window retain];
    [rootWindow setIsManaged:YES];
    [rootWindow setTab:self];
    [rootWindow setParentOrientationController:self];
    [rootWindow open:nil];
  }
  return [rootWindow hostingController];
}

- (void)openOnUIThread:(NSArray *)args
{
  if (transitionIsAnimating || transitionWithGesture) {
    [self performSelector:_cmd withObject:args afterDelay:0.1];
    return;
  }

  @try {
    TiWindowProxy *window = [args objectAtIndex:0];

    // Prevent UIKit  crashes when trying to push a window while it's already in the nav stack (e.g. on really slow devices)
    if ([[[self rootController].navigationController viewControllers] containsObject:window.hostingController]) {
      NSLog(@"[WARN] Trying to push a view controller that is already in the navigation window controller stack. Skipping open …");
      return;
    }

    BOOL animated = ([args count] > 1) ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
    [controllerStack addObject:[window hostingController]];

    [[[self rootController] navigationController] pushViewController:[window hostingController] animated:animated];
  } @catch (NSException *ex) {
    NSLog(@"[ERROR] %@", ex.description);
  }
}

- (void)closeOnUIThread:(NSArray *)args
{
  if (transitionIsAnimating || transitionWithGesture) {
    [self performSelector:_cmd withObject:args afterDelay:0.1];
    return;
  }
  TiWindowProxy *window = [args objectAtIndex:0];

  if (window == current) {
    BOOL animated = ([args count] > 1) ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
    [[[self rootController] navigationController] popViewControllerAnimated:animated];
  } else {
    [self closeWindowProxy:window animated:NO];
  }
}

#pragma mark - Internal API
- (void)setTabGroup:(TiUITabGroupProxy *)proxy
{
  tabGroup = proxy;
  /*
     TIMOB-18155. TabProxy now remembers itself instead of the TabGroup.
     In the TabGroupProxy, when you remember a tab it gets written to the
     property table with a key based on proxy hash. However when we change the
     activeTab property of the TabGroup, it is possible for this property to be
     deleted. So the JSObject is unprotected and can get Garbage Collected.
     */
  if (tabGroup) {
    [self rememberSelf];
  } else {
    [self forgetSelf];
  }
  if (controller != nil) {
    [TiUtils configureController:controller withObject:tabGroup];
  }
}

- (void)removeFromTabGroup
{
  [self setActive:NUMBOOL(NO)];
  [self cleanNavStack:YES];
}

- (void)closeWindowProxy:(TiWindowProxy *)window animated:(BOOL)animated
{
  // TIMOB-20623: This can happen when the application is currently
  // terminating and the rootWindow property has already been deallocated.
  if (!rootWindow) {
    return;
  }

  [window retain];
  UIViewController *windowController = [[window hostingController] retain];

  // Manage the navigation controller stack
  UINavigationController *navController = [[self rootController] navigationController];
  NSMutableArray *newControllerStack = [NSMutableArray arrayWithArray:[navController viewControllers]];
  [newControllerStack removeObject:windowController];
  [navController setViewControllers:newControllerStack animated:animated];
  [window setTab:nil];
  [window setParentOrientationController:nil];
  [controllerStack removeObject:windowController];
  // for this to work right, we need to sure that we always have the tab close the window
  // and not let the window simply close by itself. this will ensure that we tell the
  // tab that we're doing that
  [window close:nil];
  RELEASE_TO_NIL_AUTORELEASE(window);
  RELEASE_TO_NIL(windowController);
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

#pragma mark - TiTab protocol
- (UINavigationController *)controller
{
  if (controller == nil) {
    controller = [[UINavigationController alloc] initWithRootViewController:[self rootController]];
    controller.delegate = self;
    [TiUtils configureController:controller withObject:tabGroup];
    [self setTitle:[self valueForKey:@"title"]];
    [self setIcon:[self valueForKey:@"icon"]];
    [self setBadge:[self valueForKey:@"badge"]];
    [self setBadgeColor:[self valueForKey:@"badgeColor"]];
    [self setIconInsets:[self valueForKey:@"iconInsets"]];
    controllerStack = [[NSMutableArray alloc] init];
    [controllerStack addObject:[self rootController]];
    [controller.interactivePopGestureRecognizer addTarget:self action:@selector(popGestureStateHandler:)];
    [[controller interactivePopGestureRecognizer] setDelegate:self];
  }
  return controller;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  if (current != nil) {
    return [TiUtils boolValue:[current valueForKey:@"swipeToClose"] def:YES];
  }
  return YES;
}

- (TiProxy<TiTabGroup> *)tabGroup
{
  return tabGroup;
}

- (void)openWindow:(NSArray *)args
{
  TiWindowProxy *window = [args objectAtIndex:0];
  ENSURE_TYPE(window, TiWindowProxy);

  [window processForSafeArea];

  if (window == rootWindow) {
    [rootWindow windowWillOpen];
    [rootWindow windowDidOpen];
  }
  [window setIsManaged:YES];
  [window setTab:self];
  [window setParentOrientationController:self];

  //Send to open. Will come back after _handleOpen returns true.
  if (![window opening]) {
    args = ([args count] > 1) ? [args objectAtIndex:1] : nil;
    if (args != nil) {
      args = [NSArray arrayWithObject:args];
    }
    [window open:args];

    TiUIView *view = [window view];
    TiViewController *controller = (TiViewController *)[window hostingController];
    [view setFrame:controller.view.bounds];
    return;
  }

  [[[TiApp app] controller] dismissKeyboard];
  TiThreadPerformOnMainThread(^{
    [self openOnUIThread:args];
  },
      YES);
}

- (void)closeWindow:(NSArray *)args
{
  TiWindowProxy *window = [args objectAtIndex:0];
  ENSURE_TYPE(window, TiWindowProxy);

  if (window == rootWindow && ![[TiApp app] willTerminate]) {
    DebugLog(@"[ERROR] Can not close root window of the tab. Use removeTab instead");
    return;
  }
  TiThreadPerformOnMainThread(^{
    [self closeOnUIThread:args];
  },
      YES);
}

- (void)open:(NSArray *)args
{
  [self openWindow:args];
}

- (void)close:(NSArray *)args
{
  [self closeWindow:args];
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
  if (!transitionWithGesture) {
    transitionIsAnimating = YES;
  }
  if ([TiUtils isIOSVersionOrGreater:@"13.0"] && [viewController isKindOfClass:[TiViewController class]]) {
    TiViewController *toViewController = (TiViewController *)viewController;
    if ([[toViewController proxy] isKindOfClass:[TiWindowProxy class]]) {
      TiWindowProxy *windowProxy = (TiWindowProxy *)[toViewController proxy];
      [((TiUITabGroup *)(tabGroup.view))tabController].view.backgroundColor = windowProxy.view.backgroundColor;
    }
  }
  [self handleWillShowViewController:viewController animated:animated];
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  id activeTab = [tabGroup valueForKey:@"activeTab"];
  if (activeTab == nil || activeTab == [NSNull null]) {
    //Make sure that the activeTab property is set
    [self setActive:[NSNumber numberWithBool:YES]];
  }
  transitionIsAnimating = NO;
  transitionWithGesture = NO;
  [self handleDidShowViewController:viewController animated:animated];
}

#pragma mark Public APIs

- (void)handleWillShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  if (current != nil) {
    UIViewController *curController = [current hostingController];
    NSArray *curStack = [[[self rootController] navigationController] viewControllers];
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

  if (theWindow == rootWindow) {
    //This is probably too late for the root view controller.
    //Figure out how to call open before this callback
    [theWindow open:nil];
  } else if ([theWindow opening]) {
    [theWindow windowWillOpen];
    [theWindow windowDidOpen];
  }
}

- (void)handleDidShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
  if (current != nil) {
    UIViewController *oldController = [current hostingController];
    UINavigationController *navController = [[self rootController] navigationController];
    if (![[navController viewControllers] containsObject:oldController]) {
      [controllerStack removeObject:oldController];
      [current setTab:nil];
      [current setParentOrientationController:nil];
      [current close:nil];
      //TIMOB-15188. Tab can switch to rootView anytime by tapping the selected tab again.
      if ((viewController == [self rootController]) && ([controllerStack count] > 1)) {
        [controllerStack removeObject:[self rootController]];
        for (TiViewController *theController in [controllerStack reverseObjectEnumerator]) {
          TiWindowProxy *theWindow = (TiWindowProxy *)[theController proxy];
          [theWindow setTab:nil];
          [theWindow setParentOrientationController:nil];
          [theWindow close:nil];
        }
        [controllerStack removeAllObjects];
        [controllerStack addObject:[self rootController]];
      }
    }
  }
  RELEASE_TO_NIL(current);
  TiWindowProxy *theWindow = (TiWindowProxy *)[(TiViewController *)viewController proxy];
  current = [theWindow retain];
  [self childOrientationControllerChangedFlags:current];
  if (hasFocus) {
    [current gainFocus];
  }
}

- (void)handleWillBlur
{
}

- (void)handleDidBlur:(NSDictionary *)event
{
  if (!hasFocus) {
    return;
  }

  hasFocus = NO;
  if (current != nil) {
    UIViewController *topVC = [[[self rootController] navigationController] topViewController];
    if ([topVC isKindOfClass:[TiViewController class]]) {
      TiViewProxy *theProxy = [(TiViewController *)topVC proxy];
      if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)theProxy resignFocus];
      }
    }
  }

  if ([self _hasListeners:@"unselected"]) {
    [self fireEvent:@"unselected" withObject:event withSource:self propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

- (void)handleWillFocus
{
}

- (void)handleDidFocus:(NSDictionary *)event
{
  if (hasFocus) {
    return;
  }
  hasFocus = YES;
  if (current != nil) {
    UIViewController *topVC = [[[self rootController] navigationController] topViewController];
    if ([topVC isKindOfClass:[TiViewController class]]) {
      TiViewProxy *theProxy = [(TiViewController *)topVC proxy];
      if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)theProxy gainFocus];
      }
    }
  }

  if ([self _hasListeners:@"selected"]) {
    [self fireEvent:@"selected" withObject:event withSource:self propagate:NO reportSuccess:NO errorCode:0 message:nil];
  }
}

- (void)setActive:(id)active
{
  [self replaceValue:active forKey:@"active" notification:NO];

  id activeTab = [tabGroup valueForKey:@"activeTab"];

  if ([TiUtils boolValue:active]) {
    if (activeTab != self) {
      [tabGroup replaceValue:self forKey:@"activeTab" notification:YES];
    }
  } else {
    if (activeTab == self) {
      [tabGroup replaceValue:nil forKey:@"activeTab" notification:YES];
    }
  }
}

- (void)updateTabBarItem
{
  if (rootWindow == nil) {
    return;
  }
  ENSURE_UI_THREAD_0_ARGS;

  UIViewController *rootController = [rootWindow hostingController];
  id badgeValue = [TiUtils stringValue:[self valueForKey:@"badge"]];
  id badgeColor = [self valueForKey:@"badgeColor"];
  id iconInsets = [self valueForKey:@"iconInsets"];
  id icon = [self valueForKey:@"icon"];

  if (badgeColor == nil) {
    // Default badgeColor to tintColor.
    badgeColor = [self valueForKey:@"tintColor"];
  }

  // System-icons
  if ([icon isKindOfClass:[NSNumber class]]) {
    int value = [TiUtils intValue:icon];
    UITabBarItem *newItem = [[UITabBarItem alloc] initWithTabBarSystemItem:value tag:value];
    [newItem setBadgeValue:badgeValue];

    if (badgeColor != nil) {
      [newItem setBadgeColor:[[TiUtils colorValue:badgeColor] color]];
    }

    [rootController setTabBarItem:newItem];
    [newItem release];
    systemTab = YES;
    return;
  }

  NSString *title = [TiUtils stringValue:[self valueForKey:@"title"]];

  UIImage *image;
  UIImage *activeImage = nil;
  if (icon == nil) {
    image = nil;
  } else {
    // we might be inside a different context than our tab group and if so, he takes precendence in
    // url resolution
    TiProxy *currentWindow = [self.executionContext preloadForKey:@"currentWindow" name:@"UI"];
    if (currentWindow == nil) {
      // check our current window's context that we are owned by
      currentWindow = [self.pageContext preloadForKey:@"currentWindow" name:@"UI"];
    }
    if (currentWindow == nil) {
      currentWindow = self;
    }
    if ([icon isKindOfClass:[TiBlob class]]) {
      image = [(TiBlob *)icon image];
    } else {
      image = [[ImageLoader sharedLoader] loadImmediateImage:[TiUtils toURL:icon proxy:currentWindow]];
    }
    id activeIcon = [self valueForKey:@"activeIcon"];
    if ([activeIcon isKindOfClass:[NSString class]]) {
      activeImage = [[ImageLoader sharedLoader] loadImmediateImage:[TiUtils toURL:activeIcon proxy:currentWindow]];
    } else if ([activeIcon isKindOfClass:[TiBlob class]]) {
      activeImage = [(TiBlob *)activeIcon image];
    }

    if (image != nil) {
      if ([image respondsToSelector:@selector(imageWithRenderingMode:)]) {
        NSInteger theMode = iconOriginal ? UIImageRenderingModeAlwaysOriginal : UIImageRenderingModeAlwaysTemplate;
        image = [image imageWithRenderingMode:theMode];
      }
    }
    if (activeImage != nil) {
      if ([activeImage respondsToSelector:@selector(imageWithRenderingMode:)]) {
        NSInteger theMode = activeIconOriginal ? UIImageRenderingModeAlwaysOriginal : UIImageRenderingModeAlwaysTemplate;
        activeImage = [activeImage imageWithRenderingMode:theMode];
      }
    }

    TiColor *tintColor = [TiUtils colorValue:[self valueForKey:@"tintColor"]];
    if (tintColor == nil) {
      tintColor = [TiUtils colorValue:[tabGroup valueForKey:@"tintColor"]];
    }
    if (tintColor != nil && image != nil) {
      image = [TiUtils imageWithTint:image tintColor:[tintColor color]];
    }

    TiColor *activeTintColor = [TiUtils colorValue:[self valueForKey:@"activeTintColor"]];
    if (activeTintColor == nil) {
      activeTintColor = [TiUtils colorValue:[tabGroup valueForKey:@"activeTintColor"]];
    }
    if (activeTintColor != nil) {
      if (activeImage != nil) {
        activeImage = [TiUtils imageWithTint:activeImage tintColor:[activeTintColor color]];
      } else if (image != nil) {
        activeImage = [TiUtils imageWithTint:image tintColor:[activeTintColor color]];
      }
    }
  }
  [rootController setTitle:title];
  UITabBarItem *ourItem = nil;

  systemTab = NO;
  ourItem = [[[UITabBarItem alloc] initWithTitle:title image:image selectedImage:activeImage] autorelease];

  TiColor *titleColor = [TiUtils colorValue:[self valueForKey:@"titleColor"]];
  if (titleColor == nil) {
    titleColor = [TiUtils colorValue:[tabGroup valueForKey:@"titleColor"]];
  }
  if (titleColor != nil) {
    [ourItem setTitleTextAttributes:[NSDictionary dictionaryWithObjectsAndKeys:[titleColor color], NSForegroundColorAttributeName, nil] forState:UIControlStateNormal];
  }
  TiColor *activeTitleColor = [TiUtils colorValue:[self valueForKey:@"activeTitleColor"]];
  if (activeTitleColor == nil) {
    activeTitleColor = [TiUtils colorValue:[tabGroup valueForKey:@"activeTitleColor"]];
  }
  if (activeTitleColor != nil) {
    [ourItem setTitleTextAttributes:[NSDictionary dictionaryWithObjectsAndKeys:[activeTitleColor color], NSForegroundColorAttributeName, nil] forState:UIControlStateSelected];
  }

  if (iconInsets != nil) {
    if (!UIEdgeInsetsEqualToEdgeInsets([TiUtils contentInsets:iconInsets], [ourItem imageInsets])) {
      [ourItem setImageInsets:[self calculateIconInsets:iconInsets]];
    }
  }

  if (badgeColor != nil) {
    [ourItem setBadgeColor:[[TiUtils colorValue:badgeColor] color]];
  }

  [ourItem setBadgeValue:badgeValue];
  [rootController setTabBarItem:ourItem];
}

- (UIEdgeInsets)calculateIconInsets:(id)value
{
  if ([value isKindOfClass:[NSDictionary class]]) {
    NSDictionary *dict = (NSDictionary *)value;
    CGFloat top = [TiUtils floatValue:@"top" properties:dict def:0];
    CGFloat left = [TiUtils floatValue:@"left" properties:dict def:0];
    return UIEdgeInsetsMake(top, left, -top, -left);
  }
  return UIEdgeInsetsMake(0, 0, 0, 0);
}

- (void)setTitle:(id)title
{
  [self replaceValue:title forKey:@"title" notification:NO];
  [self updateTabBarItem];
}

- (void)setIcon:(id)icon
{
  if ([icon isKindOfClass:[NSString class]]) {
    // we might be inside a different context than our tab group and if so, he takes precendence in
    // url resolution
    TiProxy *currentWindow = [self.executionContext preloadForKey:@"currentWindow" name:@"UI"];
    if (currentWindow == nil) {
      // check our current window's context that we are owned by
      currentWindow = [self.pageContext preloadForKey:@"currentWindow" name:@"UI"];
    }
    if (currentWindow == nil) {
      currentWindow = self;
    }

    icon = [[TiUtils toURL:icon proxy:currentWindow] absoluteString];
  }

  [self replaceValue:icon forKey:@"icon" notification:NO];

  [self updateTabBarItem];
}

- (void)setIconInsets:(id)args
{
  if ([args isKindOfClass:[NSDictionary class]]) {
    [self replaceValue:args forKey:@"iconInsets" notification:NO];
    [self updateTabBarItem];
  }
}

- (void)setIconIsMask:(id)value
{
  [self replaceValue:value forKey:@"iconIsMask" notification:NO];
  BOOL newValue = ![TiUtils boolValue:value def:YES];
  if (newValue != iconOriginal) {
    iconOriginal = newValue;
    [self updateTabBarItem];
  }
}

- (void)setTitleColor:(id)value
{
  [self replaceValue:value forKey:@"titleColor" notification:NO];
  [self updateTabBarItem];
}

- (void)setActiveTitleColor:(id)value
{
  [self replaceValue:value forKey:@"activeTitleColor" notification:NO];
  [self updateTabBarItem];
}

- (void)setActiveIconIsMask:(id)value
{
  [self replaceValue:value forKey:@"activeIconIsMask" notification:NO];
  BOOL newValue = ![TiUtils boolValue:value def:YES];
  if (newValue != activeIconOriginal) {
    activeIconOriginal = newValue;
    [self updateTabBarItem];
  }
}

- (void)setActiveIcon:(id)icon
{
  if ([icon isKindOfClass:[NSString class]]) {
    // we might be inside a different context than our tab group and if so, he takes precendence in
    // url resolution
    TiProxy *currentWindow = [self.executionContext preloadForKey:@"currentWindow" name:@"UI"];
    if (currentWindow == nil) {
      // check our current window's context that we are owned by
      currentWindow = [self.pageContext preloadForKey:@"currentWindow" name:@"UI"];
    }
    if (currentWindow == nil) {
      currentWindow = self;
    }

    icon = [[TiUtils toURL:icon proxy:currentWindow] absoluteString];
  }

  [self replaceValue:icon forKey:@"activeIcon" notification:NO];

  [self updateTabBarItem];
}

- (void)setBadge:(id)badge
{
  [self replaceValue:badge forKey:@"badge" notification:NO];
  [self updateTabBarItem];
}

- (void)setBadgeColor:(id)value
{
  [self replaceValue:value forKey:@"badgeColor" notification:NO];
  [self updateTabBarItem];
}

- (void)willChangeSize
{
  [super willChangeSize];

  //TODO: Shouldn't this be not through UI? Shouldn't we retain the windows ourselves?
  for (UIViewController *thisController in [controller viewControllers]) {
    if ([thisController isKindOfClass:[TiViewController class]]) {
      TiViewProxy *thisProxy = [(TiViewController *)thisController proxy];
      [thisProxy willChangeSize];
    }
  }
}

- (void)popToRootWindow:(id)args
{
  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);

  TiThreadPerformOnMainThread(^{
    [controller popToRootViewControllerAnimated:[TiUtils boolValue:@"animated" properties:args def:NO]];
  },
      YES);
}

#pragma mark - TiOrientationController

@synthesize parentOrientationController;

- (BOOL)homeIndicatorAutoHide
{
  if (rootWindow == nil) {
    return NO;
  }

  UINavigationController *nc = [[rootWindow hostingController] navigationController];
  UIViewController *topVc = [nc topViewController];
  if ([topVc isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVc proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      return [(id<TiWindowProtocol>)theProxy homeIndicatorAutoHide];
    }
  }
  return NO;
}

- (BOOL)hidesStatusBar
{
  if (rootWindow == nil) {
    return NO;
  }

  UINavigationController *nc = [[rootWindow hostingController] navigationController];
  UIViewController *topVc = [nc topViewController];
  if ([topVc isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVc proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      return [(id<TiWindowProtocol>)theProxy hidesStatusBar];
    }
  }
  return NO;
}

- (UIStatusBarStyle)preferredStatusBarStyle;
{
  if (rootWindow == nil) {
    return UIStatusBarStyleDefault;
  }

  UINavigationController *nc = [[rootWindow hostingController] navigationController];
  UIViewController *topVc = [nc topViewController];
  if ([topVc isKindOfClass:[TiViewController class]]) {
    TiViewProxy *theProxy = [(TiViewController *)topVc proxy];
    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
      return [(id<TiWindowProtocol>)theProxy preferredStatusBarStyle];
    }
  }
  return UIStatusBarStyleDefault;
}

- (TiOrientationFlags)orientationFlags
{
  UIViewController *modalController = [controller presentedViewController];
  if ([modalController conformsToProtocol:@protocol(TiOrientationController)]) {
    return [(id<TiOrientationController>)modalController orientationFlags];
  }

  UINavigationController *nc = [[rootWindow hostingController] navigationController];
  for (id thisController in [[nc viewControllers] reverseObjectEnumerator]) {
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
  return TiOrientationNone;
}

- (void)childOrientationControllerChangedFlags:(id<TiOrientationController>)orientationController
{
  WARN_IF_BACKGROUND_THREAD_OBJ;
  [parentOrientationController childOrientationControllerChangedFlags:self];
}

@end

#endif
