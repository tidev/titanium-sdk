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

-(void)updateBackground;
@end


@implementation TiRootViewController
@synthesize backgroundColor, backgroundImage, defaultImageView, keyboardVisible;

#pragma Default image handling

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
		[self setOrientationModes:nil];
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

#pragma mark Background image/color

-(void)setBackgroundColor:(UIColor *)newColor
{
	if ((newColor == backgroundColor) || [backgroundColor isEqual:newColor])
	{
		return;
	}
	
	[backgroundColor release];
	backgroundColor = [newColor retain];
	
	[self performSelectorOnMainThread:@selector(updateBackground) withObject:nil
						waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	//The runloopcommonmodes ensures that it'll happen even during tracking.
}

-(void)setBackgroundImage:(UIImage *)newImage
{
	if ((newImage == backgroundImage) || [backgroundImage isEqual:newImage])
	{
		return;
	}
	
	[backgroundImage release];
	backgroundImage = [newImage retain];
	
	[self performSelectorOnMainThread:@selector(updateBackground) withObject:nil
						waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	//The runloopcommonmodes ensures that it'll happen even during tracking.
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

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation
{
	NSTimeInterval duration = ([self focusedViewController]==nil)?0.0:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration];

	
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
    
    
    if (newOrientation != oldOrientation && isCurrentlyVisible)
    {
        [keyboardFocusedProxy blur:nil];
        [ourApp setStatusBarOrientation:newOrientation animated:(duration > 0.0)];
        [keyboardFocusedProxy focus:nil];
    }

	UIView * ourView = [self view];
	CGRect viewFrame = [[UIScreen mainScreen] applicationFrame];
	[ourView setCenter:CGPointMake(viewFrame.origin.x + viewFrame.size.width/2.0, viewFrame.origin.y + viewFrame.size.height/2.0)];
	if (UIInterfaceOrientationIsLandscape(newOrientation)) {
		viewFrame.size = CGSizeMake(viewFrame.size.height, viewFrame.size.width);
	}
    [ourView setTransform:transform];
	viewFrame.origin=CGPointZero;
	[ourView setBounds:viewFrame];
	[self resizeView];

	[self willAnimateRotationToInterfaceOrientation:newOrientation duration:duration];

    //Propigate this to everyone else. This has to be done INSIDE the animation.
    [self repositionSubviews];
    
	lastOrientation = newOrientation;

	
	if (duration > 0.0)
	{
		[UIView commitAnimations];
	}
	
	[self didRotateFromInterfaceOrientation:oldOrientation];
}


-(void)manuallyRotate
{
	for (int i = 0; i<4; i++) {
		if ([self shouldAutorotateToInterfaceOrientation:orientationHistory[i]]) {
			[self manuallyRotateToOrientation:orientationHistory[i]];
			return;
		}
	}
}

-(void)updateOrientationIfNeeded
{
	UIInterfaceOrientation newOrientation = (UIInterfaceOrientation)
			[[UIDevice currentDevice] orientation];

	if (newOrientation == windowOrientation)
	{
		return;
	}
	//By now, we should check to see if we actually should rotate into position
	
	if (![self shouldAutorotateToInterfaceOrientation:newOrientation]) {
		return;
	}
	
	[self manuallyRotate];
	//If so, we force a rotation.
}

-(void)noteOrientationRequest:(UIInterfaceOrientation) newOrientation
{
	/*
	 *	And now, to push the orientation onto the history stack. This could be
	 *	expressed as a for loop, but the loop is so small that it might as well
	 *	be unrolled. The end result of this push is that only other orientations
	 *	are copied back, ensuring the newOrientation will be unique when it's
	 *	placed at the top of the stack.
	 */
	if (orientationHistory[2] != newOrientation) {
		orientationHistory[3] = orientationHistory[2];
	}
	if (orientationHistory[1] != newOrientation) {
		orientationHistory[2] = orientationHistory[1];
	}
	if (orientationHistory[0] != newOrientation) {
		orientationHistory[1] = orientationHistory[0];
	}
	orientationHistory[0] = newOrientation;
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

	[self noteOrientationRequest:newOrientation];

	[self performSelector:@selector(updateOrientationIfNeeded) withObject:nil afterDelay:0.0];
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
        if (TI_ORIENTATION_ALLOWED(windowFlags, toInterfaceOrientation) || (windowFlags == TiOrientationNone)) {
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

+(void)attemptRotationToDeviceOrientation
{
	/*
	 *	It turns out that, despite Apple giving us this wonderful method, it still
	 *	does not solve our woes, only minimally reduces the times where we need to
	 *	implement it ourselves.
	 */
	if ([UIViewController instancesRespondToSelector:@selector(presentingViewController)]) {
		[super attemptRotationToDeviceOrientation];
	}
	/*
	 *	In this case, iOS's attemptRotationToDeviceOrientaiton only tries rotating
	 *	the the device's current rotation, and in the case where the current rotation
	 *	is not desired, does nothing. Instead, we have to maintain and consult a
	 *	rotation history.
	 */
	//TODO: Move autorotation code into here.
}



-(CGRect)resizeView
{
//	CGRect rect = [[UIScreen mainScreen] applicationFrame];
//	VerboseLog(@"(%f,%f),(%fx%f)",rect.origin.x,rect.origin.y,rect.size.width,rect.size.height);
//	[[self view] setFrame:rect];
	//Because of the transition in landscape orientation, TiUtils can't be used here... SetFrame compensates for it.
	return [[self view] bounds];
}

- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
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
	if (![self shouldAutorotateToInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]]) {
		CGFloat duration = 0.0;
		if (animated) {
			duration = [[UIApplication sharedApplication] statusBarOrientationAnimationDuration];
		}
		[self manuallyRotate];
	}
	[super viewDidAppear:animated];
	[[viewControllerStack lastObject] viewDidAppear:animated];
}

- (void) viewDidDisappear:(BOOL)animated
{
	isCurrentlyVisible = NO;
	[self.view resignFirstResponder];
    [super viewDidDisappear:animated];
	[[viewControllerStack lastObject] viewDidDisappear:animated];
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
		CGRect ourBounds = [[self view] bounds]; //TODO: Since reposition subviews is always called right after
		// [self resizeView], which returns [[self view] bounds], maybe we should call that here? Shrug.
		endFrame.origin.x = ourBounds.origin.x;
		endFrame.origin.y = ourBounds.origin.y + ourBounds.size.height;
		endFrame.size.width = ourBounds.size.width;
		
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

-(TiOrientationFlags)allowedOrientations
{
    return allowedOrientations;
}

-(void)setOrientationModes:(NSArray *)newOrientationModes
{
	allowedOrientations = TiOrientationNone;

	for (id mode in newOrientationModes)
	{
		UIInterfaceOrientation orientation = (UIInterfaceOrientation)[TiUtils orientationValue:mode def:-1];
		switch (orientation)
		{
			case UIDeviceOrientationPortrait:
			case UIDeviceOrientationPortraitUpsideDown:
			case UIDeviceOrientationLandscapeLeft:
			case UIDeviceOrientationLandscapeRight:
				TI_ORIENTATION_SET(allowedOrientations,orientation);
				break;
			case -1:
				break;
			default:
				NSLog(@"[WARN] An invalid orientation was requested. Ignoring.");
				break;
		}
	}
	
	if (allowedOrientations == TiOrientationNone)
	{
		allowedOrientations = [self getDefaultOrientations];
	}
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
	
}

-(UIViewController *)focusedViewController
{
	return [windowViewControllers lastObject];
}

-(BOOL)isTopWindow:(TiWindowProxy *)window
{
    return [[windowProxies lastObject] isEqual:window];
}

#pragma mark Remote Control Notifications

- (void)remoteControlReceivedWithEvent:(UIEvent *)event 
{ 
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiRemoteControlNotification object:self userInfo:[NSDictionary dictionaryWithObject:event forKey:@"event"]];
}

#pragma mark TiOrientationFlags management.
- (void)openWindow:(TiWindowProxy *)window withObject:(id)args
{
	if ([windowProxies lastObject] == window)
	{
		return;
	}

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
	//Because a modal window might not introduce new 

	TiOrientationFlags newFlags = [self orientationFlags];
	if (newFlags == allowedOrientations)
	{
		//No change. Nothing to update. Skip.
		return;
	}

	allowedOrientations = newFlags;
	if ([self shouldAutorotateToInterfaceOrientation:[[UIApplication sharedApplication] statusBarOrientation]])
	{
		//We're still good. No need to rotate. Skip.
		return;
	}

	//Force a rotate to accomodate.
	[self manuallyRotate];
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
		TiOrientationFlags result = [thisWindow orientationFlags];
		if (result != TiOrientationNone)
		{
			return result;
		}
	}
	
	return [self getDefaultOrientations];
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

	UIView * ourView = [self viewForKeyboardAccessory];

	startFrame = [ourView convertRect:startingFrame fromView:nil];
	endFrame = [ourView convertRect:endingFrame fromView:nil];
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

	//Sanity check. Look at our focused proxy, and see if we mismarked it as leaving.
	TiUIView * scrolledView;	//We check at the update anyways.

	UIView * focusedToolbar = [self keyboardAccessoryViewForProxy:keyboardFocusedProxy withView:&scrolledView];
	CGRect focusedToolbarBounds = CGRectMake(0, 0, endFrame.size.width, [keyboardFocusedProxy keyboardAccessoryHeight]);
	[focusedToolbar setBounds:focusedToolbarBounds];

	if(scrolledView != nil)	//If this isn't IN the toolbar, then we update the scrollviews to compensate.
	{
		CGFloat keyboardHeight = endFrame.origin.y;
		if(focusedToolbar != nil){
			keyboardHeight -= focusedToolbarBounds.size.height;
		}
		UIView * possibleScrollView = [scrolledView superview];
		NSMutableArray * confirmedScrollViews = nil;
		
		while (possibleScrollView != nil)
		{
			if ([possibleScrollView conformsToProtocol:@protocol(TiUIScrollView)])
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

		[(UIView<TiUIScrollView> *)[confirmedScrollViews objectAtIndex:0] keyboardDidShowAtHeight:keyboardHeight];
		for (UIView<TiUIScrollView> * confirmedScrollView in confirmedScrollViews)
		{
			[confirmedScrollView scrollToShowView:scrolledView withKeyboardHeight:keyboardHeight];
		}
	}

	//This is if the keyboard is hiding or showing due to hardware.
	if ((accessoryView != nil) && !CGRectEqualToRect(targetedFrame, endFrame))
	{
		targetedFrame = endFrame;
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
		[self placeView:accessoryView nearTopOfRect:endFrame aboveTop:YES];
		[UIView commitAnimations];
	}



	if (enteringAccessoryView != nil)
	{
		//Start animation to put it into place.
		if([enteringAccessoryView superview] != [self viewForKeyboardAccessory])
		{
			[self placeView:enteringAccessoryView nearTopOfRect:startFrame aboveTop:NO];
			[[self viewForKeyboardAccessory] addSubview:enteringAccessoryView];
		}
		targetedFrame = endFrame;
		[UIView beginAnimations:@"enter" context:enteringAccessoryView];
		[UIView setAnimationDuration:enterDuration];
		[UIView setAnimationCurve:enterCurve];
		[UIView setAnimationDelegate:self];
		[self placeView:enteringAccessoryView nearTopOfRect:endFrame aboveTop:YES];
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
		[self placeView:leavingAccessoryView nearTopOfRect:endFrame aboveTop:NO];
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

- (void)keyboardDidHide:(NSNotification*)notification 
{
	startFrame = endFrame;
}

- (void)keyboardDidShow:(NSNotification*)notification
{
	startFrame = endFrame;
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
		NSLog(@"[WARN] Blurred for %@<%X>, despite %@<%X> being the focus.",blurredProxy,blurredProxy,keyboardFocusedProxy,keyboardFocusedProxy);
		return;
	}
	RELEASE_TO_NIL_AUTORELEASE(keyboardFocusedProxy);

	//Question: Ideally (IE, shouldn't happen differently) the keyboardToolbar of the focusedProxy IS the accessoryView. Should we assume this?
	//TODO: This can probably be optimized, but since how rarely this happens....
	
	TiUIView * scrolledView;	//We check at the update anyways.
	UIView * doomedView = [self keyboardAccessoryViewForProxy:blurredProxy withView:&scrolledView];

	if(doomedView != accessoryView)
	{
		NSLog(@"[WARN] Trying to blur out %@, but %@ is the one with focus.",doomedView,accessoryView);
		return;
	}

	if(scrolledView != nil)	//If this isn't IN the toolbar, then we update the scrollviews to compensate.
	{
		CGFloat keyboardHeight = endFrame.origin.y;
		UIView * possibleScrollView = [scrolledView superview];
		UIView<TiUIScrollView> * confirmedScrollView = nil;
		while (possibleScrollView != nil)
		{
			if ([possibleScrollView conformsToProtocol:@protocol(TiUIScrollView)])
			{
				confirmedScrollView = possibleScrollView;
			}
			possibleScrollView = [possibleScrollView superview];
		}
		[confirmedScrollView keyboardDidShowAtHeight:keyboardHeight];
	}

	if((doomedView == nil) || (leavingAccessoryView == doomedView)){
		//Nothing to worry about. No toolbar or it's on its way out.
		return;
	}
	
	if(leavingAccessoryView != nil)
	{
		NSLog(@"[WARN] Trying to blur out %@, but %@ is already leaving focus.",accessoryView,leavingAccessoryView);
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
		NSLog(@"[WARN] Focused for %@<%X>, despite it already being the focus.",keyboardFocusedProxy,keyboardFocusedProxy);
		return;
	}
	if (nil != keyboardFocusedProxy)
	{
		NSLog(@"[WARN] Focused for %@<%X>, despite %@<%X> already being the focus.",visibleProxy,visibleProxy,keyboardFocusedProxy,keyboardFocusedProxy);
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
			NSLog(@"[WARN] Moving in view %@, despite %@ already in line to move in.",newView,enteringAccessoryView);
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
