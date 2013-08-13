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
	[oldProxy release];
}

-(void)dealloc
{
	RELEASE_TO_NIL(controller);
    RELEASE_TO_NIL(closingProxyArray)
	[self setVisibleProxy:nil];
	//This is done this way so that proper methods are called as well.
	[super dealloc];
}

-(UINavigationController*)controller
{
	if (controller==nil)
	{
		TiWindowProxy* windowProxy = [self.proxy valueForKey:@"window"];
		if (windowProxy==nil)
		{
			[self throwException:@"window property required" subreason:nil location:CODELOCATION];
		}
        [windowProxy setIsManaged:YES];
		UIViewController *rootController = [windowProxy initController];
		controller = [[UINavigationController alloc] initWithRootViewController:rootController];
		[controller setDelegate:self];
		[TiUtils configureController:controller withObject:rootController];
		[self addSubview:controller.view];
		
		root = windowProxy;
	}
	return controller;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (controller!=nil)
	{
		[TiUtils setView:controller.view positionRect:bounds];
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
        for (UIViewController *viewController in controller.viewControllers) {
            TiWindowProxy* win = (TiWindowProxy *)[(TiViewController*)viewController proxy];
            [win retain];
            [[win view] removeFromSuperview];
            [win close:nil];
            [[self proxy] forgetProxy:win];
            [win autorelease];
        }
        controller.viewControllers = [NSArray array];
        [controller.view removeFromSuperview];
        [controller resignFirstResponder];
        RELEASE_TO_NIL(controller);
        [visibleProxy autorelease];
        visibleProxy = nil; // close/release handled by view removal
        RELEASE_TO_NIL(closingProxyArray)
    }
    [self release];
}

-(void)open:(TiWindowProxy*)window withObject:(NSDictionary*)properties
{
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
	UIViewController *viewController = [window initController];
	opening = YES;
	[controller pushViewController:viewController animated:animated];
}

-(void)delayedClose:(id)unused
{
    if ([closingProxyArray count] > 0) {
        if ( closingProxy == nil) {
            NSArray* args = [closingProxyArray objectAtIndex:0];
            [self removeWindowFromControllerStack:[args objectAtIndex:0] withObject:[args objectAtIndex:1]];
            [closingProxyArray removeObjectAtIndex:0];
        }
        else {
            [self performSelector:@selector(delayedClose:) withObject:nil afterDelay:UINavigationControllerHideShowBarDuration];
        }
    }
}

-(void)close:(TiWindowProxy*)window withObject:(NSDictionary*)properties
{
    //TIMOB-10802. If a window is being popped off the stack wait until the 
    //animation is complete before trying to pop another window
    if ( (closingProxy != nil) || ([closingProxyArray count] >0) ) {
        DebugLog(@"NavController is closing a proxy. Delaying this close call")
        if (closingProxyArray == nil) {
            closingProxyArray = [[NSMutableArray alloc] init];
        }
        [closingProxyArray addObject:[NSArray arrayWithObjects:window,properties,nil]];
        [self performSelector:@selector(delayedClose:) withObject:nil afterDelay:UINavigationControllerHideShowBarDuration];
    }
    else {
        [self removeWindowFromControllerStack:window withObject:properties];
    }
}

-(void)removeWindowFromControllerStack:(TiWindowProxy*)window withObject:(NSDictionary*)properties
{
    UIViewController* windowController = [window initController];
    NSMutableArray* newControllers = [NSMutableArray arrayWithArray:controller.viewControllers];
    BOOL lastObject = (windowController == [newControllers lastObject]);
    BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:lastObject];
    //Ignore animated if the view being popped is not the top view controller.
    if (!lastObject) {
        animated = NO;
    }
    [newControllers removeObject:windowController];
    [closingProxy autorelease];
    closingProxy = [window retain];
    [controller setViewControllers:newControllers animated:animated];

    //TIMOB-10802.If it is not the top view controller, delegate methods will 
    //not be called. So call close on the proxy here.
    if (!lastObject) {
        [closingProxy close:nil];
        [closingProxy release];
        closingProxy = nil;
    }
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
    TiWindowProxy *newWindow = (TiWindowProxy *)[(TiViewController*)viewController proxy];
	[newWindow windowWillOpen];
    [[UIApplication sharedApplication] setStatusBarHidden:[newWindow hidesStatusBar] withAnimation:UIStatusBarAnimationNone];

}
- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
    TiViewController *wincontroller = (TiViewController*)viewController;
    TiWindowProxy *newWindow = (TiWindowProxy *)[wincontroller proxy];
    BOOL visibleProxyDidChange = NO;
    if (newWindow!=visibleProxy)
    {
        if (visibleProxy != nil && visibleProxy!=root && opening==NO && visibleProxy != closingProxy)
        {
            //TODO: This is an expedient fix, but NavGroup needs rewriting anyways
            [(TiUIiPhoneNavigationGroupProxy*)[self proxy] close:[NSArray arrayWithObject:visibleProxy]];   
        }
        visibleProxyDidChange = YES;
        
        [self setVisibleProxy:newWindow];
    }
    [closingProxy close:nil];
    [closingProxy release];
    closingProxy = nil;
    opening = NO;
    if (visibleProxyDidChange) {
        [newWindow windowDidOpen];
    }
}


@end

#endif