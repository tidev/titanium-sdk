/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS
#import "TiAppiOSLocalNotificationProxy.h"
#import "TiUtils.h"

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

-(void)cancel:(id)unused
{
    DEPRECATED_REPLACED(@"App.iOS.LocalNotification.cancel", @"6.1.0", @"App.iOS.NotificationCenter.removePendingNotificationsWithIdentifiers");
    
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        DebugLog(@"[ERROR] Please use Ti.App.iOS.NotificationCenter.requestUserNotificationSettings in iOS 10 and later to request user notification settings asynchronously.");
        return;
#endif
    } else {
        UILocalNotification * cancelledNotification = [self.notification retain];
        TiThreadPerformOnMainThread(^{
            [[UIApplication sharedApplication] cancelLocalNotification:cancelledNotification];
            [cancelledNotification release];
        }, NO);
    }
}

@end

#endif
