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
    while (topmostController != nil) {
        if ([topmostController conformsToProtocol:@protocol(TiControllerContainment)]) {
            result = (UIViewController<TiControllerContainment>*)topmostController;
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

#pragma mark - TiControllerContainment
-(void)willOpenWindow:(id<TiWindowProtocol>)theWindow
{
    [_containedWindows addObject:theWindow];
    UIViewController<TiOrientationController>* contentController = [theWindow contentController];
    [self addChildViewController:contentController];
    contentController.parentOrientationController = self;
}

-(void)didOpenWindow:(id<TiWindowProtocol>)theWindow
{
    UIViewController<TiOrientationController>* contentController = [theWindow contentController];
    [contentController didMoveToParentViewController:self];
    [self dismissKeyboard];
    BOOL isLoaded = [contentController isViewLoaded];
    if (!isLoaded) {
        NSLog(@"WINDOW OPENED BUT CONTROLLER SAYING NOT LOADED. WTF");
    }
    [self childOrientationControllerChangedFlags:contentController];
}

-(void)willCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [_containedWindows removeObject:theWindow];
    UIViewController<TiOrientationController>* contentController = [theWindow contentController];
    [contentController willMoveToParentViewController:nil];
    contentController.parentOrientationController = nil;
}

-(void)didCloseWindow:(id<TiWindowProtocol>)theWindow
{
    UIViewController<TiOrientationController>* contentController = [theWindow contentController];
    [contentController removeFromParentViewController];
    [self childOrientationControllerChangedFlags:contentController];
    [self dismissKeyboard];
}

#pragma mark - Orientation Control
-(UIInterfaceOrientation) lastValidOrientation
{
	for (int i = 0; i<4; i++) {
		if ([self shouldAutorotateToInterfaceOrientation:orientationHistory[i]]) {
			return orientationHistory[i];
		}
	}
	//This line should never happen, but just in case...
	return UIInterfaceOrientationPortrait;
}


//IOS5 support. Begin Section. Drop in 3.2

- (BOOL)automaticallyForwardAppearanceAndRotationMethodsToChildViewControllers
{
    return YES;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
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

#pragma mark - TiOrientationController
-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;
{
	WARN_IF_BACKGROUND_THREAD_OBJ;
	/**
     * Essentially we are going to rotate the status bar here
     */
    UIInterfaceOrientation targetOrientation = [self lastValidOrientation];
    if ([[UIApplication sharedApplication] statusBarOrientation] != targetOrientation) {
        forcingStatusBarOrientation = YES;
        [[UIApplication sharedApplication] setStatusBarOrientation:targetOrientation animated:NO];
        forcingStatusBarOrientation = NO;
        UIViewController *c = [[UIViewController alloc]init];
        [self presentModalViewController:c animated:NO];
        [self dismissModalViewControllerAnimated:NO];
        [c release];
    }
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
    if ([_containedWindows count] > 0) {
        return [[[_containedWindows lastObject] contentController] orientationFlags];
    }
    return [self getDefaultOrientations];
}

- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    NSLog(@"ROOT I WILL ROTATE from %d MY FLAGS ARE %d",toInterfaceOrientation, [self orientationFlags]);
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    NSLog(@"I DID ROTATE from %d MY FLAGS ARE %d",fromInterfaceOrientation, [self orientationFlags]);
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    
}


@end
