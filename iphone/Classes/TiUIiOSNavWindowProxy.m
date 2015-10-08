/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSNAVIGATIONWINDOW

#import "TiUIiOSNavWindowProxy.h"
#import "TiUIiOSNavWindow.h"
#import "TiApp.h"


@implementation TiUIiOSNavWindowProxy

-(void)_destroy
{
    RELEASE_TO_NIL(rootWindow);
    RELEASE_TO_NIL(navController);
    RELEASE_TO_NIL(current);
    [super _destroy];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    [super _initWithProperties:properties];
}

-(NSString*)apiName
{
    return @"Ti.UI.iOS.NavigationWindow";
}


-(void)popGestureStateHandler:(UIGestureRecognizer *)recognizer
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

-(TiOrientationFlags) orientationFlags
{
    if ([self isModal]) {
        return [super orientationFlags];
    } else {
        for (id thisController in [[navController viewControllers] reverseObjectEnumerator])
        {
            if (![thisController isKindOfClass:[TiLayoutViewController class]])
            {
                continue;
            }
            TiWindowProxy * thisProxy = (TiWindowProxy *)[(TiLayoutViewController *)thisController viewProxy];
            if ([thisProxy conformsToProtocol:@protocol(TiOrientationController)])
            {
                TiOrientationFlags result = [thisProxy orientationFlags];
                if (result != TiOrientationNone)
                {
                    return result;
                }
            }
        }
        return _supportedOrientations;
    }
}

#pragma mark - TiTab Protocol

-(id)tabGroup
{
    return nil;
}

-(TiLayoutViewController*)hostingController
{
    if (controller == nil) {
        controller = [[TiLayoutViewController alloc] initWithViewProxy:self];
        navController = [self controller];
        [navController willMoveToParentViewController:controller];
        [controller addChildViewController:navController];
        
        UIView* controllerView = [controller view];
        if ([controllerView isKindOfClass:[TiLayoutView class]]) {
            [(TiLayoutView*)controllerView setInnerView:[navController view]];
        }
        [controllerView addSubview:[navController view]];
        [controllerView bringSubviewToFront:[navController view]];
        [navController didMoveToParentViewController:controller];
        

    }
    return controller;
}

-(TiUIView*)view
{
    return [super view];
}

-(UINavigationController*)controller
{
    if (navController == nil) {
        navController = [[UINavigationController alloc] initWithRootViewController:[self rootController]];
        navController.delegate = self;
        [TiUtils configureController:navController withObject:self];
        [navController.interactivePopGestureRecognizer addTarget:self action:@selector(popGestureStateHandler:)];
    }
    return navController;
}

-(void)openWindow:(NSArray*)args
{
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
    
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
	}, YES);
}

-(void)closeWindow:(NSArray*)args
{
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
    if (window == rootWindow) {
        DebugLog(@"[ERROR] Can not close root window of the navWindow. Close this window instead");
        return;
    }
    TiThreadPerformOnMainThread(^{
        [self popOnUIThread:args];
    }, YES);
}

-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated
{
    //NO OP NOW
}


#pragma mark - UINavigationControllerDelegate

