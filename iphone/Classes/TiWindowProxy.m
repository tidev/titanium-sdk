/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiWindowProxy.h"
#import "TiApp.h"
#import "TiUtils.h"
#import "TiAnimation.h"
#import "TiAction.h"

TiOrientationFlags TiOrientationFlagsFromObject(id args)
{
	if (![args isKindOfClass:[NSArray class]])
	{
		return TiOrientationNone;
	}

	TiOrientationFlags result = TiOrientationNone;
	for (id mode in args)
	{
		UIInterfaceOrientation orientation = [TiUtils orientationValue:mode def:-1];
		switch (orientation)
		{
			case UIDeviceOrientationPortrait:
			case UIDeviceOrientationPortraitUpsideDown:
			case UIDeviceOrientationLandscapeLeft:
			case UIDeviceOrientationLandscapeRight:
				TI_ORIENTATION_SET(result,orientation);
				break;
#if DEBUG
			case UIDeviceOrientationUnknown:
				NSLog(@"[WARN] Orientation modes cannot use Ti.Gesture.UNKNOWN. Ignoring.");
				break;
			case UIDeviceOrientationFaceDown:
				NSLog(@"[WARN] Orientation modes cannot use Ti.Gesture.FACE_DOWN. Ignoring.");
				break;
			case UIDeviceOrientationFaceUp:
				NSLog(@"[WARN] Orientation modes cannot use Ti.Gesture.FACE_UP. Ignoring.");
				break;
#endif
			default:
#if DEBUG
				NSLog(@"[WARN] An invalid orientation was requested. Ignoring.");
#endif
				break;
		}
	}
	return result;
}



@implementation TiWindowProxy
@synthesize navController, controller;

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
	for (TiViewProxy * thisProxy in [self children])
	{
		if ([thisProxy respondsToSelector:@selector(willAnimateRotationToInterfaceOrientation:duration:)])
		{
			[(id)thisProxy willAnimateRotationToInterfaceOrientation:toInterfaceOrientation duration:duration];
		}
	}
	//This is in place for TabController (Or any others) to subclass.
}


-(UIViewController *)controller
{
	if (controller == nil)
	{
		controller = [[TiViewController alloc] initWithViewProxy:self];
	}
	return controller;
}

-(void)replaceController
{
	if (controller != nil) {
		RELEASE_TO_NIL(controller);
		[self controller];
	}
}

-(void)_destroy
{
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(navController);
	RELEASE_TO_NIL(tab);
	RELEASE_TO_NIL(reattachWindows);
	RELEASE_TO_NIL(closeView);
	[super _destroy];
}

-(void)_configure
{	
	[self replaceValue:nil forKey:@"orientationModes" notification:NO];
	[super _configure];
}

-(TiUIView*)newView
{
	CGRect frame = [self appFrame];
	if (navController!=nil)
	{
		frame = navController.view.frame;
	}
	TiUIWindow * win = [[TiUIWindow alloc] initWithFrame:frame];
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
	return [[TiApp app] window];
}

-(void)windowDidOpen
{
	[super windowDidOpen];
	
	opening = NO;

	if ([self _hasListeners:@"open"])
	{
		[self fireEvent:@"open" withObject:nil];
	}
	
	// we do it here in case we have a window that
	// neither has tabs nor JS
	if (focused==NO && [self handleFocusEvents])
	{
		[self fireFocus:YES];
	}

	if (reattachWindows!=nil)
	{
		UIView *rootView = [[TiApp app] controller].view;
		for (UIView *aview in reattachWindows)
		{
			[rootView addSubview:aview];
			[rootView sendSubviewToBack:aview];
		}
		RELEASE_TO_NIL(reattachWindows);
	}
}

-(void)windowReady
{
	if (opened)
	{
		return;
	}
	
	opened = YES;
	
	if (!navWindow) 
	{
		[self attachViewToTopLevelWindow];
	}
}

-(BOOL)closing
{
	return closing;
}

