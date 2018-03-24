/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS
#import "TiAppiOSUserNotificationCenterProxy.h"
#import "TiAppiOSLocalNotificationProxy.h"
#import "TiAppiOSUserNotificationCategoryProxy.h"
#import <CoreLocation/CoreLocation.h>

#define NOTNIL(v) ((v == nil) ? (id)[NSNull null] : v)

@implementation TiAppiOSUserNotificationCenterProxy

- (void)getPendingNotifications:(id)args
{
  KrollCallback *callback = nil;
  ENSURE_ARG_AT_INDEX(callback, args, 0, KrollCallback);

  if ([TiUtils isIOS10OrGreater]) {
    TiThreadPerformOnMainThread(^{
      [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:[requests count]];

        for (UNNotificationRequest *request in requests) {
          [result addObject:[self dictionaryWithUserNotificationRequest:request]];
        }

        NSDictionary *propertiesDict = @{
          @"notifications" : result
        };
        NSArray *invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];

        [callback call:invocationArray thisObject:self];
        [invocationArray release];
      }];
    },
        NO);
  } else {
    NSArray<UILocalNotification *> *notifications = [[UIApplication sharedApplication] scheduledLocalNotifications];
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:[notifications count]];

    for (UILocalNotification *notification in notifications) {
      [result addObject:[TiApp dictionaryWithLocalNotification:notification withIdentifier:nil]];
    }

    NSDictionary *propertiesDict = @{
      @"notifications" : result
    };
    NSArray *invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];

    [callback call:invocationArray thisObject:self];
    [invocationArray release];
  }
}

- (void)getDeliveredNotifications:(id)args
{
  if ([TiUtils isIOS10OrGreater]) {
    KrollCallback *callback = nil;
    ENSURE_ARG_AT_INDEX(callback, args, 0, KrollCallback);

    TiThreadPerformOnMainThread(^{
      [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:[requests count]];

        for (UNNotificationRequest *request in requests) {
          [result addObject:[self dictionaryWithUserNotificationRequest:request]];
        }

        NSDictionary *propertiesDict = @{
          @"notifications" : result
        };
        NSArray *invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];

        [callback call:invocationArray thisObject:self];
        [invocationArray release];
      }];
    },
        NO);
  } else {
    DebugLog(@"[WARN] Ti.App.iOS.NotificationCenter.getDeliveredNotifications is not available in iOS < 10.");
  }
}

- (void)removePendingNotifications:(id)args
{
  ENSURE_TYPE(args, NSArray);

  if ([TiUtils isIOS10OrGreater]) {
    UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
    TiThreadPerformOnMainThread(^{
      if ([args count] == 0) {
        [center removeAllPendingNotificationRequests];
        return;
      }

      [center getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        // Loop through current notification requests
        for (UNNotificationRequest *request in requests) {

          // Loop through provided notifications
          for (id notification in args) {
            ENSURE_TYPE(notification, TiAppiOSLocalNotificationProxy);

            if ([request content] == [(TiAppiOSLocalNotificationProxy *)notification notification]) {
              [center removePendingNotificationRequestsWithIdentifiers:@[ [request identifier] ]];
            }
          }
        }
      }];
    },
        NO);
  } else {
    TiThreadPerformOnMainThread(^{
      if ([args count] == 0) {
        [[UIApplication sharedApplication] cancelAllLocalNotifications];
        return;
      }

      for (id notification in args) {
        ENSURE_TYPE(notification, TiAppiOSLocalNotificationProxy);
        [[UIApplication sharedApplication] cancelLocalNotification:[(TiAppiOSLocalNotificationProxy *)notification notification]];
      }
    },
        NO);
  }
}

- (void)removeDeliveredNotifications:(id)args
{
  ENSURE_TYPE(args, NSArray);

  if ([TiUtils isIOS10OrGreater]) {
    TiThreadPerformOnMainThread(^{
      UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];

      if ([args count] == 0) {
        [center removeAllDeliveredNotifications];
        return;
      }

      [center getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        // Loop through current notification requests
        for (UNNotificationRequest *request in requests) {

          // Loop through provided notifications
          for (id notification in args) {
            ENSURE_TYPE(notification, TiAppiOSLocalNotificationProxy);

            if ([request content] == [(TiAppiOSLocalNotificationProxy *)notification notification]) {
              [center removeDeliveredNotificationsWithIdentifiers:@[ [request identifier] ]];
            }
          }
        }
      }];
    },
        NO);
  } else {
    DebugLog(@"[WARN] Ti.App.iOS.NotificationCenter.removeDeliveredNotifications is only available in iOS 10 and later.");
  }
}

