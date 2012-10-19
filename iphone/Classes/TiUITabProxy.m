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
#import "TiApp.h"


//NOTE: this proxy is a little different than normal Proxy/View pattern
//since it's not really backed by a view in the normal way.  It's given
//a root level window proxy (and view) that are passed as the root controller
//to the Nav Controller.  So, we do a few things that you'd normally not 
//have to do in a Proxy/View pattern.

@interface TiUITabProxy ()
-(void)openOnUIThread:(NSArray*)args;
@end

@implementation TiUITabProxy

-(void)_destroy
{
    RELEASE_TO_NIL(closingWindows);
    RELEASE_TO_NIL(controllerStack);
	RELEASE_TO_NIL(rootController);
    RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(current);
	[super _destroy];
}

-(NSMutableDictionary*)langConversionTable
{
    return [NSMutableDictionary dictionaryWithObject:@"title" forKey:@"titleid"];
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
	if (proxy == tabGroup)
	{
		return;
	}
	for (TiViewController * thisController in [controller viewControllers])
	{
		if (![thisController isKindOfClass:[TiViewController class]])
		{
			continue;
		}
		[(TiWindowProxy *)[thisController proxy] _associateTab:nil navBar:nil tab:nil];
	}
	tabGroup = proxy;
}

-(void) cleanNavStack:(BOOL)removeTab
{
    TiThreadPerformOnMainThread(^{
        [controller setDelegate:nil];
        if ([[controller viewControllers] count] > 1) {
            NSMutableArray* doomedVcs = [[NSMutableArray arrayWithArray:[controller viewControllers]] retain];
            [doomedVcs removeObject:rootController];
            [controller setViewControllers:[NSArray arrayWithObject:rootController]];
            if (current != nil) {
                RELEASE_TO_NIL(current);
                current = [rootController retain];
            }
            for (TiUITabController* doomedVc in doomedVcs) {
                [self closeWindow:(TiWindowProxy *)[doomedVc proxy] animated:NO];
            }
            RELEASE_TO_NIL(doomedVcs);
        }
        if (removeTab) {
            [self closeWindow:[rootController window] animated:NO];
            RELEASE_TO_NIL(rootController);
            RELEASE_TO_NIL(controller);
            RELEASE_TO_NIL(current);
        }
        else {
            [controller setDelegate:self];
        }
    },YES);
}

-(void)removeFromTabGroup
{
    [self setActive:NUMBOOL(NO)];
    [self cleanNavStack:YES];
}


- (void)handleWillShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	BOOL safeToTransition = YES;
	if (current!=nil)
	{ 
		TiWindowProxy *currentWindow = [current window];
		
		[currentWindow _tabBeforeBlur];
		[[currentWindow retain] autorelease];
		
		// close the window if it's not our root window
		// check to make sure that we're not actually push a window on the stack
		if (opening==NO && [rootController window]!=currentWindow && [TiUtils boolValue:currentWindow.opened] && currentWindow.closing==NO && [controllerStack containsObject:viewController])
		{
			RELEASE_TO_NIL(closingWindows);
            closingWindows = [[NSMutableArray alloc] init];
            // Travel down the stack until the new viewController is reached; these are the windows
            // which must be closed.
            NSEnumerator* enumerator = [controllerStack reverseObjectEnumerator];
            for (UIViewController* windowController in enumerator) {
                if (windowController != viewController && [windowController isKindOfClass:[TiUITabController class]]) {
                    TiWindowProxy* window = [(TiUITabController*)windowController window];
                    if (window == nil)
                    {
                        continue;
                    }
                    [closingWindows addObject:window];
                    safeToTransition = safeToTransition && ![window restoreFullScreen];

                    [window windowWillClose];
                }
                else {
                    break;
                }
            }
		}
		
		[currentWindow _tabBlur];
		RELEASE_TO_NIL(current);
	}
	
	current = (TiUITabController*)[viewController retain];
	
	TiWindowProxy *newWindow = [current window];
	
	[newWindow _tabBeforeFocus];
	
	if (opening || [TiUtils boolValue:newWindow.opened]==NO)
	{
		[newWindow open:nil];
	}
	
	[newWindow _tabFocus];
	WARN_IF_BACKGROUND_THREAD_OBJ;
	if (safeToTransition) {
		[self childOrientationControllerChangedFlags:newWindow];
	}

	opening = NO; 
}

- (void)handleDidShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	if (closingWindows!=nil)
	{
        for (TiWindowProxy* closingWindow in closingWindows) {
            NSArray* args = [NSArray arrayWithObjects:closingWindow,[NSDictionary dictionaryWithObject:NUMBOOL(animated) forKey:@"animated"], nil];
            [self close:args];
        }
	}
    RELEASE_TO_NIL(closingWindows);
    RELEASE_TO_NIL(controllerStack);
    controllerStack = [[[rootController navigationController] viewControllers] copy];
    [self childOrientationControllerChangedFlags:[current window]];
}

