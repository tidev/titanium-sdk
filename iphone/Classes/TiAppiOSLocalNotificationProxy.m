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

@synthesize notification;

-(void)dealloc
{
	[self cancel:nil];
	RELEASE_TO_NIL(notification);
	[super dealloc];
}

-(void)cancel:(id)args
{
	[[UIApplication sharedApplication] performSelectorOnMainThread:@selector(cancelLocalNotification:) withObject:notification waitUntilDone:NO];
}

@end

#endif
