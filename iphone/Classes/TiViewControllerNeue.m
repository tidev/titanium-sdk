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
    return [[[TiApp app] neueController] preferredInterfaceOrientationForPresentation];
}

-(void)loadView
{
    if (_proxy == nil) {
        return;
    }
    [self updateOrientations];
    BOOL wrap = ( ([TiUtils isIOS7OrGreater]) && ([_proxy conformsToProtocol:@protocol(TiWindowProtocol)]) );
    
    if (wrap) {
        //IOS7 now automatically sets the frame of its view based on the fullscreen control props.
        //However this will not work for our layout system since now the reference size in which to
        //layout the view is always the full screen. So we are going to wrap our window in a wrapper
        //so it lays out correctly.
        UIView *wrapperView = [[UIView alloc] initWithFrame:[[UIScreen mainScreen] applicationFrame]];
        wrapperView.autoresizingMask = UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight;
        [wrapperView addSubview:[_proxy view]];
        self.view = wrapperView;
        [wrapperView release];
    } else {
        self.view = [_proxy view];
    }
}

#pragma mark - TiOrientationController methods

- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    NSLog(@"I WILL ROTATE from %d MY FLAGS ARE %d",toInterfaceOrientation, _supportedOrientations);
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    NSLog(@"I DID ROTATE from %d MY FLAGS ARE %d",fromInterfaceOrientation, _supportedOrientations);
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    
}



@end
