/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

#import "PlatformModuleDisplayCapsProxy.h"
#import "TiUtils.h"

@implementation PlatformModuleDisplayCapsProxy



// NOTE: device capabilities currently are hardcoded for iPad, while high/low
// display density is now detected for iPhone / iPod Touch under iOS 4.

- (id)density
{
	if ([TiUtils isIPad])
	{
		return @"high";
	}
	else if ([TiUtils isRetinaDisplay])
	{
		return @"high";
	}
	else
	{
		return @"low";
	}
}

- (id)dpi
{
	if ([TiUtils isIPad])
	{
		return [NSNumber numberWithInt:130];
	}
	else if ([TiUtils isRetinaDisplay])
	{
		return [NSNumber numberWithInt:320];
	}
	else
	{
		return [NSNumber numberWithInt:160];
	}
}

- (BOOL)isDevicePortrait
{
	UIDeviceOrientation orientation = [UIDevice currentDevice].orientation;
	return  (orientation == UIDeviceOrientationPortrait || 
			 orientation == UIDeviceOrientationPortraitUpsideDown || 
			 orientation == UIDeviceOrientationUnknown);
}

-(BOOL)isUIPortrait
{
	UIInterfaceOrientation orientation = [[UIApplication sharedApplication] statusBarOrientation];
	return  UIInterfaceOrientationIsPortrait(orientation);
}


- (NSNumber*) platformWidth
{
	if ([self isUIPortrait])
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.width];	
	}
	else
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.height];	
	}
}

- (NSNumber*) platformHeight
{
	if ([self isUIPortrait] == NO)
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.width];	
	}
	else
	{
		return [NSNumber numberWithFloat:[[UIScreen mainScreen] bounds].size.height];	
	}
}

@end

#endif