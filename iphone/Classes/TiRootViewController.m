/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRootViewController.h"
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

@interface TiRootViewController (notifications_internal)
-(void)didOrientNotify:(NSNotification *)notification;
-(void)keyboardWillHide:(NSNotification*)notification;
-(void)keyboardWillShow:(NSNotification*)notification;
-(void)keyboardDidHide:(NSNotification*)notification;
-(void)keyboardDidShow:(NSNotification*)notification;
@end

@implementation TiRootViewController

@synthesize keyboardFocusedProxy = keyboardFocusedProxy;

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
    [rootView setBackgroundColor:[UIColor yellowColor]];
    [rootView release];
}


#pragma mark - Notifications Internal
-(void)didOrientNotify:(NSNotification *)notification
{
    NSLog(@"BREAK HERE");
}

- (void)keyboardWillHide:(NSNotification*)notification
{
	NSDictionary *userInfo = [notification userInfo];
	leaveCurve = [[userInfo valueForKey:UIKeyboardAnimationCurveUserInfoKey] intValue];
	leaveDuration = [[userInfo valueForKey:UIKeyboardAnimationDurationUserInfoKey] floatValue];
	[self extractKeyboardInfo:userInfo];
	keyboardVisible = NO;
    
	if(!updatingAccessoryView)
	{
		updatingAccessoryView = YES;
		[self performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.0];
	}
    
}

- (void)keyboardWillShow:(NSNotification*)notification
{
	NSDictionary *userInfo = [notification userInfo];
	enterCurve = [[userInfo valueForKey:UIKeyboardAnimationCurveUserInfoKey] intValue];
	enterDuration = [[userInfo valueForKey:UIKeyboardAnimationDurationUserInfoKey] floatValue];
	[self extractKeyboardInfo:userInfo];
	keyboardVisible = YES;
    
	if(!updatingAccessoryView)
	{
		updatingAccessoryView = YES;
		[self performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.0];
	}
}

- (void)adjustKeyboardHeight:(NSNumber*)_keyboardVisible
{
    if ( (updatingAccessoryView == NO) && ([TiUtils boolValue:_keyboardVisible] == keyboardVisible) ) {
        updatingAccessoryView = YES;
        [self performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.0];
        if (!keyboardVisible) {
            RELEASE_TO_NIL_AUTORELEASE(keyboardFocusedProxy);
        }
    }
}

- (void)keyboardDidHide:(NSNotification*)notification
{
	startFrame = endFrame;
    [self performSelector:@selector(adjustKeyboardHeight:) withObject:[NSNumber numberWithBool:NO] afterDelay:leaveDuration];
}

