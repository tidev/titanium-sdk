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
	TiWindowProxy *window;
}
-(id)initWithWindow:(TiWindowProxy*)window;
@end

@implementation WindowViewController


-(id)initWithWindow:(TiWindowProxy*)window_
{
	if (self = [super init])
	{
		window = window_;
	}
	return self;
}

-(void)loadView
{
	self.view = [window view];
}

@end



// since we can have multiple top level window animations that attempt to
// occur at the same time, we need to make sure we queue them at the top
// level (views already queue within themselves).  this should only apply
// at windows, tabgroups, etc. 
static BOOL windowAnimationActive;
static NSMutableArray *windowAnimationQueue;

// check to make sure we don't have a top level animation happening
// if we do, we need to queue this pending action unless the previous one completes
#define UI_ENSURE_AFTER_WINDOW_ANIMATION(method,args) \
if ([self windowAnimationActive])\
{\
if (windowAnimationQueue==nil)\
{\
windowAnimationQueue = [[NSMutableArray alloc] init];\
}\
TiAction *action = [[TiAction alloc] initWithTarget:self selector:@selector(method:) arg:args];\
[windowAnimationQueue addObject:action];\
[action release];\
return;\
}\
[self setWindowAnimationActive:YES];\
[self performSelector:@selector(method:) withObject:args];\

#define UI_ENSURE_AFTER_WINDOW_ANIMATION_NOARG(method) \
if ([self windowAnimationActive])\
{\
if (windowAnimationQueue==nil)\
{\
windowAnimationQueue = [[NSMutableArray alloc] init];\
}\
TiAction *action = [[TiAction alloc] initWithTarget:self selector:@selector(method) arg:nil];\
[windowAnimationQueue addObject:action];\
[action release];\
return;\
}\
[self setWindowAnimationActive:YES];\
[self performSelector:@selector(method) withObject:nil];\


@implementation TiWindowProxy

-(void)dealloc
{
	RELEASE_TO_NIL(tempView);
	RELEASE_TO_NIL(tempColor);
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(navbar);
	RELEASE_TO_NIL(tab);
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
	win.hidden = YES;
	return win;
}

-(void)setWindowAnimationActive:(BOOL)yn
{
	@synchronized(self)
	{
		windowAnimationActive = yn;
	}
}

-(BOOL)windowAnimationActive
{
	BOOL active = NO;
	
	@synchronized(self)
	{
		active = windowAnimationActive;
	}
	
	return active;
}

BEGIN_UI_THREAD_PROTECTED_VALUE(opened,NSNumber)
	result = [NSNumber numberWithBool:opened];
END_UI_THREAD_PROTECTED_VALUE(opened)

