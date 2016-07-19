/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserNotificationCenterProxy.h"

@implementation TiAppiOSUserNotificationCenterProxy

- (void)getPendingNotifications:(id)args
{
    KrollCallback *callback = nil;
    ENSURE_ARG_AT_INDEX(callback, args, 0, KrollCallback);
    
#if IS_XCODE_8_
    [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:[requests count]];
        
        for (UNNotificationRequest *request in requests) {
            [result addObject:[request identifier]];
        }
        
        NSDictionary * propertiesDict = @{
            @"notifications": result
        };
        NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
        
        [callback call:invocationArray thisObject:self];
        [invocationArray release];
    }];
#else
    NSArray<UILocalNotification*> *notifications = [[UIApplication sharedApplication] scheduledLocalNotifications];
    NSMutableArray *result = [NSMutableArray arrayWithCapacity:[notifications count]];
   
    for (UILocalNotification *notification in notifications) {
        [result addObject:[TiApp dictionaryWithLocalNotification:notification withIdentifier: nil]];
    }
    
    NSDictionary * propertiesDict = @{
        @"notifications": result
    };
    NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
    
    [callback call:invocationArray thisObject:self];
    [invocationArray release];
#endif
}

- (void)getDeliveredNotifications:(id)args
{
#if IS_XCODE_8
    KrollCallback *callback = nil;
    ENSURE_ARG_AT_INDEX(callback, args, 0, KrollCallback);
    
    [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
        NSMutableArray *result = [NSMutableArray arrayWithCapacity:[requests count]];
        
        for (UNNotificationRequest *request in requests) {
            [result addObject:[request identifier]];
        }
        
        NSDictionary * propertiesDict = @{
            @"notifications": result
        };
        NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
        
        [callback call:invocationArray thisObject:self];
        [invocationArray release];
    }];
#else 
    NSLog(@"This API is not mapped to iOS < 10, yet.");
#endif
}

- (void)removePendingNotificationsWithIdentifiers:(id)args
{
#if IS_XCODE_8
    ENSURE_TYPE(args, NSArray);
    [[UNUserNotificationCenter currentNotificationCenter] removePendingNotificationRequestsWithIdentifiers:args];
#else
    NSLog(@"This API is not mapped to iOS < 10, yet.");
#endif
}

- (void)removeDeliveredNotificationsWithIdentifiers:(id)args
{
#if IS_XCODE_8
    ENSURE_TYPE(args, NSArray);
    [[UNUserNotificationCenter currentNotificationCenter] removeDeliveredNotificationsWithIdentifiers:args];
#else
    NSLog(@"This API is not mapped to iOS < 10, yet.");
#endif
}

- (void)removeAllPendingNotifications:(id)unused
{
#if IS_XCODE_8
    [[UNUserNotificationCenter currentNotificationCenter] removeAllPendingNotificationRequests];
#else
    [[UIApplication sharedApplication] cancelAllLocalNotifications];
#endif
}

- (void)removeAllDeliveredNotifications:(id)unused
{
#if IS_XCODE_8
    [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
#else
    // TODO: This currently behaves the same as `removeAllPendingNotifications`
    // Either note this in the docs or check if we can remove delivered notifications in iOS < 10
    [[UIApplication sharedApplication] cancelAllLocalNotifications];
#endif
}


- (void)requestCurrentUserNotificationSettings:(id)args
{
    ENSURE_SINGLE_ARG(args, NSArray);
    ENSURE_TYPE([args objectAtIndex:0], KrollCallback);
    
    KrollCallback *callback = [args objectAtIndex:0];
    
#if IS_XCODE_8
    [[UNUserNotificationCenter currentNotificationCenter] getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings *settings) {
        NSDictionary * propertiesDict = @{
            @"authorizationStatus": NUMINTEGER([settings authorizationStatus]),
            @"soundSetting": NUMINTEGER([settings soundSetting]),
            @"badgeSetting": NUMINTEGER([settings badgeSetting]),
            @"alertSetting": NUMINTEGER([settings alertSetting]),
            @"notificationCenterSetting": NUMINTEGER([settings notificationCenterSetting]),
            @"lockScreenSetting": NUMINTEGER([settings lockScreenSetting]),
            @"carPlaySetting": NUMINTEGER([settings carPlaySetting]),
            @"alertStyle": NUMINTEGER([settings alertStyle])
        };
        NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
        
        [callback call:invocationArray thisObject:self];
        [invocationArray release];
    }];
#else
    __block NSDictionary* returnVal = nil;
    TiThreadPerformOnMainThread(^{
        UIUserNotificationSettings *settings = [[UIApplication sharedApplication] currentUserNotificationSettings];
        
        NSDictionary * propertiesDict = [self formatUserNotificationSettings:settings];
        NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
        
        [callback call:invocationArray thisObject:self];
        [invocationArray release];
    }, YES);
#endif
}

@end
