/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiWindowProxy.h"
#import "TitaniumApp.h"
#import "TiUtils.h"
#import "TiAnimation.h"
#import "TiAction.h"

@interface WindowViewController : UIViewController
{
	TiWindowProxy *proxy;
}
-(id)initWithWindow:(TiWindowProxy*)window;
@property(nonatomic,readonly)	TiWindowProxy *proxy;

@end

@implementation WindowViewController

-(id)initWithWindow:(TiWindowProxy*)window_
{
	if (self = [super init])
	{
		proxy = window_;
	}
	return self;
}

-(void)loadView
{
	self.view = [proxy view];
}

-(id)proxy
{
	return proxy;
}

@end


@implementation TiWindowProxy
@synthesize navController, controller;

-(void)dealloc
{
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(navController);
	RELEASE_TO_NIL(tab);
	RELEASE_TO_NIL(reattachWindows);
	RELEASE_TO_NIL(closeView);
	[super dealloc];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
	[super _initWithProperties:properties];
	
	if (properties == nil || [properties objectForKey:@"orientationModes"]==nil)
	{
		[self replaceValue:nil forKey:@"orientationModes" notification:NO];
	}
}

-(TiUIView*)newView
{
	TiUIWindow * win = [[TiUIWindow alloc] initWithFrame:[self appFrame]];
	return win;
}

BEGIN_UI_THREAD_PROTECTED_VALUE(opened,NSNumber)
	result = [NSNumber numberWithBool:opened];
END_UI_THREAD_PROTECTED_VALUE(opened)


-(BOOL)handleFocusEvents
{
	return YES;
}

-(BOOL)_handleOpen:(id)args
{
	//subclasses can override
	return YES;
}

-(UIWindow*)_window
{
	return [[TitaniumApp app] window];
}

-(void)windowReady
{
	opened = YES;
	opening = NO;
	
	[self attachViewToTopLevelWindow];
	
	if ([self _hasListeners:@"open"])
	{
		[self fireEvent:@"open" withObject:nil];
	}
	
	// we do it here in case we have a window that
	// neither has tabs nor JS
	if (focused==NO && [self handleFocusEvents])
	{
		focused = YES;
		if ([self _hasListeners:@"focus"])
		{
			[self fireEvent:@"focus" withObject:nil];
		}
	}
	
	if (reattachWindows!=nil)
	{
		UIView *rootView = [[TitaniumApp app] controller].view;
		for (UIView *aview in reattachWindows)
		{
			[rootView addSubview:aview];
			[rootView sendSubviewToBack:aview];
		}
		RELEASE_TO_NIL(reattachWindows);
	}
}

-(void)windowClosed
{
	if (opened==NO)
	{
		return;
	}
	
	opened = NO;
	attached = NO;
	opening = NO;
	
	[self detachView];
	
	// notify our child that his window is closing
	for (TiViewProxy *child in self.children)
	{
		[child windowDidClose];
	}	
	
	[self windowDidClose];

	RELEASE_TO_NIL(navController);
	RELEASE_TO_NIL(controller);
}

-(BOOL)_handleClose:(id)args
{
	[self windowWillClose];
	return YES;
}

-(TiProxy<TiTab>*)tab
{
	return tab;
}

-(TiProxy*)tabGroup
{
	return tab!=nil ? [tab tabGroup] : nil;
}

-(BOOL)_isChildOfTab
{
	return tab!=nil;
}

-(void)_tabAttached
{
	// for subclasses
}

-(void)_tabDetached
{
	// for subclasses
}

-(void)_tabFocus
{
	focused = YES;
	[[[TitaniumApp app] controller] windowFocused:self];
}

-(void)_tabBlur
{
	focused = NO;
	[[[TitaniumApp app] controller] windowUnfocused:self];
}

-(void)_tabBeforeFocus
{
	[[[TitaniumApp app] controller] windowBeforeFocused:self];
}

-(void)_tabBeforeBlur
{
	[[[TitaniumApp app] controller] windowBeforeUnfocused:self];
}

-(void)setupWindowDecorations
{
}

