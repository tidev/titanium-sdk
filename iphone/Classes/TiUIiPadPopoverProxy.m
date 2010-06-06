/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPADPOPOVER) || defined(USE_TI_UIIPADSPLITWINDOW)

#import "TiUIiPadPopoverProxy.h"
#import "TiUIiPadPopover.h"
#import "TiUtils.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

@implementation TiUIiPadPopoverProxy
@synthesize viewController;

#pragma mark Setup
-(void)dealloc
{
	RELEASE_TO_NIL(viewController);
	RELEASE_TO_NIL(popoverController);
	[super dealloc];
}

#pragma mark Internal methods
-(void)refreshTitleBar
{
	if (viewController == nil)
	{
		return;
	}
	ENSURE_UI_THREAD_0_ARGS;
	UINavigationItem * ourItem = [viewController navigationItem];

	[ourItem setTitle:[TiUtils stringValue:[self valueForKey:@"title"]]];
	[ourItem setLeftBarButtonItem:[[self valueForKey:@"leftNavButton"] barButtonItem]];
	[ourItem setRightBarButtonItem:[[self valueForKey:@"rightNavButton"] barButtonItem]];
}

-(UINavigationController *)navigationController
{
	UINavigationController * result = [[UINavigationController alloc] initWithRootViewController:[self viewController]];
	return [result autorelease];
}

-(void)updateContentSize
{
	[[self viewController] setContentSizeForViewInPopover:
			SizeConstraintViewWithSizeAddingResizing([self layoutProperties], self, CGSizeZero, NULL)];
}

#pragma mark Accessors
-(TiViewController *)viewController
{
	if (viewController == nil)
	{
		viewController = [[TiViewController alloc] initWithViewProxy:self];
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
	UIViewController * contentController = [popoverController contentViewController];

	if ([contentController isKindOfClass:[UINavigationController class]])
	{
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
	[self refreshTitleBar];
}

-(UIPopoverController *)popoverController
{
	if (popoverController == nil)
	{
		popoverController = [[UIPopoverController alloc] initWithContentViewController:[self navigationController]];
		[popoverController setDelegate:self];
		[self refreshTitleBar];
	}
	return popoverController;
}

#pragma mark Public-facing accessors

-(void)setRightNavButton:(id)item
{
	ENSURE_SINGLE_ARG_OR_NIL(item,TiViewProxy);
	[self replaceValue:item forKey:@"rightNavButton" notification:NO];
	[self refreshTitleBar];
}

-(void)setLeftNavButton:(id)item
{
	ENSURE_SINGLE_ARG_OR_NIL(item,TiViewProxy);
	[self replaceValue:item forKey:@"rightNavButton" notification:NO];
	[self refreshTitleBar];
}

-(void)setTitle:(id)item
{
	[self replaceValue:item forKey:@"title" notification:NO];
	[self refreshTitleBar];
}

-(void)setWidth:(id)value
{
	[super setWidth:value];
	if (viewController != nil)
	{
		[self performSelectorOnMainThread:@selector(updateContentSize) withObject:nil waitUntilDone:NO];
	}
}

-(void)setHeight:(id)value
{
	[super setHeight:value];
	if (viewController != nil)
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
	
	TiViewProxy *proxy = [args objectForKey:@"view"];
	UIView *view = [proxy view];

	CGRect rect;
	if (rectProps!=nil)
	{
		rect = [TiUtils rectValue:rectProps];
	}
	else
	{
		rect = [view bounds];
	}
	
	UIPopoverArrowDirection directions = [TiUtils intValue:[self valueForKey:@"arrowDirection"] def:UIPopoverArrowDirectionAny];
	
	[self retain];
	[self updateContentSize];
	[[self popoverController] presentPopoverFromRect:rect inView:view permittedArrowDirections:directions animated:animated];
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