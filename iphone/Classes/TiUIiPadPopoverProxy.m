/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPADPOPOVER) || defined(USE_TI_UIIPADSPLITWINDOW)
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

#import "TiUIiPadPopoverProxy.h"
#import "TiUIiPadPopover.h"
#import "TiUtils.h"
#import <libkern/OSAtomic.h>


@implementation TiUIiPadPopoverProxy
@synthesize viewController;

#pragma mark Setup
-(void)dealloc
{
	RELEASE_TO_NIL(viewController);
	RELEASE_TO_NIL(navigationController);
	RELEASE_TO_NIL(popoverController);
	[super dealloc];
}

#pragma mark Internal methods
-(void)refreshTitleBarWithObject:(id)properties
{
	if (viewController == nil)
	{
		return;
	}
	ENSURE_UI_THREAD_1_ARG(properties);
	
	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
	
	UINavigationItem * ourItem = [viewController navigationItem];

	[ourItem setTitle:[TiUtils stringValue:[self valueForKey:@"title"]]];
	[ourItem setLeftBarButtonItem:[[self valueForKey:@"leftNavButton"] barButtonItem] animated:animated];
	[ourItem setRightBarButtonItem:[[self valueForKey:@"rightNavButton"] barButtonItem] animated:animated];
	
	[[self navigationController] setNavigationBarHidden:[TiUtils boolValue:[self valueForKey:@"navBarHidden"]] animated:animated];

}

-(void)repositionWithBounds:(CGRect)bounds
{
	OSAtomicTestAndClearBarrier(NEEDS_REPOSITION, &dirtyflags);
	[self layoutChildren];
}


-(CGSize)contentSize
{
	return SizeConstraintViewWithSizeAddingResizing([self layoutProperties], self, CGSizeZero, NULL);
}

-(UINavigationController *)navigationController
{
	if (navigationController == nil)
	{
		navigationController = [[UINavigationController alloc] initWithRootViewController:[self viewController]];
	}
	return navigationController;
}

-(void)updateContentSize
{
	CGSize newSize = [self contentSize];
	BOOL animated = [[self popoverController] isPopoverVisible];
	NSLog(@"Going From %fx%f",[popoverController popoverContentSize].width,[popoverController popoverContentSize].height);

	NSLog(@"Going to set size to %fx%f with animated %d",newSize.width,newSize.height,animated);

	[popoverController setPopoverContentSize:newSize animated:YES];
	[self layoutChildren];
}

#pragma mark Accessors
-(TiViewController *)viewController
{
	if (viewController == nil)
	{
		viewController = [[TiViewController alloc] initWithViewProxy:self];
/*
 *	Yes, I know that [TiViewController view] will return [self view] anyways, but for some
 *	strange reason, UIPopoverController doesn't like that. So we must explicitly set the view
 *	variable so that the UIViewController mojo isn't thrown off for sizing.
 */
		[viewController setView:[self view]];
	}
	return viewController;
}

-(void)setPopoverController:(UIPopoverController *)newController
{
	// this is only called when we are embedding the popup controller from a
	// split view event where the split view created one for us we can use
	if (popoverController == newController)
	{
		return;
	}
	[popoverController setDelegate:nil];
	RELEASE_TO_NIL(popoverController);
	popoverController = [newController retain];
	RELEASE_TO_NIL(navigationController);
	UIViewController * contentController = [popoverController contentViewController];

	if ([contentController isKindOfClass:[UINavigationController class]])
	{
		navigationController = [contentController retain];
		NSArray * viewControllersArray = [(UINavigationController *)contentController viewControllers];
		if ([viewControllersArray count]>0)
		{
			[self setViewController:[viewControllersArray objectAtIndex:0]];
		}
		else
		{
			[self setViewController:nil];
		}
	}
	else
	{
		[self setViewController:(TiViewController *)contentController];
		[popoverController setContentViewController:[self navigationController]];
	}
	[popoverController setDelegate:self];
	[self refreshTitleBarWithObject:nil];
}

