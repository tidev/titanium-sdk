/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPADSPLITWINDOW) || defined(USE_TI_UIIOSSPLITWINDOW)

#import "TiUIiOSSplitWindowButtonProxy.h"
#import "TiUIiOSSplitWindowProxy.h"
#import "TiUIiOSSplitWindow.h"


@interface TiSplitViewController : UISplitViewController
{
    TiUIiOSSplitWindowProxy* _proxy;
}
-(instancetype)initWithProxy:(TiUIiOSSplitWindowProxy*)proxy;
@end

@implementation TiSplitViewController

-(instancetype)initWithProxy:(TiUIiOSSplitWindowProxy*)proxy
{
    self = [super init];
    if (self) {
        _proxy = proxy;
    }
    return self;
}

-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    [_proxy willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    if (![TiUtils isIOS8OrGreater]) {
        [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
}

-(void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator
{
    [super viewWillTransitionToSize:size withTransitionCoordinator:coordinator];
    
    //The device has already rotated, that's why this method is being called.
    UIDeviceOrientation toOrientation   = [[UIDevice currentDevice] orientation];
    //fixes orientation mismatch (between UIDeviceOrientation and UIInterfaceOrientation)
    
    UIInterfaceOrientation newOrientation;
    switch (toOrientation) {
        case UIDeviceOrientationLandscapeLeft:
            newOrientation = UIInterfaceOrientationLandscapeLeft;
            break;
        case UIDeviceOrientationLandscapeRight:
            newOrientation = UIInterfaceOrientationLandscapeRight;
            break;
        case UIDeviceOrientationFaceDown:
        case UIDeviceOrientationFaceUp:
        case UIDeviceOrientationUnknown:
            newOrientation = UIInterfaceOrientationUnknown;
            break;
        case UIDeviceOrientationPortrait:
            newOrientation = UIInterfaceOrientationPortrait;
            break;
        case UIDeviceOrientationPortraitUpsideDown:
            newOrientation = UIInterfaceOrientationPortraitUpsideDown;
            break;
    }
    [self willRotateToInterfaceOrientation:newOrientation duration:0.0];
    
}
@end

@implementation TiUIiOSSplitWindowProxy


-(void)_initWithProperties:(NSDictionary *)properties
{
    [self initializeProperty:@"showMasterInPortrait" defaultValue:NUMBOOL(NO)];
    [self initializeProperty:@"masterIsOverlayed" defaultValue:NUMBOOL(NO)];
    [super _initWithProperties:properties];
}

-(TiUIView*)newView
{
    return [[TiUIiOSSplitWindow alloc] initWithProxy:self];
}

-(void)setShowMasterInPortrait:(id)value
{
    [self replaceValue:value forKey:@"showMasterInPortrait" notification:NO];
    TiThreadPerformOnMainThread(^{
        if ([TiUtils boolValue:value def:NO]) {
            [[self splitViewController] setPreferredDisplayMode:UISplitViewControllerDisplayModeAllVisible];
        } else {
            [[self splitViewController] setPreferredDisplayMode:UISplitViewControllerDisplayModeAutomatic];
        }
    }, NO);
}

-(void)setMasterIsOverlayed:(id)value
{
    [self replaceValue:value forKey:@"masterIsOverlayed" notification:NO];
    TiThreadPerformOnMainThread(^{
        if ([TiUtils boolValue:value def:NO]) {
            [[self splitViewController] setPreferredDisplayMode:UISplitViewControllerDisplayModePrimaryOverlay];
        } else {
            [[self splitViewController] setPreferredDisplayMode:UISplitViewControllerDisplayModeAutomatic];
        }
    }, NO);
}

-(void)setPortraitSplit:(id)args
{
    [self replaceValue:args forKey:@"portraitSplit" notification:NO];
    TiThreadPerformOnMainThread(^{
        [self willRotateToInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation] duration:0.3];
    }, NO);
}

-(void)setLandscapeSplit:(id)args
{
    [self replaceValue:args forKey:@"landscapeSplit" notification:NO];
    TiThreadPerformOnMainThread(^{
        [self willRotateToInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation] duration:0.3];
    }, NO);
}


-(TiLayoutViewController*)hostingController;
{
    if (controller == nil) {
        controller = [[TiLayoutViewController alloc] initWithViewProxy:self];
        splitViewController = [self splitViewController];
        [splitViewController willMoveToParentViewController:controller];
        [controller addChildViewController:splitViewController];
        [splitViewController didMoveToParentViewController:controller];
    }
    return controller;
}

#pragma mark - TiViewProxy Overrides
-(void) windowWillOpen
{
    if ([self viewInitialized]) {
        TiThreadPerformOnMainThread(^{
            [self initWrappers];
        }, YES);
    }
    [super windowWillOpen];
}

#pragma mark - TiWindowProtocol handler

-(void)gainFocus
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView gainFocus];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView gainFocus];
    }
    [super gainFocus];
}

