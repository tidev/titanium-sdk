/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_APPIOS

#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiProxy.h>

#import <UserNotifications/UserNotifications.h>

@interface TiAppiOSUserNotificationCenterProxy : TiProxy

- (void)getPendingNotifications:(id)args;

- (void)getDeliveredNotifications:(id)args;

- (void)removePendingNotifications:(id)args;

- (void)removeDeliveredNotifications:(id)args;

- (void)requestUserNotificationSettings:(id)args;

@end
#endif
