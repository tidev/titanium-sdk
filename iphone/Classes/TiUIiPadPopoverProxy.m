/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPADPOPOVER) || defined(USE_TI_UIIPADSPLITWINDOW)

#import "TiUIiPadPopoverProxy.h"
#import "TiUIiPadPopover.h"
#import "TiUtils.h"
#import <libkern/OSAtomic.h>

TiUIiPadPopoverProxy * currentlyDisplaying = nil;

@implementation TiUIiPadPopoverProxy
@synthesize viewController, popoverView;

#pragma mark Setup

-(id)init
{
    if (self = [super init]) {
        closingCondition = [[NSCondition alloc] init];
    }
    return self;
}

-(void)dealloc
{
	if (currentlyDisplaying == self) {
		//This shouldn't happen because we clear it on hide.
		currentlyDisplaying = nil;
	}
	[viewController setProxy:nil];
	RELEASE_TO_NIL(viewController);
	RELEASE_TO_NIL(navigationController);
	RELEASE_TO_NIL(popoverController);
	RELEASE_TO_NIL(popoverView);
    RELEASE_TO_NIL(closingCondition);
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
    id item = [self valueForKey:@"leftNavButton"];
    if ( (item == nil) || (item == [NSNull null]) ) {
        [ourItem setLeftBarButtonItem:nil animated:animated_];
    }
    else {
        [ourItem setLeftBarButtonItem:[item barButtonItem] animated:animated_];
    }
    item = [self valueForKey:@"rightNavButton"];
    if ( (item == nil) || (item == [NSNull null]) ) {
        [ourItem setRightBarButtonItem:nil animated:animated_];
    }
    else {
        [ourItem setRightBarButtonItem:[item barButtonItem] animated:animated_];
    }
	
	[[self navigationController] setNavigationBarHidden:[TiUtils boolValue:[self valueForKey:@"navBarHidden"]] animated:animated_];

}

-(CGSize)contentSize
{
    CGSize screenSize = [[UIScreen mainScreen] bounds].size;
    UIInterfaceOrientation orientation = [UIApplication sharedApplication].statusBarOrientation;
    
    if (orientation == UIInterfaceOrientationLandscapeRight || orientation ==  UIInterfaceOrientationLandscapeLeft ) {
        CGSize tempSize = CGSizeMake(screenSize.height, screenSize.width);
        screenSize = tempSize;
    }
    
	return SizeConstraintViewWithSizeAddingResizing([self layoutProperties], self, screenSize , NULL);
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
		TiThreadPerformOnMainThread(^{[self updateContentSize];}, NO);
	}
}

-(void)setHeight:(id)value
{
	[super setHeight:value];
	if (popoverController != nil)
	{
		TiThreadPerformOnMainThread(^{[self updateContentSize];}, NO);
	}
}


-(void)show:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	[self rememberSelf];
	
	[closingCondition lock];
	if (isDismissing) {
		[closingCondition wait];
	}
	[closingCondition unlock];

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

	TiThreadPerformOnMainThread(^{
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(updatePopover:) name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
		[self windowWillOpen];
		[self reposition];
		[self updatePopoverNow];
		[self windowDidOpen];
	},YES);

}

