/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSNAVWINDOW

#import "TiUIiOSNavWindowProxy.h"
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
    [self initializeProperty:@"extendEdges" defaultValue: [NSArray arrayWithObjects:NUMINT(15), nil]];
    [super _initWithProperties:properties];
}

#pragma mark - TiOrientationController

-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;
{
    [parentController childOrientationControllerChangedFlags:self];
}

-(void)setParentOrientationController:(id <TiOrientationController>)newParent
{
    parentController = newParent;
}

-(id)parentOrientationController
{
	return parentController;
}

-(TiOrientationFlags) orientationFlags
{
    if ([self isModal]) {
        return _supportedOrientations;
    } else {
        for (id thisController in [[navController viewControllers] reverseObjectEnumerator])
        {
            if (![thisController isKindOfClass:[TiViewController class]])
            {
                continue;
            }
            TiWindowProxy * thisProxy = (TiWindowProxy *)[(TiViewController *)thisController proxy];
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

-(UINavigationController*)controller
{
    if (navController == nil) {
        navController = [[UINavigationController alloc] initWithRootViewController:[self rootController]];;
        navController.delegate = self;
        [TiUtils configureController:navController withObject:self];
    }
    return navController;
}

-(void)push:(NSArray*)args
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
            args = [NSArray arrayWithObjects:args,nil];
        }
        [window open:args];
        return;
    }
    
	[[[TiApp app] controller] dismissKeyboard];
	TiThreadPerformOnMainThread(^{
		[self openOnUIThread:args];
	}, YES);
}

-(void)pop:(NSArray*)args
{
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
    if (window == rootWindow) {
        DebugLog(@"[ERROR] Can not close root window of the tab. Use removeTab instead");
        return;
    }
    TiThreadPerformOnMainThread(^{
        [self closeOnUIThread:args];
    }, YES);
}

-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated
{
    //NO OP NOW
}


#pragma mark - UINavigationControllerDelegate


- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	transitionIsAnimating = YES;
    TiWindowProxy* theWindow = (TiWindowProxy*)[(TiViewController*)viewController proxy];
    if (theWindow == rootWindow) {
        //This is probably too late for the root view controller.
        //Figure out how to call open before this callback
        [theWindow open:nil];
    } else if ([theWindow opening]) {
        [theWindow windowWillOpen];
        [theWindow windowDidOpen];
    }
    [[UIApplication sharedApplication] setStatusBarHidden:[theWindow hidesStatusBar] withAnimation:UIStatusBarAnimationNone];
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
    transitionIsAnimating = NO;
    if (current != nil) {
        UIViewController* oldController = [current initController];
        if (![[navController viewControllers] containsObject:oldController]) {
            [current setTab:nil];
            [current setParentOrientationController:nil];
            [current close:nil];
        }
    }
    RELEASE_TO_NIL(current);
    TiWindowProxy* theWindow = (TiWindowProxy*)[(TiViewController*)viewController proxy];
    current = [theWindow retain];
    [self childOrientationControllerChangedFlags:current];
}

#pragma mark - Private API
-(UIViewController *)rootController
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
    return [rootWindow initController];
}

-(void)openOnUIThread:(NSArray*)args
{
	if (transitionIsAnimating)
	{
		[self performSelector:_cmd withObject:args afterDelay:0.1];
		return;
	}
	TiWindowProxy *window = [args objectAtIndex:0];
	BOOL animated = args!=nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
    
    [[[self rootController] navigationController] pushViewController:[window initController] animated:animated];
}

-(void)closeOnUIThread:(NSArray*)args
{
	if (transitionIsAnimating)
	{
		[self performSelector:_cmd withObject:args afterDelay:0.1];
		return;
	}
	TiWindowProxy *window = [args objectAtIndex:0];
    
    if (window == current) {
        BOOL animated = args!=nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
        [[[self rootController] navigationController] popViewControllerAnimated:animated];
    }
    else {
        [self closeWindow:window animated:NO];
    }
    
}

- (void)closeWindow:(TiWindowProxy*)window animated:(BOOL)animated
{
    [window retain];
    UIViewController *windowController = [[window initController] retain];
    
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
        [navController setDelegate:nil];
        UIViewController* rootController = [self rootController];
        if ([[navController viewControllers] count] > 1) {
            NSMutableArray* doomedVcs = [[NSMutableArray arrayWithArray:[navController viewControllers]] retain];
            [doomedVcs removeObject:rootController];
            [navController setViewControllers:[NSArray arrayWithObject:rootController]];
            if (current != nil) {
                RELEASE_TO_NIL(current);
                current = [(TiWindowProxy*)[(TiViewController*)rootController proxy] retain];
            }
            for (TiViewController* doomedVc in doomedVcs) {
                [self closeWindow:(TiWindowProxy *)[doomedVc proxy] animated:NO];
            }
            RELEASE_TO_NIL(doomedVcs);
        }
        [self closeWindow:rootWindow animated:NO];
        RELEASE_TO_NIL(controller);
        RELEASE_TO_NIL(current);

    },YES);
}


#pragma mark - TiWindowProtocol
-(void)viewWillAppear:(BOOL)animated
{
    if ([self viewAttached]) {
        [navController viewWillAppear:animated];
    }
    [super viewWillAppear:animated];
}
-(void)viewWillDisappear:(BOOL)animated
{
    if ([self viewAttached]) {
        [navController viewWillDisappear:animated];
    }
    [super viewWillDisappear:animated];
}

-(void)viewDidAppear:(BOOL)animated
{
    if ([self viewAttached]) {
        [navController viewDidAppear:animated];
    }
    [super viewDidAppear:animated];
}
-(void)viewDidDisappear:(BOOL)animated
{
    if ([self viewAttached]) {
        [navController viewDidDisappear:animated];
    }
    [super viewDidDisappear:animated];
    
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

-(BOOL)_handleOpen:(id)args;
{
    
    UIView *nview = [[self controller] view];
	[nview setFrame:[[self view] bounds]];
	[[self view] addSubview:nview];
    return [super _handleOpen:args];
}

#pragma mark - TiViewProxy overrides

-(void) windowWillClose
{
    [self cleanNavStack];
    [super windowWillClose];
}

-(void)willChangeSize
{
	[super willChangeSize];
	
	//TODO: Shouldn't this be not through UI? Shouldn't we retain the windows ourselves?
	for (UIViewController * thisController in [navController viewControllers])
	{
		if ([thisController isKindOfClass:[TiViewController class]])
		{
			TiViewProxy * thisProxy = [(TiViewController *)thisController proxy];
			[thisProxy willChangeSize];
		}
	}
}

@end

#endif