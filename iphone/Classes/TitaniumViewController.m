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

-(void)dealloc
{
	RELEASE_TO_NIL(stack);
	[super dealloc];
}

-(CGRect)resizeView
{
	CGRect rect = [[UIScreen mainScreen] applicationFrame];
	[TiUtils setView:[self view] positionRect:rect];
	return rect;
}

-(void)loadView
{
	TitaniumRootView *rootView = [[TitaniumRootView alloc] init];
	[rootView setAutoresizingMask:UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight];
	self.view = rootView;
	rootView.backgroundColor = [UIColor blackColor];
	[self resizeView];
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

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation 
{
	// NOTE: this compensates for the programmatic UI.orientation by developer
	if (interfaceOrientation == [UIApplication sharedApplication].statusBarOrientation)
	{
		return YES;
	}
	
	// otherwise, we need to check the current window and make sure he supports to
	// requested orientation
	if (stack!=nil && [stack count]>0)
	{
		TiProxy *window = nil;
		
		for (size_t c = [stack count]-1; c>=0; c--)
		{
			TiViewProxy *w = [stack objectAtIndex:c];
			if ([w isKindOfClass:[TiWindowProxy class]])
			{
				//TODO: note, for small windows or other windows, how can we tell if this window
				//is the appropriate one to handle the orientationMode? we can have layers, etc.
				//for now we depend on focus and not hidden
				
				if ([w viewAttached] && [w view].hidden==NO && [TiUtils boolValue:((TiWindowProxy*)w).focused])
				{
					window = w;
					break;
				}
			}
		}
		
		if (window!=nil)
		{
			NSArray *array = [window valueForUndefinedKey:@"orientationModes"];
			if (array!=nil && (id)array!=[NSNull null] && [array count] > 0)
			{
				for (id mode in array)
				{
					UIInterfaceOrientation orientation = [TiUtils orientationValue:mode def:-1];
					if (orientation == interfaceOrientation)
					{
						return YES;
					}
				}
			}
		}
	}

	
	// otherwise, we only support portrait as default orientation
	return interfaceOrientation == UIInterfaceOrientationPortrait;
}


-(void)windowFocused:(TiProxy*)window_
{
	if ([window_ isKindOfClass:[TiWindowProxy class]])
	{
		if ([(TiWindowProxy*)window_ tab]!=nil)
		{
			currentWindow = (TiWindowProxy*)window_;
		}
	}
	
//	// maintain a stack of windows opened in order
//	if (stack==nil)
//	{
//		// don't worry about retaining
//		stack = TiCreateNonRetainingArray();
//	}
//	[stack addObject:window_];
}

-(void)windowUnfocused:(TiProxy*)window_
{
//	if (stack!=nil)
//	{
//		[stack removeObject:window_];
//	}
}

-(void)windowBeforeFocused:(TiProxy*)window_
{

}

-(void)windowBeforeUnfocused:(TiProxy*)window_
{

}

-(UINavigationController*)currentNavController
{
	if (currentWindow!=nil)
	{
		TiProxy<TiTab> *tab = [currentWindow tab];
		if (tab!=nil)
		{
			return [tab controller];
		}
	}
	return nil;
}

@end
