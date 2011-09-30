/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWINDOW

#import "TiUIWindowProxy.h"
#import "Webcolor.h"
#import "TiUIViewProxy.h"
#import "ImageLoader.h"
#import "TiComplexValue.h"
#import "TiApp.h"
#import "TiTabController.h"

// this is how long we should wait on the new JS context to be loaded
// holding the UI thread before we return during an window open. we 
// attempt to hold it for a small period of time to allow the window
// to loaded before we return from the open such that the paint will be
// much smoother on the new window during a tab transition
#define EXTERNAL_JS_WAIT_TIME (150/1000)

/** 
 * This class is a helper that will be used when we have an external
 * window w/ JS so that we can attempt to wait for the window context
 * to be fully loaded on the UI thread (since JS runs in a different
 * thread) and attempt to wait up til EXTERNAL_JS_WAIT_TIME before
 * timing out. If timed out, will go ahead and start opening the window
 * and as the JS context finishes, will continue opening from there - 
 * this has a nice effect of immediately opening if fast but not delaying
 * if slow (so you get weird button delay effects for example)
 *
 */

@interface TiUIWindowProxyLatch : NSObject
{
	NSCondition *lock;
	TiUIWindowProxy* window;
	id args;
	BOOL completed;
	BOOL timeout;
}
@end

@implementation TiUIWindowProxyLatch

