/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewController.h"
#import "TiApp.h"

@implementation TiViewController

-(id)initWithViewProxy:(TiViewProxy*)window
{
    if (self = [super init]) {
        _proxy = window;
        [self updateOrientations];
        [TiUtils configureController:self withObject:_proxy];
    }
    NSLog(@"MY ORIENTATIONS ARE %d",_supportedOrientations);
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

- (void)viewWillLayoutSubviews
{
    if ([_proxy viewAttached]) {
        ApplyConstraintToViewWithBounds([_proxy layoutProperties], [_proxy view], [self view].bounds);
    }
    [super viewWillLayoutSubviews];
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

- (NSUInteger)supportedInterfaceOrientations{
    return _supportedOrientations;
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    //THIS HAS TO BE FIXED
    return [[[TiApp app] controller] preferredInterfaceOrientationForPresentation];
}

-(void)loadView
{
    if (_proxy == nil) {
        return;
    }
    [self updateOrientations];
    //Always wrap proxy view with a wrapperView.
    //This way proxy always has correct sandbox when laying out
    BOOL wrap = YES;
    
    if (wrap) {
        //IOS7 now automatically sets the frame of its view based on the fullscreen control props.
        //However this will not work for our layout system since now the reference size in which to
        //layout the view is always the full screen. So we are going to wrap our window in a wrapper
        //so it lays out correctly.
        [_proxy parentWillShow];
        UIView *wrapperView = [[UIView alloc] initWithFrame:[[UIScreen mainScreen] applicationFrame]];
        wrapperView.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
        [wrapperView addSubview:[_proxy view]];
        [wrapperView bringSubviewToFront:[_proxy view]];
        self.view = wrapperView;
        [wrapperView release];
    } else {
        self.view = [_proxy view];
    }
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
    if ([self presentingViewController] != nil) {
        BOOL resize = NO;
        if ([self modalPresentationStyle] == UIModalPresentationFullScreen) {
            resize = YES;
        }
        if ([self modalPresentationStyle] == UIModalPresentationCurrentContext) {
            resize = ([[self presentingViewController] modalPresentationStyle] == UIModalPresentationFullScreen);
        }
        if (resize) {
            [[self view] setFrame:[TiUtils frameForController:self]];
        }
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
    if ([self presentingViewController] != nil) {
        BOOL resize = NO;
        if ([self modalPresentationStyle] == UIModalPresentationFullScreen) {
            resize = YES;
        }
        if ([self modalPresentationStyle] == UIModalPresentationCurrentContext) {
            resize = ([[self presentingViewController] modalPresentationStyle] == UIModalPresentationFullScreen);
        }
        if (resize) {
            [[self view] setFrame:[TiUtils frameForController:self]];
        }
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

@end
