/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRootViewController.h"
#import "TiUtils.h"
#import "TiApp.h"
#import "TiLayoutQueue.h"
#import "TiErrorController.h"

#ifdef FORCE_WITH_MODAL
@interface ForcingController: UIViewController {
@private
    TiOrientationFlags orientationFlags;
    UIInterfaceOrientation supportedOrientation;
    
}
-(void)setOrientation:(UIInterfaceOrientation)newOrientation;
@end

@implementation ForcingController
-(void)setOrientation:(UIInterfaceOrientation)newOrientation
{
    supportedOrientation = newOrientation;
    orientationFlags = TiOrientationNone;
    TI_ORIENTATION_SET(orientationFlags, supportedOrientation);
}
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
{
    return (toInterfaceOrientation == supportedOrientation);
}

// New Autorotation support.
- (BOOL)shouldAutorotate{
    return YES;
}
- (NSUInteger)supportedInterfaceOrientations
{
    return orientationFlags;
}
// Returns interface orientation masks.
- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    return supportedOrientation;
}

@end
#endif

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
@synthesize statusBarVisibilityChanged;
@synthesize statusBarInitiallyHidden;
@synthesize defaultStatusBarStyle;
-(void)dealloc
{
	RELEASE_TO_NIL(bgColor);
	RELEASE_TO_NIL(bgImage);
    RELEASE_TO_NIL(containedWindows);
    RELEASE_TO_NIL(modalWindows);
    
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
        
        defaultOrientations = TiOrientationNone;
        containedWindows = [[NSMutableArray alloc] init];
        modalWindows = [[NSMutableArray alloc] init];
        /*
         *	Default image view -- Since this goes away after startup, it's made here and
         *	nowhere else. We don't do this during loadView because it's possible that
         *	the view will be unloaded (by, perhaps a Memory warning while a modal view
         *	controller and loaded at a later time.
         */
        defaultImageView = [[UIImageView alloc] init];
        [defaultImageView setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth];
        [defaultImageView setContentMode:UIViewContentModeScaleToFill];
		
        [self processInfoPlist];
        
        //Notifications
        WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
        NSNotificationCenter * nc = [NSNotificationCenter defaultCenter];
        [nc addObserver:self selector:@selector(didOrientNotify:) name:UIDeviceOrientationDidChangeNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardDidHide:) name:UIKeyboardDidHideNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardDidShow:) name:UIKeyboardDidShowNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
        [nc addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
        [[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
    }
    return self;
}

-(UIStatusBarStyle)styleFromString:(NSString*)theString
{
    if (!IS_NULL_OR_NIL(theString)) {
        if ([theString isEqualToString:@"UIStatusBarStyleDefault"]) {
            return UIStatusBarStyleDefault;
        } else if ([theString isEqualToString:@"UIStatusBarStyleBlackOpaque"]) {
            return [TiUtils isIOS7OrGreater] ? 1 : UIStatusBarStyleBlackOpaque;
        } else if ([theString isEqualToString:@"UIStatusBarStyleBlackTranslucent"] || [theString isEqualToString:@"UIStatusBarStyleLightContent"]) {
            return [TiUtils isIOS7OrGreater] ? 1 : UIStatusBarStyleBlackTranslucent;
        }
    }
    return UIStatusBarStyleDefault;
}

-(void)processInfoPlist
{
    //read the default orientations
    [self getDefaultOrientations];
    
    //read the default value of UIStatusBarHidden
    id statHidden = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIStatusBarHidden"];
    statusBarInitiallyHidden = [TiUtils boolValue:statHidden];
    //read the value of UIViewControllerBasedStatusBarAppearance
    id vcbasedStatHidden = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIViewControllerBasedStatusBarAppearance"];
    viewControllerControlsStatusBar = [TiUtils boolValue:vcbasedStatHidden def:YES];
    //read the value of statusBarStyle
    id statusStyle = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIStatusBarStyle"];
    defaultStatusBarStyle = [self styleFromString:statusStyle];
    
}

-(void)loadView
{
    TiRootViewNeue *rootView = [[TiRootViewNeue alloc] initWithFrame:[TiUtils frameForController:self]];
    self.view = rootView;
    rootView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
    [self updateBackground];
    if (defaultImageView != nil) {
        [self rotateDefaultImageViewToOrientation:[[UIApplication sharedApplication] statusBarOrientation]];
        [rootView addSubview:defaultImageView];
    }
    [rootView becomeFirstResponder];
    [rootView release];
}

#pragma mark Remote Control Notifications

- (void)remoteControlReceivedWithEvent:(UIEvent *)event
{
    /*Can not find code associated with this anywhere. Keeping in place just in case*/
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiRemoteControlNotification object:self userInfo:[NSDictionary dictionaryWithObject:event forKey:@"event"]];
}