-(id)initWithTiWindow:(id)window_ args:(id)args_
{
	if (self = [super init])
	{
		window = [window_ retain];
		args = [args_ retain];
		lock = [[NSCondition alloc] init];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(lock);
	RELEASE_TO_NIL(window);
	RELEASE_TO_NIL(args);
	[super dealloc];
}

-(void)booted:(id)arg
{
	[lock lock];
	completed = YES;
	[lock signal];
	if (timeout)
	{
		[window boot:YES args:args];
	}
	[lock unlock];
}

-(BOOL)waitForBoot
{
	BOOL yn = NO;
	[lock lock];
	if(completed)
	{
		yn = YES;
	}
	else
	{
		if ([lock waitUntilDate:[NSDate dateWithTimeIntervalSinceNow:EXTERNAL_JS_WAIT_TIME]]==NO)
		{
			timeout = YES;
		}
		else 
		{
			yn = YES;
		}
	}
	[lock unlock];
	return yn;
}

@end


@implementation TiUIWindowProxy

-(void)_destroy
{
    if (![self closing]) {
        [self performSelectorOnMainThread:@selector(close:) withObject:nil waitUntilDone:YES];
    }
    
	[barImageView performSelectorOnMainThread:@selector(removeFromSuperview) withObject:nil waitUntilDone:NO];
	RELEASE_TO_NIL(barImageView);
	if (context!=nil)
	{
		[context shutdown:nil];
		RELEASE_TO_NIL(context);
	}
	RELEASE_TO_NIL(oldBaseURL);
	RELEASE_TO_NIL(latch);
	[super _destroy];
}

-(void)boot:(BOOL)timeout args:args
{
	RELEASE_TO_NIL(latch);
	contextReady = YES;

	if (navWindow) 
	{
		[self prepareForNavView:[self navController]];
	}
	else 
	{
		if (timeout && ![context evaluationError])
		{
			[self open:args];
		}
	}
}

-(NSMutableDictionary*)langConversionTable
{
	return [NSMutableDictionary dictionaryWithObjectsAndKeys:@"title",@"titleid",@"titlePrompt",@"titlepromptid",nil];
}

#pragma mark Public

-(BOOL)_handleOpen:(id)args
{
	// this is a special case that calls open again above to cause the event lifecycle to
	// happen after the JS context is fully up and ready
	if (contextReady && context!=nil)
	{
		[self fireFocus:YES];
		return YES;
	}
	
	//
	// at this level, open is top-level since this is a window.  if you want 
	// to open a window within a tab, you'll need to call tab.open(window)
	//
	
	NSURL *url = [TiUtils toURL:[self valueForKey:@"url"] proxy:self];
	
	if (url!=nil)
	{
		// Window based JS can only be loaded from local filesystem within app resources
		if ([url isFileURL] && [[[url absoluteString] lastPathComponent] hasSuffix:@".js"])
		{
			// since this function is recursive, only do this if we haven't already created the context
			if (context==nil)
			{
				RELEASE_TO_NIL(context);
				// remember our base url so we can restore on close
				oldBaseURL = [[self _baseURL] retain];
				// set our new base
				[self _setBaseURL:url];
				contextReady=NO;
				context = [[KrollBridge alloc] initWithHost:[self _host]];
				NSDictionary *values = [NSDictionary dictionaryWithObjectsAndKeys:self,@"currentWindow",[self.tab tabGroup],@"currentTabGroup",self.tab,@"currentTab",nil];
				NSDictionary *preload = [NSDictionary dictionaryWithObjectsAndKeys:values,@"UI",nil];
				latch = [[TiUIWindowProxyLatch alloc] initWithTiWindow:self args:args];
				[context boot:latch url:url preload:preload];
				if ([latch waitForBoot])
				{
					[self boot:NO args:args];
					return YES;
				}
				else 
				{
					return NO;
				}
			}
		}
		else 
		{
			NSLog(@"[ERROR] url not supported in a window. %@",url);
		}
	}
	
	return YES;
}

-(void)windowDidClose
{
    // Because other windows or proxies we have open and wish to continue functioning might be relying
    // on our created context, we CANNOT explicitly shut down here.  Instead we should memory-manage
    // contexts better so they stop when they're no longer in use.

	// Sadly, today is not that day. Without shutdown, we leak all over the place.
	if (context!=nil)
	{
		[context performSelector:@selector(shutdown:) withObject:nil afterDelay:1.0];
		RELEASE_TO_NIL(context);
	}
	[super windowDidClose];
}

-(BOOL)_handleClose:(id)args
{
	if (tab!=nil)
	{
		BOOL animate = args!=nil && [args count]>0 ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;
		[tab windowClosing:self animated:animate];
	}
	else if(focused)
	{
		// if we don't have a tab, we need to fire blur
		// events ourselves
		[self fireFocus:NO];
	}
	// on close, reset our old base URL so that any subsequent
	// re-opens will be correct
	if (oldBaseURL!=nil)
	{
		[self _setBaseURL:oldBaseURL];
	}
	RELEASE_TO_NIL(oldBaseURL);
	return YES;
}

-(void)showNavBar:(NSArray*)args
{
	ENSURE_UI_THREAD(showNavBar,args);
	[self replaceValue:[NSNumber numberWithBool:NO] forKey:@"navBarHidden" notification:NO];
	if (controller!=nil)
	{
		id properties = (args!=nil && [args count] > 0) ? [args objectAtIndex:0] : nil;
		BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
		[[controller navigationController] setNavigationBarHidden:NO animated:animated];
	}
}

-(void)hideNavBar:(NSArray*)args
{
	ENSURE_UI_THREAD(hideNavBar,args);
	[self replaceValue:[NSNumber numberWithBool:YES] forKey:@"navBarHidden" notification:NO];
	if (controller!=nil)
	{
		id properties = (args!=nil && [args count] > 0) ? [args objectAtIndex:0] : nil;
		BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
		[[controller navigationController] setNavigationBarHidden:YES animated:animated];
		//TODO: need to fix height
	}
}

-(void)setBarColor:(id)colorString
{
	ENSURE_UI_THREAD(setBarColor,colorString);
	NSString *color = [TiUtils stringValue:colorString];
	[self replaceValue:color forKey:@"barColor" notification:NO];
	if (controller!=nil)
	{
		TiColor * newColor = [TiUtils colorValue:color];
		if (newColor == nil)
		{
			newColor =[TiUtils colorValue:[[self tabGroup] valueForKey:@"barColor"]];
		}

		UINavigationController * ourNC = [controller navigationController];
		[TiUtils applyColor:newColor toNavigationController:ourNC];
		[self performSelector:@selector(_refreshBackButton) withObject:nil afterDelay:0.0];
	}
}

-(void)updateBarImage
{
	UINavigationBar * ourNB = [[controller navigationController] navigationBar];
	CGRect barFrame = [ourNB bounds];
	UIImage * newImage = [TiUtils toImage:[self valueForUndefinedKey:@"barImage"]
			proxy:self size:barFrame.size];

	if (newImage == nil)
	{
		[barImageView removeFromSuperview];
		RELEASE_TO_NIL(barImageView);
		return;
	}
	
	if (barImageView == nil)
	{
		barImageView = [[UIImageView alloc]initWithImage:newImage];
	}
	else
	{
		[barImageView setImage:newImage];
	}
	
	[barImageView setFrame:barFrame];
	
	int barImageViewIndex = 0;
	if ([ourNB respondsToSelector:@selector(setBackgroundImage:forBarMetrics:)]) {
	/*
	 *	While iOS 5 has methods for setting the background Image, using it requires
	 *	linking to that SDK (the mentioned bar metrics is an enumeration) which,
	 *	while iOS 5 is behind the NDA, isn't an option.
	 *	TODO: Update when iOS 5 is not NDAed for something more elegant.
	 */
		barImageViewIndex = 1;
	}
	
	if ([[ourNB subviews] indexOfObject:barImageView] != barImageViewIndex)
	{
		[ourNB insertSubview:barImageView atIndex:barImageViewIndex];
	}
}

-(void)setBarImage:(id)value
{
	[self replaceValue:[self sanitizeURL:value] forKey:@"barImage" notification:NO];
	if (controller!=nil)
	{
		[self performSelectorOnMainThread:@selector(updateBarImage) withObject:nil waitUntilDone:NO];
	}
}

-(void)setTranslucent:(id)value
{
	ENSURE_UI_THREAD(setTranslucent,value);
	[self replaceValue:value forKey:@"translucent" notification:NO];
	if (controller!=nil)
	{
		[controller navigationController].navigationBar.translucent = [TiUtils boolValue:value];
	}
}

-(void)setRightNavButton:(id)proxy withObject:(id)properties
{
	ENSURE_UI_THREAD_WITH_OBJ(setRightNavButton,proxy,properties);
    if (properties == nil) {
        properties = [self valueForKey:@"rightNavSettings"];
    }
    else {
        [self setValue:properties forKey:@"rightNavSettings"];
    }
	
	if (controller!=nil && 
		[controller navigationController] != nil)
	{
		ENSURE_TYPE_OR_NIL(proxy,TiViewProxy);
		[self replaceValue:proxy forKey:@"rightNavButton" notification:NO];
		if (proxy==nil || [proxy supportsNavBarPositioning])
		{
			// detach existing one
			UIBarButtonItem *item = controller.navigationItem.rightBarButtonItem;
			if ([item respondsToSelector:@selector(proxy)])
			{
				[(TiViewProxy*)[item proxy] removeBarButtonView];
			}
			if (proxy!=nil)
			{
				// add the new one
				BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
				[controller.navigationItem setRightBarButtonItem:[proxy barButtonItem] animated:animated];
				[self updateBarImage];
			}
			else 
			{
				controller.navigationItem.rightBarButtonItem = nil;
			}
		}
		else
		{
			NSString *msg = [NSString stringWithFormat:@"%@ doesn't support positioning on the nav bar",proxy];
			THROW_INVALID_ARG(msg);
		}
	}
	else 
	{
		[self replaceValue:[[[TiComplexValue alloc] initWithValue:proxy properties:properties] autorelease] forKey:@"rightNavButton" notification:NO];
	}
}

-(void)setLeftNavButton:(id)proxy withObject:(id)properties
{
	ENSURE_UI_THREAD_WITH_OBJ(setLeftNavButton,proxy,properties);
    if (properties == nil) {
        properties = [self valueForKey:@"leftNavSettings"];
    }
    else {
        [self setValue:properties forKey:@"leftNavSettings"];
    }
    
	if (controller!=nil && [controller navigationController] != nil)
	{
		ENSURE_TYPE_OR_NIL(proxy,TiViewProxy);
		[self replaceValue:proxy forKey:@"leftNavButton" notification:NO];
		if (proxy==nil || [proxy supportsNavBarPositioning])
		{
			// detach existing one
			UIBarButtonItem *item = controller.navigationItem.leftBarButtonItem;
			if ([item respondsToSelector:@selector(proxy)])
			{
				[(TiViewProxy*)[item proxy] removeBarButtonView];
			}
			controller.navigationItem.leftBarButtonItem = nil;			
			if (proxy!=nil)
			{
				// add the new one
				BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
				[controller.navigationItem setLeftBarButtonItem:[proxy barButtonItem] animated:animated];
				[self updateBarImage];
			}
			else 
			{
				controller.navigationItem.leftBarButtonItem = nil;
			}
		}
		else
		{
			NSString *msg = [NSString stringWithFormat:@"%@ doesn't support positioning on the nav bar",proxy];
			THROW_INVALID_ARG(msg);
		}
	}
	else
	{
		[self replaceValue:[[[TiComplexValue alloc] initWithValue:proxy properties:properties] autorelease] forKey:@"leftNavButton" notification:NO];
	}
}

-(void)setTabBarHidden:(id)value
{
	ENSURE_UI_THREAD_1_ARG(value);
	[self replaceValue:value forKey:@"tabBarHidden" notification:NO];
	if (controller!=nil)
	{
		[controller setHidesBottomBarWhenPushed:[TiUtils boolValue:value]];
	}
}

-(void)hideTabBar:(id)value
{
	[self setTabBarHidden:[NSNumber numberWithBool:YES]];	
}

-(void)showTabBar:(id)value
{
	[self setTabBarHidden:[NSNumber numberWithBool:NO]];
}

-(void)_refreshBackButton
{
	ENSURE_UI_THREAD_0_ARGS;
	
	if (controller == nil || [controller navigationController] == nil) {
		return; // No need to refresh
	}
	
	NSArray * controllerArray = [[controller navigationController] viewControllers];
	int controllerPosition = [controllerArray indexOfObject:controller];
	if ((controllerPosition == 0) || (controllerPosition == NSNotFound))
	{
		return;
	}

	UIViewController * parentController = [controllerArray objectAtIndex:controllerPosition-1];
	UIBarButtonItem * backButton = nil;

	UIImage * backImage = [TiUtils image:[self valueForKey:@"backButtonTitleImage"] proxy:self];
	if (backImage != nil)
	{
		backButton = [[UIBarButtonItem alloc] initWithImage:backImage style:UIBarButtonItemStylePlain target:nil action:nil];
	}
	else
	{
		NSString * backTitle = [TiUtils stringValue:[self valueForKey:@"backButtonTitle"]];
		if ((backTitle == nil) && [parentController conformsToProtocol:@protocol(TiTabController)])
		{
			id<TiTabController> tc = (id<TiTabController>)parentController;
			backTitle = [TiUtils stringValue:[[tc window] valueForKey:@"title"]];
		}
		if (backTitle != nil)
		{
			backButton = [[UIBarButtonItem alloc] initWithTitle:backTitle style:UIBarButtonItemStylePlain target:nil action:nil];
		}
	}
	[[parentController navigationItem] setBackBarButtonItem:backButton];
	[backButton release];
}

-(void)setBackButtonTitle:(id)proxy
{
	ENSURE_UI_THREAD_1_ARG(proxy);
	[self replaceValue:proxy forKey:@"backButtonTitle" notification:NO];
	if (controller!=nil)
	{
		[self _refreshBackButton];	//Because this is actually a property of a DIFFERENT view controller,
		//we can't attach this until we're in the navbar stack.
	}
}

-(void)setBackButtonTitleImage:(id)proxy
{
	ENSURE_UI_THREAD_1_ARG(proxy);
	[self replaceValue:proxy forKey:@"backButtonTitleImage" notification:NO];
	if (controller!=nil)
	{
		[self _refreshBackButton];	//Because this is actually a property of a DIFFERENT view controller, 
		//we can't attach this until we're in the navbar stack.
	}
}

-(void)updateTitleView
{
	UIView * newTitleView = nil;
	
	if (animating || controller == nil || [controller navigationController] == nil) {
		return; // No need to update the title if not in a nav controller
	}
	
	UINavigationItem * ourNavItem = [controller navigationItem];

	TiViewProxy * titleControl = [self valueForKey:@"titleControl"];

	UIView * oldView = [ourNavItem titleView];
	if ([oldView isKindOfClass:[TiUIView class]])
	{
		TiViewProxy * oldProxy = (TiViewProxy *)[(TiUIView *)oldView proxy];
		if (oldProxy == titleControl)
		{
			return;	//No need to update?
		}
		[oldProxy removeBarButtonView];
	}

	if ([titleControl isKindOfClass:[TiViewProxy class]])
	{
		newTitleView = [titleControl barButtonViewForSize:[TiUtils navBarTitleViewSize]];
	}
	else
	{
		NSURL * path = [TiUtils toURL:[self valueForKey:@"titleImage"] proxy:self];
		//Todo: This should be [TiUtils navBarTitleViewSize] with the thumbnail scaling. For now, however, we'll go with auto.
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:path withSize:CGSizeZero];
		if (image!=nil)
		{
			newTitleView = [[[UIImageView alloc] initWithImage:image] autorelease];
		}
	}

	[ourNavItem setTitleView:newTitleView];
}


