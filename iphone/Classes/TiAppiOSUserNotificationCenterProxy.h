/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_APPIOS) && defined(USE_TI_APPIOSUSERNOTIFICATIONCENTER)

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