#pragma mark - TiRootControllerProtocol
//Background Control
-(void)updateBackground
{
	UIView * ourView = [self view];
	UIColor * chosenColor = (bgColor==nil)?[UIColor blackColor]:bgColor;
	[ourView setBackgroundColor:chosenColor];
	[[ourView superview] setBackgroundColor:chosenColor];
	if (bgImage!=nil)
	{
		[[ourView layer] setContents:(id)bgImage.CGImage];
	}
	else
	{
		[[ourView layer] setContents:nil];
	}
}

-(void)setBackgroundImage:(UIImage*)newImage
{
    if ((newImage == bgImage) || [bgImage isEqual:newImage]) {
        return;
    }
    [bgImage release];
	bgImage = [newImage retain];
	TiThreadPerformOnMainThread(^{[self updateBackground];}, NO);
}

-(void)setBackgroundColor:(UIColor*)newColor
{
    if ((newColor == bgColor) || [bgColor isEqual:newColor]) {
        return;
    }
    [bgColor release];
	bgColor = [newColor retain];
	TiThreadPerformOnMainThread(^{[self updateBackground];}, NO);
}

-(void)dismissDefaultImage
{
    if (defaultImageView != nil) {
        [defaultImageView setHidden:YES];
        [defaultImageView removeFromSuperview];
        RELEASE_TO_NIL(defaultImageView);
    }
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
				image = [UIImage imageNamed:@"Default-Portrait.png"];
				break;
			case UIDeviceOrientationPortraitUpsideDown:
				image = [UIImage imageNamed:@"Default-PortraitUpsideDown.png"];
				break;
			case UIDeviceOrientationLandscapeLeft:
				image = [UIImage imageNamed:@"Default-LandscapeLeft.png"];
				break;
			case UIDeviceOrientationLandscapeRight:
				image = [UIImage imageNamed:@"Default-LandscapeRight.png"];
				break;
			default:
				image = nil;
		}
		if (image != nil) {
			return image;
		}
		
		// Generic orientation check
		if (UIDeviceOrientationIsPortrait(orientation)) {
			image = [UIImage imageNamed:@"Default-Portrait.png"];
		}
		else if (UIDeviceOrientationIsLandscape(orientation)) {
			image = [UIImage imageNamed:@"Default-Landscape.png"];
		}
		
		if (image != nil) {
			return image;
		}
	}
	*imageOrientation = UIDeviceOrientationPortrait;
	*imageIdiom = UIUserInterfaceIdiomPhone;
	// Default
    image = nil;
    if ([TiUtils isRetinaFourInch]) {
        image = [UIImage imageNamed:@"Default-568h.png"];
        if (image!=nil) {
            return image;
        }
    }
	return [UIImage imageNamed:@"Default.png"];
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

#pragma mark - Keyboard Control

-(void)dismissKeyboard
{
    [keyboardFocusedProxy blur:nil];
}