-(void)_processPendingWindowAnimations
{
	ENSURE_UI_THREAD(_processPendingWindowAnimations,nil);
	[self setWindowAnimationActive:NO];
	if (windowAnimationQueue!=nil && [windowAnimationQueue count] > 0)
	{
		TiAction *action = [[windowAnimationQueue objectAtIndex:0] retain];
		[windowAnimationQueue removeObjectAtIndex:0];
		[action execute];
		[action release];
		
		if ([windowAnimationQueue count]==0)
		{
			RELEASE_TO_NIL(windowAnimationQueue);
		}
	}
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

-(TiViewProxy*)_findFirstTiViewOnTopLevelWindow
{
	TiUIView *view = [self view];
	
	for (id child in [[self _window] subviews])
	{
		if (child == view)
		{
			continue;
		}
		if ([child isKindOfClass:[TiUIView class]])
		{
			return [(TiUIView*)child proxy];
		}
	}
	return nil;
}

-(int)_topLevelWindowChildCountExcludingSelf
{
	int count = [[[self _window] subviews] count];
	if ([[self view] superview] == [self _window])
	{
		count--;
	}
	return count;
}

-(BOOL)_topLevelWindowHasChildren
{
	return ([[[self _window] subviews] count] > 0);
}

-(void)_windowReady
{
	opened = YES;
	
	[self _attachViewToTopLevelWindow];
	
	if ([self _hasListeners:@"open"])
	{
		[self fireEvent:@"open" withObject:nil];
	}
	
	[self _processPendingWindowAnimations];
}

-(void)_windowClosed
{
	if (opened==NO)
	{
		return;
	}
	
	opened = NO;
	attached = NO;
	
	[self detachView];
	[self _processPendingWindowAnimations];
	
	// notify our child that his window is closing
	for (TiViewProxy *child in self.children)
	{
		[child windowDidClose];
	}	
	
	[self windowDidClose];

	RELEASE_TO_NIL(navbar);
	RELEASE_TO_NIL(controller);
}

-(void)_makeSplashScreenBackgroundView
{
	if (tempColor==nil)
	{
		tempColor = [[self _window].backgroundColor retain];
	}
	if (tempView==nil)
	{
		tempView = [[TiViewProxy alloc] init];
		[tempView setValue:@"Default.png" forKey:@"backgroundImage"];
		[TiUtils setView:[tempView view] positionRect:[self _window].bounds];
		[[self _window] addSubview:[tempView view]];
	}
}

-(void)_performCloseTransition:(TiAnimation*)animation
{
	BOOL animate = YES;
	[animation setDelegate:self selector:@selector(_windowClosed) withObject:nil];
	
	//TODO: REWORK ALL OF THIS
	/*
	if ([animation isTransitionAnimation] && [self _topLevelWindowHasChildren])
	{
		TiViewProxy *target = [self _findFirstTiViewOnTopLevelWindow];
		if (target == nil && [self _topLevelWindowChildCountExcludingSelf] == 0)
		{
			// we need to add a temporary view to transition back to
			[self _makeSplashScreenBackgroundView];
			target = tempView;
			closeTempView = NO;
		}
		if (target!=nil)
		{
			// if we're hanging off the top level window, we will need to do a transition
			[animation animateTransition:[self _window] oldView:self newView:target];
			animate = NO;
		}
	}*/
	
	if (animate)
	{
		[animation animate:self];
	}
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

-(UIViewController*)controller
{
	return controller;
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

-(void)setController:(UIViewController*)controller_
{
	RELEASE_TO_NIL(controller);
	controller = [controller_ retain];
}

-(void)setNavController:(UINavigationController*)navController
{
	RELEASE_TO_NIL(navbar);
	navbar = [navController retain];
}

-(void)setupWindowDecorations
{
}

// called to associate a Tab UIViewController with this window when it's connected
// to a tab or nil to disassociate
-(void)_associateTab:(UIViewController*)controller_ navBar:(UINavigationController*)navbar_ tab:(TiProxy<TiTab>*)tab_ 
{
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(navbar);
	RELEASE_TO_NIL(tab);
	
	if (tab_!=nil)
	{
		navbar = [navbar_ retain];
		controller = [controller_ retain];
		tab = [tab_ retain];
		
		[self _tabAttached];
	}
	else
	{
		[self _tabDetached];
	}
}


-(void)_performOpenTransition:(TiAnimation*)animation
{
	BOOL animate = YES;
	[animation setDelegate:self selector:@selector(_windowReady) withObject:nil];
	if ([animation isTransitionAnimation])
	{
		// potentially open with animation against the top level window 
		// if he has no attached views yet
		if (![self _topLevelWindowHasChildren])
		{
			[self _performTopLevelWindowAnimation:animation view:self];
			animate = NO;
		}
		// check to see if there are at least 1 other window we can transition from (as as sibling)
		else if ([self _topLevelWindowHasChildren])
		{
			/*FIXME: rework all of this
			TiViewProxy *target = [self _findFirstTiViewOnTopLevelWindow];
			if (target!=nil)
			{
				tempView = [target retain];
				readdTempView = YES;
				closeTempView = YES;
				// if we're hanging off the top level window, we will need to do a transition
				[animation animateTransition:[self _window] oldView:target newView:self];
				animate = NO; 
			}*/
		}
	}
	if (animate)
	{
		// else just perform the animation as-is
		[self _attachViewToTopLevelWindow];
		[animation animate:[self view]];
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
	if (opened==YES && [self windowAnimationActive]==NO)
	{
		return;
	}
	
	modal = NO;
	fullscreen = NO;
	
	if ([self isFullscreen:args])
	{
		fullscreen = YES;
		restoreFullscreen = [UIApplication sharedApplication].statusBarHidden;
		[[UIApplication sharedApplication] setStatusBarHidden:YES];
		[[[TitaniumApp app] controller] resizeView];
	}
	
	if ([self isModal:args])
	{
		modal = YES;
		attached = YES;
		WindowViewController *wc = [[[WindowViewController alloc] initWithWindow:self] autorelease];
		UINavigationController *navController = [[[UINavigationController alloc] initWithRootViewController:wc] autorelease];
		[self setController:wc];
		[self setNavController:navController];
		[self view].hidden=NO;
		BOOL animated = args!=nil && [args isKindOfClass:[NSDictionary class]] ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;
		[self setupWindowDecorations];
		[[[TitaniumApp app] controller] presentModalViewController:navController animated:animated];
	}
	
	// FIXME: for now this will ensure on open that we've created our view before we start to use it
	[self view];
	
	// give it to our subclass. he'll either return true to continue with open state and animation or 
	// false to delay for some other action
	if ([self _handleOpen:args])
	{
		TiAnimation *animation = [TiAnimation animationFromArg:args context:[self pageContext] create:NO];
		
		if (animation!=nil)
		{
			UI_ENSURE_AFTER_WINDOW_ANIMATION(_performOpenTransition,animation);
		}
		else 
		{
			UI_ENSURE_AFTER_WINDOW_ANIMATION_NOARG(_windowReady);
		}
	}
}

-(void)close:(id)args
{
	ENSURE_UI_THREAD(close,args);
	
	
	// closing more than once does nothing
	if (opened==NO && [self windowAnimationActive]==NO)
	{
		return;
	}
	
	// hold ourself during close
	[[self retain] autorelease];
	
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
			UI_ENSURE_AFTER_WINDOW_ANIMATION(_performCloseTransition,animation);
		}
		else 
		{
			UI_ENSURE_AFTER_WINDOW_ANIMATION_NOARG(_windowClosed);
		}
	}	 

	if (fullscreen)
	{
		[[UIApplication sharedApplication] setStatusBarHidden:restoreFullscreen];
		[[[TitaniumApp app] controller] resizeView];
	}
}

-(void)_attachViewToTopLevelWindow
{
	BOOL splashAnimation = [[TitaniumApp app] isSplashVisible];
	if (splashAnimation)
	{
		[UIView beginAnimations:@"splash" context:nil];
	}
	UIView *rootView = [[TitaniumApp app] controller].view;

	if (readdTempView && tempView!=nil)
	{
		[rootView addSubview:[tempView view]];
		RELEASE_TO_NIL(tempView);
		readdTempView=NO;
	}
	
	if (attached==NO)
	{
		attached = YES;
		TiUIView *view = [self view];
		if (![self _isChildOfTab])
		{
			[rootView addSubview:view];
			[[[TitaniumApp app] controller] windowFocused:self];
		}
		[self layoutChildren:view.bounds];
		[rootView bringSubviewToFront:view];
		view.hidden = NO;
	}
	
	[[TitaniumApp app] hideSplash:nil];
	
	if (splashAnimation)
	{
		[UIView commitAnimations];
	}
}

-(void)_windowAnimationCompleted
{
	// after the initial window animation completes we can
	// safely remove our tempView to save memory
	
	if (tempView!=nil && closeTempView)
	{
		[tempView destroy];
		RELEASE_TO_NIL(tempView);
		[[self _window] setBackgroundColor:tempColor];
		RELEASE_TO_NIL(tempColor);
	}
	
	// we need to fire our events
	[self _windowReady];
}

-(void)_startWindowAnimation:(NSArray*)args
{
	//FIXME - rework all of this
	
	/*
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	attached = YES;
	// start the window animation back on the main UI thread
	TiAnimation *animation = [args objectAtIndex:0];
	TiViewProxy *oldView = [args objectAtIndex:1];
	TiViewProxy *newView = [args objectAtIndex:2];
	
	if (newView==self)
	{
		TiUIView *view = [self view];
		[TiUtils setView:view positionRect:[TiUtils contentFrame:YES]];
		[self layoutChildren:view.bounds];
	}
	[animation setDelegate:self selector:@selector(_windowAnimationCompleted) withObject:nil];
	[animation animateTransition:[self _window] oldView:oldView newView:newView];
	[pool release];
	 */
}

-(void)_performTopLevelWindowAnimation:(TiAnimation*)animation view:(TiViewProxy*)newView
{
	// this method will temporarily attach the splashscreen (loading screen) at a child
	// so that we can do a transition against it
	opened = YES;
	[self _makeSplashScreenBackgroundView];
	// remember the background color of the window so we can reset after the animation
	// this little guy is required to be done on a separate thread or the animation won't happen
	// given the current state of the load.
	NSArray *args = [NSArray arrayWithObjects:animation,tempView,newView,nil];
	[NSThread detachNewThreadSelector:@selector(_startWindowAnimation:) toTarget:self withObject:args];
}

-(NSNumber*)focused
{
	return NUMBOOL(focused);
}

@end
