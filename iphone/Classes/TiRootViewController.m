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

@end


@implementation TiRootViewController
@synthesize backgroundColor, backgroundImage;

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
		windowProxies = [[NSMutableArray alloc] init];
		viewControllerStack = [[NSMutableArray alloc] init];
		WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
		NSNotificationCenter * nc = [NSNotificationCenter defaultCenter];
		[nc addObserver:self selector:@selector(keyboardDidHide:) name:UIKeyboardDidHideNotification object:nil];
		[nc addObserver:self selector:@selector(keyboardDidShow:) name:UIKeyboardDidShowNotification object:nil];
		[nc addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
		[nc addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
		leaveCurve = UIViewAnimationCurveEaseIn;
		enterCurve = UIViewAnimationCurveEaseIn;
		leaveDuration = 0.3;
		enterDuration = 0.3;
		
		// Set up the initial orientation modes
		[self setOrientationModes:nil];
	}
	return self;
}

-(CGRect)resizeView
{
	CGRect rect = [[UIScreen mainScreen] applicationFrame];
	VerboseLog(@"(%f,%f),(%fx%f)",rect.origin.x,rect.origin.y,rect.size.width,rect.size.height);
	[[self view] setFrame:rect];
	//Because of the transition in landscape orientation, TiUtils can't be used here... SetFrame compensates for it.
	return [[self view] bounds];
}

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

-(void)didOrientNotify:(NSNotification *)notification
{
	UIInterfaceOrientation newOrientation = [[UIDevice currentDevice] orientation];
	if (lastOrientation == 0)
	{ //This is when the application first starts. statusBarOrientation lies at the beginning,
	//And device orientation is 0 until this notification.
		// FIRST!  We know the orientation now, so attach the splash!
		UIInterfaceOrientation oldOrientation = [[UIApplication sharedApplication] statusBarOrientation];
		windowOrientation = oldOrientation;
		[self manuallyRotateToOrientation:newOrientation duration:0];
		if (![[TiApp app] isSplashVisible]) {
			[[TiApp app] loadSplash];
		}
		return;
	}

	if ((newOrientation==windowOrientation)&&(lastOrientation!=newOrientation) &&
			[self shouldAutorotateToInterfaceOrientation:newOrientation])
	{ //This is for when we've forced an orientation that was not what the device was, and
	//Now we want to return to it. Because newOrientation and windowOrientation are identical
	//The iPhone OS wouldn't send this method.
		[self willAnimateRotationToInterfaceOrientation:newOrientation duration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
	}
}


-(void)loadView
{
	[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didOrientNotify:) name:UIDeviceOrientationDidChangeNotification object:nil];

	TiRootView *rootView = [[TiRootView alloc] init];
	self.view = rootView;
	[self updateBackground];
	[self resizeView];
	// we have to make a copy since this code can cause a mutation
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
	VerboseLog(@"%@%@",self,CODELOCATION);
	isCurrentlyVisible = YES;
	[[viewControllerStack lastObject] viewWillAppear:animated];
}
- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	VerboseLog(@"%@%@",self,CODELOCATION);
	[[viewControllerStack lastObject] viewWillDisappear:animated];
}

- (void) viewDidAppear:(BOOL)animated
{
	[self.view becomeFirstResponder];
    [super viewDidAppear:animated];
	VerboseLog(@"%@%@",self,CODELOCATION);
	[[viewControllerStack lastObject] viewDidAppear:animated];
}

