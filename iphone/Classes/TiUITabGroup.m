/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiUITabGroup.h"
#import "TiUITabProxy.h"
#import "TiUtils.h"
#import "TiColor.h"
#import "TiUITabController.h"
#import "TiWindowProxy.h"
#import "TiUITabGroupProxy.h"

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

-(UITabBar*)tabbar
{
	return [self tabController].tabBar;
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

#pragma mark Dispatching focus change

- (void)handleWillShowTab:(TiUITabProxy *)newFocus
{
	[focused handleWillBlur];
	[newFocus handleWillFocus];
}

- (void)handleDidShowTab:(TiUITabProxy *)newFocus
{
	NSMutableDictionary * event = [NSMutableDictionary dictionaryWithCapacity:4];

	NSArray * tabArray = [controller viewControllers];

	int previousIndex = -1;
	int index = -1;

	if (focused != nil)
	{
		[event setObject:focused forKey:@"previousTab"];
		previousIndex = [tabArray indexOfObject:[(TiUITabProxy *)focused controller]];
	}
	
	if (newFocus != nil)
	{
		[event setObject:newFocus forKey:@"tab"];
		index = [tabArray indexOfObject:[(TiUITabProxy *)newFocus controller]];
	}

	[event setObject:NUMINT(previousIndex) forKey:@"previousIndex"];
	[event setObject:NUMINT(index) forKey:@"index"];

	[self.proxy fireEvent:@"blur" withObject:event];
	[focused handleDidBlur:event];
    [focused replaceValue:[NSNumber numberWithBool:NO] forKey:@"active" notification:NO];
	
	RELEASE_TO_NIL(focused);
	focused = [newFocus retain];
	[self.proxy replaceValue:focused forKey:@"activeTab" notification:NO];
    [focused replaceValue:[NSNumber numberWithBool:YES] forKey:@"active" notification:NO];

	[self.proxy fireEvent:@"focus" withObject:event];
	[focused handleDidFocus:event];
}


#pragma mark More tab delegate


-(void)updateMoreBar:(UINavigationController *)moreController
{
	if ([[moreController viewControllers] count] != 1)
	{
		return;
	}
	
	[TiUtils applyColor:barColor toNavigationController:moreController];
}

-(void)setEditButton:(UINavigationController*)moreController
{
	if ([[moreController viewControllers] count] == 1) {
		UINavigationBar* navBar = [moreController navigationBar];
		UINavigationItem* navItem = [navBar topItem];
		UIBarButtonItem* editButton = [navItem rightBarButtonItem];
		if (editTitle != nil) {
			editButton.title = editTitle;
		}
		else {
			// TODO: Need to get the localized value here
			editButton.title = @"Edit";
		}
	}
}

-(void)removeEditButton:(UINavigationController*)moreController
{
	if ([[moreController viewControllers] count] == 1) {
		UINavigationBar* navBar = [moreController navigationBar];
		UINavigationItem* navItem = [navBar topItem];
		[navItem setRightBarButtonItem:nil];
	}
}

-(void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated	
{
	NSArray * moreViewControllerStack = [navigationController viewControllers];
	int stackHeight = [moreViewControllerStack count];
	if (stackHeight > 1)
	{
		UIViewController * rootController = [moreViewControllerStack objectAtIndex:1];
		if ([rootController respondsToSelector:@selector(tab)])
		{
			[(TiUITabProxy *)[(id)rootController tab] handleWillShowViewController:viewController];
		}
	}
	else
	{
		[self handleWillShowTab:nil];
		[self updateMoreBar:navigationController];
		if (allowConfiguration) {
			[self setEditButton:navigationController];
		}
		// However, under iOS4, we have to manage the appearance/disappearance of the edit button ourselves.
		else if ([TiUtils isIOS4OrGreater]) {
			[self removeEditButton:navigationController];
		}
	}
}


- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	NSArray * moreViewControllerStack = [navigationController viewControllers];
	int stackHeight = [moreViewControllerStack count];
	if (stackHeight < 2) //No more faux roots.
	{
		if (focused != nil)
		{
			[self handleDidShowTab:nil];
		}
		return;
	}

	UIViewController * rootController = [moreViewControllerStack objectAtIndex:1];
	if (![rootController respondsToSelector:@selector(tab)])
	{
		return;
	}
	
	TiUITabProxy * tabProxy = (TiUITabProxy *)[(id)rootController tab];
	if (stackHeight == 2)	//One for the picker, one for the faux root.
	{
		if (tabProxy != focused)
		{
			[self handleDidShowTab:tabProxy];
		}
	}

	[tabProxy handleDidShowViewController:viewController];
}

#pragma mark TabBarController Delegates

- (BOOL)tabBarController:(UITabBarController *)tabBarController shouldSelectViewController:(UIViewController *)viewController
{
	TiUITabProxy * target=nil;
	if ([tabBarController moreNavigationController] == viewController)
	{
		if (self != [(UINavigationController *)viewController delegate])
		{
			[(UINavigationController *)viewController setDelegate:self];
		}
		NSArray * moreViewControllerStack = [(UINavigationController *)viewController viewControllers];
		if ([moreViewControllerStack count]>1)
		{
			viewController = [moreViewControllerStack objectAtIndex:1];
			if ([viewController respondsToSelector:@selector(tab)])
			{
				target = (TiUITabProxy *)[(id)viewController tab];
			}
		}
	}
	else
	{
		target = (TiUITabProxy *)[(UINavigationController *)viewController delegate];
	}

	[self handleWillShowTab:target];

	return YES;
}

- (void)tabBarController:(UITabBarController *)tabBarController didSelectViewController:(UIViewController *)viewController
{
	if ([tabBarController moreNavigationController] == viewController)
	{
		if (self != [(UINavigationController *)viewController delegate])
		{
			[(UINavigationController *)viewController setDelegate:self];
		}
		NSArray * moreViewControllerStack = [(UINavigationController *)viewController viewControllers];
		int stackCount = [moreViewControllerStack count];
		if (stackCount>1)
		{
			viewController = [moreViewControllerStack objectAtIndex:1];
		}
		else
		{
			[self updateMoreBar:(UINavigationController *)viewController];
			viewController = nil;
		}

	}

	[self handleDidShowTab:(TiUITabProxy *)[(UINavigationController *)viewController delegate]];
}


- (void)tabBarController:(UITabBarController *)tabBarController didEndCustomizingViewControllers:(NSArray *)viewControllers changed:(BOOL)changed
{
	if (changed) {
		NSMutableArray* tabProxies = [NSMutableArray arrayWithCapacity:[viewControllers count]];
		for (UINavigationController* controller_ in viewControllers) {
			id delegate = [controller_ delegate];
			if ([delegate isKindOfClass:[TiUITabProxy class]]) {
				TiUITabProxy* tabProxy = (TiUITabProxy*)delegate;
				[tabProxies addObject:tabProxy];
			}
		}
		
		// We do it this way to reset the 'tabs' array on the proxy without changing the active
		// controller.  The SDK documentation actually conflicts itself on whether or not the 'more' tab
		// can be manually reselected anyway.
		[(TiUITabGroupProxy*)[self proxy] _resetTabArray:tabProxies];
	}
}


#pragma mark Public APIs

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	[controller willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}


-(void)setBarColor_:(id)value
{
	[barColor release];
	barColor = [[TiUtils colorValue:value] retain];
	[self updateMoreBar:[controller moreNavigationController]];
}

-(void)setActiveTab_:(id)value
{
	UIViewController *active = nil;
	
	if (controller == nil)
	{
		return;
	}
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

-(void)setAllowUserCustomization_:(id)value
{
	allowConfiguration = [TiUtils boolValue:value def:YES];
	if (allowConfiguration) {
		[self tabController].customizableViewControllers = [self tabController].viewControllers;
		[self setEditButton:[controller moreNavigationController]];
	}
	else {
		[self tabController].customizableViewControllers = nil;
		[self removeEditButton:[controller moreNavigationController]];
	}
}

-(void)setEditButtonTitle_:(id)value
{
	editTitle = [TiUtils stringValue:value];
	[self setEditButton:[controller moreNavigationController]];
}

-(void)setTabs_:(id)tabs
{
	ENSURE_TYPE_OR_NIL(tabs,NSArray);

	if (tabs!=nil && [tabs count] > 0)
	{		
		NSMutableArray *controllers = [[NSMutableArray alloc] init];
		id thisTab = [[self proxy] valueForKey:@"activeTab"];
		
		for (TiUITabProxy *tabProxy in tabs)
		{
			[controllers addObject:[tabProxy controller]];
			if ([TiUtils boolValue:[tabProxy valueForKey:@"active"]])
			{
				focused = tabProxy;
			}
		}

		[self tabController].viewControllers = nil;
		[self tabController].viewControllers = controllers;
		if (![tabs containsObject:focused])
		{
			[self setActiveTab_:thisTab];
		}

		[controllers release];
	}
	else
	{
		focused = nil;
		[self tabController].viewControllers = nil;
	}

	[self.proxy	replaceValue:focused forKey:@"activeTab" notification:YES];
	[self setAllowUserCustomization_:[NSNumber numberWithBool:allowConfiguration]];
}

-(void)open:(id)args
{
	UIView *view = [self tabController].view;
	[TiUtils setView:view positionRect:[self bounds]];
	[self addSubview:view];

	// on an open, make sure we send the focus event to initial tab
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:focused,@"tab",NUMINT(0),@"index",NUMINT(-1),@"previousIndex",[NSNull null],@"previousTab",nil];
	[self.proxy fireEvent:@"focus" withObject:event];
	[focused handleDidFocus:event];
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
			[tab removeFromTabGroup];
		}
		controller.viewControllers = nil;
	}
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(focused);
}


-(void)focusVisibleWindow
{
	UINavigationController * ourCurrentNC = (UINavigationController *)[controller selectedViewController];
	TiUITabController * ourCurrentVC = (TiUITabController *)[ourCurrentNC visibleViewController];
	if([ourCurrentVC isKindOfClass:[TiUITabController class]])
	{
		TiWindowProxy * ourCurrentWindow = [ourCurrentVC window];
		[ourCurrentWindow _tabFocus];
	}
}

-(void)blurVisibleWindow
{
	UINavigationController * ourCurrentNC = (UINavigationController *)[controller selectedViewController];
	TiUITabController * ourCurrentVC = (TiUITabController *)[ourCurrentNC visibleViewController];
	if([ourCurrentVC isKindOfClass:[TiUITabController class]])
	{
		TiWindowProxy * ourCurrentWindow = [ourCurrentVC window];
		[ourCurrentWindow _tabBlur];
	}
}

@end

#endif