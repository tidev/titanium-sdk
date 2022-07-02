/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiProxy.h>

#ifdef USE_TI_APPIOS
#import <UserNotifications/UserNotifications.h>

@interface TiAppiOSUserNotificationCategoryProxy : TiProxy

@property (nonatomic, retain) id notificationCategory;
@property (nonatomic, readonly) NSString *identifier;

- (id)notificationCategory;

@end

#endif
