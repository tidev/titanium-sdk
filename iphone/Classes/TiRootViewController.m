/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */



#import "TiRootViewController.h"
#import "TiUtils.h"
#import "TiApp.h"
#import "TiErrorController.h"
#import "TiLayoutView.h"


@implementation TiRootViewController

@synthesize statusBarInitiallyHidden = _statusBarInitiallyHidden;
@synthesize defaultStatusBarStyle = _defaultStatusBarStyle;
@synthesize defaultOrientations = _defaultOrientations;
@synthesize hostingView = _hostingView;
@synthesize keyboardFocusedProxy = _keyboardFocusedProxy;
@synthesize keyboardVisible = _keyboardVisible;
@synthesize statusBarVisibilityChanged = _statusBarVisibilityChanged;
@synthesize statusBarIsHidden = _statusBarIsHidden;
- (instancetype)init
{
    self = [super init];
    if (self) {
        _defaultOrientations = TiOrientationNone;
        [self processInfoPlist];
    }
    return self;
}

-(void)loadView
{
//    [super loadView];
    TiLayoutView* backgroundView = [[TiLayoutView alloc] init];
    [backgroundView setTranslatesAutoresizingMaskIntoConstraints:YES];
    [backgroundView setAutoresizingMask:UIViewAutoresizingFlexibleWidth|UIViewAutoresizingFlexibleHeight];
    [self setView:backgroundView];
    _hostingView = [[TiLayoutView alloc] init];
    [[self view] addSubview:_hostingView];
    [backgroundView release];
}
-(void)processInfoPlist
{
    //read the default orientations
    [self defaultOrientations];
//
//    //read the default value of UIStatusBarHidden
    id statHidden = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIStatusBarHidden"];
    _statusBarInitiallyHidden = [TiUtils boolValue:statHidden];
//    //read the value of UIViewControllerBasedStatusBarAppearance
//    id vcbasedStatHidden = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"];
//    viewControllerControlsStatusBar = [TiUtils boolValue:vcbasedStatHidden def:YES];
//    //read the value of statusBarStyle
    id statusStyle = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIStatusBarStyle"];
    
    if (!IS_NULL_OR_NIL(statusStyle)) {
        if ([statusStyle isEqualToString:@"UIStatusBarStyleDefault"]) {
            _defaultStatusBarStyle = UIStatusBarStyleDefault;
        } else if ([statusStyle isEqualToString:@"UIStatusBarStyleBlackTranslucent"] ||
                   [statusStyle isEqualToString:@"UIStatusBarStyleLightContent"] ||
                   [statusStyle isEqualToString:@"UIStatusBarStyleBlackOpaque"]) {
            _defaultStatusBarStyle = UIStatusBarStyleLightContent;
        }
    }
}

-(TiOrientationFlags)defaultOrientations;
{
    if (_defaultOrientations == TiOrientationNone) {
        // Read the orientation values from the plist - if they exist.
        NSArray* orientations = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UISupportedInterfaceOrientations"];
        TiOrientationFlags defaultFlags = TiOrientationPortrait;
        
        if ([TiUtils isIPad]) {
            defaultFlags = TiOrientationAny;
            NSArray * ipadOrientations = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UISupportedInterfaceOrientations~ipad"];
            if ([ipadOrientations respondsToSelector:@selector(count)] && ([ipadOrientations count] > 0)) {
                orientations = ipadOrientations;
            }
        }
        
        if ([orientations respondsToSelector:@selector(count)] && ([orientations count] > 0)) {
            defaultFlags = TiOrientationNone;
            for (NSString* orientationString in orientations) {
                UIInterfaceOrientation orientation = (UIInterfaceOrientation)[TiUtils orientationValue:orientationString def:-1];
                switch (orientation) {
                    case UIInterfaceOrientationLandscapeLeft:
                    case UIInterfaceOrientationLandscapeRight:
                    case UIInterfaceOrientationPortrait:
                    case UIInterfaceOrientationPortraitUpsideDown:
                        TI_ORIENTATION_SET(defaultFlags, orientation);
                        break;
                        
                    default:
                        break;
                }
            }
        }
        _defaultOrientations = defaultFlags;
    }
    
    return _defaultOrientations;
}

-(void)forceOrientationChange
{
    UIDeviceOrientation orientation = [[UIDevice currentDevice] orientation];
    UIInterfaceOrientationMask curr = UIInterfaceOrientationMaskAll;
    UIInterfaceOrientationMask selected = [self supportedInterfaceOrientations];
    BOOL force = NO;
    switch(orientation) {
        case UIDeviceOrientationUnknown: force = YES; break;
        case UIDeviceOrientationPortrait: curr = UIInterfaceOrientationMaskPortrait; break;
        case UIDeviceOrientationPortraitUpsideDown: curr = UIInterfaceOrientationMaskPortraitUpsideDown; break;
        case UIDeviceOrientationLandscapeLeft: curr = UIInterfaceOrientationMaskLandscapeLeft; break;
        case UIDeviceOrientationLandscapeRight: curr = UIInterfaceOrientationMaskLandscapeRight; break;
        case UIDeviceOrientationFaceUp: force = YES; break;
        case UIDeviceOrientationFaceDown: force = YES; break;
    }
    
    UIInterfaceOrientationMask result = curr & selected;
    if (result == 0 || force) {
        UIApplication *app = [UIApplication sharedApplication];
        UIWindow *window = [app keyWindow];
        UIViewController* root = [window rootViewController];
        window.rootViewController = nil;
        window.rootViewController = root;
    }
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
    return [[self topContainerController] supportedInterfaceOrientations];
}

