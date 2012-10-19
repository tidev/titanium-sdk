/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2012 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiWindowProxy.h"
#import "TiApp.h"
#import "TiUtils.h"
#import "TiAnimation.h"
#import "TiAction.h"
#import "TiErrorController.h"

TiOrientationFlags TiOrientationFlagsFromObject(id args)
{
	if (![args isKindOfClass:[NSArray class]])
	{
		return TiOrientationNone;
	}

	TiOrientationFlags result = TiOrientationNone;
	for (id mode in args)
	{
		UIInterfaceOrientation orientation = (UIInterfaceOrientation)[TiUtils orientationValue:mode def:-1];
		switch (orientation)
		{
			case UIDeviceOrientationPortrait:
			case UIDeviceOrientationPortraitUpsideDown:
			case UIDeviceOrientationLandscapeLeft:
			case UIDeviceOrientationLandscapeRight:
				TI_ORIENTATION_SET(result,orientation);
				break;
			case UIDeviceOrientationUnknown:
				DebugLog(@"[WARN] Ti.Gesture.UNKNOWN / Ti.UI.UNKNOWN is an invalid orientation mode.");
				break;
			case UIDeviceOrientationFaceDown:
				DebugLog(@"[WARN] Ti.Gesture.FACE_DOWN / Ti.UI.FACE_DOWN is an invalid orientation mode.");
				break;
			case UIDeviceOrientationFaceUp:
				DebugLog(@"[WARN] Ti.Gesture.FACE_UP / Ti.UI.FACE_UP is an invalid orientation mode.");
				break;
			default:
				DebugLog(@"[WARN] An invalid orientation was requested. Ignoring.");
				break;
		}
	}
	return result;
}

@interface TiWindowProxy(Private)
-(void)openOnUIThread:(NSArray*)args;
-(void)closeOnUIThread:(NSArray*)args;
@end

