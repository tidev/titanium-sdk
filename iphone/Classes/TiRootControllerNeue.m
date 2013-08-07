//
//  TiRootControllerNeue.m
//  Titanium
//
//  Created by Vishal Duggal on 7/30/13.
//
//

#import "TiRootControllerNeue.h"
#import "TiUtils.h"
#import "TiApp.h"
#import "TiLayoutQueue.h"

@interface TiRootViewNeue : UIView
@end

@implementation TiRootViewNeue

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	if (event.type == UIEventTypeMotion && event.subtype == UIEventSubtypeMotionShake)
	{
        [[NSNotificationCenter defaultCenter] postNotificationName:kTiGestureShakeNotification object:event];
    }
}

- (BOOL)canBecomeFirstResponder
{
	return YES;
}

@end

@interface TiRootControllerNeue (notifications_internal)
-(void)didOrientNotify:(NSNotification *)notification;
-(void)keyboardWillHide:(NSNotification*)notification;
-(void)keyboardWillShow:(NSNotification*)notification;
-(void)keyboardDidHide:(NSNotification*)notification;
-(void)keyboardDidShow:(NSNotification*)notification;
@end

@implementation TiRootControllerNeue

-(void)dealloc
{
	RELEASE_TO_NIL(_bgColor);
	RELEASE_TO_NIL(_bgImage);
    RELEASE_TO_NIL(_containedWindows);
    RELEASE_TO_NIL(_modalWindows);
    
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	NSNotificationCenter * nc = [NSNotificationCenter defaultCenter];
	[nc removeObserver:self];
	[super dealloc];
}

- (id) init
{
    self = [super init];
    if (self != nil) {
        orientationHistory[0] = UIInterfaceOrientationPortrait;
        orientationHistory[1] = UIInterfaceOrientationLandscapeLeft;
        orientationHistory[2] = UIInterfaceOrientationLandscapeRight;
        orientationHistory[3] = UIInterfaceOrientationPortraitUpsideDown;
		
        //Keyboard initialization
        leaveCurve = UIViewAnimationCurveEaseIn;
        enterCurve = UIViewAnimationCurveEaseIn;
        leaveDuration = 0.3;
        enterDuration = 0.3;
        
        _defaultOrientations = TiOrientationNone;
        _allowedOrientations = TiOrientationPortrait;
        _containedWindows = [[NSMutableArray alloc] init];
        _modalWindows = [[NSMutableArray alloc] init];
        /*
         *	Default image view -- Since this goes away after startup, it's made here and
         *	nowhere else. We don't do this during loadView because it's possible that
         *	the view will be unloaded (by, perhaps a Memory warning while a modal view
         *	controller and loaded at a later time.
         */
        _defaultImageView = [[UIImageView alloc] init];
        [_defaultImageView setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth];
        [_defaultImageView setContentMode:UIViewContentModeScaleToFill];
		
        //Notifications
        WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
        [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
        NSNotificationCenter * nc = [NSNotificationCenter defaultCenter];
        [nc addObserver:self selector:@selector(didOrientNotify:) name:UIDeviceOrientationDidChangeNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardDidHide:) name:UIKeyboardDidHideNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardDidShow:) name:UIKeyboardDidShowNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
        
        [TiUtils configureController:self withObject:nil];
    }
    return self;
}

-(void)loadView
{
    TiRootViewNeue *rootView = [[TiRootViewNeue alloc] initWithFrame:[[UIScreen mainScreen] applicationFrame]];
    self.view = rootView;
    rootView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    [self updateBackground];
    if (_defaultImageView != nil) {
        //[self rotateDefaultImageViewToOrientation:UIInterfaceOrientationPortrait];
        [rootView addSubview:_defaultImageView];
    }
    [rootView becomeFirstResponder];
    [rootView release];
}


#pragma mark - Notifications Internal
-(void)didOrientNotify:(NSNotification *)notification
{
    NSLog(@"BREAK HERE");
}

-(void)keyboardWillHide:(NSNotification*)notification
{
    keyboardVisible = NO;
}

-(void)keyboardWillShow:(NSNotification*)notification
{
    keyboardVisible = YES;
}

-(void)keyboardDidHide:(NSNotification*)notification
{
    
}

-(void)keyboardDidShow:(NSNotification*)notification
{
    
}