-(void)updatePopover:(NSNotification *)notification;
{
	//This may be due to a possible race condition of rotating the iPad while another popover is coming up.
	if ((currentlyDisplaying != self)) {
		return;
	}
	[self performSelector:@selector(updatePopoverNow) withObject:nil afterDelay:[[UIApplication sharedApplication] statusBarOrientationAnimationDuration] inModes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
}

-(void)updatePopoverNow
{
    // We're in the middle of playing cleanup while a hide() is happening.
    if (isDismissing) {
        return;
    }
    
	if ((currentlyDisplaying != self)) {
		[currentlyDisplaying hide:nil];
		currentlyDisplaying = self;
	}
	
	
	[self updateContentSize];

	if ([popoverView isUsingBarButtonItem])
	{
		UIBarButtonItem * ourButtonItem = [popoverView barButtonItem];
		@try {
			/*
			 *	Because buttonItems may or many not have a view, there is no way for us
			 *	to know beforehand if the request is an invalid one.
			 */
			[[self popoverController] presentPopoverFromBarButtonItem: ourButtonItem permittedArrowDirections:directions animated:animated];
		}
		@catch (NSException *exception) {
			DebugLog(@"[WARN] Popover requested on view not attached to current window.");
		}
	}
	else
	{
		UIView *view_ = [popoverView view];
		if ([view_ window] == nil) {
			// No window, so we can't display the popover...
			DebugLog(@"[WARN] Unable to display popover; view is not attached to the current window");
            return;
		}
		
		CGRect rect;
		if (CGRectIsEmpty(popoverRect))
		{
			rect = [view_ bounds];
		}
		else
		{
			rect = popoverRect;
		}
		
		[[self popoverController] presentPopoverFromRect:rect inView:view_ permittedArrowDirections:directions animated:animated];
	}
}

-(void)hide:(id)args
{
	if (!isShowing) {
		return;
	}
    
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	
	[closingCondition lock];
	isDismissing = YES;
	[closingCondition unlock];
	
	TiThreadPerformOnMainThread(^{
		if (currentlyDisplaying == self) {
			currentlyDisplaying = nil;
		}
		BOOL animated_ = [TiUtils boolValue:@"animated" properties:args def:YES];
		[[self popoverController] dismissPopoverAnimated:animated_];
		
		// Manually calling dismissPopoverAnimated: does not, in fact, call the delegate's
		// popoverControllerDidDismissPopover: callback. See documentation!
		
		// OK, apparently we need the delay so that the animation can finish and the popover vanish before making any
		// dealloc attempts. But mixing poorly-timed hide/show calls can lead to crashes due to this delay, so we
		// have to set a flag to warn show(), and then trigger a condition when the flag is cleared.
		
		[self performSelector:@selector(popoverControllerDidDismissPopover:) withObject:popoverController afterDelay:0.5];		
	},NO);
}

-(void)setPassthroughViews:(id)args
{
    NSMutableArray* views = [NSMutableArray arrayWithCapacity:[args count]];
    for (TiViewProxy* proxy in args) {
        if (![proxy isKindOfClass:[TiViewProxy class]]) {
            [self throwException:[NSString stringWithFormat:@"Passed non-view object %@ as passthrough view",proxy] 
					   subreason:nil
						location:CODELOCATION];
        }
        [views addObject:[proxy view]];
    }
    [[self popoverController] setPassthroughViews:views];
}

#pragma mark Delegate methods
- (void)popoverControllerDidDismissPopover:(UIPopoverController *)thisPopoverController
{
//As of iPhone OS 3.2, calling dismissPopoverAnimated does NOT call didDismissPopover. So we have to do it ourselves.
//HOWEVER, in the event that this IS fixed, we don't want this called one too many times, thus isShowing is to protect
//against that.
	if (!isShowing)
	{
        [closingCondition lock];
        isDismissing = NO;
        [closingCondition signal];
        [closingCondition unlock];
        
		return;
	}
	if (currentlyDisplaying == self) {
		currentlyDisplaying = nil;
	}
	[self windowWillClose];
	isShowing = NO;
	[self fireEvent:@"hide" withObject:nil]; //Checking for listeners are done by fireEvent anyways.
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIApplicationWillChangeStatusBarOrientationNotification object:nil];
	[self windowDidClose];
	[self forgetSelf];
	RELEASE_TO_NIL(viewController);
	RELEASE_TO_NIL_AUTORELEASE(popoverController);
	RELEASE_TO_NIL(navigationController);
	[self performSelector:@selector(release) withObject:nil afterDelay:0.5];
    [closingCondition lock];
    isDismissing = NO;
    [closingCondition signal];
    [closingCondition unlock];
}

-(BOOL)suppressesRelayout
{
	return YES;
}

- (UIViewController *)childViewController;
{
	return nil;
}

/*	
 *	The viewWill/DidAppear/Disappear functions are here to conform to the
 *	TIUIViewController protocol, but currently do nothing. In the future they
 *	may pass the events onto the children. But whether that's needed or not
 *	requires research. TODO: Research popover actions for view transitions
 */
- (void)viewWillAppear:(BOOL)animated
{
}

- (void)viewDidAppear:(BOOL)animated
{
}

- (void)viewWillDisappear:(BOOL)animated
{
}

- (void)viewDidDisappear:(BOOL)animated
{
}

@end

#endif
