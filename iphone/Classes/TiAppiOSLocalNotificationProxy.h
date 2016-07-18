/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS
#import "TiProxy.h"
#if IS_XCODE_8
#import <UserNotifications/UserNotifications.h>
#endif

@interface TiAppiOSLocalNotificationProxy : TiProxy {
@private
#if IS_XCODE_8
    UNMutableNotificationContent *_notification;
#else
	UILocalNotification *_notification;
#endif

}

#if IS_XCODE_8
@property(nonatomic,retain) UNMutableNotificationContent *notification;
#else
@property(nonatomic,retain) UILocalNotification *notification;
#endif

-(void)cancel:(id)args;

@end


#endif
