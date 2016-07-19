/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_APPIOS
#if IS_XCODE_8
#import <UserNotifications/UserNotifications.h>
#endif

@interface TiAppiOSUserNotificationCategoryProxy : TiProxy
{

}

#if IS_XCODE_8
@property (nonatomic,retain) UNNotificationCategory *notificationCategory;
#else
@property (nonatomic,retain) UIMutableUserNotificationCategory *notificationCategory;
#endif
@property (nonatomic,readonly) NSString *identifier;

- (UNNotificationCategory*)notificationCategory;

@end


#endif