- (BOOL)shouldAutorotate
{
    return YES;
}


-(void)willOpenWindow:(id<TiWindowProtocol>)theWindow
{

    [self dismissKeyboard];
    
    TiLayoutViewController* last = (TiLayoutViewController*)[self topContainerController];
    [[last viewProxy] resignFocus];

    
    if ([theWindow isModal]) {

    } else {

    }
}

-(void)didOpenWindow:(id<TiWindowProtocol>)theWindow
{
    [self forceOrientationChange];
    [self dismissKeyboard];
    if ([self presentedViewController] == nil) {
        TiLayoutViewController* last = (TiLayoutViewController*)[self topContainerController];
        [[last viewProxy] gainFocus];
    }
    [self dismissDefaultImage];
}

-(void)willCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    TiLayoutViewController* last = (TiLayoutViewController*)[self topContainerController];

    [theWindow resignFocus];
    if ([theWindow isModal]) {

    } else {

    }
}

-(void)didCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    [self forceOrientationChange];
    if ([self presentedViewController] == nil) {
        TiLayoutViewController* last = (TiLayoutViewController*)[self topContainerController];
        [[last viewProxy] gainFocus];
    }
}

-(void)dismissKeyboard
{
    if ([self keyboardFocusedProxy] != nil) {
        [[self keyboardFocusedProxy] blur:nil];
    }
}

-(void)dismissDefaultImage
{
    LOG_MISSING
}

-(void)showControllerModal:(UIViewController*)controller animated:(BOOL)animated
{
    BOOL trulyAnimated = animated;
    UIViewController* topVC = [self topPresentedController];
    
    if ([topVC isBeingDismissed]) {
        topVC = [topVC presentingViewController];
    }
    
    if ([topVC isKindOfClass:[TiErrorController class]]) {
        DebugLog(@"[ERROR] ErrorController is up. ABORTING showing of modal controller");
        return;
    }
    if ([TiUtils isIOS8OrGreater]) {
        if ([topVC isKindOfClass:[UIAlertController class]]) {
            if (((UIAlertController*)topVC).preferredStyle == UIAlertControllerStyleAlert ) {
                trulyAnimated = NO;
                if (![controller isKindOfClass:[TiErrorController class]]) {
                    DebugLog(@"[ERROR] UIAlertController is up and showing an alert. ABORTING showing of modal controller");
                    return;
                }
            }
        }
    }
    if (topVC == self) {
//        [[containedWindows lastObject] resignFocus];
    } else if ([topVC respondsToSelector:@selector(viewProxy)]) {
        id theProxy = [(id)topVC viewProxy];
        if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
            [(id<TiWindowProtocol>)theProxy resignFocus];
        }
    }
    [self dismissKeyboard];
    [topVC presentViewController:controller animated:trulyAnimated completion:nil];
}

-(void)hideControllerModal:(UIViewController*)controller animated:(BOOL)animated
{
    UIViewController* topVC = [self topPresentedController];
    if (topVC != controller) {
        DebugLog(@"[WARN] Dismissing a view controller when it is not the top presented view controller. Will probably crash now.");
    }
    BOOL trulyAnimated = animated;
    UIViewController* presenter = [controller presentingViewController];
    
    if ([TiUtils isIOS8OrGreater]) {
        if ([presenter isKindOfClass:[UIAlertController class]]) {
            if (((UIAlertController*)presenter).preferredStyle == UIAlertControllerStyleAlert ) {
                trulyAnimated = NO;
            }
        }
    }
    [presenter dismissViewControllerAnimated:trulyAnimated completion:^{
        if (presenter == self) {
            [self didCloseWindow:nil];
        } else {
            [self dismissKeyboard];
            
            if ([presenter respondsToSelector:@selector(viewProxy)]) {
                id theProxy = [(id)presenter viewProxy];
                if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
                    [(id<TiWindowProtocol>)theProxy gainFocus];
                }
            } else if ([TiUtils isIOS8OrGreater]){
                //This code block will only execute when errorController is presented on top of an alert
                if ([presenter isKindOfClass:[UIAlertController class]] && (((UIAlertController*)presenter).preferredStyle == UIAlertControllerStyleAlert)) {
                    UIViewController* alertPresenter = [presenter presentingViewController];
                    [alertPresenter dismissViewControllerAnimated:NO completion:^{
                        [alertPresenter presentViewController:presenter animated:NO completion:nil];
                    }];
                }
            }
        }
    }];
}
-(NSUInteger)supportedOrientationsForAppDelegate
{
    return 0;
}
-(void)setBackgroundColor:(UIColor*)color
{
    [[self hostingView] setBackgroundColor:color];
}
-(void)setBackgroundImage:(UIImage*)image
{
    [[self hostingView] setBackgroundColor:[UIColor colorWithPatternImage:image]];
}
-(void)incrementActiveAlertControllerCount
{
    if ([TiUtils isIOS8OrGreater]){
        ++_activeAlertControllerCount;
    }
}
-(void)decrementActiveAlertControllerCount
{
    if ([TiUtils isIOS8OrGreater]) {
        --_activeAlertControllerCount;
        if (_activeAlertControllerCount == 0) {
            UIViewController* topVC = [self topPresentedController];
            if (topVC == self) {
                [self didCloseWindow:nil];
            } else {
                [self dismissKeyboard];
                
                if ([topVC respondsToSelector:@selector(proxy)]) {
                    id theProxy = [(id)topVC proxy];
                    if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
                        [(id<TiWindowProtocol>)theProxy gainFocus];
                    }
                }
            }
        }
    }
}

