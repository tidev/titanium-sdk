/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIWindowProxy.h"
#import "ImageLoader.h"
#import "TiApp.h"
#import "TiComplexValue.h"
#import "TiLayoutQueue.h"
#import "TiUIViewProxy.h"
#import "Webcolor.h"

// this is how long we should wait on the new JS context to be loaded
// holding the UI thread before we return during an window open. we
// attempt to hold it for a small period of time to allow the window
// to loaded before we return from the open such that the paint will be
// much smoother on the new window during a tab transition
#define EXTERNAL_JS_WAIT_TIME (150 / 1000)

/** 
 * This class is a helper that will be used when we have an external
 * window w/ JS so that we can attempt to wait for the window context
 * to be fully loaded on the UI thread (since JS runs in a different
 * thread) and attempt to wait up til EXTERNAL_JS_WAIT_TIME before
 * timing out. If timed out, will go ahead and start opening the window
 * and as the JS context finishes, will continue opening from there - 
 * this has a nice effect of immediately opening if fast but not delaying
 * if slow (so you get weird button delay effects for example)
 *
 */

@interface TiUIWindowProxyLatch : NSObject {
  NSCondition *lock;
  TiUIWindowProxy *window;
  id args;
  BOOL completed;
  BOOL timeout;
}
@end

@implementation TiUIWindowProxyLatch

- (id)initWithTiWindow:(id)window_ args:(id)args_
{
  if (self = [super init]) {
    window = [window_ retain];
    args = [args_ retain];
    lock = [[NSCondition alloc] init];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(lock);
  RELEASE_TO_NIL(window);
  RELEASE_TO_NIL(args);
  [super dealloc];
}

- (void)booted:(id)arg
{
  [lock lock];
  completed = YES;
  [lock signal];
  if (timeout) {
    [window boot:YES args:args];
  }
  [lock unlock];
}

- (BOOL)waitForBoot
{
  BOOL yn = NO;
  [lock lock];
  if (completed) {
    yn = YES;
  } else {
    if (![lock waitUntilDate:[NSDate dateWithTimeIntervalSinceNow:EXTERNAL_JS_WAIT_TIME]]) {
      timeout = YES;
    } else {
      yn = YES;
    }
  }
  [lock unlock];
  return yn;
}

@end

@implementation TiUIWindowProxy

- (void)_destroy
{
  if (!closing && opened) {
    TiThreadPerformOnMainThread(^{
      [self close:nil];
    },
        YES);
  }

  TiThreadPerformOnMainThread(^{
    [barImageView removeFromSuperview];
    RELEASE_TO_NIL(barImageView);
  },
      YES);

  if (context != nil) {
    [context shutdown:nil];
    RELEASE_TO_NIL(context);
  }
  RELEASE_TO_NIL(oldBaseURL);
  RELEASE_TO_NIL(latch);
  [super _destroy];
}

- (void)_configure
{
  [self replaceValue:nil forKey:@"barColor" notification:NO];
  [self replaceValue:nil forKey:@"navTintColor" notification:NO];
  [self replaceValue:nil forKey:@"barImage" notification:NO];
  [self replaceValue:nil forKey:@"translucent" notification:NO];
  [self replaceValue:nil forKey:@"titleAttributes" notification:NO];
  [self replaceValue:NUMBOOL(NO) forKey:@"tabBarHidden" notification:NO];
  [self replaceValue:NUMBOOL(NO) forKey:@"navBarHidden" notification:NO];
  [self replaceValue:NUMBOOL(NO) forKey:@"hidesBarsOnSwipe" notification:NO];
  [self replaceValue:NUMBOOL(NO) forKey:@"hidesBarsOnTap" notification:NO];
  [self replaceValue:NUMBOOL(NO) forKey:@"hidesBarsWhenKeyboardAppears" notification:NO];
  [self replaceValue:NUMBOOL(NO) forKey:@"hidesBackButton" notification:NO];
  [super _configure];
}

- (NSString *)apiName
{
  return @"Ti.UI.Window";
}

- (void)dealloc
{
  self.safeAreaViewProxy = nil;
  RELEASE_TO_NIL(barImageView);
  [super dealloc];
}

- (void)boot:(BOOL)timeout args:args
{
  RELEASE_TO_NIL(latch);
  if (timeout) {
    if (![context evaluationError]) {
      contextReady = YES;
      [self open:args];
    } else {
      DebugLog(@"Could not boot context. Context has evaluation error");
    }
  }
}

- (BOOL)optimizeSubviewInsertion
{
  return YES;
}

- (NSMutableDictionary *)langConversionTable
{
  return [NSMutableDictionary dictionaryWithObjectsAndKeys:@"title", @"titleid", @"titlePrompt", @"titlepromptid", nil];
}

#pragma mark - TiWindowProtocol overrides

- (UIViewController *)hostingController;
{
  if (controller == nil) {
    UIViewController *theController = [super hostingController];
    [theController setHidesBottomBarWhenPushed:[TiUtils boolValue:[self valueForUndefinedKey:@"tabBarHidden"] def:NO]];
    return theController;
  }
  return [super hostingController];
}

- (BOOL)_handleOpen:(id)args
{
  // this is a special case that calls open again above to cause the event lifecycle to
  // happen after the JS context is fully up and ready
  if (contextReady && context != nil) {
    return [super _handleOpen:args];
  }

  //
  // at this level, open is top-level since this is a window.  if you want
  // to open a window within a tab, you'll need to call tab.open(window)
  //

  NSURL *url = [TiUtils toURL:[self valueForKey:@"url"] proxy:self];

  if (url != nil) {
    DEPRECATED_REMOVED(@"UI.Window.url", @"2.0.0", @"6.0.0");
    DebugLog(@"[ERROR] Please use require() to manage your application components.");
    DebugLog(@"[ERROR] More infos: http://docs.appcelerator.com/platform/latest/#!/guide/CommonJS_Modules_in_Titanium");
  }

  return [super _handleOpen:args];
}

- (void)windowDidClose
{
  // Because other windows or proxies we have open and wish to continue functioning might be relying
  // on our created context, we CANNOT explicitly shut down here.  Instead we should memory-manage
  // contexts better so they stop when they're no longer in use.

  // Sadly, today is not that day. Without shutdown, we leak all over the place.
  if (context != nil) {
    NSMutableArray *childrenToRemove = [[NSMutableArray alloc] init];
    pthread_rwlock_rdlock(&childrenLock);
    for (TiViewProxy *child in children) {
      if ([child belongsToContext:context]) {
        [childrenToRemove addObject:child];
      }
    }
    pthread_rwlock_unlock(&childrenLock);
    [context performSelector:@selector(shutdown:) withObject:nil afterDelay:1.0];
    RELEASE_TO_NIL(context);

    for (TiViewProxy *child in childrenToRemove) {
      [self remove:child];
    }
    [childrenToRemove release];
  }
  [super windowDidClose];
}

- (BOOL)_handleClose:(id)args
{
  if (oldBaseURL != nil) {
    [self _setBaseURL:oldBaseURL];
  }
  RELEASE_TO_NIL(oldBaseURL);
  return [super _handleClose:args];
}

- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  [self performSelector:@selector(processForSafeArea)
             withObject:nil
             afterDelay:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];

  [super viewWillTransitionToSize:size
        withTransitionCoordinator:coordinator];
  [self willChangeSize];
}