#pragma mark Delegates


- (void)navigationController:(UINavigationController *)navigationController willShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
	transitionIsAnimating = YES;
	if (current==viewController)
	{
		return;
	}
	[self handleWillShowViewController:viewController animated:animated];
}

- (void)navigationController:(UINavigationController *)navigationController didShowViewController:(UIViewController *)viewController animated:(BOOL)animated
{
    id activeTab = [tabGroup valueForKey:@"activeTab"];
    if (activeTab == nil || activeTab == [NSNull null]) {
        //Make sure that the activeTab property is set
        [self setActive:[NSNumber numberWithBool:YES]];
    }
	transitionIsAnimating = NO;
	[self handleDidShowViewController:viewController animated:animated];
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
	TiWindowProxy *window = [args objectAtIndex:0];
	ENSURE_TYPE(window,TiWindowProxy);
	// since the didShow notification above happens on both a push and pop, i need to keep a flag
	// to let me know which state i'm in so i only close the current window on a pop
	opening = YES;
	[window setParentOrientationController:self];
	// TODO: Slap patch.  Views, when opening/added, should check parent visibility (and parent/parent visibility, if possible)
	[window parentWillShow];
	[[[TiApp app] controller] dismissKeyboard];
	TiThreadPerformOnMainThread(^{
		[self openOnUIThread:args];
	}, YES);
}

-(void)openOnUIThread:(NSArray*)args
{
	if (transitionIsAnimating)
	{
		[self performSelector:_cmd withObject:args afterDelay:0.1];
		return;
	}
	TiWindowProxy *window = [args objectAtIndex:0];
	BOOL animated = args!=nil && [args count] > 1 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:1] def:YES] : YES;
	TiUITabController *root = [[TiUITabController alloc] initWithProxy:window tab:self];

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

	BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:NO];
    
    if (window == [rootController window]) {
        NSLog(@"[WARN] Can not close root window of a tab. Use TabGroup.removeTab instead");
        return;
    }
    if (window == [current window]) {
        [[rootController navigationController] popViewControllerAnimated:animated];
        return;
    }
    [self closeWindow:window animated:animated];
}

- (void)closeWindow:(TiWindowProxy *)window animated:(BOOL)animated
{
    [window retain];
    UIViewController *windowController = [[window controller] retain];
    if ([windowController isKindOfClass:[TiUITabController class]]) {
        [(TiWindowProxy *)[(TiUITabController*)windowController proxy] _associateTab:nil navBar:nil tab:nil];
    }

	// Manage the navigation controller stack
	UINavigationController* navController = [rootController navigationController];
	NSMutableArray* newControllerStack = [NSMutableArray arrayWithArray:[navController viewControllers]];
	[newControllerStack removeObject:windowController];
	[navController setViewControllers:newControllerStack animated:animated];
    RELEASE_TO_NIL(controllerStack);
    controllerStack = [newControllerStack retain];
	[window _tabBlur];
	[window setParentOrientationController:nil];
	
	// for this to work right, we need to sure that we always have the tab close the window
	// and not let the window simply close by itself. this will ensure that we tell the 
	// tab that we're doing that
	[window close:[NSArray arrayWithObjects:[NSDictionary dictionaryWithObject:NUMBOOL(YES) forKey:@"closeByTab"],nil]];
    RELEASE_TO_NIL_AUTORELEASE(window);
    RELEASE_TO_NIL(windowController);
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
		TiProxy* currentWindow = [self.executionContext preloadForKey:@"currentWindow" name:@"UI"];
		if (currentWindow==nil)
		{
			// check our current window's context that we are owned by
			currentWindow = [self.pageContext preloadForKey:@"currentWindow" name:@"UI"];
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
		TiProxy* currentWindow = [self.executionContext preloadForKey:@"currentWindow" name:@"UI"];
		if (currentWindow==nil)
		{
			// check our current window's context that we are owned by
			currentWindow = [self.pageContext preloadForKey:@"currentWindow" name:@"UI"];
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



-(void)willChangeSize
{
	[super willChangeSize];
	
	//TODO: Shouldn't this be not through UI? Shouldn't we retain the windows ourselves?
	for (UIViewController * thisController in [controller viewControllers])
	{
		if ([thisController isKindOfClass:[TiViewController class]])
		{
			TiViewProxy * thisProxy = [(TiViewController *)thisController proxy];
			[thisProxy willChangeSize];
		}
	}
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
		TiWindowProxy * thisProxy = (TiWindowProxy *)[(TiViewController *)thisController proxy];
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
	WARN_IF_BACKGROUND_THREAD_OBJ;
	[parentOrientationController childOrientationControllerChangedFlags:self];
}

@end

#endif