- (void)keyboardDidShow:(NSNotification*)notification
{
	startFrame = endFrame;
    //The endingFrame is not always correctly calculated when rotating.
    //This method call ensures correct calculation at the end
    //See TIMOB-8720 for a test case
    [self performSelector:@selector(adjustKeyboardHeight:) withObject:[NSNumber numberWithBool:YES] afterDelay:enterDuration];
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

-(UIView *)viewForKeyboardAccessory;
{
	return [[[[TiApp app] window] subviews] lastObject];
}

-(void)extractKeyboardInfo:(NSDictionary *)userInfo
{
	NSValue *v = nil;
	CGRect endingFrame;
    
	v = [userInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
	
	if (v != nil)
	{
		endingFrame = [v CGRectValue];
	}
	else
	{
		v = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
		endingFrame = [v CGRectValue];
		v = [userInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
		CGPoint endingCenter = [v CGPointValue];
		endingFrame.origin.x = endingCenter.x - endingFrame.size.width/2.0;
		endingFrame.origin.y = endingCenter.y - endingFrame.size.height/2.0;
	}
    
	CGRect startingFrame;
	v = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
    
	if (v != nil)
	{
		startingFrame = [v CGRectValue];
	}
	else
	{
		startingFrame.size = endingFrame.size;
		v = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
		CGPoint startingCenter = [v CGPointValue];
		startingFrame.origin.x = startingCenter.x - startingFrame.size.width/2.0;
		startingFrame.origin.y = startingCenter.y - startingFrame.size.height/2.0;
	}
    
	startFrame = startingFrame;
	endFrame = endingFrame;
}

-(void) placeView:(UIView *)targetView nearTopOfRect:(CGRect)targetRect aboveTop:(BOOL)aboveTop
{
	CGRect viewFrame;
	viewFrame.size = [targetView frame].size;
	viewFrame.origin.x = targetRect.origin.x;
	if(aboveTop)
	{
		viewFrame.origin.y = targetRect.origin.y - viewFrame.size.height;
	}
	else
	{
		viewFrame.origin.y = targetRect.origin.y;
	}
	[targetView setFrame:viewFrame];
}

- (UIView *)keyboardAccessoryViewForProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy withView:(UIView **)proxyView
{
    //If the toolbar actually contains the view, then we have to give that precidence.
	if ([visibleProxy viewInitialized])
	{
		UIView * ourView = [visibleProxy view];
		*proxyView = ourView;
        
		while (ourView != nil)
		{
			if ((ourView == enteringAccessoryView) || (ourView == accessoryView) || (ourView == leavingAccessoryView))
			{
				//We found a match!
				*proxyView = nil;
				return ourView;
			}
			ourView = [ourView superview];
		}
	}
	else
	{
		*proxyView = nil;
	}
	return [visibleProxy keyboardAccessoryView];
}

-(void) handleNewKeyboardStatus
{
	updatingAccessoryView = NO;
	UIView * ourView = [self viewForKeyboardAccessory];
	CGRect endingFrame = [ourView convertRect:endFrame fromView:nil];
    
	//Sanity check. Look at our focused proxy, and see if we mismarked it as leaving.
	TiUIView * scrolledView;	//We check at the update anyways.
    
	UIView * focusedToolbar = [self keyboardAccessoryViewForProxy:keyboardFocusedProxy withView:&scrolledView];
	CGRect focusedToolbarBounds = CGRectMake(0, 0, endingFrame.size.width, [keyboardFocusedProxy keyboardAccessoryHeight]);
	[focusedToolbar setBounds:focusedToolbarBounds];
    
    CGFloat keyboardHeight = endingFrame.origin.y;
    if(focusedToolbar != nil){
        keyboardHeight -= focusedToolbarBounds.size.height;
    }
    
	if ((scrolledView != nil) && (keyboardHeight > 0))	//If this isn't IN the toolbar, then we update the scrollviews to compensate.
	{
		UIView * possibleScrollView = [scrolledView superview];
		NSMutableArray * confirmedScrollViews = nil;
		
		while (possibleScrollView != nil)
		{
			if ([possibleScrollView conformsToProtocol:@protocol(TiScrolling)])
			{
				if(confirmedScrollViews == nil)
				{
					confirmedScrollViews = [NSMutableArray arrayWithObject:possibleScrollView];
				}
				else
				{
					[confirmedScrollViews insertObject:possibleScrollView atIndex:0];
				}
			}
			possibleScrollView = [possibleScrollView superview];
		}
        
        UIView<TiScrolling> *confirmedScrollViewsLastObject = (UIView<TiScrolling> *)[confirmedScrollViews objectAtIndex:0];
        
        [confirmedScrollViewsLastObject keyboardDidShowAtHeight:keyboardHeight];
        [confirmedScrollViewsLastObject scrollToShowView:scrolledView withKeyboardHeight:keyboardHeight];
		
	}
    
	//This is if the keyboard is hiding or showing due to hardware.
	if ((accessoryView != nil) && !CGRectEqualToRect(targetedFrame, endingFrame))
	{
		targetedFrame = endingFrame;
		if([accessoryView superview] != ourView)
		{
			targetedFrame = [ourView convertRect:endingFrame toView:[accessoryView superview]];
		}
        
		[UIView beginAnimations:@"update" context:accessoryView];
		if (keyboardVisible)
		{
			[UIView setAnimationDuration:enterDuration];
			[UIView setAnimationCurve:enterCurve];
		}
		else
		{
			[UIView setAnimationDuration:leaveDuration];
			[UIView setAnimationCurve:leaveCurve];
		}
        
		[UIView setAnimationDelegate:self];
		[self placeView:accessoryView nearTopOfRect:targetedFrame aboveTop:YES];
		[UIView commitAnimations];
	}
    
    
    
	if (enteringAccessoryView != nil)
	{
		//Start animation to put it into place.
		if([enteringAccessoryView superview] != ourView)
		{
			[self placeView:enteringAccessoryView nearTopOfRect:[ourView convertRect:startFrame fromView:nil] aboveTop:NO];
			[[self viewForKeyboardAccessory] addSubview:enteringAccessoryView];
		}
		targetedFrame = endingFrame;
		[UIView beginAnimations:@"enter" context:enteringAccessoryView];
		[UIView setAnimationDuration:enterDuration];
		[UIView setAnimationCurve:enterCurve];
		[UIView setAnimationDelegate:self];
		[self placeView:enteringAccessoryView nearTopOfRect:endingFrame aboveTop:YES];
		[UIView commitAnimations];
		accessoryView = enteringAccessoryView;
		enteringAccessoryView = nil;
	}
	if (leavingAccessoryView != nil)
	{
		[UIView beginAnimations:@"exit" context:leavingAccessoryView];
		[UIView setAnimationDuration:leaveDuration];
		[UIView setAnimationCurve:leaveCurve];
		[UIView setAnimationDelegate:self];
		[self placeView:leavingAccessoryView nearTopOfRect:endingFrame aboveTop:NO];
		[UIView commitAnimations];
	}
    
}

-(void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy
{
	WARN_IF_BACKGROUND_THREAD_OBJ
    
	if ( (visibleProxy == keyboardFocusedProxy) && (leavingAccessoryView == nil) )
	{
		DeveloperLog(@"[WARN] Focused for %@<%X>, despite it already being the focus.",keyboardFocusedProxy,keyboardFocusedProxy);
		return;
	}
	if (nil != keyboardFocusedProxy)
	{
		DeveloperLog(@"[WARN] Focused for %@<%X>, despite %@<%X> already being the focus.",visibleProxy,visibleProxy,keyboardFocusedProxy,keyboardFocusedProxy);
		[self didKeyboardBlurOnProxy:keyboardFocusedProxy];
		RELEASE_TO_NIL_AUTORELEASE(keyboardFocusedProxy);
	}
	
	keyboardFocusedProxy = [visibleProxy retain];
	
	TiUIView * unused;	//We check at the update anyways.
	UIView * newView = [self keyboardAccessoryViewForProxy:visibleProxy withView:&unused];
    
	if ((newView == enteringAccessoryView) || (newView == accessoryView))
	{
		//We're already up or soon will be.
		//Note that this is valid where newView can be accessoryView despite a new visibleProxy.
		//Specifically, if one proxy's view is a subview of another's toolbar.
	}
	else
	{
		if(enteringAccessoryView != nil)
		{
			DebugLog(@"[WARN] Moving in view %@, despite %@ already in line to move in.",newView,enteringAccessoryView);
			[enteringAccessoryView release];
		}
		
		if (newView == leavingAccessoryView)
		{
			//Hold on, you're not leaving YET! We don't need to release you since we're going to retain right afterwards.
			enteringAccessoryView = newView;
			leavingAccessoryView = nil;
		}
		else
		{
			enteringAccessoryView = [newView retain];
		}
	}
	
	if(!updatingAccessoryView)
	{
		updatingAccessoryView = YES;
		[self performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.0];
	}
}

-(void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)blurredProxy
{
	WARN_IF_BACKGROUND_THREAD_OBJ
	if (blurredProxy != keyboardFocusedProxy)
	{
		DeveloperLog(@"[WARN] Blurred for %@<%X>, despite %@<%X> being the focus.",blurredProxy,blurredProxy,keyboardFocusedProxy,keyboardFocusedProxy);
		return;
	}
	
	//Question: Ideally (IE, shouldn't happen differently) the keyboardToolbar of the focusedProxy IS the accessoryView. Should we assume this?
	//TODO: This can probably be optimized, but since how rarely this happens....
	
	TiUIView * scrolledView;	//We check at the update anyways.
	UIView * doomedView = [self keyboardAccessoryViewForProxy:blurredProxy withView:&scrolledView];
    
	if(doomedView != accessoryView)
	{
		DeveloperLog(@"[WARN] Trying to blur out %@, but %@ is the one with focus.",doomedView,accessoryView);
		return;
	}
    
	if((doomedView == nil) || (leavingAccessoryView == doomedView)){
		//Nothing to worry about. No toolbar or it's on its way out.
		return;
	}
	
	if(leavingAccessoryView != nil)
	{
		DeveloperLog(@"[WARN] Trying to blur out %@, but %@ is already leaving focus.",accessoryView,leavingAccessoryView);
        [leavingAccessoryView removeFromSuperview];
		RELEASE_TO_NIL_AUTORELEASE(leavingAccessoryView);
	}
    
	leavingAccessoryView = accessoryView;
	accessoryView = nil;
    
	if(!updatingAccessoryView)
	{
		updatingAccessoryView = YES;
		[self performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.0];
	}
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
    CGRect statusBarFrame = [[UIApplication sharedApplication] statusBarFrame];
    if ([TiUtils isIOS7OrGreater]) {
        NSUInteger edges = [(id<TiUIViewControllerIOS7Support>)self edgesForExtendedLayout];
        //Check if I cover status bar
        if ((edges & 1/*UIRectEdgeTop*/) == 0) {
            [[self view] setFrame:rect];
        } else {
            rect.origin.y = 0;
            rect.size.height += statusBarFrame.size.height;
            [[self view] setFrame:rect];
        }
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
    //At this point all modal stuff is done. Go ahead and clean up proxies.
    NSArray* modalCopy = [_modalWindows copy];
    NSArray* windowCopy = [_containedWindows copy];
    
    if(modalCopy != nil) {
        for (TiViewProxy* theWindow in [modalCopy reverseObjectEnumerator]) {
            [theWindow windowWillClose];
            [theWindow windowDidClose];
        }
        [modalCopy release];
    }
    if (windowCopy != nil) {
        for (TiViewProxy* theWindow in [windowCopy reverseObjectEnumerator]) {
            [theWindow windowWillClose];
            [theWindow windowDidClose];
        }
        [windowCopy release];
    }
    
    DebugLog(@"[INFO] UI SHUTDOWN COMPLETE. TRYING TO RESUME RESTART");
    if ([arg respondsToSelector:@selector(_resumeRestart:)]) {
        [arg performSelector:@selector(_resumeRestart:) withObject:nil];
    } else {
        DebugLog(@"[WARN] Could not resume. No selector _resumeRestart: found in arg");
    }
}
#endif

#pragma mark - TiControllerContainment
-(BOOL)canHostWindows
{
    return YES;
}

-(void)willOpenWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    [[_containedWindows lastObject] resignFocus];
    if ([theWindow isModal]) {
        [_modalWindows addObject:theWindow];
    } else {
        [_containedWindows addObject:theWindow];
        [TiUtils configureController:self withObject:theWindow];
        [self resizeView];
        if (isCurrentlyVisible) {
            [theWindow viewWillAppear:YES];
        }
        theWindow.parentOrientationController = self;
    }
}

-(void)didOpenWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    if (isCurrentlyVisible) {
        [self childOrientationControllerChangedFlags:[_containedWindows lastObject]];
        [[_containedWindows lastObject] gainFocus];
        [theWindow viewDidAppear:YES];
        UIAccessibilityPostNotification(UIAccessibilityScreenChangedNotification, nil);
    }
    [self dismissDefaultImage];
}

-(void)willCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    [theWindow resignFocus];
    if ([theWindow isModal]) {
        [_modalWindows removeObject:theWindow];
    } else {
        [_containedWindows removeObject:theWindow];
        theWindow.parentOrientationController = nil;
    }
}

-(void)didCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    if (isCurrentlyVisible) {
        [TiUtils configureController:self withObject:[_containedWindows lastObject]];
        [self resizeView];
        [self childOrientationControllerChangedFlags:[_containedWindows lastObject]];
        [[_containedWindows lastObject] gainFocus];
        UIAccessibilityPostNotification(UIAccessibilityScreenChangedNotification, nil);
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


- (void)viewWillLayoutSubviews
{
    self.edgesForExtendedLayout = UIRectEdgeLeft;
    CGRect bounds = [[self view] bounds];
    NSLog(@"WILL LAYOUT SUBVIEWS %.1f %.1f",bounds.size.width, bounds.size.height);
    [super viewWillLayoutSubviews];
}

- (void)viewDidLayoutSubviews
{
    CGRect bounds = [[self view] bounds];
    NSLog(@"DID LAYOUT SUBVIEWS %.1f %.1f",bounds.size.width, bounds.size.height);
    [super viewDidLayoutSubviews];
}

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
    
    for (id<TiWindowProtocol> thisWindow in [_modalWindows reverseObjectEnumerator])
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
    [self resizeView];
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