-(void)windowClosed
{
	ENSURE_UI_THREAD_0_ARGS

	[(TiRootViewController *)[[TiApp app] controller] closeWindow:self withObject:nil];
	
	if (opened==NO)
	{
		return;
	}
	VerboseLog(@"%@ (modal:%d)%@",self,modalFlag,CODELOCATION);
	[[[TiApp app] controller] didHideViewController:controller animated:YES];

	opened = NO;
	attached = NO;
	opening = NO;
	closing = NO;
	
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

-(void)windowWillClose
{
	if (closing==NO)
	{
		closing = YES;
		[super windowWillClose];
	}
}

-(BOOL)_handleClose:(id)args
{
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
	if (!navWindow) {
		[[[TiApp app] controller] windowFocused:[self controller]];
	}
}

-(void)_tabBlur
{
	focused = NO;
}

-(void)_tabBeforeFocus
{
}

-(void)_tabBeforeBlur
{
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

-(BOOL)isRootViewAttached
{
	return ([[[[TiApp app] controller] view] superview]!=nil);
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
		modalFlag = [self isModal:args];
		fullscreenFlag = [self isFullscreen:args];
		opening = YES;
	}
	
	navWindow = NO;
	BOOL rootViewAttached = [self isRootViewAttached];
	
	// give it to our subclass. he'll either return true to continue with open state and animation or 
	// false to delay for some other action
	if ([self _handleOpen:args])
	{
		// ensure on open that we've created our view before we start to use it
		[self view];
		[self windowWillOpen];
		[self windowReady];
		
		TiAnimation *animation = nil;
		if (!modalFlag)
		{
			animation = [TiAnimation animationFromArg:args context:[self pageContext] create:NO];
		}
		if (animation!=nil)
		{
			if (rootViewAttached)
			{
				[[[TiApp app] controller] willShowViewController:[self controller] animated:(animation != nil)];
				[self attachViewToTopLevelWindow];
				[[[TiApp app] controller] didShowViewController:[self controller] animated:animation!=nil];
			}
			if ([animation isTransitionAnimation])
			{
				transitionAnimation = [[animation transition] intValue];
				splashTransitionAnimation = [[TiApp app] isSplashVisible];
			}
			animation.delegate = self;
			[animation animate:self];
		}
		if (fullscreenFlag)
		{
			fullscreenFlag = YES;
			restoreFullscreen = [UIApplication sharedApplication].statusBarHidden;
			[[UIApplication sharedApplication] setStatusBarHidden:YES];
			[self view].frame = [[[TiApp app] controller] resizeView];
		}
		else if (modalFlag)
		{
			modalFlag = YES;
			attached = YES;
			TiViewController *wc = (TiViewController*)[self controller];
			UINavigationController *nc = nil;
			
			if ([self argOrWindowProperty:@"navBarHidden" args:args]==NO)
			{
				nc = [[[UINavigationController alloc] initWithRootViewController:wc] autorelease];
			}
			
			NSDictionary *dict = [args count] > 0 ? [args objectAtIndex:0] : nil;
			int style = [TiUtils intValue:@"modalTransitionStyle" properties:dict def:-1];
			if (style!=-1)
			{
				[wc setModalTransitionStyle:style];
				[nc setModalTransitionStyle:style];
			}
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
			style = [TiUtils intValue:@"modalStyle" properties:dict def:-1];
			if (style!=-1)
			{
				// modal transition style page curl must be done only in fullscreen
				// so only allow if not page curl
				if ([wc modalTransitionStyle]!=UIModalTransitionStylePartialCurl)
				{
					[wc setModalPresentationStyle:style];
					[nc setModalPresentationStyle:style];
				}
			}
#endif			
			[self setController:wc];
			[self setNavController:nc];
			BOOL animated = args!=nil && [args isKindOfClass:[NSDictionary class]] ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;
			[self setupWindowDecorations];
			
			if (rootViewAttached==NO)
			{
				//TEMP hack until we can figure out split view issue
				RELEASE_TO_NIL(tempController);
				tempController = [[UIViewController alloc]init];
				UIWindow *w = [self _window];
				[w addSubview:tempController.view];
				[tempController presentModalViewController:wc animated:YES];
				attached = YES;
			}
			else
			{
				if (nc!=nil)
				{
					[[TiApp app] showModalController:nc animated:animated];
				}
				else 
				{
					[[TiApp app] showModalController:wc animated:animated];
				}
			}
		}
		if (animation==nil)
		{
			[self windowDidOpen];
		}
	}
}

// We can't open properly in nav views since they handle all of the view
// goofiness, and need to perform the prepatory steps that open: usually does.
-(void)prepareForNavView:(UINavigationController*)navController_
{
	ENSURE_UI_THREAD(prepareForNavView, navController_);
	
	if (opened) {
		return;
	}
	
	if (!opening) {
		opening = YES;
	}
	
	self.navController = navController_;
	navWindow = YES;
	[self view];
	if ([self _handleOpen:nil])
	{
		[self windowReady];
	}
}

-(void)removeTempController:(id)sender
{
	//TEMP hack until split view is fixed
	[tempController.view removeFromSuperview];
	[[[[TiApp app] controller] view] removeFromSuperview];
	RELEASE_TO_NIL(tempController);
}

-(void)close:(id)args
{
	ENSURE_UI_THREAD(close,args);
	
	// closing more than once does nothing
	if (opened==NO)
	{
		return;
	}
	 
	if ([self _isChildOfTab]) 
	{
		if (![args isKindOfClass:[NSArray class]] ||
			([args isKindOfClass:[NSArray class]] &&
			 [args count] > 0 && 
			 ![TiUtils boolValue:@"closeByTab" properties:[args objectAtIndex:0] def:NO]))
		{
			NSMutableArray* closeArgs = [NSMutableArray arrayWithObject:self];
			if (args != nil) {
				[closeArgs addObject:[args objectAtIndex:0]];
			}
			[[self tab] close:closeArgs];
			return;
		}
	}

	VerboseLog(@"%@ (modal:%d)%@",self,modalFlag,CODELOCATION);
	[self windowWillClose];

	//TEMP hack until we can figure out split view issue
	if (tempController!=nil)
	{
		BOOL animated = args!=nil && [args isKindOfClass:[NSDictionary class]] ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;
		[tempController dismissModalViewControllerAnimated:animated];
		if (animated==NO)
		{
			[tempController.view removeFromSuperview];
			RELEASE_TO_NIL(tempController);
		}
		else 
		{
			[self performSelector:@selector(removeTempController:) withObject:nil afterDelay:0.3];
		}
		return;
	}
	else
	{
		UIViewController *vc = [self controller];
		
		[[[TiApp app] controller] windowClosed:vc];

		if (modalFlag)
		{
			BOOL animated = args!=nil && [args isKindOfClass:[NSDictionary class]] ? [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;
			[[TiApp app] hideModalController:vc animated:animated];
			if (animated)
			{
				// if animated, we don't want to immediately remove our view but instead need
				// to wait until the modal dialog is dismissed before we remove our view 
				// otherwise, you'll see the view popup as the window is lowering
				modalFlag = NO;
				[self performSelector:@selector(close:) withObject:nil afterDelay:0.3];
				return;
			}
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
	
	[[[TiApp app] controller] willHideViewController:controller animated:YES];
	VerboseLog(@"%@ (modal:%d)%@",self,modalFlag,CODELOCATION);
	if ([self _handleClose:args])
	{
		TiAnimation *animation = [self _isChildOfTab] ? nil : [TiAnimation animationFromArg:args context:[self pageContext] create:NO];
		
		if (animation!=nil)
		{
			if ([animation isTransitionAnimation])
			{
				UIView *rootView = [[TiApp app] controller].view;
				transitionAnimation = [[animation transition] intValue];
				splashTransitionAnimation = [[rootView subviews] count]<=1 && modalFlag==NO;
				if (splashTransitionAnimation)
				{
					[[TiApp app] attachSplash];
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
		  
		if (fullscreenFlag)
		{
			[[UIApplication sharedApplication] setStatusBarHidden:restoreFullscreen];
			self.view.frame = [[[TiApp app] controller] resizeView];
		} 
 
		if (animation!=nil)
		{
			[self performSelector:@selector(windowClosed) withObject:nil afterDelay:0.8];
		}
		else 
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
	
	UIView *rootView = [[TiApp app] controller].view;
	
	TiUIView *view = [self view];
	
	if (![self _isChildOfTab])
	{
		//TEMP hack for splitview until we can get things worked out
		if (rootView.superview==nil && tempController==nil)
		{
			tempController = [[UIViewController alloc] init];
			tempController.view = rootView;
			[[self _window] addSubview:rootView];
		}
		[rootView addSubview:view];
		
		[self controller];

		[(TiRootViewController *)[[TiApp app] controller] openWindow:self withObject:nil];
		[[[TiApp app] controller] windowFocused:[self controller]];
	}

	[self layoutChildren:YES];

	[rootView bringSubviewToFront:view];

	// make sure the splash is gone
	[[TiApp app] hideSplash:nil];
}

-(NSNumber*)focused
{
	return NUMBOOL(focused);
}

-(void)fireFocus:(BOOL)newFocused;
{
#ifdef VERBOSE
	if (newFocused == focused)
	{
		VerboseLog(@"[DEBUG] Setting focus to %d when it's already set to that.",focused);
	}
#endif

	[self fireEvent:newFocused?@"focus":@"blur" withObject:nil propagate:NO];
	focused = newFocused;
}

#pragma mark Animation Delegates

- (void)viewDidAppear:(BOOL)animated;    // Called when the view is about to made visible. Default does nothing
{
	[[self parentOrientationController]
			childOrientationControllerChangedFlags:self];
}



-(BOOL)animationShouldTransition:(id)sender
{
	UIView *rootView = [[TiApp app] controller].view;
	[UIView setAnimationTransition:transitionAnimation
						   forView:rootView
							 cache:NO];
	
	if (opening)
	{
		if (splashTransitionAnimation)
		{
			splashTransitionAnimation=NO;
			UIView *splashView = [[TiApp app] splash];
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
			if ([[TiApp app] isSplashVisible])
			{
				[[TiApp app] splash].alpha = 0;
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
		[self windowDidOpen];
	}
	else if (closing)
	{
		[self windowClosed];
		[closeView autorelease];
		closeView=nil;
	}
}


- (UIViewController *)childViewController
{
	return nil;
}


-(void)setOrientationModes:(id)value
{
	[self replaceValue:value forKey:@"orientationModes" notification:YES];
	
	TiOrientationFlags newFlags = TiOrientationFlagsFromObject(value);
	if (newFlags == orientationFlags)
	{
		return;
	}
	orientationFlags = newFlags;
	[parentOrientationController performSelectorOnMainThread:@selector(childOrientationControllerChangedFlags:) withObject:self waitUntilDone:NO];
}


@synthesize parentOrientationController, orientationFlags;
-(void)childOrientationControllerChangedFlags:(id <TiOrientationController>)orientationController
{
	WARN_IF_BACKGROUND_THREAD;
	[parentOrientationController childOrientationControllerChangedFlags:self];
}

@end
