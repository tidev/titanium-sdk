/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_APPIOS

#import "TiProxy.h"
#import "TiApp.h"
#if IS_XCODE_8
#import <UserNotifications/UserNotifications.h>
#endif

@interface TiAppiOSUserNotificationCenterProxy : TiProxy

- (void)getPendingNotifications:(id)args;

- (void)getDeliveredNotifications:(id)args;

- (void)removePendingNotificationsWithIdentifiers:(id)args;

- (void)removeDeliveredNotificationsWithIdentifiers:(id)args;

- (void)removeAllPendingNotifications:(id)unused;

- (void)removeAllDeliveredNotifications:(id)unused;

- (void)requestUserNotificationSettings:(id)args;

@end
#endif