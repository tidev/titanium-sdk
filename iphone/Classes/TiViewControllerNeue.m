//
//  TiViewControllerNeue.m
//  Titanium
//
//  Created by Vishal Duggal on 7/30/13.
//
//

#import "TiViewControllerNeue.h"
#import "TiApp.h"

@implementation TiViewControllerNeue

-(id)initWithViewProxy:(TiViewProxy*)window
{
    if (self = [super init]) {
        _proxy = window;
        [self updateOrientations];
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
        _supportedOrientations = [[[TiApp app] neueController] getDefaultOrientations];
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
    BOOL result =  TI_ORIENTATION_ALLOWED(_supportedOrientations,toInterfaceOrientation) ? YES : NO;
    TiOrientationFlags result2 = TiOrientationNone;
    TI_ORIENTATION_SET(result2, toInterfaceOrientation);
    if (result == YES) {
        NSLog(@"YES I WILL ROTATE %d %d",_supportedOrientations, result2);
    } else {
        NSLog(@"NO I WILL NOT ROTATE %d %d", _supportedOrientations, result2);
    }
    
    return result;
}
//IOS5 support. End Section


//IOS6 new stuff.
- (BOOL)shouldAutomaticallyForwardRotationMethods
{
    return YES;
}

- (BOOL)shouldAutomaticallyForwardAppearanceMethods
{
    YES;
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
    return [[[TiApp app] neueController] preferredInterfaceOrientationForPresentation];
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

@end