-(TiLayoutViewController*)topContainerController;
{
    return [[[[TiApp app] controller] childViewControllers] lastObject];
}
-(UIViewController*)topPresentedController
{
    return [self topPresentedControllerCheckingPopover:NO];
}

-(UIViewController*)topPresentedControllerCheckingPopover:(BOOL)checkPopover
{
    UIViewController* topmostController = [TiApp controller];
    UIViewController* presentedViewController = nil;
    while ( topmostController != nil ) {
        presentedViewController = [topmostController presentedViewController];
        if ((presentedViewController != nil) && checkPopover && [TiUtils isIOS8OrGreater]) {
            if (presentedViewController.modalPresentationStyle == UIModalPresentationPopover) {
                presentedViewController = nil;
            } else if ([presentedViewController isKindOfClass:[UIAlertController class]]) {
                presentedViewController = nil;
            }
        }
        if (presentedViewController != nil) {
            topmostController = presentedViewController;
            presentedViewController = nil;
        }
        else {
            break;
        }
    }
    return topmostController;
}

-(BOOL)statusBarInitiallyHidden
{
    return _statusBarInitiallyHidden;
}

-(TiLayoutView*)hostingView
{
    return (TiLayoutView*)[self view];
}

#if defined(DEBUG) || defined(DEVELOPER)
-(void)shutdownUi:(id)arg
{
    //FIRST DISMISS ALL MODAL WINDOWS
    UIViewController* topVC = [self topPresentedController];
    if (topVC != self) {
        UIViewController* presenter = [topVC presentingViewController];
        [presenter dismissViewControllerAnimated:NO completion:^{
            [self shutdownUi:arg];
        }];
        return;
    }
    LOG_MISSING
    //At this point all modal stuff is done. Go ahead and clean up proxies.
//    NSArray* modalCopy = [modalWindows copy];
//    NSArray* windowCopy = [containedWindows copy];
//    
//    if(modalCopy != nil) {
//        for (TiViewProxy* theWindow in [modalCopy reverseObjectEnumerator]) {
//            [theWindow windowWillClose];
//            [theWindow windowDidClose];
//        }
//        [modalCopy release];
//    }
//    if (windowCopy != nil) {
//        for (TiViewProxy* theWindow in [windowCopy reverseObjectEnumerator]) {
//            [theWindow windowWillClose];
//            [theWindow windowDidClose];
//        }
//        [windowCopy release];
//    }
    
    DebugLog(@"[INFO] UI SHUTDOWN COMPLETE. TRYING TO RESUME RESTART");
    if ([arg respondsToSelector:@selector(_resumeRestart:)]) {
        [arg performSelector:@selector(_resumeRestart:) withObject:nil];
    } else {
        DebugLog(@"[WARN] Could not resume. No selector _resumeRestart: found for arg");
    }
}
#endif

-(void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy
{
    _keyboardVisible = YES;
    [self setKeyboardFocusedProxy: visibleProxy];
}
-(void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy
{
    [self setKeyboardFocusedProxy: nil];
    _keyboardVisible = NO;
}

-(void)handleNewKeyboardStatus
{
    LOG_MISSING
}
- (BOOL)prefersStatusBarHidden
{
    BOOL oldStatus = _statusBarIsHidden;
    if ([[self childViewControllers] count] > 0) {
        _statusBarIsHidden = [[[self topContainerController] viewProxy] hidesStatusBar];
//        if ([TiUtils isIOS8OrGreater] && curTransformAngle != 0) {
//            _statusBarIsHidden = YES;
//        }
    } else {
        _statusBarIsHidden = oldStatus = _statusBarInitiallyHidden;
    }
    
    
    _statusBarVisibilityChanged = (_statusBarIsHidden != oldStatus);
    return _statusBarIsHidden;
}

@end