#pragma mark - TiRootControllerProtocol
//Background Control
-(void)updateBackground
{
	UIView * ourView = [self view];
	UIColor * chosenColor = (_bgColor==nil)?[UIColor blackColor]:_bgColor;
	[ourView setBackgroundColor:chosenColor];
	[[ourView superview] setBackgroundColor:chosenColor];
	if (_bgColor!=nil)
	{
		[[ourView layer] setContents:(id)_bgImage.CGImage];
	}
	else
	{
		[[ourView layer] setContents:nil];
	}
}

-(void)setBackgroundImage:(UIImage*)newImage
{
    if ((newImage == _bgImage) || [_bgImage isEqual:newImage]) {
        return;
    }
    [_bgImage release];
	_bgImage = [newImage retain];
	TiThreadPerformOnMainThread(^{[self updateBackground];}, NO);
}

-(void)setBackgroundColor:(UIColor*)newColor
{
    if ((newColor == _bgColor) || [_bgColor isEqual:newColor]) {
        return;
    }
    [_bgColor release];
	_bgColor = [newColor retain];
	TiThreadPerformOnMainThread(^{[self updateBackground];}, NO);
}

-(void)dismissDefaultImage
{
    if (_defaultImageView == nil) {
        return;
    }
    [_defaultImageView removeFromSuperview];
    RELEASE_TO_NIL(_defaultImageView);
}

//Keyboard stuff
-(BOOL)keyboardVisible
{
    return keyboardVisible;
}

-(void)dismissKeyboard
{
    [keyboardFocusedProxy blur:nil];
}

-(void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy
{
    
}

-(void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)blurredProxy
{
    
}

//ViewController stuff

-(TiOrientationFlags)getDefaultOrientations
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

-(UIViewController*)topPresentedController
{
    UIViewController* topmostController = self;
    UIViewController* presentedViewController = nil;
    while ( topmostController != nil ) {
        presentedViewController = [topmostController presentedViewController];
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

-(UIViewController<TiControllerContainment>*)topContainerController;
{
    UIViewController* topmostController = self;
    UIViewController* presentedViewController = nil;
    UIViewController<TiControllerContainment>* result = nil;
    UIViewController<TiControllerContainment>* match = nil;
    while (topmostController != nil) {
        if ([topmostController conformsToProtocol:@protocol(TiControllerContainment)]) {
            match = (UIViewController<TiControllerContainment>*)topmostController;
            if ([match canHostWindows]) {
                result = match;
            }
        }
        presentedViewController = [topmostController presentedViewController];
        if (presentedViewController != nil) {
            topmostController = presentedViewController;
            presentedViewController = nil;
        }
        else {
            break;
        }
    }
    
    return result;
}

-(CGRect)resizeView
{
    CGRect rect = [[UIScreen mainScreen] applicationFrame];
    if ([TiUtils isIOS7OrGreater]) {
        //TODO. Check for fullscreen params
    } else {
        [[self view] setFrame:rect];
    }
    return [[self view]bounds];
}

-(void)repositionSubviews
{
    for (id<TiWindowProtocol> thisWindow in [_containedWindows reverseObjectEnumerator]) {
        [TiLayoutQueue layoutProxy:(TiViewProxy*)thisWindow];
    }
}

#pragma mark - TiControllerContainment
-(BOOL)canHostWindows
{
    return YES;
}

-(void)willOpenWindow:(id<TiWindowProtocol>)theWindow
{
    [[_containedWindows lastObject] resignFocus];
    if ([theWindow isModal]) {
        [_modalWindows addObject:theWindow];
        //If opening a modal window we will rotate before modal window is presented.
        //[self refreshOrientationWithDuration:0.0];
    } else {
        [_containedWindows addObject:theWindow];
    }
    theWindow.parentOrientationController = self;
}

-(void)didOpenWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    if ([self presentedViewController] == nil) {
        [self childOrientationControllerChangedFlags:[_containedWindows lastObject]];
        [[_containedWindows lastObject] gainFocus];
    }
    [self dismissDefaultImage];
}

-(void)willCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [theWindow resignFocus];
    if ([theWindow isModal]) {
        [_modalWindows removeObject:theWindow];
    } else {
        [_containedWindows removeObject:theWindow];
    }
    theWindow.parentOrientationController = nil;
}

-(void)didCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    if ([self presentedViewController] == nil) {
        [self childOrientationControllerChangedFlags:[_containedWindows lastObject]];
        [[_containedWindows lastObject] gainFocus];
    }
}