-(void)setTitleControl:(id)proxy
{
	ENSURE_UI_THREAD(setTitleControl,proxy);
	[self replaceValue:proxy forKey:@"titleControl" notification:NO];
	if (controller!=nil)
	{
		[self updateTitleView];
	}
}

-(void)setTitleImage:(id)image
{
	ENSURE_UI_THREAD(setTitleImage,image);
	NSURL *path = [TiUtils toURL:image proxy:self];
	[self replaceValue:[path absoluteString] forKey:@"titleImage" notification:NO];
	if (controller!=nil)
	{
		[self updateTitleView];
	}
}

-(void)setTitle:(NSString*)title_
{
	ENSURE_UI_THREAD(setTitle,title_);
	NSString *title = [TiUtils stringValue:title_];
	[self replaceValue:title forKey:@"title" notification:NO];
	if (controller!=nil && [controller navigationController] != nil)
	{
		controller.navigationItem.title = title;
	}
}

-(void)setTitlePrompt:(NSString*)title_
{
	ENSURE_UI_THREAD(setTitlePrompt,title_);
	NSString *title = [TiUtils stringValue:title_];
	[self replaceValue:title forKey:@"titlePrompt" notification:NO];
	if (controller!=nil && [controller navigationController] != nil)
	{
		controller.navigationItem.prompt = title;
	}
}