// called to associate a Tab UIViewController with this window when it's connected
// to a tab or nil to disassociate
-(void)_associateTab:(UIViewController*)controller_ navBar:(UINavigationController*)navbar_ tab:(TiProxy<TiTab>*)tab_ 
{
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(navController);
	RELEASE_TO_NIL(tab);
	
	if (tab_!=nil)
	{
		navController = [navbar_ retain];
		controller = [controller_ retain];
		tab = [tab_ retain];
		
		[self _tabAttached];
	}
	else
	{
		[self _tabDetached];
	}
}

-(BOOL)argOrWindowProperty:(NSString*)key args:(id)args
{
	if ([TiUtils boolValue:[self valueForUndefinedKey:key]])
	{
		return YES;
	}
	if (args!=nil && [args count] > 0 && [[args objectAtIndex:0] isKindOfClass:[NSDictionary class]])
	{
		return [TiUtils boolValue:key properties:[args objectAtIndex:0] def:NO];
	}
	return NO;
}

-(BOOL)isModal:(id)args
{
	return [self argOrWindowProperty:@"modal" args:args];
}

-(BOOL)isFullscreen:(id)args
{
	return [self argOrWindowProperty:@"fullscreen" args:args];
}

-(void)open:(id)args
{
	ENSURE_UI_THREAD(open,args);
	
	// opening a window more than once does nothing
	if (opened==YES)
	{
		return;
	}
	
	if (opening==NO)
	{
		modal = [self isModal:args];
		fullscreen = [self isFullscreen:args];
		opening = YES;
	}
	
	// ensure on open that we've created our view before we start to use it
	[self view];
	
	// give it to our subclass. he'll either return true to continue with open state and animation or 
	// false to delay for some other action
	if ([self _handleOpen:args])
	{
		TiAnimation *animation = [TiAnimation animationFromArg:args context:[self pageContext] create:NO];
		if (animation!=nil)
		{
			[self attachViewToTopLevelWindow];
			if ([animation isTransitionAnimation])
			{
				transitionAnimation = [[animation transition] intValue];
				splashTransitionAnimation = [[TitaniumApp app] isSplashVisible];
			}
			animation.delegate = self;
			[animation animate:self];
		}
		if (fullscreen)
		{
			fullscreen = YES;
			restoreFullscreen = [UIApplication sharedApplication].statusBarHidden;
			[[UIApplication sharedApplication] setStatusBarHidden:YES];
			[self view].frame = [[[TitaniumApp app] controller] resizeView];
		}
		else if (modal)
		{
			modal = YES;
			attached = YES;
			WindowViewController *wc = [[[WindowViewController alloc] initWithWindow:self] autorelease];
			UINavigationController *nc = [[[UINavigationController alloc] initWithRootViewController:wc] autorelease];
			[self setController:wc];
			[self setNavController:nc];
			BOOL animated = args!=nil && [args isKindOfClass:[NSDictionary class]] ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;
			[self setupWindowDecorations];
			[[[TitaniumApp app] controller] presentModalViewController:nc animated:animated];
		}
		if (animation==nil)
		{
			[self windowReady];
		}
	}
}

