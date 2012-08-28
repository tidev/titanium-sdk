/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */


#import "TiRootViewController.h"
#import "TiUtils.h"
#import "TiViewProxy.h"
#import "TiWindowProxy.h"
#import "TiTab.h"
#import "TiApp.h"
#import <MessageUI/MessageUI.h>

@interface TiRootView : UIView
@end

@implementation TiRootView

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


@interface TiRootViewController ()

- (UIView *)keyboardAccessoryViewForProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy withView:(UIView **)proxyView;
-(UIView*)viewForKeyboardAccessory;

-(void)updateBackground;
-(void)updateOrientationHistory:(UIInterfaceOrientation)newOrientation;

@property (nonatomic,readwrite,assign)	UIInterfaceOrientation windowOrientation;

-(TiOrientationFlags)getDefaultOrientations;
@property(nonatomic,readonly) TiViewProxy<TiKeyboardFocusableView> * keyboardFocusedProxy;

@end


@implementation TiRootViewController
@synthesize backgroundColor, backgroundImage, defaultImageView, keyboardVisible;
@synthesize windowOrientation;

#pragma mark Default image handling

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
	return [UIImage imageNamed:@"Default.png"];
}

-(void)dismissDefaultImageView
{
	if (defaultImageView == nil)
	{
		return;
	}
	[defaultImageView removeFromSuperview];
	RELEASE_TO_NIL(defaultImageView);
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


#pragma mark Initialization and deallocation 

-(void)dealloc
{
	RELEASE_TO_NIL(backgroundColor);
	RELEASE_TO_NIL(backgroundImage);

	RELEASE_TO_NIL(windowProxies);

	RELEASE_TO_NIL(windowViewControllers);
	RELEASE_TO_NIL(viewControllerStack);

	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	NSNotificationCenter * nc = [NSNotificationCenter defaultCenter];
	[nc removeObserver:self];
	[super dealloc];
}

- (id) init
{
	self = [super init];
	if (self != nil)
	{
//View controller and orientation initialization
		windowProxies = [[NSMutableArray alloc] init];
		viewControllerStack = [[NSMutableArray alloc] init];
		// Set up the initial orientation modes
		allowedOrientations = [self getDefaultOrientations];
		orientationHistory[0] = UIInterfaceOrientationPortrait;
		orientationHistory[1] = UIInterfaceOrientationLandscapeLeft;
		orientationHistory[2] = UIInterfaceOrientationLandscapeRight;
		orientationHistory[3] = UIInterfaceOrientationPortraitUpsideDown;
		
//Keyboard initialization
		leaveCurve = UIViewAnimationCurveEaseIn;
		enterCurve = UIViewAnimationCurveEaseIn;
		leaveDuration = 0.3;
		enterDuration = 0.3;

/*
 *	Default image view -- Since this goes away after startup, it's made here and
 *	nowhere else. We don't do this during loadView because it's possible that
 *	the view will be unloaded (by, perhaps a Memory warning while a modal view
 *	controller and loaded at a later time.
 */
		defaultImageView = [[UIImageView alloc] init];
		[defaultImageView setAutoresizingMask:UIViewAutoresizingFlexibleHeight
				 | UIViewAutoresizingFlexibleWidth];
		[defaultImageView setContentMode:UIViewContentModeScaleToFill];
		
//Notifications
		WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
		NSNotificationCenter * nc = [NSNotificationCenter defaultCenter];
		[nc addObserver:self selector:@selector(didOrientNotify:) name:UIDeviceOrientationDidChangeNotification object:nil];

		[nc addObserver:self selector:@selector(keyboardDidHide:) name:UIKeyboardDidHideNotification object:nil];
		[nc addObserver:self selector:@selector(keyboardDidShow:) name:UIKeyboardDidShowNotification object:nil];
		[nc addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
		[nc addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
	}
	return self;
}

#pragma mark UIViewController methods

@synthesize keyboardFocusedProxy;

-(void)dismissKeyboard
{
	[keyboardFocusedProxy blur:nil];
}

-(void)loadView
{
	TiRootView *rootView = [[TiRootView alloc] initWithFrame:[[UIScreen mainScreen] applicationFrame]];
	self.view = rootView;
	[self updateBackground];
	if (defaultImageView != nil) {
		[self rotateDefaultImageViewToOrientation:UIInterfaceOrientationPortrait];
		[rootView addSubview:defaultImageView];
	}
	//In the event that we are reloading the view due to memory panic.
	for (TiWindowProxy * thisProxy in windowProxies)
	{
		UIView * thisView = [thisProxy view];
		[rootView addSubview:thisView];
		[thisProxy reposition];
	}
	[rootView release];
}

- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	TiThreadProcessPendingMainThreadBlocks(0.1, YES, nil);
	[[viewControllerStack lastObject] viewWillAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	[[viewControllerStack lastObject] viewWillDisappear:animated];
}

- (void) viewDidAppear:(BOOL)animated
{
   	isCurrentlyVisible = YES;
	[self.view becomeFirstResponder];
	[self refreshOrientationWithDuration:animated?[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]:0.0];
	[super viewDidAppear:animated];
	[[viewControllerStack lastObject] viewDidAppear:animated];
}

- (void) viewDidDisappear:(BOOL)animated
{
	isCurrentlyVisible = NO;
	[self.view resignFirstResponder];
	[self refreshOrientationWithDuration:animated?[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]:0.0];
    [super viewDidDisappear:animated];
	[[viewControllerStack lastObject] viewDidDisappear:animated];
}

#pragma mark Background image/color

-(void)setBackgroundColor:(UIColor *)newColor
{
	if ((newColor == backgroundColor) || [backgroundColor isEqual:newColor])
	{
		return;
	}
	
	[backgroundColor release];
	backgroundColor = [newColor retain];
	TiThreadPerformOnMainThread(^{[self updateBackground];}, NO);
}

-(void)setBackgroundImage:(UIImage *)newImage
{
	if ((newImage == backgroundImage) || [backgroundImage isEqual:newImage])
	{
		return;
	}
	
	[backgroundImage release];
	backgroundImage = [newImage retain];
	TiThreadPerformOnMainThread(^{[self updateBackground];}, NO);
}

-(void)updateBackground
{
	UIView * ourView = [self view];
	UIColor * chosenColor = (backgroundColor==nil)?[UIColor blackColor]:backgroundColor;
	[ourView setBackgroundColor:chosenColor];
	[[ourView superview] setBackgroundColor:chosenColor];
	if (backgroundImage!=nil)
	{
		[[ourView layer] setContents:(id)backgroundImage.CGImage];
	}
	else
	{
		[[ourView layer] setContents:nil];
	}
}

#pragma mark Performing orientation rotations

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration
{
	UIApplication * ourApp = [UIApplication sharedApplication];
	UIInterfaceOrientation oldOrientation = [ourApp statusBarOrientation];
	CGAffineTransform transform;

	switch (newOrientation)
	{
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
    if (duration > 0.0)
	{
		[UIView beginAnimations:@"orientation" context:nil];
		[UIView setAnimationDuration:duration];
	}
    
    if (forceOrientation || ((newOrientation != oldOrientation) && isCurrentlyVisible))
    {
        TiViewProxy<TiKeyboardFocusableView> *kfvProxy = [keyboardFocusedProxy retain];
        [kfvProxy blur:nil];
        [ourApp setStatusBarOrientation:newOrientation animated:(duration > 0.0)];
        [kfvProxy focus:nil];
        [kfvProxy release];
    }

	UIView * ourView = [self view];
    [ourView setTransform:transform];
	[self resizeView];
	
	[self willAnimateRotationToInterfaceOrientation:newOrientation duration:duration];

    //Propigate this to everyone else. This has to be done INSIDE the animation.
    [self repositionSubviews];
	
	if (duration > 0.0)
	{
		[UIView commitAnimations];
	}
	
	[self didRotateFromInterfaceOrientation:oldOrientation];
}

-(NSTimeInterval)suggestedRotationDuration
{
	if(([self focusedViewController]==nil))
	{
		return 0.0;
	}
	return [[UIApplication sharedApplication] statusBarOrientationAnimationDuration];
}

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

-(void)refreshOrientation
{
	[self refreshOrientationWithDuration:[self suggestedRotationDuration]];
}

-(void)didOrientNotify:(NSNotification *)notification
{
	/*
	 *	The new behavior is that we give iOS a chance to do it right instead.
	 *	Then, during the callback, see if we need to manually override.
	 */
	UIInterfaceOrientation newOrientation =
			(UIInterfaceOrientation)[[UIDevice currentDevice] orientation];
	
	if (!UIDeviceOrientationIsValidInterfaceOrientation(newOrientation)) {
		return;
	}

    UIInterfaceOrientation oldOrientation = [[UIApplication sharedApplication] statusBarOrientation];
    TiViewProxy<TiKeyboardFocusableView> *kfvProxy = (newOrientation != oldOrientation) ? [[keyboardFocusedProxy retain] autorelease] : nil;

    [self updateOrientationHistory:newOrientation];
    
	UIInterfaceOrientation latestOrientation = [self lastValidOrientation];
	if ((latestOrientation == oldOrientation) && (latestOrientation == windowOrientation))
	{
		return;
	}
    
    // We appear to do this in order to synchronize rotation animations with the keyboard.
    // But there is an interesting edge case where the status bar sometimes updates its orientation,
    // but does not animate, before we trigger the refresh. This means that the keyboard refuses to
    // rotate with, if it's focused as first responder (and in fact having it focused as first
    // responder may be part of what causes the race in conjunction with non-device orienting.
    // See TIMOB-7998.)
    
    TiThreadPerformOnMainThread(^{
        if ([[UIApplication sharedApplication] statusBarOrientation] != oldOrientation) {
            forceOrientation = YES;
        }
        [self refreshOrientation];
        forceOrientation = NO;
    }, NO);
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

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation 
{
	return TI_ORIENTATION_ALLOWED(allowedOrientations,interfaceOrientation) ? YES : NO;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	[super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];

	for (TiWindowProxy * thisProxy in windowProxies)
	{
		TiOrientationFlags windowFlags = [thisProxy orientationFlags];
		BOOL shouldRotate = TI_ORIENTATION_ALLOWED(windowFlags, toInterfaceOrientation) || (windowFlags == TiOrientationNone);
        if (shouldRotate || ![thisProxy respondsToSelector:@selector(ignoringRotationToOrientation:)]) {
            UIViewController * thisNavCon = [thisProxy navController];
            if (thisNavCon == nil)
            {
                thisNavCon = [thisProxy controller];
            }
            [thisNavCon willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
        }
        else {
            [thisProxy ignoringRotationToOrientation:toInterfaceOrientation];
        }
	}
	[self rotateDefaultImageViewToOrientation:toInterfaceOrientation];
}

- (void)willRotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration;
{
	windowOrientation = toInterfaceOrientation;
	[super willRotateToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

- (void)didRotateFromInterfaceOrientation:(UIInterfaceOrientation)fromInterfaceOrientation;
{
	[super didRotateFromInterfaceOrientation:fromInterfaceOrientation];
}
-(BOOL)isCurrentWindowModal{
    for (TiWindowProxy * thisWindow in [windowProxies reverseObjectEnumerator])
	{
        if ([thisWindow closing] == NO) {
            if([thisWindow modalFlagValue] == YES){
                return YES;
            }
            else{
                return NO;
            }
        }
    }
}
-(BOOL)isModal {
    //For detecting windows that are opened modally.
    BOOL modalFlag = NO;
    if([self isCurrentWindowModal] == YES){
        return YES;
    }
    
    //For modal views that was added by the TiApp.mm (ApplicationDelegate)
    
    //TODO: modalViewController is being deprecated should use presentedViewcontroller.
    id modalvc= self.modalViewController;
    UIViewController *parentController = [modalvc parentViewController];
    //TODO: As of iOS 5, Apple is phasing out the modal concept in exchange for
    //'presenting', making all non-Ti modal view controllers claim to have
    //no parent view controller.
    
    if(parentController==nil && [modalvc respondsToSelector:@selector(presentingViewController)]){
        parentController = [modalvc presentingViewController];
    }
    
    if(parentController == self){
        modalFlag = YES;
    }
    
    if(modalvc != nil){
        if ([modalvc isKindOfClass:[UINavigationController class]] && 
            ![modalvc isKindOfClass:[MFMailComposeViewController class]] &&
            modalFlag == YES ) 
        {
            //Since this is a window opened from inside a modalviewcontroller we need
            //to let this be oriented by ourselves.
            modalFlag = NO;
        }
    }
    return modalFlag;
}
-(void)refreshOrientationWithDuration:(NSTimeInterval) duration
{
    if (![[TiApp app] windowIsKeyWindow]) {
        VerboseLog(@"[DEBUG] RETURNING BECAUSE WE ARE NOT KEY WINDOW");
        return;
    }

	/*
	 *	Apple gives us a wonderful method, attemptRotation... in iOS 5 below
	 *	but sadly, it only updates the orientation if the UI can change that
	 *	way. So we give it a shot, and if that's not enough, consult the
	 *	rotation history and manually force the rotation.
	 */
    TiOrientationFlags oldFlags = allowedOrientations;
    allowedOrientations = [self orientationFlags];	
    
    if ([self respondsToSelector:@selector(presentingViewController)]) {
        [UIViewController attemptRotationToDeviceOrientation];
    }
    UIInterfaceOrientation newOrientation = [self lastValidOrientation];	
    //Check if the view was opened modally, then we shouldnot be handling the rotation.
    if([self isModal] == YES){
        //TODO: Needs to look at how we do orientations, tracking windowOrientation
        //for getting the actual window orientation doesnot seem like the correct for tracking it.
        windowOrientation = newOrientation;
        return;
    }   
    
    /*Find out if we are inside a modal view controller . 
     *TODO : There is currently a ticket open TIMOB-8902 to expose the 
     *navigation controller of the modal window so that windows can 
     *be added to it, instead of adding it here. when that ticket is resolved.
     *this entire logic should be removed.
     */
    
    BOOL isInsideModalWindow = NO;
    for (TiWindowProxy * thisWindow in [windowProxies reverseObjectEnumerator])
	{
        if ([thisWindow closing] == NO) {
            if([thisWindow modalFlagValue] == YES){
                isInsideModalWindow = YES;
                DebugLog(@"[WARN] Trying to open a new window from within a Modal Window is unsupported.");
                break;
            }
            
        }
    }
    

    if ((newOrientation == windowOrientation) &&
        (oldFlags & allowedOrientations))
    {
        // If it's the case that the window orientation doesn't match the status bar orientation,
        // move the status bar into the right place.
        if (windowOrientation != [[UIApplication sharedApplication] statusBarOrientation]) {
            [[UIApplication sharedApplication] setStatusBarOrientation:windowOrientation animated:NO];
        }
                
        if (TI_ORIENTATION_ALLOWED(allowedOrientations, orientationHistory[0]) && (isInsideModalWindow == NO)) {
             //Nothing to do here.
            return;
        }
    }
    [self manuallyRotateToOrientation:newOrientation duration:duration];
}

-(CGRect)resizeView
{
	CGRect rect = [[UIScreen mainScreen] applicationFrame];
//	VerboseLog(@"(%f,%f),(%fx%f)",rect.origin.x,rect.origin.y,rect.size.width,rect.size.height);
	[[self view] setFrame:rect];
	//Because of the transition in landscape orientation, TiUtils can't be used here... SetFrame compensates for it.
	return [[self view] bounds];
}

// Some controllers (like MPVideoPlayerController) manually hide/show the bar
// based on whether or not they enter a "fullscreen" mode, and upon exiting,
// the root view size needs to be adjusted based on any status bar differences.
-(CGRect)resizeViewForStatusBarHidden
{
    CGRect screenBounds = [[UIScreen mainScreen] bounds];
    CGPoint appCenter = CGPointMake(screenBounds.size.width/2.0f, screenBounds.size.height/2.0f);
    CGRect statusBarFrame = [[UIApplication sharedApplication] statusBarFrame];
    if (CGRectIsEmpty(statusBarFrame)) {
        [[self view] setBounds:screenBounds];
        [[self view] setCenter:appCenter];
    }
    else {
        CGRect appBounds = CGRectZero;
        switch ([[UIApplication sharedApplication] statusBarOrientation]) {
            case UIInterfaceOrientationPortrait:
                appCenter.y = appCenter.y + TI_STATUSBAR_HEIGHT/2;
                appBounds.size.width = screenBounds.size.width;
                appBounds.size.height = screenBounds.size.height - TI_STATUSBAR_HEIGHT;
                break;
            case UIInterfaceOrientationPortraitUpsideDown:
                appCenter.y = appCenter.y - TI_STATUSBAR_HEIGHT/2;
                appBounds.size.width = screenBounds.size.width;
                appBounds.size.height = screenBounds.size.height - TI_STATUSBAR_HEIGHT;
                break;
            case UIInterfaceOrientationLandscapeLeft:
                appCenter.x = appCenter.x + TI_STATUSBAR_HEIGHT/2;
                appBounds.size.height = screenBounds.size.width - TI_STATUSBAR_HEIGHT;
                appBounds.size.width = screenBounds.size.height;
                break;
            case UIInterfaceOrientationLandscapeRight:
                appCenter.x = appCenter.x - TI_STATUSBAR_HEIGHT/2;
                appBounds.size.height = screenBounds.size.width - TI_STATUSBAR_HEIGHT;
                appBounds.size.width = screenBounds.size.height;
                break;
        }
        [[self view] setBounds:appBounds];
        [[self view] setCenter:appCenter];
    }
    return [[self view] bounds];
}

-(void)repositionSubviews
{
	for (TiWindowProxy * thisProxy in windowProxies)
	{
		[thisProxy reposition];
	}
	//Keyboard handling injection.
	if(!keyboardVisible && !updatingAccessoryView)
	{
		//Set endFrame's origin and width to what you'd imagine the keyboard placed.
		UIView * ourView = [self viewForKeyboardAccessory];
		CGRect ourBounds = [ourView bounds];
		ourBounds.origin.y += ourBounds.size.height;
		endFrame = [ourView convertRect:ourBounds toView:nil];
		updatingAccessoryView = YES;
		[self performSelector:@selector(handleNewKeyboardStatus) withObject:nil afterDelay:0.0];
	}
	
}



-(TiOrientationFlags)getDefaultOrientations
{
	// Read the orientation values from the plist - if they exist.
	NSArray* orientations = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UISupportedInterfaceOrientations"];
	TiOrientationFlags defaultFlags = TiOrientationPortrait;
	
	if ([TiUtils isIPad])
	{
		defaultFlags = TiOrientationAny;
		NSArray * ipadOrientations = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UISupportedInterfaceOrientations~ipad"];
		if ([ipadOrientations respondsToSelector:@selector(count)] && ([ipadOrientations count] > 0))
		{
			orientations = ipadOrientations;
		}
	}

	if ([orientations respondsToSelector:@selector(count)] && ([orientations count] > 0))
	{
		defaultFlags = TiOrientationNone;
		for (NSString* orientationString in orientations)
		{
			UIInterfaceOrientation orientation = (UIInterfaceOrientation)[TiUtils orientationValue:orientationString def:-1];
			if (orientation != -1) {
				TI_ORIENTATION_SET(defaultFlags, orientation);
			}
		}
	}
	
	return defaultFlags;
}


- (void)willHideViewController:(UIViewController *)focusedViewController animated:(BOOL)animated
{
	if (!isCurrentlyVisible || (focusedViewController != [viewControllerStack lastObject]))
	{
		return;
	}
	
	[focusedViewController viewWillDisappear:animated];
	
	int previousIndex = [viewControllerStack count] - 2;	
	if (previousIndex > 0)
	{
		[[viewControllerStack objectAtIndex:previousIndex] viewWillAppear:animated];
	}
}

- (void)didHideViewController:(UIViewController *)focusedViewController animated:(BOOL)animated
{
	if (!isCurrentlyVisible || (focusedViewController != [viewControllerStack lastObject]))
	{
		if([viewControllerStack containsObject:focusedViewController]){
			[viewControllerStack removeObject:focusedViewController];
		}
		return;
	}
	
	[focusedViewController viewDidDisappear:animated];
	[viewControllerStack removeLastObject];
	
	[[viewControllerStack lastObject] viewDidAppear:animated];
}

- (void)willShowViewController:(UIViewController *)focusedViewController animated:(BOOL)animated
{
	if (!isCurrentlyVisible || [viewControllerStack containsObject:focusedViewController])
	{
		return;
	}
	
	[[viewControllerStack lastObject] viewWillDisappear:animated];
	[focusedViewController viewWillAppear:animated];
}

- (void)didShowViewController:(UIViewController *)focusedViewController animated:(BOOL)animated
{
	if (!isCurrentlyVisible || [viewControllerStack containsObject:focusedViewController])
	{
		return;
	}
	
	[[viewControllerStack lastObject] viewDidDisappear:animated];
	[viewControllerStack addObject:focusedViewController];
	[focusedViewController viewDidAppear:animated];
}

-(void)windowFocused:(UIViewController*)focusedViewController
{
	[self dismissDefaultImageView];
	if ([focusedViewController isKindOfClass:[UINavigationController class]] && ![focusedViewController isKindOfClass:[MFMailComposeViewController class]])
	{
		UIViewController * topViewController = [(UINavigationController *)focusedViewController topViewController];
		if (topViewController != nil)
		{
			focusedViewController = topViewController;
		}
	}

	TiWindowProxy * focusedProxy = nil;

	if ([focusedViewController respondsToSelector:@selector(proxy)])
	{
		focusedProxy = (TiWindowProxy *)[(id)focusedViewController proxy];
	}
	
	UIViewController * oldTopWindow = [windowViewControllers lastObject];
	[windowViewControllers removeObject:focusedViewController];
	if ((focusedViewController==nil) || [(TiWindowProxy *)focusedProxy _isChildOfTab] || ([(TiWindowProxy *)focusedProxy parent]!=nil))
	{
		return;
	}
	
	if (windowViewControllers==nil)
	{
		windowViewControllers = [[NSMutableArray alloc] initWithObjects:focusedViewController,nil];
	}
	else
	{
		[windowViewControllers addObject:focusedViewController];
	}
	
	if ((oldTopWindow != focusedViewController) && [oldTopWindow respondsToSelector:@selector(proxy)])
	{
		[(TiWindowProxy *)[(id)oldTopWindow proxy] _tabBlur];
	}
}

-(void)windowClosed:(UIViewController *)closedViewController
{
	if ([closedViewController isKindOfClass:[UINavigationController class]] && ![closedViewController isKindOfClass:[MFMailComposeViewController class]])
	{
		UIViewController * topViewController = [(UINavigationController *)closedViewController topViewController];
		if (topViewController != nil)
		{
			closedViewController = topViewController;
		}
	}

	BOOL focusChanged = [windowViewControllers lastObject] == closedViewController;
	[[closedViewController retain] autorelease];
	[windowViewControllers removeObject:closedViewController];
	if (!focusChanged)
	{
		closedViewController=nil;
		return; //Exit early. We're done here.
	}
	
	UIViewController * newTopWindow = [windowViewControllers lastObject];
	
	if ([newTopWindow respondsToSelector:@selector(proxy)])
	{
		[(TiWindowProxy *)[(id)newTopWindow proxy] _tabFocus];
	}
    [self refreshOrientation];
}

-(UIViewController *)focusedViewController
{
	return [windowViewControllers lastObject];
}

-(BOOL)isTopWindow:(TiWindowProxy *)window
{
    return [[windowProxies lastObject] isEqual:window];
}

#pragma mark TiOrientationFlags management.
- (void)openWindow:(TiWindowProxy *)window withObject:(id)args
{
	if ([windowProxies lastObject] == window)
	{
		return;
	}
    
    TiViewProxy<TiKeyboardFocusableView> *kfvProxy = [[keyboardFocusedProxy retain] autorelease];
    [kfvProxy blur:nil];
    
	if ([windowProxies containsObject:window])
	{
		[[window retain] autorelease];
		[windowProxies removeObject:window];
	}

	[window setParentOrientationController:self];
	[windowProxies addObject:window];
	[window parentWillShow];
	//Todo: Move all the root-attaching logic here.

	[self childOrientationControllerChangedFlags:window];
}

- (void)closeWindow:(TiWindowProxy *)window withObject:(id)args
{
	if (![windowProxies containsObject:window])
	{
		return;
	}
	
	BOOL wasTopWindow = [windowProxies lastObject] == window;

	//Todo: Move all the root-detaching logic here.

	[window setParentOrientationController:nil];
	[window parentWillHide];
	[windowProxies removeObject:window];

	if(wasTopWindow)
	{
		[self childOrientationControllerChangedFlags:[windowProxies lastObject]];
	}
}


-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;
{
	WARN_IF_BACKGROUND_THREAD_OBJ;
	[self refreshOrientationWithDuration:[self suggestedRotationDuration]];
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
	for (TiWindowProxy * thisWindow in [windowProxies reverseObjectEnumerator])
	{
        if ([thisWindow closing] == NO) {
            TiOrientationFlags result = [thisWindow orientationFlags];
            if (result != TiOrientationNone)
            {
                return result;
            }
       }
        
	}
	
	return [self getDefaultOrientations];
}

#pragma mark Remote Control Notifications

- (void)remoteControlReceivedWithEvent:(UIEvent *)event 
{ 
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiRemoteControlNotification object:self userInfo:[NSDictionary dictionaryWithObject:event forKey:@"event"]];
}

#pragma mark Keyboard handling

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


-(void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)blurredProxy;
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

	if(scrolledView != nil)	//If this isn't IN the toolbar, then we update the scrollviews to compensate.
	{
		UIView * ourView = [self viewForKeyboardAccessory];
        CGRect rect = [ourView convertRect:endFrame fromView:nil];
		CGFloat keyboardHeight = rect.origin.y;
        if (keyboardHeight > 0) {
            UIView * possibleScrollView = [scrolledView superview];
            UIView<TiScrolling> * confirmedScrollView = nil;
            while (possibleScrollView != nil)
            {
                if ([possibleScrollView conformsToProtocol:@protocol(TiScrolling)])
                {
                    confirmedScrollView = (UIView<TiScrolling>*)possibleScrollView;
                }
                possibleScrollView = [possibleScrollView superview];
            }
            [confirmedScrollView keyboardDidShowAtHeight:keyboardHeight];
        }
	}
    RELEASE_TO_NIL_AUTORELEASE(keyboardFocusedProxy);
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


-(void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy;
{
	WARN_IF_BACKGROUND_THREAD_OBJ
    
	if (visibleProxy == keyboardFocusedProxy)
	{
		DeveloperLog(@"[WARN] Focused for %@<%X>, despite it already being the focus.",keyboardFocusedProxy,keyboardFocusedProxy);
		return;
	}
	if (nil != keyboardFocusedProxy)
	{
		DeveloperLog(@"[WARN] Focused for %@<%X>, despite %@<%X> already being the focus.",visibleProxy,visibleProxy,keyboardFocusedProxy,keyboardFocusedProxy);
		[self didKeyboardBlurOnProxy:keyboardFocusedProxy];
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


@end