-(void)showControllerModal:(UIViewController*)theController animated:(BOOL)animated
{
    UIViewController* topVC = [self topPresentedController];
    [topVC presentViewController:theController animated:animated completion:nil];
}

-(void)hideControllerModal:(UIViewController*)theController animated:(BOOL)animated
{
    UIViewController* topVC = [self topPresentedController];
    if (topVC != theController) {
        DebugLog(@"[WARN] Dismissing a view controller when it is not the top presented view controller. Will probably crash now.");
    }
    UIViewController* presenter = [theController presentingViewController];
    [presenter dismissViewControllerAnimated:animated completion:nil];
}


#pragma mark - Orientation Control
-(UIInterfaceOrientation) lastValidOrientation
{
	for (int i = 0; i<4; i++) {
		if ([self shouldRotateToInterfaceOrientation:orientationHistory[i]]) {
			return orientationHistory[i];
		}
	}
	//This line should never happen, but just in case...
	return UIInterfaceOrientationPortrait;
}

- (BOOL)shouldRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
{
    TiOrientationFlags result2 = TiOrientationNone;
    TI_ORIENTATION_SET(result2, toInterfaceOrientation);
    BOOL result = TI_ORIENTATION_ALLOWED([self orientationFlags],toInterfaceOrientation) ? YES : NO;
    if (result == YES) {
        NSLog(@"ROOT YES I WILL ROTATE %d %d",[self orientationFlags], result2);
    } else {
        NSLog(@"ROOT NO I WILL NOT ROTATE %d %d", [self orientationFlags], result2);
    }
    return result;
}


//IOS5 support. Begin Section. Drop in 3.2

