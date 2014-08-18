/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSLocalNotificationProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSLocalNotificationProxy

@synthesize notification = _notification;

-(void)dealloc
{
	RELEASE_TO_NIL(_notification);
	[super dealloc];
}

-(NSString*)apiName
{
    return @"Ti.App.iOS.LocalNotification";
}

-(void)cancel:(id)args
{
	UILocalNotification * cancelledNotification = [self.notification retain];
	TiThreadPerformOnMainThread(^{[[UIApplication sharedApplication] cancelLocalNotification:cancelledNotification];
		[cancelledNotification release];}, NO);
}

@end

#endif