-(void)setToolbar:(id)items withObject:(id)properties
{
	ENSURE_UI_THREAD_WITH_OBJ(setToolbar,items,properties);
    if (properties == nil) {
        properties = [self valueForKey:@"toolbarSettings"];
    }
    else {
        [self setValue:properties forKey:@"toolbarSettings"];
    }
    
	if (controller!=nil)
	{
		ENSURE_TYPE_OR_NIL(items,NSArray);
		[self replaceValue:items forKey:@"toolbar" notification:NO];
		
		// detatch the current ones
		NSArray *existing = [controller toolbarItems];
		UINavigationController * ourNC = [controller navigationController];
		if (existing!=nil)
		{
			for (id current in existing)
			{
				if ([current respondsToSelector:@selector(proxy)])
				{
					[(TiViewProxy*)[current proxy] removeBarButtonView];
				}
			}
		}
		BOOL translucent = [TiUtils boolValue:@"translucent" properties:properties def:NO];
		if (items!=nil && [items count] > 0)
		{
			NSMutableArray *array = [[NSMutableArray alloc] initWithCapacity:[items count]];
			for (TiViewProxy *proxy in items)
			{
				if ([proxy supportsNavBarPositioning])
				{
					// detach existing one
					UIBarButtonItem *item = [proxy barButtonItem];
					[array addObject:item];
				}
				else
				{
					NSString *msg = [NSString stringWithFormat:@"%@ doesn't support positioning on the nav bar",proxy];
					THROW_INVALID_ARG(msg);
				}
			}
			BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
			[controller setToolbarItems:array animated:animated];
			[ourNC setToolbarHidden:NO animated:animated];
			[ourNC.toolbar setTranslucent:translucent];
			[array release];
			hasToolbar=YES;
		}
		else
		{
			BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:NO];
			[controller setToolbarItems:nil animated:animated];
			[ourNC setToolbarHidden:YES animated:animated];
			[ourNC.toolbar setTranslucent:translucent];
			hasToolbar=NO;
		}
	}
	else
	{
		[self replaceValue:[[[TiComplexValue alloc] initWithValue:items properties:properties] autorelease] forKey:@"toolbar" notification:NO];
	}
}


