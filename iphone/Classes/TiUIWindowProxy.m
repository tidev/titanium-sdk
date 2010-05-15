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

@implementation TiUIWindowProxy

-(void)_destroy
{
	RELEASE_TO_NIL(context);
	if (context!=nil)
	{
		[context shutdown];
		RELEASE_TO_NIL(context);
	}
	[super _destroy];
}

-(void)booted:(id)arg
{
	// nothing to do, in the future we might show and hide indicator on a context load 
	// but for now, nothing...
	contextReady = YES;
	
	if (!navWindow) 
	{
		[self open:nil];
	}
	else {
		[self prepareForNavView:[self navController]];
	}
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
				//TODO: add activity indicator until booted
				RELEASE_TO_NIL(context);
				// set our new base
				[self _setBaseURL:url];
				contextReady=NO;
				context = [[KrollBridge alloc] initWithHost:[self _host]];
				NSDictionary *preload = [NSDictionary dictionaryWithObjectsAndKeys:self,@"currentWindow",[self.tab tabGroup],@"currentTabGroup",self.tab,@"currentTab",nil];
				[context boot:self url:url preload:preload];
				return NO;
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
	if (context!=nil)
	{
		[context shutdown];
		RELEASE_TO_NIL(context);
	}
	[super windowDidClose];
}

-(BOOL)_handleClose:(id)args
{
	if (tab!=nil)
	{
		BOOL animate = args!=nil && [args count]>0 ? [TiUtils boolValue:@"animate" properties:[args objectAtIndex:0] def:YES] : YES;
		[tab windowClosing:self animated:animate];
	}
	else
	{
		// if we don't have a tab, we need to fire blur
		// events ourselves
		[self fireFocus:NO];
	}
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

-(void)setTranslucent:(id)value
{
	ENSURE_UI_THREAD(setTranslucent,value);
	[self replaceValue:value forKey:@"translucent" notification:NO];
	if (controller!=nil)
	{
		[controller navigationController].navigationBar.translucent = [TiUtils boolValue:value];
	}
}

-(void)setOrientationModes:(id)value
{
	[self replaceValue:value forKey:@"orientationModes" notification:YES];
	[[[TiApp app] controller] performSelectorOnMainThread:@selector(refreshOrientationModesIfNeeded:) withObject:self waitUntilDone:NO];
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
    
	if (controller!=nil)
	{
		ENSURE_TYPE_OR_NIL(proxy,TiViewProxy);
		[self replaceValue:proxy forKey:@"rightNavButton" notification:NO];
		if (proxy==nil || [proxy supportsNavBarPositioning])
		{
			// detach existing one
			UIBarButtonItem *item = controller.navigationItem.rightBarButtonItem;
			if (item!=nil && [item isKindOfClass:[TiViewProxy class]])
			{
				[(TiViewProxy*)item removeBarButtonView];
			}
			if (proxy!=nil)
			{
				// add the new one
				BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
				[controller.navigationItem setRightBarButtonItem:[proxy barButtonItem] animated:animated];
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
    
	if (controller!=nil)
	{
		ENSURE_TYPE_OR_NIL(proxy,TiViewProxy);
		[self replaceValue:proxy forKey:@"leftNavButton" notification:NO];
		if (proxy==nil || [proxy supportsNavBarPositioning])
		{
			// detach existing one
			UIBarButtonItem *item = controller.navigationItem.leftBarButtonItem;
			if (item!=nil && [item isKindOfClass:[TiViewProxy class]])
			{
				[(TiViewProxy*)item removeBarButtonView];
			}
			if (proxy!=nil)
			{
				// add the new one
				BOOL animated = [TiUtils boolValue:@"animated" properties:properties def:YES];
				[controller.navigationItem setLeftBarButtonItem:[proxy barButtonItem] animated:animated];
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
	if (controller!=nil)
	{
		controller.navigationItem.title = title;
	}
}

-(void)setTitlePrompt:(NSString*)title_
{
	ENSURE_UI_THREAD(setTitlePrompt,title_);
	NSString *title = [TiUtils stringValue:title_];
	[self replaceValue:title forKey:@"titlePrompt" notification:NO];
	if (controller!=nil)
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
				if ([current isKindOfClass:[TiViewProxy class]])
				{
					[(TiViewProxy*)current removeBarButtonView];
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
	[super viewDidAttach];
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
	[super _tabBeforeBlur];
}

-(void)_tabFocus
{
	if (focused==NO)
	{
		// we can't fire focus here since we 
		// haven't yet wired up the JS context at this point
		// and listeners wouldn't be ready
		[self fireFocus:YES];
		[self setupWindowDecorations];
	}
	[super _tabFocus];
}

-(void)_tabBlur
{
	if (focused)
	{
		[self fireFocus:NO];
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