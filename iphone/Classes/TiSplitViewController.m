/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADSPLITWINDOW
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
#import "TiSplitViewController.h"
#import "TiBase.h"

@implementation TiSplitViewController

-(id)initWithRootController:(TiRootViewController *)controller
{
	if (self = [super init]) {
		titaniumRoot = [controller retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(titaniumRoot);
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
	// No-op for split view controllers
}

-(void)repositionSubviews
{
	// No-op for split view controllers
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
