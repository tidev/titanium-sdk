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

-(void)_destroy
{
	RELEASE_TO_NIL(tabGroup);
	RELEASE_TO_NIL(rootController);
	RELEASE_TO_NIL(current);
	[super _destroy];
}

-(void)_configure
{
	// since we're special proxy type instead of normal, we force in values
	[self replaceValue:nil forKey:@"title" notification:NO];
	[self replaceValue:nil forKey:@"icon" notification:NO];
	[self replaceValue:nil forKey:@"badge" notification:NO];
	[super _configure];
}

-(TiUITabController *)rootController
{
	if (rootController == nil)
	{
		TiWindowProxy *window = [self valueForKey:@"window"];
		[window setParentOrientationController:self];
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
	if (current!=nil)
	{
		TiWindowProxy *currentWindow = [current window];
		[self close:currentWindow];
	}
}

- (void)handleWillShowViewController:(UIViewController *)viewController
{
	if (current!=nil)
	{ 
		TiWindowProxy *currentWindow = [current window];
		
		[currentWindow _tabBeforeBlur];
		[[currentWindow retain] autorelease];
		
		// close the window if it's not our root window
		// check to make sure that we're not actually push a window on the stack
		if (opening==NO && [rootController window]!=currentWindow && [TiUtils boolValue:currentWindow.opened] && currentWindow.closing==NO)
		{
			RELEASE_TO_NIL(closingWindow);
			closingWindow = [currentWindow retain];
			[closingWindow windowWillClose];
		}
		
		[currentWindow _tabBlur];
		RELEASE_TO_NIL(current);
	}
	
	current = [viewController retain];
	
	TiWindowProxy *newWindow = [current window];
	
	[newWindow _tabBeforeFocus];
	
	if (opening || [TiUtils boolValue:newWindow.opened]==NO)
	{
		[newWindow open:nil];
	}
	
	[newWindow _tabFocus];
	[self childOrientationControllerChangedFlags:newWindow];

	opening = NO; 
}

- (void)handleDidShowViewController:(UIViewController *)viewController
{
	if (closingWindow!=nil)
	{
		[self close:[NSArray arrayWithObject:closingWindow]];
		RELEASE_TO_NIL(closingWindow);
	}
}

#pragma mark Delegates


- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	if (current==viewController)
	{
		return;
	}
	[self handleWillShowViewController:viewController];
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	[self handleDidShowViewController:viewController];
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
	[window setParentOrientationController:self];

	[self controller];
	[[rootController navigationController] pushViewController:root animated:animated];
	[root release];
}

