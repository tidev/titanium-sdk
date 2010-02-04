/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <QuartzCore/QuartzCore.h>
#import "TiUIDialogProxy.h"
#import "TitaniumApp.h"
#import "TiUtils.h"
#import "Webcolor.h"

@implementation TiUIDialogProxy

-(void)dealloc
{
	RELEASE_TO_NIL(mask);
	[super dealloc];
}

-(BOOL)_handleOpen:(id)args
{
	RELEASE_TO_NIL(mask);
	
	//FIXME FIXME
	
	return NO;

	/*
	id props = [args count] > 0 ? [args objectAtIndex:0] : nil;
	TiAnimation *animation = [TiAnimation animationFromArg:args context:[self pageContext] create:NO];
	
	// dialogs by default are modeless
	BOOL modal = [TiUtils boolValue:@"modal" properties:props def:NO];

	// dialogs need to go at the root level so they can be positioned anywhere you want on the main screen
	UIWindow *window_ = [[TitaniumApp app] window];
	
	// if modal, we automatically we add a modal mask in front of the current window subviews that by 
	// default will show through transparently. the developer can pass in a mask object with the open
	// to customize the look-n-feel of the mask backgroundColor and opacity
	if (modal)
	{
		mask = [[UIView alloc] initWithFrame:[window_ frame]];
		mask.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
		id maskProperties = props!=nil ? [props objectForKey:@"mask"] : nil;
		mask.backgroundColor = [[TiUtils colorValue:@"backgroundColor" properties:maskProperties def:[TiUtils colorValue:@"111"]] _color];
		mask.alpha = [TiUtils floatValue:@"opacity" properties:maskProperties def:0.7];
		[mask addSubview:[self _view]];
		[window_ insertSubview:mask atIndex:0];
		mask.layer.zPosition = INT_MAX;
		[self _insertIntoView:mask bounds:[window_ bounds]];
		[window_ bringSubviewToFront:mask];
	}
	else 
	{
		// this is a modeless dialog, just put it in the window
		[self _insertIntoView:window_ bounds:[window_ bounds]];
		[window_ bringSubviewToFront:[self _view]];
	}

	// load dialogs from a URL possibly
	if (url!=nil)
	{
		if ([url isFileURL] && [[[url absoluteString] lastPathComponent] hasSuffix:@".js"])
		{
			// check for nil since this can recurse
			if (context==nil)
			{
				//TODO: add activity indicator until booted
				//TODO: need to also set currentWindow
				NSDictionary *preload = [NSDictionary dictionaryWithObjectsAndKeys:self, @"currentDialog", nil];
				context = [[KrollBridge alloc] initWithHost:[self _host]];
				[context boot:self url:url preload:preload];
			}
		}
		else
		{
			[self throwException:@"dialogs can only load JavaScript URLs" subreason:nil location:CODELOCATION];
		}
	}	
	
	// dialogs can be opened with animation as well
	if (animation!=nil)
	{
		[animation animate:self];
	}
	
	closed = NO;
	 */
}

-(BOOL)_handleClose:(id)args
{
	//FIXME
	
	return YES;
	
	/*
	BOOL animate = NO;

	TiAnimation *animation = [TiAnimation animationFromArg:args context:[self pageContext] create:NO];
	if (animation!=nil)
	{
		[animation setDelegate:self selector:@selector(_destroy) withObject:nil];
		[animation animate:self];
		animate = YES;
	}
	
	if (animate==NO)
	{
		[self _destroy];
	}*/
}

@end
