/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITabGroup.h"
#import "TiUITabProxy.h"
#import "TiUtils.h"
#import "TiUITabController.h"

@implementation TiUITabGroup

DEFINE_EXCEPTIONS

-(void)dealloc
{
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(focused);
	[super dealloc];
}

-(UITabBarController*)tabController
{
	if (controller==nil)
	{
		controller = [[UITabBarController alloc] init];
		controller.delegate = self;
	}
	return controller;
}

-(int)findIndexForTab:(TiProxy*)proxy
{
	if (proxy!=nil)
	{
		int index = 0;
		for (UINavigationController *tc in controller.viewControllers)
		{
			if (tc.delegate == (id)proxy)
			{
				return index;
			}
			index++;
		}
	}
	return -1;
}

#pragma mark TabBarController Delegates

- (void)tabBarController:(UITabBarController *)tabBarController didSelectViewController:(UIViewController *)viewController
{
	if ([viewController isKindOfClass:[UINavigationController class]])
	{
		UINavigationController *navController = (UINavigationController*)viewController;
		TiUITabProxy *tab = (TiUITabProxy*)navController.delegate;
		
		int selectedIndex = [tabBarController selectedIndex];
		int previousIndex = [self findIndexForTab:focused];
		
		// hold for the event below
		id oldTab = [[focused retain] autorelease];
		
		if (focused)
		{
			BOOL tbBlur = [self.proxy _hasListeners:@"blur"];
			BOOL tBlur = [focused _hasListeners:@"blur"];
			// check to see if the tabGroup and/or tab has a blur and fire to him
			if (tbBlur || tBlur)
			{
				NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:tab,@"tab",NUMINT(selectedIndex),@"index",NUMINT(previousIndex),@"previousIndex",focused,@"previousTab",nil];
				if (tbBlur)
				{
					[self.proxy fireEvent:@"blur" withObject:event];
				}
				if (tBlur)
				{
					[focused fireEvent:@"blur" withObject:event];
				}
			}
			
			RELEASE_TO_NIL(focused);
		}
		
		// set our new focused tab reference so we can keep track
		focused = [tab retain];
		
		// set our activeTab property
		[self.proxy replaceValue:focused forKey:@"activeTab" notification:NO];
		
		BOOL tbFocus = [self.proxy _hasListeners:@"focus"];
		BOOL tFocus = [focused _hasListeners:@"focus"];
		
		// check to see if we have a focus listener(s) and fire event to him (against tabGroup)
		if (tbFocus || tFocus)
		{
			NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:focused,@"tab",NUMINT(selectedIndex),@"index",NUMINT(previousIndex),@"previousIndex",oldTab,@"previousTab",nil];
			if (tbFocus)
			{
				[self.proxy fireEvent:@"focus" withObject:event];
			}
			if (tFocus)
			{
				[focused fireEvent:@"focus" withObject:event];
			}
		}
	}
}

- (void)tabBarController:(UITabBarController *)tabBarController willEndCustomizingViewControllers:(NSArray *)viewControllers changed:(BOOL)changed
{
	//TODO
}


#pragma mark Public APIs

-(void)setTabs_:(id)tabs
{
	ENSURE_TYPE_OR_NIL(tabs,NSArray);
	
	if (tabs!=nil && [tabs count] > 0)
	{
		NSMutableArray *controllers = [[NSMutableArray alloc] init];
		for (TiUITabProxy *tabProxy in tabs)
		{
			[controllers addObject:[tabProxy controller]];
		}
		[self tabController].viewControllers = controllers;
		[controllers release];
		if (focused == nil)
		{
			focused = [tabs objectAtIndex:0];
			[self.proxy	replaceValue:focused forKey:@"activeTab" notification:NO];
		}
	}
	else
	{
		focused = nil;
		[self.proxy	replaceValue:nil forKey:@"activeTab" notification:NO];
		[self tabController].viewControllers = nil;
	}
}

-(void)setActiveTab_:(id)value
{
	UIViewController *active = nil;
	
	if ([value isKindOfClass:[TiUITabProxy class]])
	{
		TiUITabProxy *tab = (TiUITabProxy*)value;
		for (UIViewController *c in [self tabController].viewControllers)
		{
			if ([[tab controller] isEqual:c])
			{
				active = c;
				break;
			}
		}
	}
	else
	{
		int index = [TiUtils intValue:value];
		if (index >= 0 && index < [[self tabController].viewControllers count])
		{
			active = [[self tabController].viewControllers objectAtIndex:index];
		}
	}
	
	[self tabController].selectedViewController = active;
	[self tabBarController:[self tabController] didSelectViewController:active];
}

-(void)open:(id)args
{
	UIView *view = [self tabController].view;
	[TiUtils setView:view positionRect:[self bounds]];
	[self addSubview:view];
}

-(void)close:(id)args
{
	[self.proxy setValue:nil forKey:@"activeTab"];
	if (controller!=nil)
	{ 
		for (UIViewController *c in controller.viewControllers)
		{
			UINavigationController *navController = (UINavigationController*)c;
			TiUITabProxy *tab = (TiUITabProxy*)navController.delegate;
			[tab close:nil];
			[tab removeFromTabGroup];
		}
		controller.viewControllers = nil;
	}
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(focused);
}

@end