-(void)resignFocus
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if ([masterView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)masterView resignFocus];
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if ([detailView conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)detailView resignFocus];
    }
    [super resignFocus];
}

-(BOOL)_handleOpen:(id)args
{
    id masterView = [self valueForUndefinedKey:@"masterView"];
    if (![masterView isKindOfClass:[TiViewProxy class]]) {
        DebugLog(@"masterView property must be set to an object of type TiViewProxy");
        return NO;
    }
    id detailView = [self valueForUndefinedKey:@"detailView"];
    if (![detailView isKindOfClass:[TiViewProxy class]]) {
        DebugLog(@"detailView property must be set to an object of type TiViewProxy");
        return NO;
    }
    
    return [super _handleOpen:args];
}

-(void)initWrappers
{
    if (splitViewController == nil) return;
    
    masterProxy = [self valueForUndefinedKey:@"masterView"];
    detailProxy = [self valueForUndefinedKey:@"detailView"];
    
    if (masterProxy == nil || detailProxy == nil) return;
    
    UIViewController* masterController = nil;
    UIViewController* detailController = nil;
    if (masterProxy != nil) {
        if ([masterProxy isKindOfClass:[TiWindowProxy class]]) {
            [(TiWindowProxy*)masterProxy setIsManaged:YES];
            masterController = [(TiWindowProxy*)masterProxy hostingController];
        } else {
            masterController = [[[UIViewController alloc] init] autorelease];
            [[masterController view] addSubview:[masterProxy view]];
        }
    }
    if (detailProxy != nil) {
        if ([detailProxy isKindOfClass:[TiWindowProxy class]]) {
            [(TiWindowProxy*)detailProxy setIsManaged:YES];
            detailController = [(TiWindowProxy*)detailProxy hostingController];
        } else {
            detailController = [[[UIViewController alloc] init] autorelease];
            [[detailController view] addSubview:[detailProxy view]];
        }
    }
    
    [self setRightViewController:detailController];
    [self setLeftViewController:masterController];
    [splitViewController setViewControllers:@[masterController, detailController]];
    
}

-(UISplitViewController*)splitViewController
{
    if (splitViewController == nil) {
        splitViewController = [[TiSplitViewController alloc] initWithProxy:self];
        [splitViewController setDelegate:self];
        [self initWrappers];
    }
    return splitViewController;
}


-(void)viewWillAppear:(BOOL)animated
{
    // force orientation
    UIApplication *app = [UIApplication sharedApplication];
    UIWindow *window = [app keyWindow];
    UIViewController* root = [window rootViewController];
    window.rootViewController = nil;
    window.rootViewController = root;
    [super viewWillAppear:animated];
    [self willRotateToInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation] duration:0.3];
    
}

-(void)viewWillDisappear:(BOOL)animated
{
    [super viewWillDisappear:animated];
}

