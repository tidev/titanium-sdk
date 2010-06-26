/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiProxy.h"
#import "TiUITabProxy.h"
#import "TiUIViewProxy.h"
#import "TiWindowProxy.h"
#import "TiUITabController.h"
#import "TiUITabGroupProxy.h"
#import "TiUtils.h"
#import "ImageLoader.h"


//NOTE: this proxy is a little different than normal Proxy/View pattern
//since it's not really backed by a view in the normal way.  It's given
//a root level window proxy (and view) that are passed as the root controller
//to the Nav Controller.  So, we do a few things that you'd normally not 
//have to do in a Proxy/View pattern.


@implementation TiUITabProxy

-(void)dealloc
{
	RELEASE_TO_NIL(tabGroup);
	RELEASE_TO_NIL(rootController);
	RELEASE_TO_NIL(current);
	[super dealloc];
}

-(void)_configure
{
	// since we're special proxy type instead of normal, we force in values
	[self replaceValue:nil forKey:@"title" notification:NO];
	[self replaceValue:nil forKey:@"icon" notification:NO];
	[self replaceValue:nil forKey:@"badge" notification:NO];
}

-(TiUITabController *)rootController
{
	if (rootController == nil)
	{
		TiWindowProxy *window = [self valueForKey:@"window"];
		rootController = [[TiUITabController alloc] initWithProxy:window tab:self];
	}
	return rootController;
}

-(UINavigationController*)controller
{
	if (controller==nil)
	{
		controller = [[UINavigationController alloc] initWithRootViewController:[self rootController]];
		controller.delegate = self;
		[self setTitle:[self valueForKey:@"title"]];
		[self setIcon:[self valueForKey:@"icon"]];
		[self setBadge:[self valueForKey:@"badge"]];
	}
	return controller;
}

-(void)setTabGroup:(TiUITabGroupProxy*)proxy
{
	RELEASE_TO_NIL(tabGroup);
	tabGroup = [proxy retain];
}

-(void)removeFromTabGroup
{
}

#pragma mark Delegates

- (void)handleWillShowViewController:(UIViewController *)viewController
{
	if (current==viewController)
	{
		return;
	}

	if (current!=nil)
	{
		TiWindowProxy *currentWindow = [current window];
		[currentWindow _tabBeforeBlur];
	}
	
	[[(TiUITabController*)viewController window] _tabBeforeFocus];
	[self handleDidShowViewController:viewController];
}

- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	[self handleWillShowViewController:viewController];
}

- (void)handleDidShowViewController:(UIViewController *)viewController
{
	if (current==viewController)
	{
		return;
	}

	if (current!=nil)
	{
		TiWindowProxy *currentWindow = [current window];
		[currentWindow _tabBlur];
		
		// close the window if it's not our root window
		// check to make sure that we're not actually push a window on the stack
		if (opening==NO && [rootController window]!=currentWindow)
		{
			[self close:[NSArray arrayWithObject:currentWindow]];
		}
		
		RELEASE_TO_NIL(current);
	}
	
	current = [viewController retain];
	
	TiWindowProxy *newWindow = [current window];
	
	if (![TiUtils boolValue:newWindow.opened])
	{
		[newWindow open:nil];
	}
	
	[newWindow _tabFocus];

	opening = NO;
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
}

- (void)handleWillBlur
{
	TiWindowProxy *currentWindow = [current window];
	[currentWindow _tabBeforeBlur];
}

- (void)handleDidBlur:(NSDictionary *)event
{
	if ([self _hasListeners:@"blur"])
	{
		[self fireEvent:@"blur" withObject:event propagate:NO];
	}
	TiWindowProxy *currentWindow = [current window];
	[currentWindow _tabBlur];
}

- (void)handleWillFocus
{
	TiWindowProxy *currentWindow = [current window];
	[currentWindow _tabBeforeFocus];
}

- (void)handleDidFocus:(NSDictionary *)event
{
	if ([self _hasListeners:@"focus"])
	{
		[self fireEvent:@"focus" withObject:event propagate:NO];
	}
	TiWindowProxy *currentWindow = [current window];
	[currentWindow _tabFocus];
}


#pragma mark Public APIs

