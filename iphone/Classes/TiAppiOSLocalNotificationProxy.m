/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS
#import "TiAppiOSLocalNotificationProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiAppiOSLocalNotificationProxy

@synthesize notification = _notification;

- (void)dealloc
{
  RELEASE_TO_NIL(_notification);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.App.iOS.LocalNotification";
}

- (void)cancel:(id)unused
{
  DEPRECATED_REPLACED(@"App.iOS.LocalNotification.cancel()", @"7.3.0", @"App.iOS.UserNotificationCenter.removePendingNotifications()");

  NSString *identifier = @"notification";
  NSDictionary *userInfo = [(UNMutableNotificationContent *)self.notification userInfo];

  if (userInfo != nil && [userInfo objectForKey:@"id"] != nil) {
    identifier = [TiUtils stringValue:[userInfo objectForKey:@"id"]];
  }
  [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:@[ [TiUtils stringValue:identifier] ]];
}

@end

#endif