-(void)viewDidAppear:(BOOL)animated
{
    [super viewDidAppear:animated];
    
    if (self.splitViewController.displayMode == UISplitViewControllerDisplayModePrimaryHidden)
    {
        [self shouldPopoverButton:YES];
    }
    
}
-(void)viewDidDisappear:(BOOL)animated
{
    [super viewDidDisappear:animated];
}
-(void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    [super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
}


-(void)shouldPopoverButton:(BOOL)flag
{
    if (!popoverController) {
        
        UISplitViewController* splitView = [self splitViewController];
        if ([splitView viewControllers] == nil) return;
        if ([[splitView viewControllers] count] != 2) return;
        UINavigationController* navController = nil;
        UIViewController * detailViewController = [[splitView viewControllers] objectAtIndex:1];
        // this will probably always be false
        if ([detailViewController isKindOfClass:[UINavigationController class]]) {
            navController = (UINavigationController*)detailViewController;
        }
        if (navController == nil) {
            if ([[detailViewController childViewControllers] count] > 0) {
                id obj = [[detailViewController childViewControllers] objectAtIndex:0];
                if ([obj isKindOfClass:[UINavigationController class]]) {
                    navController = obj;
                }
            }
        }
        if (navController != nil) {
            popoverController = [[[navController childViewControllers] objectAtIndex:0] retain];
        }
    }
    
    BOOL hasListener = [self _hasListeners:@"visible"];
    TiUIiPadSplitWindowButtonProxy *buttonProxy = [[TiUIiPadSplitWindowButtonProxy alloc] initWithButton:[splitViewController displayModeButtonItem] splitViewProxy:self andPageContext:[self executionContext]];
    if (hasListener) {
        NSString* viewName = nil;
        if (flag) {
            viewName = @"detail";
        } else {
            viewName = @"master";
        }
        [self fireEvent:@"visible" withObject:@{@"view":viewName, @"button":buttonProxy}];
    } else {
        if ([TiUtils isIOS8OrGreater] && popoverController != nil) {
            UINavigationItem* navItem = [popoverController navigationItem];
            [navItem setLeftBarButtonItem:flag ? [buttonProxy barButtonItem] : nil animated:YES];
            [navItem setLeftItemsSupplementBackButton:YES];
        }
    }
    [buttonProxy autorelease];
}

-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    if (splitViewController == nil) return;
    switch (toInterfaceOrientation) {
        case UIInterfaceOrientationLandscapeLeft:
        case UIInterfaceOrientationLandscapeRight:
        {
            NSNumber* landscapeSplit = [self valueForKey:@"landscapeSplit"];
            if (landscapeSplit != nil && [self leftViewController] != nil)
            {
                CGFloat newWidth = [landscapeSplit floatValue];
                [[self splitViewController] setPreferredPrimaryColumnWidthFraction: newWidth];
            }
            
            break;
        }
        case UIInterfaceOrientationPortrait:
        case UIInterfaceOrientationPortraitUpsideDown:
        {
            NSNumber* portraitSplit = [self valueForKey:@"portraitSplit"];
            if (portraitSplit != nil && [self leftViewController] != nil)
            {
                CGFloat f = UISplitViewControllerAutomaticDimension;
                CGFloat newWidth = [portraitSplit floatValue];
                [[self splitViewController] setPreferredPrimaryColumnWidthFraction: newWidth];
            }
            
            break;
        }
        default:
            break;
    }
}

#pragma -mark Delegate Methods

// This method allows a client to update any bar button items etc.
- (void)splitViewController:(UISplitViewController *)svc willChangeToDisplayMode:(UISplitViewControllerDisplayMode)displayMode
{
    if ([TiUtils isIOS8OrGreater])
    {
        switch (displayMode) {
            case UISplitViewControllerDisplayModeAllVisible:
            {
                [self shouldPopoverButton:NO];
                break;
            }
            case UISplitViewControllerDisplayModePrimaryHidden:
            {
                [self shouldPopoverButton:YES];
                break;
            }
            default:
                break;
        }
    }
}

// Called by the gesture AND barButtonItem to determine what they will set the display mode to (and what the displayModeButtonItem's appearance will be.) Return UISplitViewControllerDisplayModeAutomatic to get the default behavior.
- (UISplitViewControllerDisplayMode)targetDisplayModeForActionInSplitViewController:(UISplitViewController *)svc
{
    if ([TiUtils isIOS8OrGreater])
    {
        // do something here
    }
    return UISplitViewControllerDisplayModeAutomatic;
}

// Override this method to customize the behavior of `showViewController:` on a split view controller. Return YES to indicate that you've handled
// the action yourself; return NO to cause the default behavior to be executed.
- (BOOL)splitViewController:(UISplitViewController *)splitViewController showViewController:(UIViewController *)vc sender:(nullable id)sender
{
    if ([TiUtils isIOS8OrGreater])
    {
        // do something here
    }
    return NO;
}

// Override this method to customize the behavior of `showDetailViewController:` on a split view controller. Return YES to indicate that you've
// handled the action yourself; return NO to cause the default behavior to be executed.
- (BOOL)splitViewController:(UISplitViewController *)aSplitViewController showDetailViewController:(UIViewController *)vc sender:(nullable id)sender
{
    if ([TiUtils isIOS8OrGreater])
    {
        // do something here
    }
    return NO;
}