@implementation TiWindowProxy
@synthesize navController, controller, opening;

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration
{
    NSArray* childProxies = [self children];
	for (TiViewProxy * thisProxy in childProxies)
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

-(void)releaseController
{
	[(TiViewController *)controller setProxy:nil];
	TiThreadReleaseOnMainThread(controller, NO);
	controller = nil;
}

-(void)replaceController
{
	if (controller != nil) {
		[self releaseController];
		[self controller];
	}
}

-(void) dealloc {
    
	RELEASE_TO_NIL(navController);
	[self releaseController];
	
	[super dealloc];
}

-(void)_destroy
{
	[self releaseController];

    [tab release];
    [closeView release];
    [animatedOver release];
    [openAnimation release];
    [closeAnimation release];
	
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


-(NSNumber *) opened{
    return [NSNumber numberWithBool:opened];
}

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
	
	[self forgetProxy:openAnimation];
	RELEASE_TO_NIL(openAnimation);

    if (opening) {
        opening = NO;
        if ([self _hasListeners:@"open"])
        {
            [self fireEvent:@"open" withObject:nil];
        }
    }
	
	// we do it here in case we have a window that
	// neither has tabs nor JS
	if (focused==NO && [self handleFocusEvents])
	{
		[self fireFocus:YES];
	}
    
    if (animatedOver != nil) {
        UIView* rootView = [[[TiApp app] controller] view];
        [rootView insertSubview:animatedOver belowSubview:[self view]];
        if ([animatedOver isKindOfClass:[TiUIView class]]) {
            TiUIView* tiview = (TiUIView*)animatedOver;
            LayoutConstraint* layoutProps = [(TiViewProxy*)[tiview proxy] layoutProperties];
            ApplyConstraintToViewWithBounds(layoutProps, tiview, rootView.bounds);
        }
        RELEASE_TO_NIL(animatedOver);
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
	if ([self _hasListeners:@"close"])
	{
		[self fireEvent:@"close" withObject:nil];
	}

	[self forgetProxy:closeAnimation];
	RELEASE_TO_NIL(closeAnimation);
	opened = NO;
	attached = NO;
	opening = NO;
	closing = NO;
	
	//TODO: Since windowDidClose also calls detachView, is this necessary?
	[self detachView];
	// notify our child that his window is closing
    NSArray* childProxies = [self children];
	for (TiViewProxy *child in childProxies)
	{
		[child windowDidClose];
	}
	
	RELEASE_TO_NIL(navController);
	[self releaseController];
	
	[self windowDidClose];
	[self forgetSelf];
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
    if (![self opening]) {
        focused = YES;
    }
	[self willShow];
	if (!navWindow) {
		[[[TiApp app] controller] windowFocused:[self controller]];
	}
}

-(void)_tabBlur
{
	[self willHide];
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
	[self releaseController];
	RELEASE_TO_NIL(navController);
	RELEASE_TO_NIL(tab);
	
	if (tab_!=nil)
	{
		navController = [navbar_ retain];
		controller = [controller_ retain];
		[(TiViewController *)controller setProxy:self];
		tab = (TiViewProxy<TiTab>*)[tab_ retain];
		
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

-(BOOL)modalFlagValue
{
    return modalFlag;
}
-(BOOL)isFullscreen:(id)args
{
	return [self argOrWindowProperty:@"fullscreen" args:args];
}

-(BOOL)isRootViewAttached
{
	BOOL result = ([[[[TiApp app] controller] view] superview]!=nil);
	return result;
}

-(void)open:(id)args
{
	if ([[[[TiApp app] controller] modalViewController] isKindOfClass:[TiErrorController class]]) { // we have an error dialog up
		return;
	}
	// opening a window more than once does nothing
	if (opened==YES)
	{
		return;
	}

	[self rememberSelf];
	
	//First, we need to get our arguments in order. Perhaps in Opening.

	if (opening==NO)
	{
		modalFlag = [self isModal:args];
		fullscreenFlag = [self isFullscreen:args];
		if (!modalFlag)
		{
			[self forgetProxy:openAnimation];
			RELEASE_TO_NIL(openAnimation);
			openAnimation = [[TiAnimation animationFromArg:args context:[self pageContext] create:NO] retain];
			[self rememberProxy:openAnimation];
		}
		opening = YES;
	}
    TiThreadPerformOnMainThread(^{
        [self openOnUIThread:args];
    }, YES);
}

-(void)openOnUIThread:(NSArray*)args
{
	navWindow = NO;
	BOOL rootViewAttached = [self isRootViewAttached];
	[self parentWillShow];
	// give it to our subclass. he'll either return true to continue with open state and animation or 
	// false to delay for some other action
	if ([self _handleOpen:args])
	{
		// ensure on open that we've created our view before we start to use it
		[self view];
		[self windowWillOpen];
		[self windowReady];
		//This flag will track if window was opened with an animation to resolve the edge case 
		//that the animation completes before the method ends. TIMOB-8030
		BOOL hasAnimation = NO;
		if (openAnimation!=nil)
		{
			if (rootViewAttached)
			{
				[self attachViewToTopLevelWindow];
			}
			if ([openAnimation isTransitionAnimation])
			{
				transitionAnimation = [[openAnimation transition] intValue];
				startingTransitionAnimation = [[TiApp controller] defaultImageView] != nil;
			}
			openAnimation.delegate = self;
			[openAnimation animate:self];
			hasAnimation = YES;
		}
		if (fullscreenFlag)
		{
			restoreFullscreen = [UIApplication sharedApplication].statusBarHidden;
			[[UIApplication sharedApplication] setStatusBarHidden:YES];
			[self view].frame = [[[TiApp app] controller] resizeView];
		}
		if (modalFlag)
		{
			modalFlag = YES;
			attached = YES;
			TiViewController *wc = (TiViewController*)[self controller];

			UINavigationController *nc = [[[UINavigationController alloc] initWithRootViewController:wc] autorelease];

			BOOL navBarHidden = [self argOrWindowProperty:@"navBarHidden" args:args];
			[nc setNavigationBarHidden:navBarHidden];

			NSDictionary *dict = [args count] > 0 ? [args objectAtIndex:0] : nil;
			int style = [TiUtils intValue:@"modalTransitionStyle" properties:dict def:-1];
			if (style!=-1)
			{
				[wc setModalTransitionStyle:style];
				[nc setModalTransitionStyle:style];
			}
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

//			[self setController:wc];
			[self setNavController:nc];
			BOOL animated = [TiUtils boolValue:@"animated" properties:dict def:YES];
			[self setupWindowDecorations];

			//showModalController will show the passed-in controller's navigation controller if it exists
			[[TiApp app] showModalController:nc animated:animated];
		}
		if (hasAnimation == NO)
		{
			[self windowDidOpen];
		}
	}
}

// We can't open properly in nav views since they handle all of the view
// goofiness, and need to perform the prepatory steps that open: usually does.
-(void)prepareForNavView:(UINavigationController*)navController_
{
	ENSURE_UI_THREAD_1_ARG(navController_)
	
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

-(void)removeTempController
{
	//TEMP hack until split view is fixed
	[tempController.view removeFromSuperview];
    [[self view] removeFromSuperview];
	RELEASE_TO_NIL(tempController);
}

-(void)close:(id)args
{
    // There's the following very odd case we need to handle:
    // * Context A is opening a window for Context B
    // * Context B, in its JS evaluation, fires an event which
    //   is caught by the window's event listener in Context A - and requests
    //   that the window close
    // 
    // Note that the JS evaluation doesn't occur until -[TiWindowProxy openOnUIThread:]
    // is called, so it's safe to queue on the main thread and block until
    // completion. This also doesn't guarantee the window isn't (briefly) displayed,
    // because in between the open and close there may be a rendering pass (depends
    // entirely on the instruction being executed in -[TiWindowProxy openOnUIThread:]
    // when this is called).
    
    if (opening) {
        TiThreadPerformOnMainThread(^{
            opening = NO; // Preemptively clear 'opening' so we don't hit this block again
            [self close:args];
        }, YES);
        return;
    }
    
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
			[self forgetProxy:closeAnimation];
			RELEASE_TO_NIL(closeAnimation);
			[[self tab] close:closeArgs];
			return;
		}
	}
	else if(![NSThread isMainThread])
	{
		[self forgetProxy:closeAnimation];
		RELEASE_TO_NIL(closeAnimation);
		closeAnimation = [[TiAnimation animationFromArg:args context:[self executionContext] create:NO] retain];
		[self rememberProxy:closeAnimation];
	}

    TiThreadPerformOnMainThread(^{
        [self closeOnUIThread:args];
    }, YES);
}

-(BOOL)restoreFullScreen
{
    if (fullscreenFlag && !restoreFullscreen)
    {
        [[UIApplication sharedApplication] setStatusBarHidden:restoreFullscreen withAnimation:UIStatusBarAnimationNone];
        [[[TiApp app] controller] resizeViewForStatusBarHidden];
        return YES;
    } 
    return NO;
}

-(void)closeOnUIThread:(id)args
{
	[self windowWillClose];

	//TEMP hack until we can figure out split view issue
    // appears to be a dead code
	if ((tempController != nil) && modalFlag) {
        BOOL animated = (args!=nil && [args isKindOfClass:[NSDictionary class]]) ? 
            [TiUtils boolValue:@"animated" properties:[args objectAtIndex:0] def:YES] : YES;

        [tempController dismissModalViewControllerAnimated:animated];

        if (!animated) {
            [self removeTempController];
        }
        else {
            [self performSelector:@selector(removeTempController) withObject:nil afterDelay:0.3];
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
	UIView *myview = nil;
	if([self viewAttached]) {
		myview = [self view];
	}
	// hold ourself during close
	[myview retain];	
	[self retain];

	[[[TiApp app] controller] willHideViewController:controller animated:YES];
	VerboseLog(@"%@ (modal:%d)%@",self,modalFlag,CODELOCATION);
	if ([self _handleClose:args])
	{
		if (closeAnimation!=nil)
		{
			if ([closeAnimation isTransitionAnimation])
			{
				UIView *rootView = [[TiApp app] controller].view;
				transitionAnimation = [[closeAnimation transition] intValue];
				startingTransitionAnimation = [[rootView subviews] count]<=1 && modalFlag==NO;
			}
            
			closeAnimation.delegate = self;
			// we need to hold a reference during close
			closeView = [myview retain];
			[closeAnimation animate:self];
		}
		  
		if (fullscreenFlag && !restoreFullscreen)
		{
			[[UIApplication sharedApplication] setStatusBarHidden:restoreFullscreen withAnimation:UIStatusBarAnimationNone];
			self.view.frame = [[[TiApp app] controller] resizeViewForStatusBarHidden];
		} 
 
		if (closeAnimation!=nil)
		{
			[self performSelector:@selector(windowClosed) withObject:nil afterDelay:0.8];
		}
		else 
		{
			[self windowClosed];
		}
	}
	[myview release];
    if (tempController != nil) {
        [self removeTempController];
    }
	[self release];
}

-(void)attachViewToTopLevelWindow
{
    if (attached) {
        return;
    }
    attached = YES;
	
    /*
     If opening a regular window on top of a modal window
     it must be attached to the modal window superview and not 
     the root controller view
     */
    UIView *rootView = nil;
    TiWindowProxy* topWindow = [[TiApp controller] topWindow];
    if ( topWindow != nil) {
        //This will get the nav controller view for modal top windows
        //and the rootView for regular top windows
        rootView = [[topWindow view] superview];
    }
    if (rootView == nil) {
        rootView = [[TiApp app] controller].view;
    }

    TiUIView *view_ = [self view];
	
    /*
     A modal window is by definition presented and should never be a subview of anything.
     */
    if (![self _isChildOfTab]) {
        if (!modalFlag) {
            [rootView addSubview:view_];
        }

        [self controller];

        [(TiRootViewController *)[[TiApp app] controller] openWindow:self withObject:nil];
        [[[TiApp app] controller] windowFocused:[self controller]];
    }

    if (!modalFlag) {
        [rootView bringSubviewToFront:view_];
    }

    // make sure the splash is gone
    [[TiApp controller] dismissDefaultImageView];
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
    focused = newFocused;
    [self fireEvent:newFocused?@"focus":@"blur" withObject:nil propagate:NO];
}

#pragma mark TIUIViewController methods
/*
 *	Over time, we should move focus and blurs to be triggered by standard
 *	Cocoa conventions instead of second-guessing iOS. This will be a slow
 *	transition, and in the meantime, verbose debug statements of focus being
 *	already set/cleared should not be a need for panic.
 */

- (void)viewDidAppear:(BOOL)animated
{
	[[self parentOrientationController]
			childOrientationControllerChangedFlags:self];
    
	if (!focused)
	{
        //Do not fire focus until context is ready
        if (![self opening]) {
            [self fireFocus:YES];
        }
	}
	else
	{
		DeveloperLog(@"[DEBUG] Focused was already set while in viewDidAppear.");
	}
    
    //Propagate this state to children
    [self parentDidAppear:[NSNumber numberWithBool:animated]];
}

-(void)viewWillDisappear:(BOOL)animated
{
	if (focused)
	{
		[self fireFocus:NO];
	}
	else
	{
		DeveloperLog(@"[DEBUG] Focused was already cleared while in viewWillDisappear.");
	}
    //Propagate this state to children
    [self parentWillDisappear:[NSNumber numberWithBool:animated]];
}

-(void)viewWillAppear:(BOOL)animated
{
	[self parentWillShow];
	TiThreadProcessPendingMainThreadBlocks(0.1, YES, nil);
    //Propagate this state to children
    [self parentWillAppear:[NSNumber numberWithBool:animated]];
}

- (void)viewDidDisappear:(BOOL)animated
{
	[self parentWillHide];
    //Propagate this state to children
    [self parentDidDisappear:[NSNumber numberWithBool:animated]];
}

#pragma mark Animation Delegates

-(BOOL)animationShouldTransition:(id)sender
{
	UIView *rootView = [[TiApp app] controller].view;
    
    void (^animation)(void) = ^{
        if (opening)
        {
            if (startingTransitionAnimation)
            {
                startingTransitionAnimation=NO;
                [[TiApp controller] dismissDefaultImageView];
            }
            else
            {
                RELEASE_TO_NIL(animatedOver);
                NSArray* subviews = [rootView subviews];
                if ([subviews count] > 0) {
                    // We should be attached to the top level view at this point (the window is "ready") so
                    // this is OK to do.
                    NSUInteger index = [subviews indexOfObject:[self view]];
                    if (index != NSNotFound && index != 0) {
                        animatedOver = [[subviews objectAtIndex:index-1] retain];
                        [animatedOver removeFromSuperview];
                    }
                }
            }
            [self attachViewToTopLevelWindow];
        }
        else 
        {
            [self detachView];
        }
    };
    
    [UIView transitionWithView:rootView
                      duration:[(TiAnimation*)sender animationDuration]
                       options:transitionAnimation
                    animations:animation
                    completion:^(BOOL finished) {
                        [sender animationCompleted:[NSString stringWithFormat:@"%X",(void *)rootView] 
                                          finished:[NSNumber numberWithBool:finished] 
                                           context:sender];
                    }
     ];
    
	return NO;
}

-(void)animationWillStart:(id)sender
{
//	[self rememberProxy:sender];
	if (opening)
	{
		if (startingTransitionAnimation==NO)
		{
			[[[TiApp controller] defaultImageView] setAlpha:0.0];
			[self attachViewToTopLevelWindow];
		}
	}
	else
	{
		if (startingTransitionAnimation)
		{
			[self detachView];
		}
	}
}

-(void)animationDidComplete:(id)sender
{
//	[self forgetProxy:sender];
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
	TiThreadPerformOnMainThread(^{[parentOrientationController childOrientationControllerChangedFlags:self];}, NO);
}


-(NSNumber*)orientation
{
	return NUMINT([UIApplication sharedApplication].statusBarOrientation);
}


@synthesize parentOrientationController, orientationFlags;
-(void)childOrientationControllerChangedFlags:(id <TiOrientationController>)orientationController
{
	WARN_IF_BACKGROUND_THREAD;
	[parentOrientationController childOrientationControllerChangedFlags:self];
}

@end
