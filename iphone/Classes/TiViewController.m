/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if 0

#import "TiViewController.h"
#import "TiApp.h"
#import "TiLayoutView.h"

@implementation TiViewController

-(id)initWithViewProxy:(TiViewProxy*)window
{
    if (self = [super init]) {
        _proxy = window;
        [self updateOrientations];
        [TiUtils configureController:self withObject:_proxy];
    }
    return self;
}

-(void)dealloc
{
    [super dealloc];
}

-(void)updateOrientations
{
    id object = [_proxy valueForUndefinedKey:@"orientationModes"];
    _supportedOrientations = [TiUtils TiOrientationFlagsFromObject:object];
    if (_supportedOrientations == TiOrientationNone) {
        _supportedOrientations = [[[TiApp app] controller] getDefaultOrientations];
    }
}

-(TiViewProxy*) proxy
{
    return _proxy;
}

//IOS5 support. Begin Section. Drop in 3.2
- (BOOL)automaticallyForwardAppearanceAndRotationMethodsToChildViewControllers
{
    return YES;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
{
    return TI_ORIENTATION_ALLOWED(_supportedOrientations,toInterfaceOrientation) ? YES : NO;
}
//IOS5 support. End Section


//IOS6 new stuff.
- (BOOL)shouldAutomaticallyForwardRotationMethods
{
    return YES;
}

- (BOOL)shouldAutomaticallyForwardAppearanceMethods
{
    return YES;
}

- (BOOL)shouldAutorotate{
    return YES;
}

- (NSUInteger)supportedInterfaceOrientations {
    /*
     If we are in a navigation controller, let us match so it doesn't get freaked 
     out in when pushing/popping. We are going to force orientation anyways.
     */
    if ([self navigationController] != nil) {
        return [[self navigationController] supportedInterfaceOrientations];
    }
    //This would be for modal.
    return (NSUInteger)_supportedOrientations;
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    return [[[TiApp app] controller] lastValidOrientation:_supportedOrientations];
}

-(void)loadView
{
    if (_proxy == nil) {
        DebugLog(@"NO PROXY ASSOCIATED WITH VIEWCONTROLLER. RETURNING")
        return;
    }
    [self updateOrientations];
    [self setHidesBottomBarWhenPushed:[TiUtils boolValue:[_proxy valueForUndefinedKey:@"tabBarHidden"] def:NO]];
    //Always wrap proxy view with a wrapperView.
    //This way proxy always has correct sandbox when laying out
    TiLayoutView *wrapperView = [[TiLayoutView alloc] init];
    [wrapperView addSubview:[_proxy view]];
    [wrapperView bringSubviewToFront:[_proxy view]];
    self.view = wrapperView;
    [wrapperView release];
}

#pragma mark - Appearance & rotation methods

-(void)viewWillAppear:(BOOL)animated
{
   	if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_proxy viewWillAppear:animated];
    }
    [super viewWillAppear:animated];
}
-(void)viewWillDisappear:(BOOL)animated
{
   	if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_proxy viewWillDisappear:animated];
    }
    [super viewWillDisappear:animated];
}
-(void)viewDidAppear:(BOOL)animated
{
   	if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_proxy viewDidAppear:animated];
    }
    [super viewDidAppear:animated];
}
-(void)viewDidDisappear:(BOOL)animated
{
   	if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_proxy viewDidDisappear:animated];
    }
    [super viewDidDisappear:animated];
}
-(void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
   	if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_proxy willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
   	if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_proxy willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
   	if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        [(id<TiWindowProtocol>)_proxy didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    }
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
}

#pragma mark - Status Bar Appearance

- (BOOL)prefersStatusBarHidden
{
    if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        return [(id<TiWindowProtocol>)_proxy hidesStatusBar];
    } else {
        return NO;
    }
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
    if ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
        return [(id<TiWindowProtocol>)_proxy preferredStatusBarStyle];
    } else {
        return UIStatusBarStyleDefault;
    }
}

-(BOOL) modalPresentationCapturesStatusBarAppearance
{
    return YES;
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
    return UIStatusBarAnimationNone;
}
- (BOOL)disablesAutomaticKeyboardDismissal {
    return NO;
}
@end

#endif