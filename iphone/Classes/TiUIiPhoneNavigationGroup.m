/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONENAVIGATIONGROUP

#import "TiUIiPhoneNavigationGroup.h"
#import "TiUtils.h"
#import "TiWindowProxy.h"

@implementation TiUIiPhoneNavigationGroup

-(void)setVisibleProxy:(TiWindowProxy *) newVisibleProxy
{
	if (newVisibleProxy == visibleProxy)
	{
		return;
	}
	[visibleProxy _tabBeforeBlur];
	[visibleProxy _tabBlur];
	[visibleProxy autorelease];

	visibleProxy = [newVisibleProxy retain];
	[newVisibleProxy _tabBeforeFocus];
	[newVisibleProxy _tabFocus];
}

-(void)dealloc
{
	RELEASE_TO_NIL(controller);
	
	[self setVisibleProxy:nil];
	//This is done this way so that proper methods are called as well.
	[super dealloc];
}

-(UINavigationController*)controller
{
	if (controller==nil)
	{
		TiWindowProxy* windowProxy = [self.proxy valueForKey:@"window"];
		if (windowProxy==nil)
		{
			[self throwException:@"window property required" subreason:nil location:CODELOCATION];
		}
		UIViewController *rootController = [windowProxy controller];	
		controller = [[UINavigationController alloc] initWithRootViewController:rootController];
		[controller setDelegate:self];
		[self addSubview:controller.view];
		[controller.view addSubview:[windowProxy view]];
		[windowProxy prepareForNavView:controller];
		
		current = windowProxy;
		root = windowProxy;
	}
	return controller;
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	if (controller!=nil)
	{
		[TiUtils setView:controller.view positionRect:bounds];
	}
}

#pragma mark Public APIs

-(void)setWindow_:(id)window
{
	[self controller];
}

-(void)close
{
	if (controller!=nil)
	{
		for (UIViewController *viewController in controller.viewControllers)
		{
			UIView *view = viewController.view;
			if ([view isKindOfClass:[TiUIWindow class]])
			{
				TiWindowProxy *win =(TiWindowProxy*) ((TiUIWindow*)view).proxy;
				[win retain];
				[[win view] removeFromSuperview];
				[win close:nil];
				[win autorelease];
			}
		}
		[controller.view removeFromSuperview];
		[controller resignFirstResponder];
		RELEASE_TO_NIL(controller);
	}
}

-(void)open:(TiWindowProxy*)window withObject:(NSDictionary*)properties
{
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
	UIViewController *viewController = [window controller];
	current = window;
	opening = YES;
	[controller pushViewController:viewController animated:animated];
}

-(void)close:(TiWindowProxy*)window withObject:(NSDictionary*)properties
{
	UIViewController* windowController = [window controller];
	NSMutableArray* newControllers = [NSMutableArray arrayWithArray:controller.viewControllers];
	BOOL animated = (windowController == [newControllers lastObject]);
	[newControllers removeObject:windowController];
	[controller setViewControllers:newControllers animated:animated];
	
	[window retain];
	[window close:nil];
	[window autorelease];
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	[controller willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}


#pragma mark Delegate 

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
    TiWindowProxy *newWindow = (TiWindowProxy *)[(TiViewController*)viewController proxy];
	[newWindow prepareForNavView:controller];
	[newWindow setupWindowDecorations];
	
	[newWindow windowWillOpen];
}
- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	TiViewController *wincontroller = (TiViewController*)viewController;
	TiWindowProxy *newWindow = (TiWindowProxy *)[wincontroller proxy];
	[self setVisibleProxy:newWindow];
	
	if (newWindow!=current)
	{
		if (current!=root && opening==NO)
		{
			[self close:current withObject:nil];
		}
		current = newWindow;
	}
	opening = NO;
	[newWindow windowDidOpen];
}


@end

#endif