#define SETPROP(m,x) \
{\
  id value = [self valueForKey:m]; \
  if (value!=nil)\
  {\
	[self x:(value==[NSNull null]) ? nil : value];\
  }\
  else{\
	[self replaceValue:nil forKey:m notification:NO];\
  }\
}\

#define SETPROPOBJ(m,x) \
{\
id value = [self valueForKey:m]; \
if (value!=nil)\
{\
if ([value isKindOfClass:[TiComplexValue class]])\
{\
     TiComplexValue *cv = (TiComplexValue*)value;\
     [self x:(cv.value==[NSNull null]) ? nil : cv.value withObject:cv.properties];\
}\
else\
{\
	[self x:(value==[NSNull null]) ? nil : value withObject:nil];\
}\
}\
else{\
[self replaceValue:nil forKey:m notification:NO];\
}\
}\

-(void)viewDidAttach
{
	// we must do this before the tab is loaded for it to repaint correctly
	// we also must do it in tabFocus below so that it reverts when we push off the stack
	SETPROP(@"barColor",setBarColor);
	SETPROP(@"barImage",setBarImage);
	[self updateTitleView];
	[super viewDidAttach];
}

- (void)viewWillAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	animating = YES;
	[super viewWillAppear:animated];
}

- (void)viewDidAppear:(BOOL)animated;     // Called when the view has been fully transitioned onto the screen. Default does nothing
{
	animating = NO;
	[self updateTitleView];
	[super viewDidAppear:animated];
}