#ifdef USE_TI_UIIOSTRANSITIONANIMATION
- (id <UIViewControllerAnimatedTransitioning>)navigationController:(UINavigationController *)navigationController
                                   animationControllerForOperation:(UINavigationControllerOperation)operation
                                                fromViewController:(UIViewController *)fromVC
                                                  toViewController:(UIViewController *)toVC
{
    if([toVC isKindOfClass:[TiLayoutViewController class]]) {
        TiLayoutViewController* toViewController = (TiLayoutViewController*)toVC;
        if([[toViewController proxy] isKindOfClass:[TiWindowProxy class]]) {
            TiWindowProxy *windowProxy = (TiWindowProxy*)[toViewController proxy];
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
    if (current != nil) {
        TiLayoutViewController *curController = [current hostingController];
        NSArray* curStack = [navController viewControllers];
        BOOL winclosing = NO;
        if (![curStack containsObject:curController]) {
            winclosing = YES;
        } else {
            NSUInteger curIndex = [curStack indexOfObject:curController];
            if (curIndex > 1) {
                UIViewController* currentPopsTo = [curStack objectAtIndex:(curIndex - 1)];
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
    TiWindowProxy* theWindow = (TiWindowProxy*)[(TiLayoutViewController*)viewController viewProxy];
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
        TiLayoutViewController* oldController = [current hostingController];
        
        if (![[navController viewControllers] containsObject:oldController]) {
            [current setTab:nil];
            [current setParentOrientationController:nil];
            [current close:nil];
        }
    }
    RELEASE_TO_NIL(current);
    TiWindowProxy* theWindow = (TiWindowProxy*)[(TiLayoutViewController*)viewController viewProxy];
    current = [theWindow retain];
    [self childOrientationControllerChangedFlags:current];
    if (focussed) {
        [current gainFocus];
    }
}

#pragma mark - Private API

/*
-(void)setFrame:(CGRect)bounds
{
    if (navController != nil) {
        [[navController view] setFrame:bounds];
    }
}
*/

-(TiLayoutViewController *)rootController
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

-(void)pushOnUIThread:(NSArray*)args
{
	if (transitionIsAnimating || transitionWithGesture)
	{
		[self performSelector:_cmd withObject:args afterDelay:0.1];
		return;
	}
	TiWindowProxy *window = [args objectAtIndex:0];
	BOOL animated = args!=nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
    
    [navController pushViewController:[window hostingController] animated:animated];
}

-(void)popOnUIThread:(NSArray*)args
{
	if (transitionIsAnimating || transitionWithGesture)
	{
		[self performSelector:_cmd withObject:args afterDelay:0.1];
		return;
	}
	TiWindowProxy *window = [args objectAtIndex:0];
    
    if (window == current) {
        BOOL animated = args!=nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
        [navController popViewControllerAnimated:animated];
    }
    else {
        [self closeWindow:window animated:NO];
    }
    
}

- (void)closeWindow:(TiWindowProxy*)window animated:(BOOL)animated
{
    [window retain];
    TiLayoutViewController *windowController = [[window hostingController] retain];
    
	// Manage the navigation controller stack
	NSMutableArray* newControllerStack = [NSMutableArray arrayWithArray:[navController viewControllers]];
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

-(void) cleanNavStack
{
    TiThreadPerformOnMainThread(^{
        if (navController != nil) {
            [navController setDelegate:nil];
            NSArray* currentControllers = [navController viewControllers];
            [navController setViewControllers:[NSArray array]];
            
            for (UIViewController* viewController in currentControllers) {
                TiWindowProxy* win = (TiWindowProxy *)[(TiLayoutViewController*)viewController viewProxy];
                [win setTab:nil];
                [win setParentOrientationController:nil];
                [win close:nil];
            }
            [navController.view removeFromSuperview];
            RELEASE_TO_NIL(navController);
            RELEASE_TO_NIL(rootWindow);
            RELEASE_TO_NIL(current);
        }
    },YES);
}


#pragma mark - TiWindowProtocol

-(BOOL) hidesStatusBar
{
    UIViewController* topVC = [navController topViewController];
    if ([topVC isKindOfClass:[TiLayoutViewController class]]) {
        TiViewProxy* theProxy = [(TiLayoutViewController*)topVC viewProxy];
        if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
            return [(id<TiWindowProtocol>)theProxy hidesStatusBar];
        }
    }
    return [super hidesStatusBar];
}

-(UIStatusBarStyle)preferredStatusBarStyle;
{
    UIViewController* topVC = [navController topViewController];
    if ([topVC isKindOfClass:[TiLayoutViewController class]]) {
        TiViewProxy* theProxy = [(TiLayoutViewController*)topVC viewProxy];
        if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
            return [(id<TiWindowProtocol>)theProxy preferredStatusBarStyle];
        }
    }
    return [super preferredStatusBarStyle];
}

-(void)gainFocus
{
    UIViewController* topVC = [navController topViewController];
    if ([topVC isKindOfClass:[TiLayoutViewController class]]) {
        TiViewProxy* theProxy = [(TiLayoutViewController*)topVC viewProxy];
        if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
            [(id<TiWindowProtocol>)theProxy gainFocus];
        }
    }
    [super gainFocus];
}

-(void)resignFocus
{
    UIViewController* topVC = [navController topViewController];
    if ([topVC isKindOfClass:[TiLayoutViewController class]]) {
        TiViewProxy* theProxy = [(TiLayoutViewController*)topVC viewProxy];
        if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
            [(id<TiWindowProtocol>)theProxy resignFocus];
        }
    }
    [super resignFocus];
}

-(void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    if ([self viewAttached]) {
        [navController willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    if ([self viewAttached]) {
        [navController willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    if ([self viewAttached]) {
        [navController didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    }
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
}

#pragma mark - TiViewProxy overrides
-(TiUIView*)newView
{
	CGRect frame = [self appFrame];
	TiUIiOSNavWindow * win = [[TiUIiOSNavWindow alloc] initWithFrame:frame];
	return win;
}

-(void)windowWillOpen
{
    return [super windowWillOpen];
}


-(void) windowDidClose
{
    [self cleanNavStack];
    [super windowDidClose];
}

@end

#endif