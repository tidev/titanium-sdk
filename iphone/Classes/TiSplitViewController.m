/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"


#ifdef USE_TI_UIIPADSPLITWINDOW

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

#import "TiSplitViewController.h"
#import "TiViewProxy.h"

@implementation TiSplitViewController

-(id)initWithRootController:(TiRootViewController *)rootController masterProxy:(TiViewProxy*)master_ detailProxy:(TiViewProxy*)detail_
{
	if (self = [super init]) {
		titaniumRoot = [rootController retain];
		
		master = [[TiViewController alloc] initWithViewProxy:master_];
		detail = [[TiViewController alloc] initWithViewProxy:detail_];
		
		UINavigationController *leftNav = [[UINavigationController alloc] initWithRootViewController:master];
		UINavigationController *rightNav = [[UINavigationController alloc] initWithRootViewController:detail];
		
		leftNav.navigationBarHidden = YES;
		rightNav.navigationBarHidden = YES;
		
		self.viewControllers = [NSArray arrayWithObjects:leftNav,rightNav,nil];

		[leftNav release];
		[rightNav release];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(titaniumRoot);
	RELEASE_TO_NIL(master);
	RELEASE_TO_NIL(detail);
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

-(void)loadView
{
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didOrientNotify:) name:UIDeviceOrientationDidChangeNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:titaniumRoot name:UIDeviceOrientationDidChangeNotification object:nil];
	[super loadView];
}

-(void)viewDidLoad
{
	[self willAnimateRotationToInterfaceOrientation:[[UIDevice currentDevice] orientation] duration:0];
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
	
	if ((lastOrientation!=newOrientation) && [self shouldAutorotateToInterfaceOrientation:newOrientation])
	{ //This is for when we've forced an orientation that was not what the device was, and
		//Now we want to return to it. Because newOrientation and windowOrientation are identical
		//The iPhone OS wouldn't send this method.
		[self willAnimateRotationToInterfaceOrientation:newOrientation duration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
	}
	
}

-(void)repositionSubviews
{
	[[master proxy] reposition];
	[[detail proxy] reposition];
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
	[self manuallyRotateToOrientation:toInterfaceOrientation duration:duration];
	[super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation 
{
	return [titaniumRoot shouldAutorotateToInterfaceOrientation:interfaceOrientation];
}

-(void)refreshOrientationModesIfNeeded:(TiWindowProxy *)oldCurrentWindow
{
	[titaniumRoot refreshOrientationModesIfNeeded:oldCurrentWindow];
}

-(void)windowFocused:(UIViewController*)focusedViewController
{
	// No-op on split views
}

-(void)windowClosed:(UIViewController *)closedViewController
{
	// No-op on split views
}

-(void)setBackgroundImage:(UIImage*)image
{
	// No-op on split views
}

-(void)setBackgroundColor:(UIColor*)color
{
	// No-op on split view
}

@end
#endif
#endif
