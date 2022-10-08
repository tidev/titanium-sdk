/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS
#import <TitaniumKit/TiProxy.h>

#import <UserNotifications/UserNotifications.h>

@interface TiAppiOSLocalNotificationProxy : TiProxy {
  @private
  id _notification;
}

@property (nonatomic, retain) id notification;

- (void)cancel:(id)unused;

@end

#endif
