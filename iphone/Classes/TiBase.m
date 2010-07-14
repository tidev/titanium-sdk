/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

NSMutableArray* TiCreateNonRetainingArray() 
{
	CFArrayCallBacks callbacks = kCFTypeArrayCallBacks;
	callbacks.retain = NULL;
	callbacks.release = NULL;
	return (NSMutableArray*)CFArrayCreateMutable(nil, 0, &callbacks);
}

NSMutableDictionary* TiCreateNonRetainingDictionary() 
{
	CFDictionaryKeyCallBacks keyCallbacks = kCFTypeDictionaryKeyCallBacks;
	CFDictionaryValueCallBacks callbacks = kCFTypeDictionaryValueCallBacks;
	callbacks.retain = NULL;
	callbacks.release = NULL;
	return (NSMutableDictionary*)CFDictionaryCreateMutable(nil, 0, &keyCallbacks, &callbacks);
}

CGPoint midpointBetweenPoints(CGPoint a, CGPoint b) 
{
    CGFloat x = (a.x + b.x) / 2.0;
    CGFloat y = (a.y + b.y) / 2.0;
    return CGPointMake(x, y);
}


NSString * const kTiContextShutdownNotification = @"TiContextShutdown";
NSString * const kTiWillShutdownNotification = @"TiWillShutdown";
NSString * const kTiShutdownNotification = @"TiShutdown";
NSString * const kTiSuspendNotification = @"TiSuspend";
NSString * const kTiResumeNotification = @"TiResume";
NSString * const kTiAnalyticsNotification = @"TiAnalytics";
NSString * const kTiRemoteDeviceUUIDNotification = @"TiDeviceUUID";
NSString * const kTiGestureShakeNotification = @"TiGestureShake";
NSString * const kTiRemoteControlNotification = @"TiRemoteControl";