// Return the view controller which is to become the primary view controller after `splitViewController` is collapsed due to a transition to
// the horizontally-compact size class. If you return `nil`, then the argument will perform its default behavior (i.e. to use its current primary view
// controller).
- (nullable UIViewController *)primaryViewControllerForCollapsingSplitViewController:(UISplitViewController *)aSplitViewController
{
    if ([TiUtils isIOS8OrGreater])
    {
        return [self rightViewController];
    }
    return nil;
}

// Return the view controller which is to become the primary view controller after the `splitViewController` is expanded due to a transition
// to the horizontally-regular size class. If you return `nil`, then the argument will perform its default behavior (i.e. to use its current
// primary view controller.)
- (nullable UIViewController *)primaryViewControllerForExpandingSplitViewController:(UISplitViewController *)aSplitViewController
{
    NSLog(@"%s", __PRETTY_FUNCTION__);
    if ([TiUtils isIOS8OrGreater])
    {
        return [self leftViewController];
    }
    return nil;
}


// This method is called when a split view controller is collapsing its children for a transition to a compact-width size class. Override this
// method to perform custom adjustments to the view controller hierarchy of the target controller.  When you return from this method, you're
// expected to have modified the `primaryViewController` so as to be suitable for display in a compact-width split view controller, potentially
// using `secondaryViewController` to do so.  Return YES to prevent UIKit from applying its default behavior; return NO to request that UIKit
// perform its default collapsing behavior.
- (BOOL)splitViewController:(UISplitViewController *)splitViewController collapseSecondaryViewController:(UIViewController *)secondaryViewController ontoPrimaryViewController:(UIViewController *)primaryViewController
{
    if ([TiUtils isIOS8OrGreater])
    {
        // do something here
    }
    return NO;
}

// This method is called when a split view controller is separating its child into two children for a transition from a compact-width size
// class to a regular-width size class. Override this method to perform custom separation behavior.  The controller returned from this method
// will be set as the secondary view controller of the split view controller.  When you return from this method, `primaryViewController` should
// have been configured for display in a regular-width split view controller. If you return `nil`, then `UISplitViewController` will perform
// its default behavior.
- (nullable UIViewController *)splitViewController:(UISplitViewController *)splitViewController separateSecondaryViewControllerFromPrimaryViewController:(UIViewController *)primaryViewController
{
    if ([TiUtils isIOS8OrGreater])
    {
        // do something here
    }
    return nil;
}


- (UIInterfaceOrientationMask)splitViewControllerSupportedInterfaceOrientations:(UISplitViewController *)splitViewController
{
    return [[self hostingController] supportedInterfaceOrientations];
}


// Called when a button should be added to a toolbar for a hidden view controller.
// Implementing this method allows the hidden view controller to be presented via a swipe gesture if 'presentsWithGesture' is 'YES' (the default).
- (void)splitViewController:(UISplitViewController *)svc willHideViewController:(UIViewController *)aViewController withBarButtonItem:(UIBarButtonItem *)aBarButtonItem forPopoverController:(UIPopoverController *)pc
{
    if ([TiUtils isIOS8OrGreater]) return;
    //DEPRECATED IN 8_0 - "Use splitViewController:willChangeToDisplayMode: and displayModeButtonItem instead";
    
    [self shouldPopoverButton:YES];
    [[popoverController navigationItem] setLeftBarButtonItem:aBarButtonItem animated:YES];
}

// Called when the view is shown again in the split view, invalidating the button and popover controller.
- (void)splitViewController:(UISplitViewController *)svc willShowViewController:(UIViewController *)aViewController invalidatingBarButtonItem:(UIBarButtonItem *)barButtonItem
{
    if ([TiUtils isIOS8OrGreater]) return;
    //DEPRECATED IN 8_0 - "Use splitViewController:willChangeToDisplayMode: and displayModeButtonItem instead";
    [self shouldPopoverButton:NO];
    [[popoverController navigationItem] setLeftBarButtonItem:nil animated:YES];
}

// Called when the view controller is shown in a popover so the delegate can take action like hiding other popovers.
- (void)splitViewController:(UISplitViewController *)svc popoverController:(UIPopoverController *)pc willPresentViewController:(UIViewController *)aViewController NS_DEPRECATED_IOS(2_0, 8_0, "Use splitViewController:willChangeToDisplayMode: instead");
{
    
}

@end
#endif