- (void)systemLayoutFittingSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  [super systemLayoutFittingSizeDidChangeForChildContentContainer:container];
}

- (void)willTransitionToTraitCollection:(UITraitCollection *)newCollection withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
  [super willTransitionToTraitCollection:newCollection withTransitionCoordinator:coordinator];
}

- (void)preferredContentSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container
{
  [super preferredContentSizeDidChangeForChildContentContainer:container];
}

- (void)viewWillAppear:(BOOL)animated; // Called when the view is about to made visible. Default does nothing
{
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  // TO DO: Refactor navigation bar customisation iOS 13
  if ([TiUtils isIOSVersionOrGreater:@"13.0"]) {
    TiColor *newColor = [TiUtils colorValue:[self valueForKey:@"barColor"]];
    if (newColor == nil) {
      newColor = [TiUtils colorValue:[[self tabGroup] valueForKey:@"barColor"]];
    }
    if (controller != nil && !(controller.edgesForExtendedLayout == UIRectEdgeTop || controller.edgesForExtendedLayout == UIRectEdgeAll)) {
      UINavigationBarAppearance *appearance = controller.navigationController.navigationBar.standardAppearance;
      if ([TiUtils boolValue:[self valueForKey:@"largeTitleEnabled"] def:NO]) {
        [appearance configureWithTransparentBackground];
        if (newColor == nil) {
          appearance.backgroundColor = self.view.backgroundColor;
        } else {
          appearance.backgroundColor = newColor.color;
        }
      } else {
        [appearance configureWithDefaultBackground];
        if (newColor != nil) {
          appearance.backgroundColor = newColor.color;
        }
      }
      controller.navigationController.navigationBar.standardAppearance = appearance;
      controller.navigationController.navigationBar.scrollEdgeAppearance = appearance;
      controller.navigationController.navigationBar.backgroundColor = UIColor.clearColor;
    }
  }
#endif
  shouldUpdateNavBar = YES;
  [self setupWindowDecorations];
  [super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated; // Called when the view has been fully transitioned onto the screen. Default does nothing
{
  [self updateTitleView];
  [super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
  shouldUpdateNavBar = NO;
  [self cleanupWindowDecorations];
  [super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated; // Called after the view was dismissed, covered or otherwise hidden. Default does nothing
{
  [super viewDidDisappear:animated];
}

#pragma mark - UINavController, NavItem UI

- (void)setNavTintColor:(id)color
{
  __block TiColor *newColor = [TiUtils colorValue:color];

  [self replaceValue:newColor forKey:@"navTintColor" notification:NO];
  TiThreadPerformOnMainThread(^{
    if (controller != nil) {
      if (newColor == nil) {
        //Get from TabGroup
        newColor = [TiUtils colorValue:[[self tabGroup] valueForKey:@"navTintColor"]];
      }
      UINavigationBar *navBar = [[controller navigationController] navigationBar];
      [navBar setTintColor:[newColor color]];
      [self performSelector:@selector(refreshBackButton) withObject:nil afterDelay:0.0];
    }
  },
      NO);
}

- (void)setBarColor:(id)color
{
  ENSURE_UI_THREAD(setBarColor, color);

  TiColor *newColor = [TiUtils colorValue:color];
  [self replaceValue:newColor forKey:@"barColor" notification:NO];

  if (shouldUpdateNavBar && controller != nil && [controller navigationController] != nil) {
    if (newColor == nil) {
      newColor = [TiUtils colorValue:[[self tabGroup] valueForKey:@"barColor"]];
    }

    UIColor *barColor = [TiUtils barColorForColor:newColor];
    UIBarStyle navBarStyle = [TiUtils barStyleForColor:newColor];

    UINavigationBar *navBar = [[controller navigationController] navigationBar];
    [navBar setBarStyle:navBarStyle];
    [navBar setBarTintColor:barColor];
    [self refreshBackButton];
  }
}

- (void)setTitleAttributes:(id)args
{
  ENSURE_UI_THREAD(setTitleAttributes, args);
  ENSURE_SINGLE_ARG_OR_NIL(args, NSDictionary);
  [self replaceValue:args forKey:@"titleAttributes" notification:NO];

  if (args == nil) {
    args = [[self tabGroup] valueForUndefinedKey:@"titleAttributes"];
  }

  NSMutableDictionary *theAttributes = nil;
  if (args != nil) {
    theAttributes = [NSMutableDictionary dictionary];
    if ([args objectForKey:@"color"] != nil) {
      UIColor *theColor = [[TiUtils colorValue:@"color" properties:args] _color];
      if (theColor != nil) {
        [theAttributes setObject:theColor forKey:NSForegroundColorAttributeName];
      }
    }
    if ([args objectForKey:@"shadow"] != nil) {
      NSShadow *shadow = [TiUtils shadowValue:[args objectForKey:@"shadow"]];
      if (shadow != nil) {
        [theAttributes setObject:shadow forKey:NSShadowAttributeName];
      }
    }

    if ([args objectForKey:@"font"] != nil) {
      UIFont *theFont = [[TiUtils fontValue:[args objectForKey:@"font"] def:nil] font];
      if (theFont != nil) {
        [theAttributes setObject:theFont forKey:NSFontAttributeName];
      }
    }

    if ([theAttributes count] == 0) {
      theAttributes = nil;
    }
  }

  if (shouldUpdateNavBar && ([controller navigationController] != nil)) {
    UINavigationBar *navigationBar = controller.navigationController.navigationBar;
    if ([TiUtils isIOSVersionOrGreater:@"11.0"] && [TiUtils boolValue:[self valueForKey:@"largeTitleEnabled"] def:NO]) {
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
      if ([TiUtils isIOSVersionOrGreater:@"13.0"]) {
        navigationBar.standardAppearance.largeTitleTextAttributes = theAttributes;
        navigationBar.scrollEdgeAppearance.largeTitleTextAttributes = theAttributes;
      }
#endif
      navigationBar.largeTitleTextAttributes = theAttributes;
    }
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    if ([TiUtils isIOSVersionOrGreater:@"13.0"]) {
      navigationBar.standardAppearance.titleTextAttributes = theAttributes;
      navigationBar.scrollEdgeAppearance.titleTextAttributes = theAttributes;
    }
#endif
    navigationBar.titleTextAttributes = theAttributes;
  }
}

- (void)updateBarImage
{
  if (controller == nil || [controller navigationController] == nil || !shouldUpdateNavBar) {
    return;
  }

  id barImageValue = [self valueForUndefinedKey:@"barImage"];

  UINavigationBar *ourNB = [[controller navigationController] navigationBar];
  UIImage *theImage = nil;
  theImage = [TiUtils toImage:barImageValue proxy:self];

  if (theImage == nil) {
    [ourNB setBackgroundImage:nil forBarMetrics:UIBarMetricsDefault];
  } else {
    UIImage *resizableImage = [theImage resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0) resizingMode:UIImageResizingModeStretch];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
    if ([TiUtils isIOSVersionOrGreater:@"13.0"]) {
      ourNB.standardAppearance.backgroundImage = resizableImage;
      ourNB.scrollEdgeAppearance.backgroundImage = resizableImage;
    }
#endif

    [ourNB setBackgroundImage:resizableImage
                forBarMetrics:UIBarMetricsDefault];

    //You can only set up the shadow image with a custom background image.
    id shadowImageValue = [self valueForUndefinedKey:@"shadowImage"];
    theImage = [TiUtils toImage:shadowImageValue proxy:self];

    if (theImage != nil) {
      UIImage *resizableImage = [theImage resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0) resizingMode:UIImageResizingModeStretch];
      ourNB.shadowImage = resizableImage;
    } else {
      BOOL clipValue = [TiUtils boolValue:[self valueForUndefinedKey:@"hideShadow"] def:NO];
      if (clipValue) {
        //Set an empty Image.
        ourNB.shadowImage = [[[UIImage alloc] init] autorelease];
      } else {
        ourNB.shadowImage = nil;
      }
    }
  }
}

- (void)setBarImage:(id)value
{
  [self replaceValue:value forKey:@"barImage" notification:NO];
  if (controller != nil) {
    TiThreadPerformOnMainThread(^{
      [self updateBarImage];
    },
        NO);
  }
}

- (void)setShadowImage:(id)value
{
  [self replaceValue:value forKey:@"shadowImage" notification:NO];
  if (controller != nil) {
    TiThreadPerformOnMainThread(^{
      [self updateBarImage];
    },
        NO);
  }
}

- (void)setHideShadow:(id)value
{
  [self replaceValue:value forKey:@"hideShadow" notification:NO];
  if (controller != nil) {
    TiThreadPerformOnMainThread(^{
      [self updateBarImage];
    },
        NO);
  }
}

- (void)setTranslucent:(id)value
{
  ENSURE_UI_THREAD(setTranslucent, value);
  [self replaceValue:value forKey:@"translucent" notification:NO];
  if (controller != nil) {
    [controller navigationController].navigationBar.translucent = [TiUtils boolValue:value def:YES];
  }
}

- (void)updateNavButtons
{
  //Update LeftNavButton
  NSDictionary *lProperties = [self valueForUndefinedKey:@"leftNavSettings"];
  id leftNavButtons = [self valueForUndefinedKey:@"leftNavButtons"];
  if (!IS_NULL_OR_NIL(leftNavButtons)) {
    [self setLeftNavButtons:leftNavButtons withObject:lProperties];
  } else {
    leftNavButtons = [self valueForUndefinedKey:@"leftNavButton"];
    [self setLeftNavButton:leftNavButtons withObject:lProperties];
  }
  //Update RightNavButton
  NSDictionary *rProperties = [self valueForUndefinedKey:@"rightNavSettings"];
  id rightNavButtons = [self valueForUndefinedKey:@"rightNavButtons"];
  if (!IS_NULL_OR_NIL(rightNavButtons)) {
    [self setRightNavButtons:rightNavButtons withObject:rProperties];
  } else {
    rightNavButtons = [self valueForUndefinedKey:@"rightNavButton"];
    [self setRightNavButton:rightNavButtons withObject:rProperties];
  }
}

- (void)refreshRightNavButtons:(id)unused
{
  if (controller == nil || [controller navigationController] == nil) {
    return; // No need to refresh
  }
  NSArray *theObjects = [self valueForUndefinedKey:@"rightNavButtons"];
  NSDictionary *theProperties = [self valueForUndefinedKey:@"rightNavSettings"];

  ENSURE_TYPE_OR_NIL(theObjects, NSArray);
  ENSURE_TYPE_OR_NIL(theProperties, NSDictionary);

  NSMutableArray *theItems = [[NSMutableArray alloc] init];
  for (TiViewProxy *theProxy in theObjects) {
    if ([theProxy supportsNavBarPositioning]) {
      [theItems addObject:[theProxy barButtonItem]];
    } else {
      DebugLog(@"%@ does not support nav bar positioning", theProxy);
    }
  }

  BOOL animated = [TiUtils boolValue:@"animated" properties:theProperties def:NO];

  if ([theItems count] > 0) {
    [controller.navigationItem setRightBarButtonItems:theItems animated:animated];
  } else {
    [controller.navigationItem setRightBarButtonItems:nil animated:animated];
  }
  [theItems release];
}

- (void)setRightNavButtons:(id)arg withObject:(id)properties
{
  ENSURE_TYPE_OR_NIL(arg, NSArray);
  ENSURE_TYPE_OR_NIL(properties, NSDictionary);

  NSArray *curValues = [self valueForUndefinedKey:@"rightNavButtons"];
  ENSURE_TYPE_OR_NIL(curValues, NSArray);

  //Clean up current values
  for (TiViewProxy *curProxy in curValues) {
    if (![(NSArray *)arg containsObject:curProxy]) {
      [curProxy removeBarButtonView];
      [self forgetProxy:curProxy];
    }
  }
  for (TiViewProxy *proxy in arg) {
    if ([proxy isKindOfClass:[TiViewProxy class]]) {
      [self rememberProxy:proxy];
    }
  }

  [self replaceValue:arg forKey:@"rightNavButtons" notification:NO];
  [self replaceValue:properties forKey:@"rightNavSettings" notification:NO];
  TiThreadPerformOnMainThread(^{
    [self refreshRightNavButtons:nil];
  },
      NO);
}

- (void)setRightNavButton:(id)proxy withObject:(id)properties
{
  [self replaceValue:proxy forKey:@"rightNavButton" notification:NO];
  if (IS_NULL_OR_NIL(proxy)) {
    [self setRightNavButtons:nil withObject:properties];
  } else {
    [self setRightNavButtons:[NSArray arrayWithObject:proxy] withObject:properties];
  }
}

- (void)refreshLeftNavButtons:(id)unused
{
  if (controller == nil || [controller navigationController] == nil) {
    return; // No need to refresh
  }
  NSArray *theObjects = [self valueForUndefinedKey:@"leftNavButtons"];
  NSDictionary *theProperties = [self valueForUndefinedKey:@"leftNavSettings"];

  ENSURE_TYPE_OR_NIL(theObjects, NSArray);
  ENSURE_TYPE_OR_NIL(theProperties, NSDictionary);

  NSMutableArray *theItems = [[NSMutableArray alloc] init];
  for (TiViewProxy *theProxy in theObjects) {
    if ([theProxy supportsNavBarPositioning]) {
      [theItems addObject:[theProxy barButtonItem]];
    } else {
      DebugLog(@"%@ does not support nav bar positioning", theProxy);
    }
  }

  BOOL animated = [TiUtils boolValue:@"animated" properties:theProperties def:NO];

  if ([theItems count] > 0) {
    [controller.navigationItem setLeftBarButtonItems:theItems animated:animated];
  } else {
    [controller.navigationItem setLeftBarButtonItems:nil animated:animated];
  }
  [theItems release];
}

- (void)setLeftNavButtons:(id)arg withObject:(id)properties
{
  ENSURE_TYPE_OR_NIL(arg, NSArray);
  ENSURE_TYPE_OR_NIL(properties, NSDictionary);

  NSArray *curValues = [self valueForUndefinedKey:@"leftNavButtons"];
  ENSURE_TYPE_OR_NIL(curValues, NSArray);

  //Clean up current values
  for (TiViewProxy *curProxy in curValues) {
    if (![(NSArray *)arg containsObject:curProxy]) {
      [curProxy removeBarButtonView];
      [self forgetProxy:curProxy];
    }
  }
  for (TiViewProxy *proxy in arg) {
    if ([proxy isKindOfClass:[TiViewProxy class]]) {
      [self rememberProxy:proxy];
    }
  }
  [self replaceValue:arg forKey:@"leftNavButtons" notification:NO];
  [self replaceValue:properties forKey:@"leftNavSettings" notification:NO];
  TiThreadPerformOnMainThread(^{
    [self refreshLeftNavButtons:nil];
  },
      NO);
}

- (void)setLeftNavButton:(id)proxy withObject:(id)properties
{
  [self replaceValue:proxy forKey:@"leftNavButton" notification:NO];
  if (IS_NULL_OR_NIL(proxy)) {
    [self setLeftNavButtons:nil withObject:properties];
  } else {
    [self setLeftNavButtons:[NSArray arrayWithObject:proxy] withObject:properties];
  }
}

- (void)setTabBarHidden:(id)value
{
  [self replaceValue:value forKey:@"tabBarHidden" notification:NO];
  TiThreadPerformOnMainThread(^{
    if (controller != nil) {
      [controller setHidesBottomBarWhenPushed:[TiUtils boolValue:value]];
      [self processForSafeArea];
    }
  },
      NO);
}

- (void)hideTabBar:(id)value
{
  [self setTabBarHidden:[NSNumber numberWithBool:YES]];
}

- (void)showTabBar:(id)value
{
  [self setTabBarHidden:[NSNumber numberWithBool:NO]];
}

- (void)refreshBackButton
{
  ENSURE_UI_THREAD_0_ARGS;

  if (controller == nil || [controller navigationController] == nil) {
    return; // No need to refresh
  }

  NSArray *controllerArray = [[controller navigationController] viewControllers];
  NSUInteger controllerPosition = [controllerArray indexOfObject:controller];
  if ((controllerPosition == 0) || (controllerPosition == NSNotFound)) {
    return;
  }

  UIViewController *prevController = [controllerArray objectAtIndex:controllerPosition - 1];
  UIBarButtonItem *backButton = nil;

  UIImage *backImage = [TiUtils image:[self valueForKey:@"backButtonTitleImage"] proxy:self];
  if (backImage != nil) {
    backButton = [[UIBarButtonItem alloc] initWithImage:backImage style:UIBarButtonItemStylePlain target:nil action:nil];
  } else {
    NSString *backTitle = [TiUtils stringValue:[self valueForKey:@"backButtonTitle"]];
    if ((backTitle == nil) && [prevController isKindOfClass:[TiViewController class]]) {
      id tc = [(TiViewController *)prevController proxy];
      backTitle = [TiUtils stringValue:[tc valueForKey:@"title"]];
    }
    if (backTitle != nil) {
      backButton = [[UIBarButtonItem alloc] initWithTitle:backTitle style:UIBarButtonItemStylePlain target:nil action:nil];
    }
  }
  [[prevController navigationItem] setBackBarButtonItem:backButton];
  [backButton release];
}

- (void)setBackButtonTitle:(id)proxy
{
  ENSURE_UI_THREAD_1_ARG(proxy);
  [self replaceValue:proxy forKey:@"backButtonTitle" notification:NO];
  if (controller != nil) {
    [self refreshBackButton]; //Because this is actually a property of a DIFFERENT view controller,
    //we can't attach this until we're in the navbar stack.
  }
}

- (void)setBackButtonTitleImage:(id)proxy
{
  ENSURE_UI_THREAD_1_ARG(proxy);
  [self replaceValue:proxy forKey:@"backButtonTitleImage" notification:NO];
  if (controller != nil) {
    [self refreshBackButton]; //Because this is actually a property of a DIFFERENT view controller,
    //we can't attach this until we're in the navbar stack.
  }
}

- (void)updateNavBar
{
  //Called from the view when the screen rotates.
  //Resize titleControl and barImage based on navbar bounds
  if (!shouldUpdateNavBar || controller == nil || [controller navigationController] == nil) {
    return; // No need to update the title if not in a nav controller
  }
  TiThreadPerformOnMainThread(^{
    if ([[self valueForKey:@"titleControl"] isKindOfClass:[TiViewProxy class]]) {
      [self updateTitleView];
    }
  },
      NO);
}

- (void)updateTitleView
{
  UIView *newTitleView = nil;

  if (!shouldUpdateNavBar || controller == nil || [controller navigationController] == nil) {
    return; // No need to update the title if not in a nav controller
  }

  UINavigationItem *ourNavItem = [controller navigationItem];
  UINavigationBar *ourNB = [[controller navigationController] navigationBar];
  CGRect barFrame = [ourNB bounds];
  CGSize availableTitleSize = CGSizeZero;
  availableTitleSize.width = barFrame.size.width - (2 * TI_NAVBAR_BUTTON_WIDTH);
  availableTitleSize.height = barFrame.size.height;

  //Check for titlePrompt. Ugly hack. Assuming 50% for prompt height.
  if (ourNavItem.prompt != nil) {
    availableTitleSize.height /= 2.0f;
    barFrame.origin.y = barFrame.size.height = availableTitleSize.height;
  }

  TiViewProxy *titleControl = [self valueForKey:@"titleControl"];

  UIView *oldView = [ourNavItem titleView];
  if ([oldView isKindOfClass:[TiUIView class]]) {
    TiViewProxy *oldProxy = (TiViewProxy *)[(TiUIView *)oldView proxy];
    if (oldProxy == titleControl) {
      //relayout titleControl
      CGRect barBounds;
      barBounds.origin = CGPointZero;
#ifndef TI_USE_AUTOLAYOUT
      barBounds.size = SizeConstraintViewWithSizeAddingResizing(titleControl.layoutProperties, titleControl, availableTitleSize, NULL);
#endif
      [oldView setBounds:barBounds];
      [oldView setAutoresizingMask:UIViewAutoresizingNone];

      //layout the titleControl children
      [titleControl layoutChildren:NO];

      return;
    }
    [oldProxy removeBarButtonView];
  }

  if ([titleControl isKindOfClass:[TiViewProxy class]]) {
    newTitleView = [titleControl barButtonViewForSize:availableTitleSize];
  } else {
    NSURL *path = [TiUtils toURL:[self valueForKey:@"titleImage"] proxy:self];
    //Todo: This should be [TiUtils navBarTitleViewSize] with the thumbnail scaling. For now, however, we'll go with auto.
    UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:path withSize:CGSizeZero];
    if (image != nil) {
      if ([oldView isKindOfClass:[UIImageView class]]) {
        [(UIImageView *)oldView setImage:image];
        newTitleView = oldView;
      } else {
        newTitleView = [[[UIImageView alloc] initWithImage:image] autorelease];
      }
    }
  }

  if (oldView != newTitleView) {
    [ourNavItem setTitleView:newTitleView];
  }
}

- (void)setTitleControl:(id)proxy
{
  ENSURE_UI_THREAD(setTitleControl, proxy);
  [self replaceValue:proxy forKey:@"titleControl" notification:NO];
  if (controller != nil) {
    [self updateTitleView];
  }
}

- (void)setTitleImage:(id)image
{
  ENSURE_UI_THREAD(setTitleImage, image);
  NSURL *path = [TiUtils toURL:image proxy:self];
  [self replaceValue:[path absoluteString] forKey:@"titleImage" notification:NO];
  if (controller != nil) {
    [self updateTitleView];
  }
}

- (void)setTitle:(NSString *)title_
{
  NSString *title = [TiUtils stringValue:title_];
  [self replaceValue:title forKey:@"title" notification:NO];
  TiThreadPerformOnMainThread(^{
    if (shouldUpdateNavBar && controller != nil && [controller navigationController] != nil) {
      controller.navigationItem.title = title;
    }
  },
      [NSThread isMainThread]);
}

- (void)setLargeTitleEnabled:(id)value
{
  ENSURE_UI_THREAD(setLargeTitleEnabled, value);
  ENSURE_TYPE_OR_NIL(value, NSNumber);

  [self replaceValue:value forKey:@"largeTitleEnabled" notification:NO];

  if ([TiUtils isIOSVersionOrGreater:@"11.0"] && shouldUpdateNavBar && controller != nil && [controller navigationController] != nil) {
    [[[controller navigationController] navigationBar] setPrefersLargeTitles:[TiUtils boolValue:value def:NO]];
  }
}

- (void)setLargeTitleDisplayMode:(id)value
{
  ENSURE_UI_THREAD(setLargeTitleDisplayMode, value);
  ENSURE_TYPE_OR_NIL(value, NSNumber);

  [self replaceValue:value forKey:@"largeTitleDisplayMode" notification:NO];

  if ([TiUtils isIOSVersionOrGreater:@"11.0"] && shouldUpdateNavBar && controller != nil && [controller navigationController] != nil) {
    [[controller navigationItem] setLargeTitleDisplayMode:[TiUtils intValue:value def:UINavigationItemLargeTitleDisplayModeAutomatic]];
  }
}

- (void)setHidesSearchBarWhenScrolling:(id)value
{
  ENSURE_UI_THREAD(setHidesSearchBarWhenScrolling, value);
  ENSURE_TYPE_OR_NIL(value, NSNumber);

  [self replaceValue:value forKey:@"hidesSearchBarWhenScrolling" notification:NO];

  if ([TiUtils isIOSVersionOrGreater:@"11.0"] && shouldUpdateNavBar && controller != nil && [controller navigationController] != nil) {
    [controller navigationItem].hidesSearchBarWhenScrolling = [TiUtils intValue:value def:YES];
  }
}
- (void)setTitlePrompt:(NSString *)title_
{
  ENSURE_UI_THREAD(setTitlePrompt, title_);
  NSString *title = [TiUtils stringValue:title_];
  [self replaceValue:title forKey:@"titlePrompt" notification:NO];
  if (controller != nil && [controller navigationController] != nil) {
    controller.navigationItem.prompt = title;
  }
}

- (void)setToolbar:(id)items withObject:(id)properties
{
  ENSURE_TYPE_OR_NIL(items, NSArray);
  if (properties == nil) {
    properties = [self valueForKey:@"toolbarSettings"];
  } else {
    [self setValue:properties forKey:@"toolbarSettings"];
  }
  NSArray *oldarray = [self valueForUndefinedKey:@"toolbar"];
  if ((id)oldarray == [NSNull null]) {
    oldarray = nil;
  }
  for (TiViewProxy *oldProxy in oldarray) {
    if (![items containsObject:oldProxy]) {
      [self forgetProxy:oldProxy];
    }
  }
  for (TiViewProxy *proxy in items) {
    [self rememberProxy:proxy];
  }
  [self replaceValue:items forKey:@"toolbar" notification:NO];
  TiThreadPerformOnMainThread(^{
    if (shouldUpdateNavBar && controller != nil && [controller navigationController] != nil) {
      NSArray *existing = [controller toolbarItems];
      UINavigationController *ourNC = [controller navigationController];
      if (existing != nil) {
        for (id current in existing) {
          if ([current respondsToSelector:@selector(proxy)]) {
            TiViewProxy *p = (TiViewProxy *)[current performSelector:@selector(proxy)];
            [p removeBarButtonView];
          }
        }
      }
      NSMutableArray *array = [[NSMutableArray alloc] initWithArray:@[]];
      for (TiViewProxy *proxy in items) {
        if ([proxy supportsNavBarPositioning]) {
          UIBarButtonItem *item = [proxy barButtonItem];
          [array addObject:item];
        }
      }
      hasToolbar = array != nil && [array count] > 0;
      BOOL translucent = [TiUtils boolValue:@"translucent" properties:properties def:YES];
      BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:hasToolbar];
      TiColor *toolbarColor = [TiUtils colorValue:@"barColor" properties:properties];
      UIColor *barColor = [TiUtils barColorForColor:toolbarColor];
      [controller setToolbarItems:array animated:animated];
      [ourNC setToolbarHidden:!hasToolbar animated:animated];
      [ourNC.toolbar setTranslucent:translucent];
      UIColor *tintColor = [[TiUtils colorValue:@"tintColor" properties:properties] color];
      [ourNC.toolbar setBarTintColor:barColor];
      [ourNC.toolbar setTintColor:tintColor];

      [array release];
    }
  },
      YES);
}

#define SETPROP(m, x)                                   \
  {                                                     \
    id value = [self valueForKey:m];                    \
    if (value != nil) {                                 \
      [self x:(value == [NSNull null]) ? nil : value];  \
    } else {                                            \
      [self replaceValue:nil forKey:m notification:NO]; \
    }                                                   \
  }

#define SETPROPOBJ(m, x)                                                                \
  {                                                                                     \
    id value = [self valueForKey:m];                                                    \
    if (value != nil) {                                                                 \
      if ([value isKindOfClass:[TiComplexValue class]]) {                               \
        TiComplexValue *cv = (TiComplexValue *)value;                                   \
        [self x:(cv.value == [NSNull null]) ? nil : cv.value withObject:cv.properties]; \
      } else {                                                                          \
        [self x:(value == [NSNull null]) ? nil : value withObject:nil];                 \
      }                                                                                 \
    } else {                                                                            \
      [self replaceValue:nil forKey:m notification:NO];                                 \
    }                                                                                   \
  }

- (void)setupWindowDecorations
{
  if ((controller == nil) || ([controller navigationController] == nil)) {
    return;
  }

  //Need to clear title for titleAttributes to apply correctly on iOS6.
  [[controller navigationItem] setTitle:nil];
  SETPROP(@"titleAttributes", setTitleAttributes);
  SETPROP(@"title", setTitle);
  SETPROP(@"titlePrompt", setTitlePrompt);
  SETPROP(@"largeTitleEnabled", setLargeTitleEnabled);
  SETPROP(@"largeTitleDisplayMode", setLargeTitleDisplayMode);
  SETPROP(@"hidesSearchBarWhenScrolling", setHidesSearchBarWhenScrolling);

  [self updateTitleView];
  SETPROP(@"barColor", setBarColor);
  SETPROP(@"navTintColor", setNavTintColor);
  SETPROP(@"translucent", setTranslucent);
  SETPROP(@"tabBarHidden", setTabBarHidden);
  SETPROPOBJ(@"toolbar", setToolbar);
  [[controller navigationController] setToolbarHidden:!hasToolbar animated:YES];
  [self updateBarImage];
  [self updateNavButtons];
  [self refreshBackButton];
}

- (void)cleanupWindowDecorations
{
  if ((controller == nil) || ([controller navigationController] == nil)) {
    return;
  }
  NSArray *curValues = [self valueForUndefinedKey:@"leftNavButtons"];
  ENSURE_TYPE_OR_NIL(curValues, NSArray);
  for (TiViewProxy *curProxy in curValues) {
    [curProxy removeBarButtonView];
  }

  NSArray *curValues2 = [self valueForUndefinedKey:@"rightNavButtons"];
  ENSURE_TYPE_OR_NIL(curValues2, NSArray);
  for (TiViewProxy *curProxy in curValues2) {
    [curProxy removeBarButtonView];
  }

  if (barImageView != nil) {
    [barImageView removeFromSuperview];
  }
}

- (TiViewProxy *)safeAreaView
{
  return self.safeAreaViewProxy;
}

- (void)processForSafeArea
{
  [self setValue:@{ @"top" : NUMFLOAT(0.0),
    @"left" : NUMFLOAT(0.0),
    @"bottom" : NUMFLOAT(0.0),
    @"right" : NUMFLOAT(0.0) }
          forKey:@"safeAreaPadding"];

  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {
    if (self.shouldExtendSafeArea && !hidesStatusBar) {
      [self setValue:@{ @"top" : NUMFLOAT(20.0),
        @"left" : NUMFLOAT(0.0),
        @"bottom" : NUMFLOAT(0.0),
        @"right" : NUMFLOAT(0.0) }
              forKey:@"safeAreaPadding"];
    }

    return;
  }

  UIEdgeInsets edgeInsets = UIEdgeInsetsZero;
  UIViewController<TiControllerContainment> *topContainerController = [[[TiApp app] controller] topContainerController];
  UIEdgeInsets safeAreaInset = [[topContainerController hostingView] safeAreaInsets];

  if (self.tabGroup) {
    edgeInsets = [self tabGroupEdgeInsetsForSafeAreaInset:safeAreaInset];
  } else if (self.tab) {
    edgeInsets = [self navigationGroupEdgeInsetsForSafeAreaInset:safeAreaInset];
  } else {
    edgeInsets = [self defaultEdgeInsetsForSafeAreaInset:safeAreaInset];
  }

  if (self.shouldExtendSafeArea) {
    [self setValue:@{ @"top" : NUMFLOAT(edgeInsets.top),
      @"left" : NUMFLOAT(edgeInsets.left),
      @"bottom" : NUMFLOAT(edgeInsets.bottom),
      @"right" : NUMFLOAT(edgeInsets.right) }
            forKey:@"safeAreaPadding"];

    if (!UIEdgeInsetsEqualToEdgeInsets(edgeInsets, oldSafeAreaInsets)) {
      self.safeAreaInsetsUpdated = YES;
    }
    oldSafeAreaInsets = edgeInsets;
    return;
  }

  TiViewProxy *safeAreaProxy = [self safeAreaViewProxy];
  CGFloat oldTop = [[safeAreaProxy valueForKey:@"top"] floatValue];
  CGFloat oldLeft = [[safeAreaProxy valueForKey:@"left"] floatValue];
  CGFloat oldRight = [[safeAreaProxy valueForKey:@"right"] floatValue];
  CGFloat oldBottom = [[safeAreaProxy valueForKey:@"bottom"] floatValue];

  if (oldTop != edgeInsets.top) {
    [safeAreaProxy setTop:NUMFLOAT(edgeInsets.top)];
  }
  if (oldBottom != edgeInsets.bottom) {
    [safeAreaProxy setBottom:NUMFLOAT(edgeInsets.bottom)];
  }
  if (oldLeft != edgeInsets.left) {
    [safeAreaProxy setLeft:NUMFLOAT(edgeInsets.left)];
  }
  if (oldRight != edgeInsets.right) {
    [safeAreaProxy setRight:NUMFLOAT(edgeInsets.right)];
  }
}

- (UIEdgeInsets)tabGroupEdgeInsetsForSafeAreaInset:(UIEdgeInsets)safeAreaInset
{
  UIEdgeInsets edgeInsets = UIEdgeInsetsZero;
  TiWindowProxy *windowProxy = nil;
  if ([self.tabGroup isKindOfClass:[TiWindowProxy class]]) {
    windowProxy = (TiWindowProxy *)self.tabGroup;
  }
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  if (!UIInterfaceOrientationIsPortrait(orientation)) {
    if (windowProxy.isMasterWindow) {
      edgeInsets.left = safeAreaInset.left;
    } else if (windowProxy.isDetailWindow) {
      edgeInsets.right = safeAreaInset.right;
    } else {
      edgeInsets.left = safeAreaInset.left;
      edgeInsets.right = safeAreaInset.right;
    }
  }
  if ([TiUtils boolValue:[self valueForUndefinedKey:@"navBarHidden"] def:NO]) {
    edgeInsets.top = safeAreaInset.top;
  }
  if ([TiUtils boolValue:[self valueForUndefinedKey:@"tabBarHidden"] def:NO]) {
    edgeInsets.bottom = safeAreaInset.bottom;
  }
  return edgeInsets;
}

- (UIEdgeInsets)navigationGroupEdgeInsetsForSafeAreaInset:(UIEdgeInsets)safeAreaInset
{
  UIEdgeInsets edgeInsets = UIEdgeInsetsZero;
  TiWindowProxy *windowProxy = nil;
  if ([self.tab isKindOfClass:[TiWindowProxy class]]) {
    windowProxy = (TiWindowProxy *)self.tab;
  }
  UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
  if (!UIInterfaceOrientationIsPortrait(orientation)) {
    if (windowProxy.isMasterWindow) {
      edgeInsets.left = safeAreaInset.left;
    } else if (windowProxy.isDetailWindow) {
      edgeInsets.right = safeAreaInset.right;
    } else {
      edgeInsets.left = safeAreaInset.left;
      edgeInsets.right = safeAreaInset.right;
    }
  }
  if ([TiUtils boolValue:[self valueForUndefinedKey:@"navBarHidden"] def:NO]) {
    edgeInsets.top = safeAreaInset.top;
  }
  edgeInsets.bottom = safeAreaInset.bottom;
  return edgeInsets;
}

- (UIEdgeInsets)defaultEdgeInsetsForSafeAreaInset:(UIEdgeInsets)safeAreaInset
{
  UIEdgeInsets edgeInsets = UIEdgeInsetsZero;
  if (self.isMasterWindow) {
    edgeInsets.left = safeAreaInset.left;
  } else if (self.isDetailWindow) {
    edgeInsets.right = safeAreaInset.right;
  } else {
    edgeInsets.left = safeAreaInset.left;
    edgeInsets.right = safeAreaInset.right;
  }
  edgeInsets.bottom = safeAreaInset.bottom;
  edgeInsets.top = safeAreaInset.top;
  return edgeInsets;
}

@end
