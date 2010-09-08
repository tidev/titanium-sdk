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
#import <libkern/OSAtomic.h>

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

@implementation TiUIiPadPopoverProxy
@synthesize viewController, popoverView;

#pragma mark Setup
-(void)dealloc
{
	RELEASE_TO_NIL(viewController);
	RELEASE_TO_NIL(navigationController);
	RELEASE_TO_NIL(popoverController);
	RELEASE_TO_NIL(popoverView);
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
	
	BOOL animated_ = [TiUtils boolValue:@"animated" properties:properties def:YES];
	
	UINavigationItem * ourItem = [viewController navigationItem];

	[ourItem setTitle:[TiUtils stringValue:[self valueForKey:@"title"]]];
	[ourItem setLeftBarButtonItem:[[self valueForKey:@"leftNavButton"] barButtonItem] animated:animated_];
	[ourItem setRightBarButtonItem:[[self valueForKey:@"rightNavButton"] barButtonItem] animated:animated_];
	
	[[self navigationController] setNavigationBarHidden:[TiUtils boolValue:[self valueForKey:@"navBarHidden"]] animated:animated_];

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
	BOOL animated_ = [[self popoverController] isPopoverVisible];
	[[self viewController] setContentSizeForViewInPopover:newSize];
	[self layoutChildren:NO];
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
	[self replaceValue:item forKey:@"leftNavButton" notification:NO];
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
	animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	directions = [TiUtils intValue:[self valueForKey:@"arrowDirection"] def:UIPopoverArrowDirectionAny];
	[self setPopoverView:[args objectForKey:@"view"]];

	if (rectProps!=nil)
	{
		popoverRect = [TiUtils rectValue:rectProps];
	}
	else
	{
		popoverRect = CGRectZero;
	}

	isShowing = YES;
	[self retain];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePopover:) name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
	[self windowWillOpen];
	[self reposition];
	[self updatePopoverNow];
	[self windowDidOpen];
}

-(void)updatePopover:(NSNotification *)notification;
{
	[self performSelector:@selector(updatePopoverNow) withObject:nil afterDelay:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration]];
}

-(void)updatePopoverNow
{
	[self updateContentSize];

	if ([popoverView isUsingBarButtonItem])
	{
		[[self popoverController] presentPopoverFromBarButtonItem:[popoverView barButtonItem] permittedArrowDirections:directions animated:animated];
	}
	else
	{
		UIView *view = [popoverView view];
		
		CGRect rect;
		if (CGRectIsEmpty(popoverRect))
		{
			rect = [view bounds];
		}
		else
		{
			rect = popoverRect;
		}
		
		[[self popoverController] presentPopoverFromRect:rect inView:view permittedArrowDirections:directions animated:animated];
	}
}


-(void)hide:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);

	ENSURE_UI_THREAD_1_ARG(args);
	BOOL animated_ = [TiUtils boolValue:@"animated" properties:args def:YES];
	[[self popoverController] dismissPopoverAnimated:animated_];

//As of iPhone OS 3.2, calling dismissPopoverAnimated does NOT call didDismissPopover. So we have to do it ourselves...
	[self performSelector:@selector(popoverControllerDidDismissPopover:) withObject:popoverController afterDelay:0.5];
}

#pragma mark Delegate methods
- (void)popoverControllerDidDismissPopover:(UIPopoverController *)thisPopoverController
{
//As of iPhone OS 3.2, calling dismissPopoverAnimated does NOT call didDismissPopover. So we have to do it ourselves.
//HOWEVER, in the event that this IS fixed, we don't want this called one too many times, thus isShowing is to protect
//against that.
	if (!isShowing)
	{
		return;
	}
	[self windowWillClose];
	isShowing = NO;
	[self fireEvent:@"hide" withObject:nil]; //Checking for listeners are done by fireEvent anyways.
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
	[self windowDidClose];
	RELEASE_TO_NIL(viewController);
	RELEASE_TO_NIL_AUTORELEASE(popoverController);
	RELEASE_TO_NIL(navigationController);
	[self performSelector:@selector(release) withObject:nil afterDelay:0.5];
}

- (UIViewController *)childViewController;
{
	return nil;
}

-(BOOL)suppressesRelayout
{
	return YES;
}


@end
#endif

#endif