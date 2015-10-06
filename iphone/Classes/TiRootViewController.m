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
        defaultImageView = [[UIImageView alloc] init];
        [defaultImageView setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth];
        [defaultImageView setContentMode:UIViewContentModeScaleToFill];
        _defaultOrientations = TiOrientationNone;
        [self processInfoPlist];
    }
    return self;
}

-(void)loadView
{
    [super loadView];
    _hostingView = [[TiLayoutView alloc] init];
    [[self view] addSubview:_hostingView];
    if (defaultImageView != nil) {
        [self rotateDefaultImageViewToOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
        [[self view] addSubview:defaultImageView];
    }
    [_hostingView becomeFirstResponder];
    [_hostingView release];
    
    [self updateStatusBar];
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
    id vcbasedStatHidden = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"];
    viewControllerControlsStatusBar = [TiUtils boolValue:vcbasedStatHidden def:YES];
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

-(void)forceOrientationChange:(BOOL)forceAnyway
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
    if (result == 0 || force || forceAnyway) {
        UIApplication *app = [UIApplication sharedApplication];
        UIWindow *window = [app keyWindow];
        UIViewController* root = [window rootViewController];
        window.rootViewController = nil;
        window.rootViewController = root;
    }
}

- (UIInterfaceOrientationMask)supportedInterfaceOrientations
{
    UIInterfaceOrientationMask mask;
    UIViewController* c = [self topContainerController];
    if (c == nil) {
        mask = (UIInterfaceOrientationMask)[self defaultOrientations];
    } else {
        mask = [c supportedInterfaceOrientations];
    }
    return mask;
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
    [self forceOrientationChange:NO];
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
    [self forceOrientationChange:NO];
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
    if (defaultImageView != nil) {
        [defaultImageView setHidden:YES];
        [defaultImageView removeFromSuperview];
        RELEASE_TO_NIL(defaultImageView);
    }
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

- (UIImage*)defaultImageForOrientation:(UIDeviceOrientation) orientation resultingOrientation:(UIDeviceOrientation *)imageOrientation idiom:(UIUserInterfaceIdiom*) imageIdiom
{
    UIImage* image;
    
    if([[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPad)
    {
        *imageOrientation = orientation;
        *imageIdiom = UIUserInterfaceIdiomPad;
        // Specific orientation check
        switch (orientation) {
            case UIDeviceOrientationPortrait:
            case UIDeviceOrientationPortraitUpsideDown:
                image = [UIImage imageNamed:@"LaunchImage-700-Portrait"];
                break;
            case UIDeviceOrientationLandscapeLeft:
            case UIDeviceOrientationLandscapeRight:
                image = [UIImage imageNamed:@"LaunchImage-700-Landscape"];
                break;
            default:
                image = nil;
        }
        if (image != nil) {
            return image;
        }
        
        // Generic orientation check
        if (UIDeviceOrientationIsPortrait(orientation)) {
            image = [UIImage imageNamed:@"LaunchImage-700-Portrait"];
        }
        else if (UIDeviceOrientationIsLandscape(orientation)) {
            image = [UIImage imageNamed:@"LaunchImage-700-Landscape"];
        }
        
        if (image != nil) {
            return image;
        }
    }
    *imageOrientation = UIDeviceOrientationPortrait;
    *imageIdiom = UIUserInterfaceIdiomPhone;
    // Default
    image = nil;
    if ([TiUtils isRetinaHDDisplay]) {
        if (UIDeviceOrientationIsPortrait(orientation)) {
            image = [UIImage imageNamed:@"LaunchImage-800-Portrait-736h@3x"];
        }
        else if (UIDeviceOrientationIsLandscape(orientation)) {
            image = [UIImage imageNamed:@"LaunchImage-800-Landscape-736h@3x"];
        }
        if (image!=nil) {
            *imageOrientation = orientation;
            return image;
        }
    }
    if ([TiUtils isRetinaiPhone6]) {
        image = [UIImage imageNamed:@"LaunchImage-800-667h"];
        if (image!=nil) {
            return image;
        }
    }
    if ([TiUtils isRetinaFourInch]) {
        image = [UIImage imageNamed:@"LaunchImage-700-568h@2x"];
        if (image!=nil) {
            return image;
        }
    }
    
    return [UIImage imageNamed:@"LaunchImage-700@2x"];
}

-(void)rotateDefaultImageViewToOrientation: (UIInterfaceOrientation )newOrientation;
{
    if (defaultImageView == nil)
    {
        return;
    }
    UIDeviceOrientation imageOrientation;
    UIUserInterfaceIdiom imageIdiom;
    UIUserInterfaceIdiom deviceIdiom = [[UIDevice currentDevice] userInterfaceIdiom];
    /*
     *	This code could stand for some refinement, but it is rarely called during
     *	an application's lifetime and is meant to recreate the quirks and edge cases
     *	that iOS uses during application startup, including Apple's own
     *	inconsistencies between iPad and iPhone.
     */
    
    UIImage * defaultImage = [self defaultImageForOrientation:
                              (UIDeviceOrientation)newOrientation
                                         resultingOrientation:&imageOrientation idiom:&imageIdiom];
    
    CGFloat imageScale = [defaultImage scale];
    CGRect newFrame = [[self view] bounds];
    CGSize imageSize = [defaultImage size];
    UIViewContentMode contentMode = UIViewContentModeScaleToFill;
    
    if (imageOrientation == UIDeviceOrientationPortrait) {
        if (newOrientation == UIInterfaceOrientationLandscapeLeft) {
            UIImageOrientation imageOrientation;
            if (deviceIdiom == UIUserInterfaceIdiomPad)
            {
                imageOrientation = UIImageOrientationLeft;
            }
            else
            {
                imageOrientation = UIImageOrientationRight;
            }
            defaultImage = [
                            UIImage imageWithCGImage:[defaultImage CGImage] scale:imageScale orientation:imageOrientation];
            imageSize = CGSizeMake(imageSize.height, imageSize.width);
            if (imageScale > 1.5) {
                contentMode = UIViewContentModeCenter;
            }
        }
        else if(newOrientation == UIInterfaceOrientationLandscapeRight)
        {
            defaultImage = [UIImage imageWithCGImage:[defaultImage CGImage] scale:imageScale orientation:UIImageOrientationLeft];
            imageSize = CGSizeMake(imageSize.height, imageSize.width);
            if (imageScale > 1.5) {
                contentMode = UIViewContentModeCenter;
            }
        }
        else if((newOrientation == UIInterfaceOrientationPortraitUpsideDown) && (deviceIdiom == UIUserInterfaceIdiomPhone))
        {
            defaultImage = [UIImage imageWithCGImage:[defaultImage CGImage] scale:imageScale orientation:UIImageOrientationDown];
            if (imageScale > 1.5) {
                contentMode = UIViewContentModeCenter;
            }
        }
    }
    
    if(imageSize.width == newFrame.size.width)
    {
        CGFloat overheight;
        overheight = imageSize.height - newFrame.size.height;
        if (overheight > 0.0) {
            newFrame.origin.y -= overheight;
            newFrame.size.height += overheight;
        }
    }
    [defaultImageView setContentMode:contentMode];
    [defaultImageView setImage:defaultImage];
    [defaultImageView setFrame:newFrame];
}

-(CGRect)resizeView
{
    CGRect rect = [TiUtils frameForController:self];
    [[self view] setFrame:rect];
    return [[self view]bounds];
}


- (void) updateStatusBar
{
    if (viewControllerControlsStatusBar) {
        [self performSelector:@selector(setNeedsStatusBarAppearanceUpdate) withObject:nil];
    } else {
        [[UIApplication sharedApplication] setStatusBarHidden:[self prefersStatusBarHidden] withAnimation:UIStatusBarAnimationNone];
        [[UIApplication sharedApplication] setStatusBarStyle:[self preferredStatusBarStyle] animated:NO];
        [self resizeView];
    }
}

@end