- (void)requestUserNotificationSettings:(id)args
{
  ENSURE_SINGLE_ARG(args, NSArray);
  ENSURE_TYPE([args objectAtIndex:0], KrollCallback);

  KrollCallback *callback = [args objectAtIndex:0];

  if ([TiUtils isIOS10OrGreater]) {
    TiThreadPerformOnMainThread(^{
      [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        NSMutableDictionary *propertiesDict = [@{
          @"authorizationStatus" : @([settings authorizationStatus]),
          @"soundSetting" : @([settings soundSetting]),
          @"badgeSetting" : @([settings badgeSetting]),
          @"alertSetting" : @([settings alertSetting]),
          @"notificationCenterSetting" : @([settings notificationCenterSetting]),
          @"lockScreenSetting" : @([settings lockScreenSetting]),
          @"carPlaySetting" : @([settings carPlaySetting]),
          @"alertStyle" : @([settings alertStyle])
        } mutableCopy];
#if IS_XCODE_9
        if ([TiUtils isIOSVersionOrGreater:@"11.0"]) {
          propertiesDict[@"showPreviewsSetting"] = @([settings showPreviewsSetting]);
        }
#endif
        NSArray *invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];

        [callback call:invocationArray thisObject:self];
        [invocationArray release];
      }];
    },
        NO);
  } else {
    TiThreadPerformOnMainThread(^{
      UIUserNotificationSettings *settings = [[UIApplication sharedApplication] currentUserNotificationSettings];

      NSDictionary *propertiesDict = [self formatUserNotificationSettings:settings];
      NSArray *invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];

      [callback call:invocationArray thisObject:self];
      [invocationArray release];
    },
        YES);
  }
}

#pragma mark Utilities

- (NSDictionary *)dictionaryWithUserNotificationRequest:(UNNotificationRequest *)request
{
  NSMutableDictionary *event = [NSMutableDictionary dictionary];

  [event setObject:[[NSTimeZone defaultTimeZone] name] forKey:@"timezone"];
  [event setObject:NOTNIL([[request content] body]) forKey:@"alertBody"];
  [event setObject:NOTNIL([[request content] title]) forKey:@"alertTitle"];
  [event setObject:NOTNIL([[request content] subtitle]) forKey:@"alertSubtitle"];
  [event setObject:NOTNIL([[request content] launchImageName]) forKey:@"alertLaunchImage"];
  [event setObject:NOTNIL([[request content] sound]) forKey:@"sound"];
  [event setObject:NOTNIL([[request content] badge]) forKey:@"badge"];
  [event setObject:NOTNIL([[request content] userInfo]) forKey:@"userInfo"];
  [event setObject:NOTNIL([[request content] categoryIdentifier]) forKey:@"category"];
  [event setObject:NOTNIL([request identifier]) forKey:@"identifier"];

  if ([[request trigger] isKindOfClass:[UNCalendarNotificationTrigger class]]) {
    [event setObject:NOTNIL([(UNCalendarNotificationTrigger *)[request trigger] nextTriggerDate]) forKey:@"date"];
  } else if ([[request trigger] isKindOfClass:[UNLocationNotificationTrigger class]]) {
    CLCircularRegion *region = (CLCircularRegion *)[(UNLocationNotificationTrigger *)[request trigger] region];

    NSDictionary *dict = @{
      @"latitude" : NUMDOUBLE(region.center.latitude),
      @"longitude" : NUMDOUBLE(region.center.longitude),
      @"radius" : NUMDOUBLE(region.radius),
      @"identifier" : region.identifier
    };
    [event setObject:dict forKey:@"region"];
  }

  return event;
}

- (NSDictionary *)formatUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  if (![NSThread isMainThread]) {
    __block NSDictionary *result = nil;
    TiThreadPerformOnMainThread(^{
      result = [[self formatUserNotificationSettings:notificationSettings] retain];
    },
        YES);
    return [result autorelease];
  }
  NSMutableArray *typesArray = [NSMutableArray array];
  NSMutableArray *categoriesArray = [NSMutableArray array];

  NSUInteger types = notificationSettings.types;
  NSSet *categories = notificationSettings.categories;

  // Types
  if ((types & UIUserNotificationTypeBadge) != 0) {
    [typesArray addObject:NUMINT(UIUserNotificationTypeBadge)];
  }
  if ((types & UIUserNotificationTypeAlert) != 0) {
    [typesArray addObject:NUMINT(UIUserNotificationTypeAlert)];
  }
  if ((types & UIUserNotificationTypeSound) != 0) {
    [typesArray addObject:NUMINT(UIUserNotificationTypeSound)];
  }

  // Categories
  for (id cat in categories) {
    TiAppiOSUserNotificationCategoryProxy *categoryProxy = [[[TiAppiOSUserNotificationCategoryProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    categoryProxy.notificationCategory = cat;
    [categoriesArray addObject:categoryProxy];
  }

  return @{
    @"types" : typesArray,
    @"categories" : categoriesArray
  };
}

@end
#endif
