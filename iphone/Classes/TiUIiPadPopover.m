/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADPOPOVER

#import "TiUIiPadPopover.h"
#import "TiUtils.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2


@implementation TiUIiPadPopover

-(void)dealloc
{
	RELEASE_TO_NIL(viewController);
	RELEASE_TO_NIL(controller);
	[super dealloc];
}

-(UIPopoverController*)popover
{
	if (viewController==nil)
	{
		viewController = [[TiViewController alloc] initWithViewProxy:(TiViewProxy*)self.proxy];
		viewController.contentSizeForViewInPopover = size;
	}
	if (controller == nil)
	{
		// this is a special case where we are embedding the popup controller from a
		// split view event where the split view created one for us we can use
		controller = (UIPopoverController*)[self.proxy valueForUndefinedKey:@"popoverController"];
		if (controller==nil)
		{
			UINavigationController *nc = [[UINavigationController alloc]initWithRootViewController:viewController];
			controller = [[UIPopoverController alloc] initWithContentViewController:nc];
			[nc release];
		}
		else 
		{
			if ([controller.contentViewController isKindOfClass:[UINavigationController class]]==NO)
			{
				UINavigationController *nc = [[UINavigationController alloc]initWithRootViewController:controller.contentViewController];
				[controller setContentViewController:nc];
				[nc release];
			}
			[controller retain];
		}
		
		UINavigationController *nav = (UINavigationController*)controller.contentViewController;
		NSString *title = [self.proxy valueForUndefinedKey:@"title"];
		if (title!=nil)
		{
			nav.navigationBar.topItem.title = title;
		}
		TiViewProxy *leftItem = [self.proxy valueForUndefinedKey:@"leftNavButton"];
		if (leftItem!=nil)
		{
			nav.navigationBar.topItem.leftBarButtonItem = [leftItem barButtonItem];
		}
		TiViewProxy *rightItem = [self.proxy valueForUndefinedKey:@"rightNavButton"];
		if (rightItem!=nil)
		{
			nav.navigationBar.topItem.rightBarButtonItem = [rightItem barButtonItem];
		}
		
		controller.delegate = self;
	}
	return controller;
}

-(UINavigationController*)navigationController
{
	return (UINavigationController*)[self popover].contentViewController;
}

-(UINavigationItem*)item
{
	return [self navigationController].navigationBar.topItem;
}

-(void)setTitle_:(id)title
{
	ENSURE_SINGLE_ARG(title,NSString);
	if (controller!=nil)
	{
		[self item].title = title;
	}
}

-(void)setLeftNavButton_:(id)item
{
	ENSURE_SINGLE_ARG_OR_NIL(item,TiViewProxy);
	if (controller!=nil)
	{
		UIBarButtonItem *existingItem = [self item].leftBarButtonItem;
		if (existingItem!=nil && [existingItem isKindOfClass:[TiViewProxy class]])
		{
			[(TiViewProxy*)existingItem removeBarButtonView];
		}
		if (item!=nil && [item supportsNavBarPositioning])
		{
			[self item].leftBarButtonItem = [item barButtonItem];
		}
		else 
		{
			[self item].leftBarButtonItem = nil;
		}
	}
}

-(void)setRightNavButton_:(id)item
{
	ENSURE_SINGLE_ARG_OR_NIL(item,TiViewProxy);
	if (controller!=nil)
	{
		UIBarButtonItem *existingItem = [self item].rightBarButtonItem;
		if (existingItem!=nil && [existingItem isKindOfClass:[TiViewProxy class]])
		{
			[(TiViewProxy*)existingItem removeBarButtonView];
		}
		if (item!=nil && [item supportsNavBarPositioning])
		{
			[self item].rightBarButtonItem = [item barButtonItem];
		}
		else 
		{
			[self item].rightBarButtonItem = nil;
		}
	}
}

-(void)frameSizeChanged:(CGRect)frame bounds:(CGRect)bounds
{
	self.frame = CGRectIntegral(self.frame);
	viewController.contentSizeForViewInPopover = bounds.size;
	[TiUtils setView:[viewController view] positionRect:bounds];
}

#pragma mark Public APIs

-(void)setWidth_:(id)value
{
	ENSURE_SINGLE_ARG(value,NSObject);
	size.width = [TiUtils floatValue:value];
	viewController.contentSizeForViewInPopover = size;
}

-(void)setHeight_:(id)value
{
	ENSURE_SINGLE_ARG(value,NSObject);
	size.height = [TiUtils floatValue:value];
	viewController.contentSizeForViewInPopover = size;
}

-(NSNumber*)visible
{
	return NUMBOOL([[self popover] isPopoverVisible]);
}

-(NSNumber*)arrowDirection
{
	return NUMINT([[self popover] popoverArrowDirection]);
}

-(void)show:(id)args
{
	ENSURE_SINGLE_ARG(args,NSDictionary);
	
	NSDictionary *rectProps = [args objectForKey:@"rect"];
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	
	CGRect rect;
	if (rectProps!=nil)
	{
		rect.origin.x = [TiUtils floatValue:@"x" properties:rectProps];
		rect.origin.y = [TiUtils floatValue:@"y" properties:rectProps];
		rect.size.width = [TiUtils floatValue:@"width" properties:rectProps];
		rect.size.height = [TiUtils floatValue:@"height" properties:rectProps];
	}
	
	TiViewProxy *proxy = [args objectForKey:@"view"];
	
	UIView *view = [proxy view];
	UIPopoverArrowDirection directions = [TiUtils intValue:@"arrow" properties:args def:UIPopoverArrowDirectionAny];
	
	[[self popover] presentPopoverFromRect:rect inView:view permittedArrowDirections:directions animated:animated];
}

-(void)hide:(id)args
{
	ENSURE_SINGLE_ARG_OR_NIL(args,NSDictionary);
	BOOL animated = [TiUtils boolValue:@"animated" properties:args def:YES];
	[[self popover] dismissPopoverAnimated:animated];
}

#pragma mark Delegate 

/**
 * Called on the delegate when the user has taken action to dismiss the popover. This is not called when -dismissPopoverAnimated: is called directly.
 */
- (void)popoverControllerDidDismissPopover:(UIPopoverController *)popoverController
{
	if ([self.proxy _hasListeners:@"hide"])
	{
		[self.proxy fireEvent:@"hide" withObject:nil];
	}
}


@end

#endif

#endif