-(BOOL)keyboardVisible
{
    return keyboardVisible;
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

-(UIView *)viewForKeyboardAccessory;
{
	return [[[[TiApp app] window] subviews] lastObject];
}

-(void)extractKeyboardInfo:(NSDictionary *)userInfo
{
    NSValue *v = nil;
    v = [userInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
	
    if (v != nil) {
        endFrame = [v CGRectValue];
    }
    
    v = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
    
    if (v != nil) {
        startFrame = [v CGRectValue];
    }
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
		UIView<TiScrolling> *confirmedScrollView = nil;
		
		while (possibleScrollView != nil)
		{
			if ([possibleScrollView conformsToProtocol:@protocol(TiScrolling)])
			{
				confirmedScrollView = (UIView<TiScrolling>*)possibleScrollView;
			}
			possibleScrollView = [possibleScrollView superview];
		}
        
        
        [confirmedScrollView keyboardDidShowAtHeight:keyboardHeight];
        [confirmedScrollView scrollToShowView:scrolledView withKeyboardHeight:keyboardHeight];
		
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

-(void)animationDidStop:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context
{
	if(![finished boolValue]){
		return;
	}
	if(context == leavingAccessoryView){
		[leavingAccessoryView removeFromSuperview];
		RELEASE_TO_NIL(leavingAccessoryView);
	}
}

-(UIView *)topWindowProxyView
{
    if ([modalWindows count] > 0) {
        return (UIView *)[[modalWindows lastObject] view];
    } else if ([containedWindows count] > 0) {
        return (UIView *)[[containedWindows lastObject] view];
    } else {
        return [self view];
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
    NSArray* modalCopy = [modalWindows copy];
    NSArray* windowCopy = [containedWindows copy];
    
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
        DebugLog(@"[WARN] Could not resume. No selector _resumeRestart: found for arg");
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
    [[containedWindows lastObject] resignFocus];
    if ([theWindow isModal]) {
        [modalWindows addObject:theWindow];
    } else {
        [containedWindows addObject:theWindow];
        theWindow.parentOrientationController = self;
    }
}

-(void)didOpenWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    if ([self presentedViewController] == nil) {
        [self childOrientationControllerChangedFlags:[containedWindows lastObject]];
        [[containedWindows lastObject] gainFocus];
    }
    [self dismissDefaultImage];
}

-(void)willCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    [theWindow resignFocus];
    if ([theWindow isModal]) {
        [modalWindows removeObject:theWindow];
    } else {
        [containedWindows removeObject:theWindow];
        theWindow.parentOrientationController = nil;
    }
}

-(void)didCloseWindow:(id<TiWindowProtocol>)theWindow
{
    [self dismissKeyboard];
    if ([self presentedViewController] == nil) {
        [self childOrientationControllerChangedFlags:[containedWindows lastObject]];
        [[containedWindows lastObject] gainFocus];
    }
}

@class TiViewController;

-(void)showControllerModal:(UIViewController*)theController animated:(BOOL)animated
{
    UIViewController* topVC = [self topPresentedController];
    if ([topVC isKindOfClass:[TiErrorController class]]) {
        DebugLog(@"[ERROR] ErrorController is up. ABORTING showing of modal controller");
        return;
    }
    if (topVC == self) {
        [[containedWindows lastObject] resignFocus];
    } else if ([topVC respondsToSelector:@selector(proxy)]) {
        id theProxy = [(id)topVC proxy];
        if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
            [(id<TiWindowProtocol>)theProxy resignFocus];
        }
    }
    [self dismissKeyboard];
    [topVC presentViewController:theController animated:animated completion:nil];
}

-(void)hideControllerModal:(UIViewController*)theController animated:(BOOL)animated
{
    UIViewController* topVC = [self topPresentedController];
    if (topVC != theController) {
        DebugLog(@"[WARN] Dismissing a view controller when it is not the top presented view controller. Will probably crash now.");
    }
    UIViewController* presenter = [theController presentingViewController];
    [presenter dismissViewControllerAnimated:animated completion:^{
        if (presenter == self) {
            [self didCloseWindow:nil];
        } else {
            [self dismissKeyboard];

            if ([presenter respondsToSelector:@selector(proxy)]) {
                id theProxy = [(id)presenter proxy];
                if ([theProxy conformsToProtocol:@protocol(TiWindowProtocol)]) {
                    [(id<TiWindowProtocol>)theProxy gainFocus];
                }
            }
        }
    }];
}


#pragma mark - Orientation Control
-(TiOrientationFlags)getDefaultOrientations
{
    if (defaultOrientations == TiOrientationNone) {
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
        defaultOrientations = defaultFlags;
    }
	
	return defaultOrientations;
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
    CGRect rect = [TiUtils frameForController:self];
    [[self view] setFrame:rect];
    return [[self view]bounds];
}

-(void)repositionSubviews
{
    //Since the window relayout is now driven from viewDidLayoutSubviews
    //this is not required. Leaving it in place in case someone is using it now.
    /*
    for (id<TiWindowProtocol> thisWindow in [containedWindows reverseObjectEnumerator]) {
        [TiLayoutQueue layoutProxy:(TiViewProxy*)thisWindow];
    }
    */
}

-(UIInterfaceOrientation) lastValidOrientation:(BOOL)checkModal
{
	for (int i = 0; i<4; i++) {
		if ([self shouldRotateToInterfaceOrientation:orientationHistory[i] checkModal:checkModal]) {
			return orientationHistory[i];
		}
	}
	//This line should never happen, but just in case...
	return UIInterfaceOrientationPortrait;
}

- (BOOL)shouldRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation checkModal:(BOOL)check
{
    return TI_ORIENTATION_ALLOWED([self getFlags:check],toInterfaceOrientation) ? YES : NO;
}

#ifdef DEVELOPER
- (void)viewWillLayoutSubviews
{
    CGRect bounds = [[self view] bounds];
    NSLog(@"ROOT WILL LAYOUT SUBVIEWS %.1f %.1f",bounds.size.width, bounds.size.height);
    [super viewWillLayoutSubviews];
}
#endif

- (void)viewDidLayoutSubviews
{
#ifdef DEVELOPER
    CGRect bounds = [[self view] bounds];
    NSLog(@"ROOT DID LAYOUT SUBVIEWS %.1f %.1f",bounds.size.width, bounds.size.height);
#endif
    for (id<TiWindowProtocol> thisWindow in containedWindows) {
        if ([thisWindow isKindOfClass:[TiViewProxy class]]) {
            if (!CGRectEqualToRect([(TiViewProxy*)thisWindow sandboxBounds], [[self view] bounds])) {
                [(TiViewProxy*)thisWindow parentSizeWillChange];
            }
        }
    }
    [super viewDidLayoutSubviews];
}

//IOS5 support. Begin Section. Drop in 3.2
- (BOOL)automaticallyForwardAppearanceAndRotationMethodsToChildViewControllers
{
    return YES;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
{
    return [self shouldRotateToInterfaceOrientation:toInterfaceOrientation checkModal:YES];
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

-(NSUInteger)supportedOrientationsForAppDelegate;
{
    if (forcingStatusBarOrientation) {
        return 0;
    }
    //Since this is used just for intersection, ok to return UIInterfaceOrientationMaskAll
    return 30;//UIInterfaceOrientationMaskAll
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
        NSUInteger retVal = [topmostController supportedInterfaceOrientations];
        if ([topmostController isBeingDismissed]) {
            UIViewController* presenter = [topmostController presentingViewController];
            if (presenter == self) {
                return retVal | [self orientationFlags];
            } else {
                return retVal | [presenter supportedInterfaceOrientations];
            }
        } else {
            return retVal;
        }
    }
    return [self orientationFlags];
}

- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation
{
    return [self lastValidOrientation:YES];
}

-(void)didOrientNotify:(NSNotification *)notification
{
    UIDeviceOrientation newOrientation = [[UIDevice currentDevice] orientation];
	
    if (!UIDeviceOrientationIsValidInterfaceOrientation(newOrientation)) {
        return;
    }
    deviceOrientation = (UIInterfaceOrientation) newOrientation;
   
    if ([self shouldRotateToInterfaceOrientation:deviceOrientation checkModal:NO]) {
        [self updateOrientationHistory:deviceOrientation];
    }
}


-(void)refreshOrientationWithDuration:(id)unused
{
    if (![[TiApp app] windowIsKeyWindow]) {
        VerboseLog(@"[DEBUG] RETURNING BECAUSE WE ARE NOT KEY WINDOW");
        return;
    }
    
    if (forcingRotation) {
        return;
    }
    
    UIInterfaceOrientation target = [self lastValidOrientation:NO];
    //Device Orientation takes precedence.
    if (target != deviceOrientation) {
        if ([self shouldRotateToInterfaceOrientation:deviceOrientation checkModal:NO]) {
            target = deviceOrientation;
        }
    }
    
    if ([[UIApplication sharedApplication] statusBarOrientation] != target) {
        forcingRotation = YES;
#if defined(DEBUG) || defined(DEVELOPER)
        DebugLog(@"Forcing rotation to %d. Current Orientation %d. This is not good UI design. Please reconsider.",target,[[UIApplication sharedApplication] statusBarOrientation]);
#endif
#ifdef FORCE_WITH_MODAL
        [self forceRotateToOrientation:target];
#else
        [self manuallyRotateToOrientation:target duration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
        forcingRotation = NO;
#endif
    }
    
}

-(void)updateOrientationHistory:(UIInterfaceOrientation)newOrientation
{
	/*
	 *	And now, to push the orientation onto the history stack. This could be
	 *	expressed as a for loop, but the loop is so small that it might as well
	 *	be unrolled. The end result of this push is that only other orientations
	 *	are copied back, ensuring the newOrientation will be unique when it's
	 *	placed at the top of the stack.
	 */
	int i=0;
	for (int j=0;j<4;j++)
	{
		if (orientationHistory[j] == newOrientation) {
			i = j;
			break;
		}
	}
	while (i > 0) {
		orientationHistory[i] = orientationHistory[i-1];
		i--;
	}
	orientationHistory[0] = newOrientation;
}

#ifdef FORCE_WITH_MODAL
-(void)forceRotateToOrientation:(UIInterfaceOrientation)newOrientation
{
    UIViewController* tempPresenter = [self topPresentedController];
    ForcingController* dummy = [[ForcingController alloc] init];
    [dummy setOrientation:newOrientation];
    forcingStatusBarOrientation = YES;

    [[UIApplication sharedApplication] setStatusBarOrientation:newOrientation animated:NO];
    
    forcingStatusBarOrientation = NO;
    
    [self updateOrientationHistory:newOrientation];
    
    [tempPresenter presentViewController:dummy animated:NO completion:^{
        [UIViewController attemptRotationToDeviceOrientation];
        [tempPresenter dismissViewControllerAnimated:NO completion:nil];
        [dummy release];
    }];
}
#endif

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration
{
    if (!forcingRotation) {
        return;
    }
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
        BOOL focusAfterBlur = [kfvProxy focused:nil];
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
    if ([self presentedViewController] == nil && isCurrentlyVisible) {
        [self updateStatusBar];
        [self refreshOrientationWithDuration:nil];
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
    return [self getFlags:YES];
}

-(TiOrientationFlags) getFlags:(BOOL)checkModal
{
    TiOrientationFlags result = TiOrientationNone;
    if (checkModal) {
        for (id<TiWindowProtocol> thisWindow in [modalWindows reverseObjectEnumerator])
        {
            if ([thisWindow closing] == NO) {
                result = [thisWindow orientationFlags];
                if (result != TiOrientationNone)
                {
                    return result;
                }
            }
        }
        
    }
    for (id<TiWindowProtocol> thisWindow in [containedWindows reverseObjectEnumerator])
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
    for (id<TiWindowProtocol> thisWindow in containedWindows) {
        [thisWindow viewWillAppear:animated];
    }
    [super viewWillAppear:animated];
}
-(void)viewWillDisappear:(BOOL)animated
{
    for (id<TiWindowProtocol> thisWindow in containedWindows) {
        [thisWindow viewWillDisappear:animated];
    }
    [[containedWindows lastObject] resignFocus];
    [super viewWillDisappear:animated];
}
-(void)viewDidAppear:(BOOL)animated
{
    isCurrentlyVisible = YES;
    if ([containedWindows count] > 0) {
        for (id<TiWindowProtocol> thisWindow in containedWindows) {
            [thisWindow viewDidAppear:animated];
        }
        if (forcingRotation) {
            forcingRotation = NO;
            [self performSelector:@selector(childOrientationControllerChangedFlags:) withObject:[containedWindows lastObject] afterDelay:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
        } else {
            [self childOrientationControllerChangedFlags:[containedWindows lastObject]];
        }
        [[containedWindows lastObject] gainFocus];
    }
    [super viewDidAppear:animated];
}
-(void)viewDidDisappear:(BOOL)animated
{
    isCurrentlyVisible = NO;
    for (id<TiWindowProtocol> thisWindow in containedWindows) {
        [thisWindow viewDidDisappear:animated];
    }
    [super viewDidDisappear:animated];
}
-(void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    for (id<TiWindowProtocol> thisWindow in containedWindows) {
        [thisWindow willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [self updateOrientationHistory:toInterfaceOrientation];
    [self rotateDefaultImageViewToOrientation:toInterfaceOrientation];
    [super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    for (id<TiWindowProtocol> thisWindow in containedWindows) {
        [thisWindow willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
    }
    [super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}
-(void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation
{
    for (id<TiWindowProtocol> thisWindow in containedWindows) {
        [thisWindow didRotateFromInterfaceOrientation:fromInterfaceOrientation];
    }
    [super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
}

#pragma mark - Status Bar Appearance
- (BOOL)prefersStatusBarHidden
{
    BOOL oldStatus = statusBarIsHidden;
    if ([containedWindows count] > 0) {
        statusBarIsHidden = [[containedWindows lastObject] hidesStatusBar];
    } else {
        statusBarIsHidden = oldStatus = statusBarInitiallyHidden;
    }
    statusBarVisibilityChanged = (statusBarIsHidden != oldStatus);
    return statusBarIsHidden;
}

- (UIStatusBarAnimation)preferredStatusBarUpdateAnimation
{
    return UIStatusBarAnimationNone;
}

- (UIStatusBarStyle)preferredStatusBarStyle
{
    if ([containedWindows count] > 0) {
        return [[containedWindows lastObject] preferredStatusBarStyle];
    }
    return defaultStatusBarStyle;
}

-(BOOL) modalPresentationCapturesStatusBarAppearance
{
    return YES;
}

- (void) updateStatusBar
{
    if ([TiUtils isIOS7OrGreater] && viewControllerControlsStatusBar) {
        [self performSelector:@selector(setNeedsStatusBarAppearanceUpdate) withObject:nil];
    } else {
        [[UIApplication sharedApplication] setStatusBarHidden:[self prefersStatusBarHidden] withAnimation:UIStatusBarAnimationNone];
        [[UIApplication sharedApplication] setStatusBarStyle:[self preferredStatusBarStyle] animated:NO];
        [self resizeView];
    }
}

@end
