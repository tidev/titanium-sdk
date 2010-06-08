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

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)orientation
{
	[self willRotateToInterfaceOrientation:orientation duration:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
}

-(void)windowFocused:(UIViewController*)focusedViewController
{
	// No-op for split view controllers
}

-(void)windowClosed:(UIViewController *)closedViewController
{
	// No-op for split view controllers
}

-(CGRect)resizeView
{
	CGRect rect = [[UIScreen mainScreen] applicationFrame];
	[[self view] setFrame:rect];
	VerboseLog(@"(%f,%f),(%fx%f)",rect.origin.x,rect.origin.y,rect.size.width,rect.size.height);
	//Because of the transition in landscape orientation, TiUtils can't be used here... SetFrame compensates for it.
	return rect;
}

-(void)repositionSubviews
{
	// No-op
}

-(void)setBackgroundColor:(UIColor*)color
{
	// No-op for split view controllers
}

-(void)setBackgroundImage:(UIImage*) backgroundImage
{
	// No-op for split view controllers
}

-(BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation
{
	[titaniumRoot shouldAutorotateToInterfaceOrientation:toInterfaceOrientation];
}

@end
#endif
#endif