-(TiProxy*)tabGroup
{
	return tabGroup;
}

-(void)open:(NSArray*)args
{
	[self performSelectorOnMainThread:@selector(openOnUIThread:) withObject:args waitUntilDone:YES];
}

-(void)openOnUIThread:(NSArray*)args
{
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
	// since the didShow notification above happens on both a push and pop, i need to keep a flag
	// to let me know which state i'm in so i only close the current window on a pop
	opening = YES;
	BOOL animated = args!=nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
	TiUITabController *root = [[TiUITabController alloc] initWithProxy:window tab:self];

	[self controller];
	[[rootController navigationController] pushViewController:root animated:animated];
	[root release];
}

-(void)close:(NSArray*)args
{
	ENSURE_UI_THREAD(close,args);
	
	TiWindowProxy *window = [args objectAtIndex:0];
	[window retain];
	[window _tabBlur];
	if ([current window]==window)
	{
		RELEASE_TO_NIL(current);
	}
	[window close:nil];
	RELEASE_TO_NIL(window);
}

-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated
{
	if (current!=nil && [current window]==window)
	{
		[[rootController navigationController] popViewControllerAnimated:animated];
	}
}

-(void)setActive:(id)active
{
	[self replaceValue:active forKey:@"active" notification:NO];

	id activeTab = [tabGroup valueForKey:@"activeTab"];
	
	if ([TiUtils boolValue:active])
	{
		if (activeTab!=self)
		{
			[tabGroup replaceValue:self forKey:@"activeTab" notification:YES];
		}
	}
	else
	{
		if (activeTab==self)
		{
			[tabGroup replaceValue:nil forKey:@"activeTab" notification:YES];
		}
	}
}

-(void)setTitle:(id)title
{
	[self replaceValue:title forKey:@"title" notification:NO];
	ENSURE_UI_THREAD(setTitle,title);
	if (rootController!=nil)
	{
		title = [TiUtils stringValue:title];
		rootController.tabBarItem.title = title;
		rootController.title = title;
	}
}

-(void)setIcon:(id)icon
{
	[self replaceValue:icon forKey:@"icon" notification:NO];
	ENSURE_UI_THREAD(setIcon,icon);
	if (rootController!=nil)
	{
		// check to see if its a system defined icon
		if ([icon isKindOfClass:[NSNumber class]])
		{
			// need to remember the badge in case there's one set
			id badgeValue = rootController.tabBarItem.badgeValue;
			int value = [TiUtils intValue:icon];
			UITabBarItem *newItem = [[[UITabBarItem alloc] initWithTabBarSystemItem:value tag:value] autorelease];
			rootController.tabBarItem = newItem;
			rootController.tabBarItem.badgeValue = badgeValue;
			systemTab = YES;
		}
		else
		{
			// we might be inside a different context than our tab group and if so, he takes precendence in
			// url resolution
			TiProxy* currentWindow = [self.executionContext preloadForKey:@"currentWindow"];
			if (currentWindow==nil)
			{
				// check our current window's context that we are owned by
				currentWindow = [self.pageContext preloadForKey:@"currentWindow"];
			}
			if (currentWindow==nil)
			{
				currentWindow = self;
			}
			UIImage *image = icon == nil ? nil : [[ImageLoader sharedLoader] loadImmediateImage:[TiUtils toURL:icon proxy:currentWindow]];
			if (systemTab)
			{
				systemTab = NO;
				id badgeValue = rootController.tabBarItem.badgeValue;
				UITabBarItem *newItem = [[[UITabBarItem alloc] initWithTitle:[self valueForKey:@"title"] image:image tag:0] autorelease];
				rootController.tabBarItem = newItem;
				rootController.tabBarItem.badgeValue = badgeValue;
			}
			else
			{
				rootController.tabBarItem.image = image;
			}
		}
	}
}

-(void)setBadge:(id)badge
{
	[self replaceValue:badge forKey:@"badge" notification:NO];
	ENSURE_UI_THREAD(setBadge,badge);
	if (rootController!=nil)
	{
		rootController.tabBarItem.badgeValue = badge == nil ? nil : [TiUtils stringValue:badge];
	}
}


@end

#endif