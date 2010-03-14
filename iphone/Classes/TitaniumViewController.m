/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumViewController.h"
#import "TiUtils.h"
#import "TiViewProxy.h"
#import "TiWindowProxy.h"
#import "TiTab.h" 

@interface TitaniumRootView : UIView
@end

@implementation TitaniumRootView

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
	if (event.type == UIEventTypeMotion && event.subtype == UIEventSubtypeMotionShake) 
	{
        [[NSNotificationCenter defaultCenter] postNotificationName:@"titanium.gesture.shake" object:event];
    }
}

- (BOOL)canBecomeFirstResponder
{ 
	return YES; 
}

@end



@implementation TitaniumViewController
@synthesize backgroundColor, backgroundImage;

-(void)dealloc
{
	RELEASE_TO_NIL(windowProxies);
	[super dealloc];
}

-(CGRect)resizeView
{
	CGRect rect = [[UIScreen mainScreen] applicationFrame];
	[TiUtils setView:[self view] positionRect:rect];
	return rect;
}

-(void)setBackgroundColor:(UIColor *)newColor
{
	if ((newColor == backgroundColor) || [backgroundColor isEqual:newColor])
	{
		return;
	}

	[backgroundColor release];
	backgroundColor = [newColor retain];
	
	[self performSelectorOnMainThread:@selector(updateBackground) withObject:nil
		waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	//The runloopcommonmodes ensures that it'll happen even during tracking.
}

-(void)setBackgroundImage:(UIImage *)newImage
{
	if ((newImage == backgroundImage) || [backgroundImage isEqual:newImage])
	{
		return;
	}

	[backgroundImage release];
	backgroundImage = [newImage retain];
	
	[self performSelectorOnMainThread:@selector(updateBackground) withObject:nil
		waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
	//The runloopcommonmodes ensures that it'll happen even during tracking.
}

-(void)updateBackground
{
	UIView * ourView = [self view];
	UIColor * chosenColor = (backgroundColor==nil)?[UIColor blackColor]:backgroundColor;
	[ourView setBackgroundColor:chosenColor];
	[[ourView superview] setBackgroundColor:chosenColor];
	[[ourView layer] setContents:(id)backgroundImage.CGImage];
}

-(void)loadView
{
	TitaniumRootView *rootView = [[TitaniumRootView alloc] init];
	[rootView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
	self.view = rootView;
	[self updateBackground];
	[self resizeView];
	for (TiWindowProxy * thisWindowProxy in windowProxies)
	{
		TiUIView * thisView = [thisWindowProxy view];
		[rootView addSubview:thisView];
		[thisWindowProxy reposition];
	}

	[rootView release];
}

- (void) viewDidAppear:(BOOL)animated
{
    [self.view becomeFirstResponder];
    [super viewDidAppear:animated];
}

- (void) viewDidDisappear:(BOOL)animated
{
	[self.view resignFirstResponder];
    [super viewDidDisappear:animated];
}

-(void) manuallyRotateToOrientation:(UIInterfaceOrientation)orientation;
{
	UIWindow *win = [[UIApplication sharedApplication] keyWindow];
	[UIView beginAnimations:@"orientation" context:nil];
	[UIView setAnimationDuration:[UIApplication sharedApplication].statusBarOrientationAnimationDuration];
	CGAffineTransform transform = CGAffineTransformIdentity;
	int sign = 1;
	CGRect rect;
	switch (orientation)
	{
		case UIInterfaceOrientationPortraitUpsideDown:
			transform = CGAffineTransformMakeRotation(M_PI); //180 degrees
			//Flow into portrait.
		case UIInterfaceOrientationPortrait:
		{
			rect = CGRectMake(0, 0, 320, 480);
			break;
		}
		case UIInterfaceOrientationLandscapeLeft:
			sign = -1;
			//Flow into landscape.
		case UIInterfaceOrientationLandscapeRight:
		{
			transform = CGAffineTransformMakeRotation( sign * M_PI_2 );
			transform = CGAffineTransformTranslate( transform, sign * 90.0, sign * 90.0 );
			rect = CGRectMake(10, -10, 480, 320);
			break;
		}
	}
	[win setTransform:transform];	
	[TiUtils setView:win positionRect:rect];
	[UIApplication sharedApplication].statusBarOrientation = orientation;	
	[UIView commitAnimations];
	lastOrientation = orientation;
}

-(void)setOrientationModes:(NSArray *)newOrientationModes
{
	for (int i=0; i<MAX_ORIENTATIONS; i++)
	{
		allowedOrientations[i] = NO;
	}

	BOOL noOrientations = YES;

	for (id mode in newOrientationModes)
	{
		UIInterfaceOrientation orientation = [TiUtils orientationValue:mode def:-1];
		switch (orientation)
		{
			case UIDeviceOrientationPortrait:
			case UIDeviceOrientationPortraitUpsideDown:
			case UIDeviceOrientationLandscapeLeft:
			case UIDeviceOrientationLandscapeRight:
				allowedOrientations[orientation] = YES;
				noOrientations = NO;
				break;
			case -1:
				break;
			default:
				NSLog(@"[WARN] An invalid orientation was requested. Ignoring.");
				break;
		}
	}
	
	if (noOrientations)
	{
		allowedOrientations[UIInterfaceOrientationPortrait] = YES;
	}
}

-(void)refreshOrientationModesIfNeeded:(TiWindowProxy *)oldCurrentWindow
{
	if (currentWindow != oldCurrentWindow)
	{
		return;
	}

	[self enforceOrientationModesFromWindow:currentWindow];
}


-(void)enforceOrientationModesFromWindow:(TiWindowProxy *) newCurrentWindow
{
	currentWindow = newCurrentWindow;

	Class arrayClass = [NSArray class];
	Class windowClass = [TiWindowProxy class];
	SEL proxySel = @selector(proxy);

	BOOL noPrefrenceTab = NO;
	
	NSArray * candidateOrientationModes = [newCurrentWindow valueForKey:@"orientationModes"];
	if (![candidateOrientationModes isKindOfClass:arrayClass])
	{
		UINavigationController * navCon = [newCurrentWindow navController];
		NSEnumerator * viewControllerEnum = [[navCon viewControllers] reverseObjectEnumerator];

		noPrefrenceTab = (viewControllerEnum != nil);

		for (UIViewController * thisViewController in viewControllerEnum)
		{
			if (![thisViewController respondsToSelector:proxySel])
			{
				continue;
			}
			TiWindowProxy * thisProxy = (TiWindowProxy *)[(id)thisViewController proxy];
			if (![thisProxy isKindOfClass:windowClass])
			{
				continue;
			}
			candidateOrientationModes = [thisProxy valueForKey:@"orientationModes"];
			if ([candidateOrientationModes isKindOfClass:arrayClass])
			{
				noPrefrenceTab = NO;
				break;
			}
		}
	}

	if ([candidateOrientationModes isKindOfClass:arrayClass])
	{
		[self setOrientationModes:candidateOrientationModes];
	}
	else if(noPrefrenceTab)
	{
		[self setOrientationModes:nil];
	}

	if(allowedOrientations[lastOrientation])
	{
		return; //Nothing to enforce.
	}

	UIInterfaceOrientation requestedOrientation = UIInterfaceOrientationPortrait;
	NSTimeInterval latestRequest = 0.0;
	for (int i=0; i<MAX_ORIENTATIONS; i++)
	{
		if (allowedOrientations[i] && (orientationRequestTimes[i]>latestRequest))
		{
			requestedOrientation = i;
			latestRequest = orientationRequestTimes[i];
		}
	}
	
	[self manuallyRotateToOrientation:requestedOrientation];
}


- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation 
{
	orientationRequestTimes[interfaceOrientation] = [NSDate timeIntervalSinceReferenceDate];

	BOOL result;

	result = allowedOrientations[interfaceOrientation];

	if (result)
	{
		[self manuallyRotateToOrientation:interfaceOrientation];
	}
	
	return interfaceOrientation == [[UIApplication sharedApplication] statusBarOrientation];
}


-(void)windowFocused:(TiProxy*)window_
{
	if (![window_ isKindOfClass:[TiWindowProxy class]])
	{
		return;
	}

	[self enforceOrientationModesFromWindow:(id)window_];
	
	TiWindowProxy * oldTopWindow = [windowProxies lastObject];
	[windowProxies removeObject:window_];
	if ([(TiWindowProxy *)window_ _isChildOfTab] || ([(TiWindowProxy *)window_ parent]!=nil))
	{
		return;
	}
	
	if (windowProxies==nil)
	{
		windowProxies = [[NSMutableArray alloc] initWithObjects:window_,nil];
	}
	else
	{
		[windowProxies addObject:window_];
	}
	
	if (oldTopWindow != window_)
	{
		[oldTopWindow _tabBlur];
	}
	
	
}

-(void)windowClosed:(TiProxy *)window_
{
	BOOL focusChanged = [windowProxies lastObject] == window_;
	[windowProxies removeObject:window_];
	if (!focusChanged)
	{
		return; //Exit early. We're done here.
	}
	
	TiWindowProxy * newTopWindow = [windowProxies lastObject];
	[newTopWindow _tabFocus];
	
}

-(void)windowUnfocused:(TiProxy*)window_
{
}

-(void)windowBeforeFocused:(TiProxy*)window_
{

}

-(void)windowBeforeUnfocused:(TiProxy*)window_
{

}

@end
