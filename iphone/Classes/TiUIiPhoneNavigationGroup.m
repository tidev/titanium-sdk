/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONENAVIGATIONGROUP

#import "TiUIiPhoneNavigationGroup.h"
#import "TiUtils.h"
#import "TiWindowProxy.h"
#import "TiUIiPhoneNavigationGroupProxy.h"

@implementation TiUIiPhoneNavigationGroup

-(void)setVisibleProxy:(TiWindowProxy *) newVisibleProxy
{
	if (newVisibleProxy == visibleProxy)
	{
		return;
	}
    // NOTE: We don't need to blur the currently visible proxy, because it gets closed out by the close: call.
	TiWindowProxy * oldProxy = visibleProxy;
	visibleProxy = [newVisibleProxy retain];
	[visibleProxy gainFocus];
	[oldProxy release];
}

-(void)dealloc
{
	RELEASE_TO_NIL(controller);
    RELEASE_TO_NIL(root);
	[self setVisibleProxy:nil];
	//This is done this way so that proper methods are called as well.
	[super dealloc];
}

-(UINavigationController*)controller
{
    if (controller==nil) {
        TiWindowProxy* windowProxy = [self.proxy valueForKey:@"window"];
        ENSURE_TYPE(windowProxy, TiWindowProxy);
        [windowProxy setIsManaged:YES];
        [windowProxy setTab:(TiViewProxy<TiTab> *)self.proxy];
        [windowProxy setParentOrientationController:(id <TiOrientationController>)self.proxy];
        root = [windowProxy retain];
        [windowProxy open:nil];
        UIViewController *rootController = [windowProxy hostingController];
        controller = [[UINavigationController alloc] initWithRootViewController:rootController];
        [controller setDelegate:self];
        [TiUtils configureController:controller withObject:nil];
        [self addSubview:controller.view];
		
    }
    return controller;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (controller!=nil)
	{
		[controller.view setFrame:bounds];
	}
    [super frameSizeChanged:frame bounds:bounds];
}

#pragma mark Public APIs

-(void)setWindow_:(id)window
{
	[self controller];
}

-(void)close
{
    [self retain];
    if (controller!=nil) {
        [controller setDelegate:nil];
        NSArray* currentControllers = [controller viewControllers];
        [controller setViewControllers:[NSArray array]];
        
        for (UIViewController* viewController in currentControllers) {
            TiWindowProxy* win = (TiWindowProxy *)[(TiViewController*)viewController proxy];
            [win setTab:nil];
            [win setParentOrientationController:nil];
            [win close:nil];
        }
        [controller.view removeFromSuperview];
        [controller resignFirstResponder];
        RELEASE_TO_NIL(controller);
        RELEASE_TO_NIL_AUTORELEASE(visibleProxy);
    }
    [self release];
}

-(void)pushOnUIThread:(NSArray*)args
{
    if (transitionIsAnimating)
    {
        [self performSelector:_cmd withObject:args afterDelay:0.1];
        return;
    }

    TiWindowProxy *window = [args objectAtIndex:0];

    if (window == root) {
        [window windowWillOpen];
        [window windowDidOpen];
        return;
    }
    BOOL animated = ([args count] > 1) ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
    UIViewController *viewController = [window hostingController];
    [controller pushViewController:viewController animated:animated];
}

-(void)popOnUIThread:(NSArray*)args
{
    if (transitionIsAnimating)
    {
        [self performSelector:_cmd withObject:args afterDelay:0.1];
        return;
    }

    TiWindowProxy *window = [args objectAtIndex:0];
    
    if (window == visibleProxy) {
        BOOL animated = args!=nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
        [[self controller] popViewControllerAnimated:animated];
    }
    else {
        [self removeWindowFromControllerStack:window animated:NO];
    }
}

-(void)removeWindowFromControllerStack:(TiWindowProxy*)window animated:animated
{
    [window retain];
    UIViewController* windowController = [[window hostingController] retain];
    NSMutableArray* newControllers = [NSMutableArray arrayWithArray:controller.viewControllers];
    [newControllers removeObject:windowController];
    [controller setViewControllers:newControllers animated:animated];
    
    [window setTab:nil];
	[window setParentOrientationController:nil];
	
	// for this to work right, we need to sure that we always have the tab close the window
	// and not let the window simply close by itself. this will ensure that we tell the
	// tab that we're doing that
	[window close:nil];
    RELEASE_TO_NIL_AUTORELEASE(window);
    RELEASE_TO_NIL(windowController);
}

-(UIViewController*) getFirstViewControllerInResponderChain
{
    UIResponder* nextResponder = [self nextResponder];
    BOOL isViewController = [nextResponder isKindOfClass:[UIViewController class]];
    while (!isViewController && (nextResponder!= nil)) {
        nextResponder = [nextResponder nextResponder];
        isViewController = [nextResponder isKindOfClass:[UIViewController class]];
    }
    if (isViewController) {
        return (UIViewController*)nextResponder;
    }
    return nil;
}

-(void)attachToFirstViewController
{
    if ([TiUtils isIOS7OrGreater]) {
        return;
    }
    if ([TiUtils isIOS5OrGreater]) {
        UIWindow* newWindow = [self window];
        if (newWindow != nil) {
            UIViewController* parentController = [self getFirstViewControllerInResponderChain];
            if (parentController != nil) {
                [parentController addChildViewController:[self controller]];
            }
        }
    }
}

-(void)didMoveToSuperview
{
    [self attachToFirstViewController];
    [super didMoveToSuperview];
}

- (void)didMoveToWindow
{
    [self attachToFirstViewController];
    [super didMoveToWindow];
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	[controller willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}


#pragma mark Delegate 

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
    transitionIsAnimating = YES;
    if (visibleProxy != nil) {
        UIViewController *curController = [visibleProxy hostingController];
        NSArray* curStack = [navigationController viewControllers];
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
            [visibleProxy windowWillClose];
        }
    }
    TiWindowProxy *newWindow = (TiWindowProxy *)[(TiViewController*)viewController proxy];
    if ([newWindow opening]) {
        [newWindow windowWillOpen];
        [newWindow windowDidOpen];
    }
}
- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
    TiViewController *wincontroller = (TiViewController*)viewController;
    TiWindowProxy *newWindow = (TiWindowProxy *)[wincontroller proxy];
    
    if (visibleProxy != nil) {
        UIViewController* oldController = [visibleProxy hostingController];
        if (![[navigationController viewControllers] containsObject:oldController]) {
            [visibleProxy setTab:nil];
            [visibleProxy setParentOrientationController:nil];
            [visibleProxy close:nil];
        }
    }
    RELEASE_TO_NIL(visibleProxy);
    [self setVisibleProxy:newWindow];
    transitionIsAnimating = NO;
}


@end

#endif