-(void)close:(id)args
{
	ENSURE_UI_THREAD(close,args);

	// Don't use ENSURE_SINGLE_ARG because it will overwrite the original 'args' value if we
	// ARE passing more than one arg
	TiWindowProxy* window = nil;
	if ([args isKindOfClass:[NSArray class]]) {
		window = [args objectAtIndex:0];
	}
	else {
		window = args;
	}
	if (![window isKindOfClass:[TiWindowProxy class]]) {
		[self throwException:TiExceptionInvalidType 
				   subreason:[NSString stringWithFormat:@"expected: %@, was: %@",[TiWindowProxy class],[window class]] 
					location:CODELOCATION];
	}
	
	NSDictionary* properties = (([args isKindOfClass:[NSArray class]]) &&
								([args count] > 1) && 
								([[args objectAtIndex:1] isKindOfClass:[NSDictionary class]])) ? [args objectAtIndex:1] : nil;

	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
	if ([current window] == window)
	{
		[[rootController navigationController] popViewControllerAnimated:animated];
		return;
	}
	
	// Manage the navigation controller stack
	UINavigationController* navController = [rootController navigationController];
	NSMutableArray* controllerStack = [NSMutableArray arrayWithArray:[navController viewControllers]];
	[controllerStack removeObject:[window controller]];
	[navController setViewControllers:controllerStack animated:animated];
	
	[window retain];
	[window _tabBlur];
	[window setParentOrientationController:nil];
	
	// for this to work right, we need to sure that we always have the tab close the window
	// and not let the window simply close by itself. this will ensure that we tell the 
	// tab that we're doing that
	[window close:[NSArray arrayWithObjects:[NSDictionary dictionaryWithObject:NUMBOOL(YES) forKey:@"closeByTab"],nil]];
	if ([current window]==window)
	{
		RELEASE_TO_NIL(current);
	}
	[window autorelease];
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

-(void)updateTabBarItem
{
	if (rootController == nil)
	{
		return;
	}
	ENSURE_UI_THREAD_0_ARGS;
	
	id badgeValue = [TiUtils stringValue:[self valueForKey:@"badge"]];
	id icon = [self valueForKey:@"icon"];
	
	if ([icon isKindOfClass:[NSNumber class]])
	{
		int value = [TiUtils intValue:icon];
		UITabBarItem *newItem = [[UITabBarItem alloc] initWithTabBarSystemItem:value tag:value];
		[newItem setBadgeValue:badgeValue];
		[rootController setTabBarItem:newItem];
		[newItem release];
		systemTab = YES;
		return;
	}

	NSString * title = [TiUtils stringValue:[self valueForKey:@"title"]];

	UIImage *image;
	if (icon == nil)
	{
		image = nil;
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
		image = [[ImageLoader sharedLoader] loadImmediateImage:[TiUtils toURL:icon proxy:currentWindow]];
	}

	[rootController setTitle:title];
	UITabBarItem *ourItem = nil;

	if (!systemTab)
	{
		ourItem = [rootController tabBarItem];
		[ourItem setTitle:title];
		[ourItem setImage:image];
	}

	if(ourItem == nil)
	{
		systemTab = NO;
		ourItem = [[[UITabBarItem alloc] initWithTitle:title image:image tag:0] autorelease];
		[rootController setTabBarItem:ourItem];
	}

	[ourItem setBadgeValue:badgeValue];
}

-(void)setTitle:(id)title
{
	[self replaceValue:title forKey:@"title" notification:NO];
	[self updateTabBarItem];
}

-(void)setIcon:(id)icon
{
	if([icon isKindOfClass:[NSString class]])
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
		
		icon = [[TiUtils toURL:icon proxy:currentWindow] absoluteString];
	}


	[self replaceValue:icon forKey:@"icon" notification:NO];

	[self updateTabBarItem];
}

-(void)setBadge:(id)badge
{
	[self replaceValue:badge forKey:@"badge" notification:NO];
	[self updateTabBarItem];
}



- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	if ([self viewAttached])
	{
//		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
//		[tabController viewWillAppear:animated];
	}
//	[super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated;     // Called when the view has been fully transitioned onto the screen. Default does nothing
{
	if ([self viewAttached])
	{
//		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
//		[tabController viewDidAppear:animated];
	}
//	[super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	if ([self viewAttached])
	{
//		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
//		[tabController viewWillDisappear:animated];
	}
//	[super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated;  // Called after the view was dismissed, covered or otherwise hidden. Default does nothing
{
	if ([self viewAttached])
	{
//		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
//		[tabController viewDidDisappear:animated];
	}
//	[super viewDidDisappear:animated];
}

@synthesize parentOrientationController;

-(TiOrientationFlags)orientationFlags
{
	UIViewController * modalController = [controller modalViewController];
	if ([modalController conformsToProtocol:@protocol(TiOrientationController)])
	{
		return [(id<TiOrientationController>)modalController orientationFlags];
	}
	
	for (id thisController in [[controller viewControllers] reverseObjectEnumerator])
	{
		if (![thisController isKindOfClass:[TiViewController class]])
		{
			continue;
		}
		TiWindowProxy * thisProxy = [(TiViewController *)thisController proxy];
		if ([thisProxy conformsToProtocol:@protocol(TiOrientationController)])
		{
			TiOrientationFlags result = [thisProxy orientationFlags];
			if (result != TiOrientationNone)
			{
				return result;
			}
		}
	}
	return TiOrientationNone;
}

-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController
{
	[parentOrientationController childOrientationControllerChangedFlags:self];
}

@end

#endif