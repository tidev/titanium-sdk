/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiUITabGroupProxy.h"
#import "TiUITabProxy.h"
#import "TiUITabGroup.h"
#import "TiApp.h"

@implementation TiUITabGroupProxy

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	if ([self viewAttached])
	{
		[(TiUITabGroup *)[self view] willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
	}
	[super willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
}

-(void)dealloc
{
	for (id thisTab in tabs)
	{
        [thisTab removeFromTabGroup];
		[thisTab setParentOrientationController:nil];
		[thisTab setTabGroup:nil];
        [self forgetProxy:thisTab];
	}
	RELEASE_TO_NIL(tabs);
	[super dealloc];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
	[self setValue:[NSNumber numberWithBool:YES] forKey:@"allowUserCustomization"];
	[super _initWithProperties:properties];
}

-(void)_destroy
{
	RELEASE_TO_NIL(tabs);
	[super _destroy];
}

-(TiUIView*)newView
{
	TiUITabGroup *group = [[TiUITabGroup alloc] initWithFrame:[self appFrame]];
	return group;
}

-(UITabBar*)tabbar
{
	return [(TiUITabGroup*)[self view] tabbar];
}

#pragma mark Public APIs

-(void)addTab:(id)tabProxy
{
	ENSURE_SINGLE_ARG(tabProxy,TiUITabProxy);
	[self rememberProxy:tabProxy];
	if (tabs == nil)
	{
		tabs = [[NSMutableArray alloc] initWithCapacity:4];
	}
	[tabProxy setParentOrientationController:self];
	[tabs addObject:tabProxy];
	[tabProxy setTabGroup:self];
	[self replaceValue:tabs forKey:@"tabs" notification:YES];
}

-(void)removeTab:(id)tabProxy
{
	ENSURE_SINGLE_ARG(tabProxy,NSObject);
	if (tabs!=nil)
	{
		if (![tabProxy isKindOfClass:[TiUITabProxy class]])
		{
			int value = [TiUtils intValue:tabProxy];
			tabProxy = [tabs objectAtIndex:value];
			if (tabProxy==nil)
			{
				[self throwException:TiExceptionRangeError subreason:@"invalid tab index" location:CODELOCATION];
			}
		}
		
		//TODO: close all the tabs and fire events
		
        [tabProxy removeFromTabGroup];
		[tabProxy setParentOrientationController:nil];
		[tabs removeObject:tabProxy];
		[self replaceValue:tabs forKey:@"tabs" notification:YES];
		[self forgetProxy:tabProxy];
	}
}

-(void)setTabs:(NSArray *)newTabs
{
	if (newTabs == tabs)
	{
		return;
	}

	ENSURE_TYPE_OR_NIL(newTabs,NSArray);
	for (id thisTab in newTabs)
	{
		ENSURE_TYPE(thisTab,TiUITabProxy);
	}

	for (id thisTab in tabs)
	{
		if (![newTabs containsObject:thisTab])
		{
			[thisTab setParentOrientationController:nil];
			[thisTab setTabGroup:nil];
			[self forgetProxy:thisTab];
		}
	}
	for (id thisTab in newTabs)
	{
		if (![tabs containsObject:thisTab])
		{
			[self rememberProxy:thisTab];
			[thisTab setTabGroup:self];
			[thisTab setParentOrientationController:self];
		}
	}
	[tabs release];
	tabs = [newTabs mutableCopy];

	[self replaceValue:tabs forKey:@"tabs" notification:YES];
}

// Used to set the tab array without replacing values in the controller.
-(void)_resetTabArray:(NSArray*)newTabOrder
{
	RELEASE_TO_NIL(tabs);
	tabs = [newTabOrder mutableCopy];
}


-(BOOL)handleFocusEvents
{
	return NO;
}

-(void)_tabFocus
{
	[(TiUITabGroup *)[self view] focusVisibleWindow];
}

-(void)_tabBlur
{
	[(TiUITabGroup *)[self view] blurVisibleWindow];
}

#pragma mark Window Management

-(BOOL)_handleOpen:(id)args
{
	TiUITabGroup *tg = (TiUITabGroup*)self.view;
	[tg open:args];
	return YES;
}

-(BOOL)_handleClose:(id)args
{
	TiUITabGroup *tabGroup = (TiUITabGroup*)self.view;
	if (tabGroup!=nil)
	{
		[tabGroup close:args];
	}
	return YES;
}

-(void)didReceiveMemoryWarning:(NSNotification*)notification
{
	// override but don't drop the tab group, causes problems
}

- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	if ([self viewAttached])
	{
		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
		[tabController viewWillAppear:animated];
	}
}

- (void)viewDidAppear:(BOOL)animated;     // Called when the view has been fully transitioned onto the screen. Default does nothing
{
	if ([self viewAttached])
	{
		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
		[tabController viewDidAppear:animated];
	}
}

- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	if ([self viewAttached])
	{
		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
		[tabController viewWillDisappear:animated];
	}
}

- (void)viewDidDisappear:(BOOL)animated;  // Called after the view was dismissed, covered or otherwise hidden. Default does nothing
{
	if ([self viewAttached])
	{
		UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
		[tabController viewDidDisappear:animated];
	}
}

-(TiOrientationFlags)orientationFlags
{
	UITabBarController * tabController = [(TiUITabGroup *)[self view] tabController];
	int blessedController = [tabController selectedIndex];
	if (blessedController != NSNotFound)
	{
		TiOrientationFlags result = [[tabs objectAtIndex:blessedController] orientationFlags];
		if (result != TiOrientationNone) {
			return result;
		}
	}
	return [super orientationFlags];
}

-(void)willChangeSize
{
	[super willChangeSize];

	[tabs makeObjectsPerformSelector:@selector(willChangeSize)];
	//TODO: Shouldn't tabs have a lock protecting them?
}

@end

#endif