- (BOOL)automaticallyForwardAppearanceAndRotationMethodsToChildViewControllers
{
    return YES;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
{
    return [self shouldRotateToInterfaceOrientation:toInterfaceOrientation];
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
    //IOS6. If forcing status bar orientation, this must return 0.
    if (forcingStatusBarOrientation) {
        return 0;
    }
    //IOS6. If we are presenting a modal view controller, get the supported
    //orientations from the modal view controller
    UIViewController* topmostController = [self topPresentedController];
    if (topmostController != self) {
        //If I am a modal window then send out orientationFlags property
        if ([topmostController isKindOfClass:[UINavigationController class]]) {
            UIViewController* topVC = [(UINavigationController *)topmostController topViewController];
            if ( (topVC != nil) && ([topVC conformsToProtocol:@protocol(TiOrientationController)]) ) {
                return [(id<TiOrientationController>)topVC orientationFlags];
            }
        }
        //Send out whatever the View Controller supports
        NSUInteger retVal = [topmostController supportedInterfaceOrientations];
        if ([topmostController respondsToSelector:@selector(isBeingDismissed)]) {
            if ([topmostController isBeingDismissed]) {
                retVal = retVal | [self orientationFlags];
            }
        }
        return retVal;
    }
    return [self orientationFlags];
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    //TO DO
    return [self lastValidOrientation];
}


-(void)refreshOrientationWithDuration:(NSTimeInterval)theDuration
{
    if (![[TiApp app] windowIsKeyWindow]) {
        VerboseLog(@"[DEBUG] RETURNING BECAUSE WE ARE NOT KEY WINDOW");
        return;
    }
    
    UIInterfaceOrientation targetOrientation = [self lastValidOrientation];
    if ([[UIApplication sharedApplication] statusBarOrientation] != targetOrientation) {
        [self manuallyRotateToOrientation:targetOrientation duration:theDuration];
    }
}

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration
{
    UIApplication * ourApp = [UIApplication sharedApplication];
    UIInterfaceOrientation oldOrientation = [ourApp statusBarOrientation];
    CGAffineTransform transform;

    switch (newOrientation) {
        case UIInterfaceOrientationPortraitUpsideDown:
            transform = CGAffineTransformMakeRotation(M_PI);
            break;
        case UIInterfaceOrientationLandscapeLeft:
            transform = CGAffineTransformMakeRotation(-M_PI_2);
            break;
        case UIInterfaceOrientationLandscapeRight:
            transform = CGAffineTransformMakeRotation(M_PI_2);
            break;
        default:
            transform = CGAffineTransformIdentity;
            break;
    }
    
    [self willRotateToInterfaceOrientation:newOrientation duration:duration];
	
    // Have to batch all of the animations together, so that it doesn't look funky
    if (duration > 0.0) {
        [UIView beginAnimations:@"orientation" context:nil];
        [UIView setAnimationDuration:duration];
    }
    
    if ((newOrientation != oldOrientation) && isCurrentlyVisible) {
        TiViewProxy<TiKeyboardFocusableView> *kfvProxy = [keyboardFocusedProxy retain];
        BOOL focusAfterBlur = [kfvProxy focused];
        if (focusAfterBlur) {
            [kfvProxy blur:nil];
        }
        forcingStatusBarOrientation = YES;
        [ourApp setStatusBarOrientation:newOrientation animated:(duration > 0.0)];
        forcingStatusBarOrientation = NO;
        if (focusAfterBlur) {
            [kfvProxy focus:nil];
        }
        [kfvProxy release];
    }

    UIView * ourView = [self view];
    [ourView setTransform:transform];
    [self resizeView];

    [self willAnimateRotationToInterfaceOrientation:newOrientation duration:duration];

    //Propigate this to everyone else. This has to be done INSIDE the animation.
    [self repositionSubviews];

    if (duration > 0.0) {
        [UIView commitAnimations];
    }

    [self didRotateFromInterfaceOrientation:oldOrientation];
}

#pragma mark - TiOrientationController
-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;
{
	WARN_IF_BACKGROUND_THREAD_OBJ;
	/**
     * Essentially we are going to rotate the status bar here
     */
    [self refreshOrientationWithDuration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
}

-(void)setParentOrientationController:(id <TiOrientationController>)newParent
{
	//Blank method since we never have a parent.
}

-(id)parentOrientationController
{
	//Blank method since we never have a parent.
	return nil;
}

-(TiOrientationFlags) orientationFlags
{
    TiOrientationFlags result = TiOrientationNone;
    
    for (id<TiWindowProtocol> thisWindow in [_containedWindows reverseObjectEnumerator])
    {
         if ([thisWindow closing] == NO) {
             result = [thisWindow orientationFlags];
             if (result != TiOrientationNone)
             {
                 return result;
             }
         }
    }
    
    for (id<TiWindowProtocol> thisWindow in [_containedWindows reverseObjectEnumerator])
    {
        if ([thisWindow closing] == NO) {
            result = [thisWindow orientationFlags];
            if (result != TiOrientationNone)
            {
                return result;
            }
        }
    }
    return [self getDefaultOrientations];
}

#pragma mark - Appearance and rotation callbacks

//Containing controller will call these callbacks(appearance/rotation) on contained windows when it receives them.
-(void)viewWillAppear:(BOOL)animated
{
    TiThreadProcessPendingMainThreadBlocks(0.1, YES, nil);
    for (id<TiWindowProtocol> thisWindow in _containedWindows) {
        [thisWindow viewWillAppear:animated];
    }
    [super viewWillAppear:animated];
}
-(void)viewWillDisappear:(BOOL)animated
{
    for (id<TiWindowProtocol> thisWindow in _containedWindows) {
        [thisWindow viewWillDisappear:animated];
    }
    [[_containedWindows lastObject] resignFocus];
    [super viewWillDisappear:animated];
}
-(void)viewDidAppear:(BOOL)animated
{
    isCurrentlyVisible = YES;
    if ([_containedWindows count] > 0) {
        [self refreshOrientationWithDuration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
    }
    for (id<TiWindowProtocol> thisWindow in _containedWindows) {
        [thisWindow viewDidAppear:animated];
    }
    [[_containedWindows lastObject] gainFocus];
    [super viewDidAppear:animated];
}
-(void)viewDidDisappear:(BOOL)animated
{
    isCurrentlyVisible = NO;
    for (id<TiWindowProtocol> thisWindow in _containedWindows) {
        [thisWindow viewDidDisappear:animated];
    }
    [super viewDidDisappear:animated];
}
-(void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    for (id<TiWindowProtocol> thisWindow in _containedWindows) {
        [thisWindow willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    for (id<TiWindowProtocol> thisWindow in _containedWindows) {
        [thisWindow willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    for (id<TiWindowProtocol> thisWindow in _containedWindows) {
        [thisWindow didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    }
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
}

@end