-(void)close:(id)args
{
	ENSURE_UI_THREAD(close,args);
	
	// closing more than once does nothing
	if (opened==NO)
	{
		return;
	}
	
	[[[TitaniumApp app] controller] windowClosed:self];

	if (modal)
	{
		UIViewController *vc = [self controller];
		BOOL animated = args!=nil && [args isKindOfClass:[NSDictionary class]] ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;
		[vc dismissModalViewControllerAnimated:animated];
		if (animated)
		{
			// if animated, we don't want to immediately remove our view but instead need
			// to wait until the modal dialog is dismissed before we remove our view 
			// otherwise, you'll see the view popup as the window is lowering
			modal = NO;
			[self performSelector:@selector(close:) withObject:nil afterDelay:0.3];
			return;
		}
	}
	
	
	opening = NO;
	UIView *myview = [self view];
	[[myview retain] autorelease];
	
	// hold ourself during close
	[[self retain] autorelease];
	
	if ([self _hasListeners:@"close"])
	{
		[self fireEvent:@"close" withObject:nil];
	}	
	
	// notify our child that his window is closing
	if (self.children!=nil)
	{
		for (TiViewProxy *child in self.children)
		{
			[child windowWillClose];
		}
	}
	
	if (![self _isChildOfTab])
	{
		[[[TitaniumApp app] controller] windowUnfocused:self];
	}	
	
	if ([self _handleClose:args])
	{
		TiAnimation *animation = [TiAnimation animationFromArg:args context:[self pageContext] create:NO];
		if (animation!=nil)
		{
			if ([animation isTransitionAnimation])
			{
				UIView *rootView = [[TitaniumApp app] controller].view;
				transitionAnimation = [[animation transition] intValue];
				splashTransitionAnimation = [[rootView subviews] count]<=1 && modal==NO;
				if (splashTransitionAnimation)
				{
					[[TitaniumApp app] attachSplash];
				}
				else
				{
					RELEASE_TO_NIL(reattachWindows);
					if ([[rootView subviews] count] > 0)
					{
						reattachWindows = [[NSMutableArray array] retain];
						for (UIView *aview in [rootView subviews])
						{
							if (aview!=[self view])
							{
								[reattachWindows addObject:aview];
								[aview removeFromSuperview];
							}
						}
					}
				}
			}
			animation.delegate = self;
			// we need to hold a reference during close
			closeView = [myview retain];
			[animation animate:self];
		}
		
		if (fullscreen)
		{
			[[UIApplication sharedApplication] setStatusBarHidden:restoreFullscreen];
			self.view.frame = [[[TitaniumApp app] controller] resizeView];
		}
		
		if (animation==nil)
		{
			[self windowClosed];
		}
	}	 
}

-(void)attachViewToTopLevelWindow
{
	if (attached)
	{
		return;
	}
	attached = YES;
	
	UIView *rootView = [[TitaniumApp app] controller].view;
	TiUIView *view = [self view];
	
	if (![self _isChildOfTab])
	{
		[rootView addSubview:view];
		[[[TitaniumApp app] controller] windowFocused:self];
	}

	[self layoutChildren:view.bounds];

	[rootView bringSubviewToFront:view];

	// make sure the splash is gone
	[[TitaniumApp app] hideSplash:nil];
}

-(NSNumber*)focused
{
	return NUMBOOL(focused);
}

#pragma mark Animation Delegates

-(BOOL)animationShouldTransition:(id)sender
{
	UIView *rootView = [[TitaniumApp app] controller].view;
	[UIView setAnimationTransition:transitionAnimation
						   forView:rootView
							 cache:NO];
	
	if (opening)
	{
		if (splashTransitionAnimation)
		{
			splashTransitionAnimation=NO;
			UIView *splashView = [[TitaniumApp app] splash];
			[splashView removeFromSuperview];
		}
		else
		{
			RELEASE_TO_NIL(reattachWindows);
			if ([[rootView subviews] count] > 0)
			{
				reattachWindows = [[NSMutableArray array] retain];
				for (UIView *aview in [rootView subviews])
				{
					if (aview!=[self view])
					{
						[reattachWindows addObject:aview];
						[aview removeFromSuperview];
					}
				}
			}
		}
		[self attachViewToTopLevelWindow];
	}
	else 
	{
		if (reattachWindows!=nil)
		{
			for (UIView *aview in reattachWindows)
			{
				[rootView addSubview:aview];
			}
			RELEASE_TO_NIL(reattachWindows);
			[self detachView];
		}
	}

	return NO;
}

-(void)animationWillStart:(id)sender
{
	if (opening)
	{
		if (splashTransitionAnimation==NO)
		{
			if ([[TitaniumApp app] isSplashVisible])
			{
				[[TitaniumApp app] splash].alpha = 0;
			}	
			[self attachViewToTopLevelWindow];
		}
	}
	else
	{
		if (splashTransitionAnimation)
		{
			[self detachView];
		}
	}
}

-(void)animationDidComplete:(id)sender
{
	if (opening)
	{
		[self windowReady];
	}
	else
	{
		[self windowClosed];
		[closeView autorelease];
		closeView=nil;
	}
}


@end