-(UIPopoverController *)popoverController
{
	if (popoverController == nil)
	{
		popoverController = [[UIPopoverController alloc] initWithContentViewController:[self navigationController]];
		[popoverController setDelegate:self];
		[self refreshTitleBarWithObject:nil];
		[self updateContentSize];
	}
	return popoverController;
}

#pragma mark Public-facing accessors

-(void)setRightNavButton:(id)item withObject:(id)properties
{
	ENSURE_SINGLE_ARG_OR_NIL(item,TiViewProxy);
	[self replaceValue:item forKey:@"rightNavButton" notification:NO];
	[self refreshTitleBarWithObject:properties];
}

-(void)setLeftNavButton:(id)item withObject:(id)properties
{
	ENSURE_SINGLE_ARG_OR_NIL(item,TiViewProxy);
	[self replaceValue:item forKey:@"rightNavButton" notification:NO];
	[self refreshTitleBarWithObject:properties];
}

-(void)setNavBarHidden:(id)item withObject:(id)properties
{
	[self replaceValue:item forKey:@"navBarHidden" notification:NO];
	[self refreshTitleBarWithObject:properties];
}


-(void)showNavBar:(NSArray*)args
{
	id properties;
	if ([args count]>0)
	{
		properties = [args objectAtIndex:0];
	}
	else
	{
		properties = nil;
	}

	[self setNavBarHidden:[NSNumber numberWithBool:NO] withObject:properties];
}

-(void)hideNavBar:(NSArray*)args
{
	id properties;
	if ([args count]>0)
	{
		properties = [args objectAtIndex:0];
	}
	else
	{
		properties = nil;
	}

	[self setNavBarHidden:[NSNumber numberWithBool:YES] withObject:properties];
}


-(void)setTitle:(id)item
{
	[self replaceValue:item forKey:@"title" notification:NO];
	[self refreshTitleBarWithObject:nil];
}

-(void)setWidth:(id)value
{
	[super setWidth:value];
	if (popoverController != nil)
	{
		[self performSelectorOnMainThread:@selector(updateContentSize) withObject:nil waitUntilDone:NO];
	}
}

-(void)setHeight:(id)value
{
	[super setHeight:value];
	if (popoverController != nil)
	{
		[self performSelectorOnMainThread:@selector(updateContentSize) withObject:nil waitUntilDone:NO];
	}
}


-(void)show:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	ENSURE_UI_THREAD_1_ARG(args);
	
	NSDictionary *rectProps = [args objectForKey:@"rect"];
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	UIPopoverArrowDirection directions = [TiUtils intValue:[self valueForKey:@"arrowDirection"] def:UIPopoverArrowDirectionAny];
	
	TiViewProxy *proxy = [args objectForKey:@"view"];


	[self retain];
	[self updateContentSize];

	if ([proxy isUsingBarButtonItem]) {
		[[self popoverController] presentPopoverFromBarButtonItem:[proxy barButtonItem] permittedArrowDirections:directions animated:animated];
	}
	else
	{
		UIView *view = [proxy view];
		
		CGRect rect;
		if (rectProps!=nil)
		{
			rect = [TiUtils rectValue:rectProps];
		}
		else
		{
			rect = [view frame];
		}
		
		[[self popoverController] presentPopoverFromRect:rect inView:[view superview] permittedArrowDirections:directions animated:animated];
	}
}

-(void)hide:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);

	ENSURE_UI_THREAD_1_ARG(args);
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	[[self popoverController] dismissPopoverAnimated:animated];
}

#pragma mark Delegate methods
- (void)popoverControllerDidDismissPopover:(UIPopoverController *)popoverController
{
	[self fireEvent:@"hide" withObject:nil]; //Checking for listeners are done by fireEvent anyways.
	[self performSelector:@selector(release) withObject:nil afterDelay:0.5];
}


@end
#endif

#endif