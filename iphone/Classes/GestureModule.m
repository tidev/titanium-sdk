/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_GESTURE

#import "GestureModule.h"


@implementation GestureModule

#pragma mark Internal

-(void)shakeEvent:(NSNotification*)sender
{
	UIEvent *evt = [sender object];
	// since we get multiple motion end events we need to detect the first one and then ignore the subsequent 
	// ones during the same shake motion
	if (evt.timestamp == 0 || evt.timestamp - lastShakeTime < 1)
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:NUMDOUBLE(evt.timestamp) forKey:@"timestamp"];
		[self fireEvent:@"shake" withObject:event];
	}
	lastShakeTime = evt.timestamp;
}

-(void)rotateEvent:(NSNotification*)sender
{
	UIDeviceOrientation orientation = [UIDevice currentDevice].orientation;
	NSDictionary *event = [NSDictionary dictionaryWithObject:NUMINT(orientation) forKey:@"orientation"];
	[self fireEvent:@"orientationchange" withObject:event];
}

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	if (count == 1 && [type isEqualToString:@"shake"])
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shakeEvent:) name:kTiGestureShakeNotification object:nil];
	}
	else if (count == 1 && [type isEqualToString:@"orientationchange"])
	{
		[[UIDevice currentDevice] beginGeneratingDeviceOrientationNotifications];
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[NSNotificationCenter defaultCenter] addObserver:self
												 selector:@selector(rotateEvent:)
													 name:UIDeviceOrientationDidChangeNotification object:nil];
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	if (count == 0 && [type isEqualToString:@"shake"])
	{
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiGestureShakeNotification object:nil];
	}
	else if (count == 0 && [type isEqualToString:@"orientationchange"])
	{
		// don't stop device orientation against current device since that's used by Platform module too
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
		[[NSNotificationCenter defaultCenter] removeObserver:self name:UIDeviceOrientationDidChangeNotification object:nil];
	}
}

MAKE_SYSTEM_PROP(PORTRAIT,UIDeviceOrientationPortrait);
MAKE_SYSTEM_PROP(LANDSCAPE_LEFT,UIDeviceOrientationLandscapeLeft);
MAKE_SYSTEM_PROP(LANDSCAPE_RIGHT,UIDeviceOrientationLandscapeRight);
MAKE_SYSTEM_PROP(UPSIDE_PORTRAIT,UIDeviceOrientationPortraitUpsideDown);
MAKE_SYSTEM_PROP(UNKNOWN,UIDeviceOrientationUnknown);
MAKE_SYSTEM_PROP(FACE_UP,UIDeviceOrientationFaceUp);
MAKE_SYSTEM_PROP(FACE_DOWN,UIDeviceOrientationFaceDown);

-(NSNumber*)isLandscape:(id)args
{
	return NUMBOOL([TiUtils isOrientationLandscape]);
}

-(NSNumber*)isPortrait:(id)args
{
	return NUMBOOL([TiUtils isOrientationPortait]);
}

-(NSNumber*)orientation
{
	UIDeviceOrientation orientation = [UIDevice currentDevice].orientation;
	return NUMINT(orientation);
}


@end

#endif