- (void)viewWillDisappear:(BOOL)animated; // Called when the view is dismissed, covered or otherwise hidden. Default does nothing
{
	animating = YES;
	[super viewWillDisappear:animated];
}

- (void)viewDidDisappear:(BOOL)animated;  // Called after the view was dismissed, covered or otherwise hidden. Default does nothing
{
	animating = NO;
	[self updateTitleView];
	[super viewDidDisappear:animated];
}

-(void)setupWindowDecorations
{	
	if (controller!=nil)
	{
		[[controller navigationController] setToolbarHidden:!hasToolbar animated:YES];
	}
	
	SETPROP(@"title",setTitle);
	SETPROP(@"titlePrompt",setTitlePrompt);
	[self updateTitleView];
	SETPROP(@"barColor",setBarColor);
	SETPROP(@"translucent",setTranslucent);

	SETPROP(@"tabBarHidden",setTabBarHidden);

	SETPROPOBJ(@"leftNavButton",setLeftNavButton);
	SETPROPOBJ(@"rightNavButton",setRightNavButton);
	SETPROPOBJ(@"toolbar",setToolbar);
	SETPROP(@"barImage",setBarImage);
	[self _refreshBackButton];
	
	id navBarHidden = [self valueForKey:@"navBarHidden"];
	if (navBarHidden!=nil)
	{
		id properties = [NSArray arrayWithObject:[NSDictionary dictionaryWithObject:[NSNumber numberWithBool:NO] forKey:@"animated"]];
		if ([TiUtils boolValue:navBarHidden])
		{
			[self hideNavBar:properties];
		}
		else
		{
			[self showNavBar:properties];
		}
	}
}

-(void)cleanupWindowDecorations
{
    if (controller != nil) {
        UIBarButtonItem *item = controller.navigationItem.leftBarButtonItem;
        if ([item respondsToSelector:@selector(proxy)])
        {
            [(TiViewProxy*)[item proxy] removeBarButtonView];
        }
        
        item = controller.navigationItem.rightBarButtonItem;
        if ([item respondsToSelector:@selector(proxy)]) 
        {
            [(TiViewProxy*)[item proxy] removeBarButtonView];
        }
    }
}

-(void)_tabBeforeFocus
{
	if (focused==NO)
	{
		[self setupWindowDecorations];
	}
	[super _tabBeforeFocus];
}

-(void)_tabBeforeBlur
{
    if (focused==YES) {
        [self cleanupWindowDecorations];
    }
	[barImageView removeFromSuperview];
	[super _tabBeforeBlur];
}

-(void)_tabFocus
{
	if (focused==NO)
	{
		// we can't fire focus here since we 
		// haven't yet wired up the JS context at this point
		// and listeners wouldn't be ready
		if(![self opening])
		{
			[self fireFocus:YES];
		}
		[self setupWindowDecorations];
	}
	[super _tabFocus];
}

-(void)_tabBlur
{
	if (focused)
	{
		[self fireFocus:NO];
		if ([navController topViewController] != controller) {
			[barImageView removeFromSuperview];
		}
	}
	[super _tabBlur];
}

-(void)_associateTab:(UIViewController*)controller_ navBar:(UINavigationController*)navbar_ tab:(TiProxy<TiTab>*)tab_ 
{
	[super _associateTab:controller_ navBar:navbar_ tab:tab_];
	SETPROP(@"tabBarHidden",setTabBarHidden);
}

@end

#endif