- (void) viewDidDisappear:(BOOL)animated
{
	isCurrentlyVisible = NO;
	[self.view resignFirstResponder];
    [super viewDidDisappear:animated];
	VerboseLog(@"%@%@",self,CODELOCATION);
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

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration
{
	UIApplication * ourApp = [UIApplication sharedApplication];
	if (newOrientation != [ourApp statusBarOrientation])
	{
		[keyboardFocusedProxy blur:nil];
		[ourApp setStatusBarOrientation:newOrientation animated:(duration > 0.0)];
		[keyboardFocusedProxy focus:nil];
	}
	
	// if already in the orientation, don't do it again
	if (lastOrientation==newOrientation)
	{
		return;
	}

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

	for (TiWindowProxy * thisProxy in windowProxies)
	{
		UIViewController * thisNavCon = [thisProxy navController];
		if (thisNavCon == nil)
		{
			thisNavCon = [thisProxy controller];
		}
		[thisNavCon willAnimateRotationToInterfaceOrientation:newOrientation duration:duration];
	}


	if (duration > 0.0)
	{
		[UIView beginAnimations:@"orientation" context:nil];
		[UIView setAnimationDuration:duration];
	}

	[[self view] setTransform:transform];
	lastOrientation = newOrientation;
	[self resizeView];

	//Propigate this to everyone else. This has to be done INSIDE the animation.
	[self repositionSubviews];
	
	if (duration > 0.0)
	{
		[UIView commitAnimations];
	}
}

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation) newOrientation
{
	[self manuallyRotateToOrientation:newOrientation duration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	VerboseLog(@"Rotating to %d (Landscape? %d)",toInterfaceOrientation,UIInterfaceOrientationIsLandscape(toInterfaceOrientation));
	windowOrientation = toInterfaceOrientation;
	[self manuallyRotateToOrientation:toInterfaceOrientation duration:duration];
	[super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

-(TiOrientationFlags)getDefaultOrientations
{
	// Read the orientation values from the plist - if they exist.
	TiOrientationFlags defaultFlags = TiOrientationPortrait;
	NSString* property = @"UISupportedInterfaceOrientations";
	if ([TiUtils isIPad]) {
		defaultFlags = TiOrientationAny;
		property = [property stringByAppendingString:@"~ipad"];
	}
	NSArray* orientations = [[NSBundle mainBundle] objectForInfoDictionaryKey:property];
	if (orientations == nil || [orientations count] == 0) {
		return defaultFlags;
	}
	else {
		defaultFlags = TiOrientationNone;
		for (NSString* orientationString in orientations) {
			UIInterfaceOrientation orientation = [TiUtils orientationValue:orientationString def:-1];
			if (orientation != -1) {
				TI_ORIENTATION_SET(defaultFlags, orientation);
			}
		}
	}
	
	return defaultFlags;
}

-(void)setOrientationModes:(NSArray *)newOrientationModes
{
	allowedOrientations = TiOrientationNone;

	for (id mode in newOrientationModes)
	{
		UIInterfaceOrientation orientation = [TiUtils orientationValue:mode def:-1];
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

-(UIInterfaceOrientation)mostRecentlyAllowedOrientation
{
	UIInterfaceOrientation requestedOrientation = [[UIApplication sharedApplication] statusBarOrientation];
	NSTimeInterval latestRequest = 0.0;
	if(!TI_ORIENTATION_ALLOWED(allowedOrientations,requestedOrientation))
	{
		latestRequest = -1.0;
	}
	for (int i=0; i<MAX_ORIENTATIONS; i++)
	{
		if (TI_ORIENTATION_ALLOWED(allowedOrientations,i) && (orientationRequestTimes[i]>latestRequest))
		{
			requestedOrientation = i;
			latestRequest = orientationRequestTimes[i];
		}
	}
	return requestedOrientation;
}


- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation 
{
	orientationRequestTimes[interfaceOrientation] = [NSDate timeIntervalSinceReferenceDate];
	return TI_ORIENTATION_ALLOWED(allowedOrientations,interfaceOrientation);
}


/*
Okay, Blain's sit and think about this. This is only concerning the top level of things.
That is, this is only a stack of open windows, and does not concern beyond that.
What this does mean is that any 

*/

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

#pragma mark Remote Control Notifications

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
- (void)remoteControlReceivedWithEvent:(UIEvent *)event 
{ 
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiRemoteControlNotification object:self userInfo:[NSDictionary dictionaryWithObject:event forKey:@"event"]];
}
#endif

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
	if (TI_ORIENTATION_ALLOWED(allowedOrientations,lastOrientation))
	{
		//We're still good. No need to rotate. Skip.
		return;
	}

	//Force a rotate to accomodate.
	[self manuallyRotateToOrientation:[self mostRecentlyAllowedOrientation]];
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

-(void)extractKeyboardInfo:(NSDictionary *)userInfo
{
	NSValue *v = nil;
	CGRect endingFrame;
	BOOL canUse32Constants = [TiUtils isiPhoneOS3_2OrGreater];

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	if (canUse32Constants)
	{
		v = [userInfo valueForKey:UIKeyboardFrameEndUserInfoKey];
	}
#endif
	
	if (v != nil)
	{
		endingFrame = [v CGRectValue];
	}
	else
	{
		v = [userInfo valueForKey:UIKeyboardBoundsUserInfoKey];
		endingFrame = [v CGRectValue];
		v = [userInfo valueForKey:UIKeyboardCenterEndUserInfoKey];
		CGPoint endingCenter = [v CGPointValue];
		endingFrame.origin.x = endingCenter.x - endingFrame.size.width/2.0;
		endingFrame.origin.y = endingCenter.y - endingFrame.size.height/2.0;
	}

	CGRect startingFrame;
	v = nil;
	
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
	if (canUse32Constants)
	{
		v = [userInfo valueForKey:UIKeyboardFrameBeginUserInfoKey];
	}
#endif

	if (v != nil)
	{
		startingFrame = [v CGRectValue];
	}
	else
	{
		startingFrame.size = endingFrame.size;
		v = [userInfo valueForKey:UIKeyboardCenterBeginUserInfoKey];
		CGPoint startingCenter = [v CGPointValue];
		startingFrame.origin.x = startingCenter.x - startingFrame.size.width/2.0;
		startingFrame.origin.y = startingCenter.y - startingFrame.size.height/2.0;
	}

	UIView * ourView = [self view];

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
		if([enteringAccessoryView superview] != [self view])
		{
			[self placeView:enteringAccessoryView nearTopOfRect:startFrame aboveTop:NO];
			[[self view] addSubview:enteringAccessoryView];
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
