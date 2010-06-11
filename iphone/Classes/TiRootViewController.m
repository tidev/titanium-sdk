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



@implementation TiRootViewController
@synthesize backgroundColor, backgroundImage;

-(void)dealloc
{
	RELEASE_TO_NIL(windowViewControllers);
	RELEASE_TO_NIL(backgroundColor);
	RELEASE_TO_NIL(backgroundImage);
	[super dealloc];
}

-(CGRect)resizeView
{
	CGRect rect = [[UIScreen mainScreen] applicationFrame];
	[[self view] setFrame:rect];
	VerboseLog(@"(%f,%f),(%fx%f)",rect.origin.x,rect.origin.y,rect.size.width,rect.size.height);
	//Because of the transition in landscape orientation, TiUtils can't be used here... SetFrame compensates for it.
	return rect;
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
		[self willAnimateRotationToInterfaceOrientation:newOrientation duration:0];
		return;
	}

	if ((newOrientation==windowOrientation)&&(lastOrientation!=newOrientation) && [self shouldAutorotateToInterfaceOrientation:newOrientation])
	{ //This is for when we've forced an orientation that was not what the device was, and
	//Now we want to return to it. Because newOrientation and windowOrientation are identical
	//The iPhone OS wouldn't send this method.
		[self willAnimateRotationToInterfaceOrientation:newOrientation duration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
	}

}


-(void)loadView
{
	[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didOrientNotify:) name:UIDeviceOrientationDidChangeNotification object:nil];

	TiRootView *rootView = [[TiRootView alloc] init];
	[rootView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
	self.view = rootView;
	[self updateBackground];
	[self resizeView];
	for (TiWindowViewController * thisWindowController in windowViewControllers)
	{
		if ([thisWindowController isKindOfClass:[TiWindowViewController class]])
		{
			UIView * thisView = [thisWindowController view];
			[rootView addSubview:thisView];
			[[thisWindowController proxy] reposition];
		}
	}
	[rootView release];
}

- (void) viewDidAppear:(BOOL)animated
{
	[self.view becomeFirstResponder];
    [super viewDidAppear:animated];
}

- (void) viewDidDisappear:(BOOL)animated
{
	[self.view resignFirstResponder];
    [super viewDidDisappear:animated];
}

-(void)repositionSubviews
{
	for (UIView * subView in [[self view] subviews])
	{
		if ([subView respondsToSelector:@selector(proxy)])
		{
			[(TiViewProxy *)[(TiUIView *)subView proxy] reposition];
		}
	}
}

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration
{
	UIApplication * ourApp = [UIApplication sharedApplication];
	if (newOrientation != [ourApp statusBarOrientation])
	{
		[ourApp setStatusBarOrientation:newOrientation animated:YES];
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

	//Propagate this to everyone else. This has to be done outside the animation.
	for (UIViewController * thisVC in windowViewControllers)
	{
		UINavigationController * thisNavCon = [thisVC navigationController];
		if (thisNavCon != nil)
		{
			[thisNavCon willAnimateRotationToInterfaceOrientation:newOrientation duration:duration];
		}
		else
		{
			[thisVC willAnimateRotationToInterfaceOrientation:newOrientation duration:duration];
		}

	}


	if (duration > 0.0)
	{
		[UIView beginAnimations:@"orientation" context:nil];
		[UIView setAnimationDuration:duration];
	}

	[[self view] setTransform:transform];
	[self resizeView];

	//Propigate this to everyone else. This has to be done INSIDE the animation.
	[self repositionSubviews];
	
	if (duration > 0.0)
	{
		[UIView commitAnimations];
	}
	lastOrientation = newOrientation;
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

-(void)setOrientationModes:(NSArray *)newOrientationModes
{
	for (int i=0; i<MAX_ORIENTATIONS; i++)
	{
		allowedOrientations[i] = NO;
	}

	BOOL noOrientations = YES;
	for (id mode in newOrientationModes)
	{
		UIInterfaceOrientation orientation = [TiUtils orientationValue:mode def:-1];
		switch (orientation)
		{
			case UIDeviceOrientationPortrait:
			case UIDeviceOrientationPortraitUpsideDown:
			case UIDeviceOrientationLandscapeLeft:
			case UIDeviceOrientationLandscapeRight:
				allowedOrientations[orientation] = YES;
				noOrientations = NO;
				break;
			case -1:
				break;
			default:
				NSLog(@"[WARN] An invalid orientation was requested. Ignoring.");
				break;
		}
	}
	
	if (noOrientations)
	{
		allowedOrientations[UIInterfaceOrientationPortrait] = YES;
		if ([TiUtils isIPad])
		{
			allowedOrientations[UIInterfaceOrientationPortraitUpsideDown] = YES;
			allowedOrientations[UIInterfaceOrientationLandscapeLeft] = YES;
			allowedOrientations[UIInterfaceOrientationLandscapeRight] = YES;
		}
	}
}

-(void)refreshOrientationModesIfNeeded:(TiWindowProxy *)oldCurrentWindow
{
	if (currentWindow != oldCurrentWindow)
	{
		return;
	}

	[self enforceOrientationModesFromWindow:currentWindow];
}

-(void)enforceOrientationModesFromWindow:(TiWindowProxy *) newCurrentWindow
{	
	currentWindow = newCurrentWindow;

	Class arrayClass = [NSArray class];
	Class windowClass = [TiWindowProxy class];
	SEL proxySel = @selector(proxy);

	BOOL noPrefrenceTab = NO;
	
	NSArray * candidateOrientationModes = [newCurrentWindow valueForKey:@"orientationModes"];
	if (![candidateOrientationModes isKindOfClass:arrayClass])
	{
		UINavigationController * navCon = [newCurrentWindow navController];
		NSEnumerator * viewControllerEnum = [[navCon viewControllers] reverseObjectEnumerator];

		noPrefrenceTab = YES;

		for (UIViewController * thisViewController in viewControllerEnum)
		{
			if (![thisViewController respondsToSelector:proxySel])
			{
				continue;
			}
			TiWindowProxy * thisProxy = (TiWindowProxy *)[(id)thisViewController proxy];
			if (![thisProxy isKindOfClass:windowClass])
			{
				continue;
			}
			candidateOrientationModes = [thisProxy valueForKey:@"orientationModes"];
			if ([candidateOrientationModes isKindOfClass:arrayClass])
			{
				noPrefrenceTab = NO;
				break;
			}
		}
	}

	if ([candidateOrientationModes isKindOfClass:arrayClass])
	{
		[self setOrientationModes:candidateOrientationModes];
	}
	else if(noPrefrenceTab)
	{
		[self setOrientationModes:nil];
	}

	if(allowedOrientations[lastOrientation] || (lastOrientation == 0))
	{
		return; //Nothing to enforce.
	}

	UIInterfaceOrientation requestedOrientation = [[UIApplication sharedApplication] statusBarOrientation];
	NSTimeInterval latestRequest = 0.0;
	for (int i=0; i<MAX_ORIENTATIONS; i++)
	{
		if (allowedOrientations[i] && (orientationRequestTimes[i]>latestRequest))
		{
			requestedOrientation = i;
			latestRequest = orientationRequestTimes[i];
		}
	}
	
	[self manuallyRotateToOrientation:requestedOrientation];
}


- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation 
{
	orientationRequestTimes[interfaceOrientation] = [NSDate timeIntervalSinceReferenceDate];
	return allowedOrientations[interfaceOrientation];
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
		focusedViewController=nil;
		[self enforceOrientationModesFromWindow:(id)focusedProxy];
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
	
	[self enforceOrientationModesFromWindow:(id)focusedProxy];
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


@end
