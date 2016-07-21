/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS
#import "TiAppiOSUserNotificationCenterProxy.h"
#import "TiAppiOSUserNotificationCategoryProxy.h"
#import "TiAppiOSLocalNotificationProxy.h"

#define NOTNIL(v) ((v==nil) ? (id)[NSNull null] : v)

@implementation TiAppiOSUserNotificationCenterProxy

- (void)getPendingNotifications:(id)args
{
    KrollCallback *callback = nil;
    ENSURE_ARG_AT_INDEX(callback, args, 0, KrollCallback);
    
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        [[UNUserNotificationCenter currentNotificationCenter] getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
            NSMutableArray *result = [NSMutableArray arrayWithCapacity:[requests count]];
            
            for (UNNotificationRequest *request in requests) {
                [result addObject:[self dictionaryWithUserNotificationRequest:request]];
            }
            
            NSDictionary * propertiesDict = @{
                @"notifications": result
            };
            NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
            
            [callback call:invocationArray thisObject:self];
            [invocationArray release];
        }];
#else
    } else {
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
}

- (void)getDeliveredNotifications:(id)args
{
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        KrollCallback *callback = nil;
        ENSURE_ARG_AT_INDEX(callback, args, 0, KrollCallback);
        
        [[UNUserNotificationCenter currentNotificationCenter] getDeliveredNotificationsWithCompletionHandler:^(NSArray<UNNotificationRequest *> *requests) {
            NSMutableArray *result = [NSMutableArray arrayWithCapacity:[requests count]];
            
            for (UNNotificationRequest *request in requests) {
                [result addObject:[self dictionaryWithUserNotificationRequest:request]];
            }
            
            NSDictionary * propertiesDict = @{
                @"notifications": result
            };
            NSArray * invocationArray = [[NSArray alloc] initWithObjects:&propertiesDict count:1];
            
            [callback call:invocationArray thisObject:self];
            [invocationArray release];
        }];
#else 
    } else {
        NSLog(@"[WARN] Ti.App.iOS.NotificationCenter.getDeliveredNotifications is not available in iOS < 10.");
#endif
    }
}

- (void)removePendingNotificationsWithIdentifiers:(id)args
{
    ENSURE_TYPE(args, NSArray);

    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        TiThreadPerformOnMainThread(^{
            [center getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest*> *requests) {
                
                // Loop through current notification requests
                for (UNNotificationRequest *request in requests) {
                    
                    // Loop throigh provided notifications
                    for (id notification in args) {
                        ENSURE_TYPE(notification, TiAppiOSLocalNotificationProxy);
                        
                        if ([request content] == [(TiAppiOSLocalNotificationProxy*)notification notification]) {
                            [center removePendingNotificationRequestsWithIdentifiers:@[[request identifier]]];
                        }
                    }
                }
            }];
        }, NO);
#else
    } else {
        TiThreadPerformOnMainThread(^{
            for (id notification in args) {
                ENSURE_TYPE(notification, TiAppiOSLocalNotificationProxy);
                [[UIApplication sharedApplication] cancelLocalNotification:[(TiAppiOSLocalNotificationProxy*)notification notification]];
            }
        }, NO);
#endif
    }
}

- (void)removeDeliveredNotificationsWithIdentifiers:(id)args
{
    ENSURE_TYPE(args, NSArray);

    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        UNUserNotificationCenter *center = [UNUserNotificationCenter currentNotificationCenter];
        TiThreadPerformOnMainThread(^{
            [center getPendingNotificationRequestsWithCompletionHandler:^(NSArray<UNNotificationRequest*> *requests) {
                
                // Loop through current notification requests
                for (UNNotificationRequest *request in requests) {
                    
                    // Loop throigh provided notifications
                    for (id notification in args) {
                        ENSURE_TYPE(notification, TiAppiOSLocalNotificationProxy);
                        
                        if ([request content] == [(TiAppiOSLocalNotificationProxy*)notification notification]) {
                            [center removeDeliveredNotificationsWithIdentifiers:@[[request identifier]]];
                        }
                    }
                }
            }];
        }, NO);        
#else
    } else {
        NSLog(@"[WARN] Ti.App.iOS.NotificationCenter.removeDeliveredNotificationsWithIdentifiers is not avaible in iOS < 10.");
#endif
    }
}

- (void)removeAllPendingNotifications:(id)unused
{
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        [[UNUserNotificationCenter currentNotificationCenter] removeAllPendingNotificationRequests];
#else
    } else {
        [[UIApplication sharedApplication] cancelAllLocalNotifications];
#endif
    }
}

- (void)removeAllDeliveredNotifications:(id)unused
{
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
    [[UNUserNotificationCenter currentNotificationCenter] removeAllDeliveredNotifications];
#else
    } else {
        NSLog(@"[WARN] Ti.App.iOS.NotificationCenter.removeAllDeliveredNotifications is not avaible in iOS < 10.");
#endif
    }
}

- (void)requestUserNotificationSettings:(id)args
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

#pragma mark Utilities

#if IS_XCODE_8
- (NSDictionary*)dictionaryWithUserNotificationRequest:(UNNotificationRequest*)request
{
    NSMutableDictionary* event = [NSMutableDictionary dictionary];
    
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
    
    return event;
}
#endif

-(NSDictionary*)formatUserNotificationSettings:(UIUserNotificationSettings*)notificationSettings
{
    if (![NSThread isMainThread]) {
        __block NSDictionary*result = nil;
        TiThreadPerformOnMainThread(^{
            result = [[self formatUserNotificationSettings:notificationSettings] retain];
        }, YES);
        return [result autorelease];
        
    }
    NSMutableArray *typesArray = [NSMutableArray array];
    NSMutableArray *categoriesArray = [NSMutableArray array];
    
    NSUInteger types = notificationSettings.types;
    NSSet *categories = notificationSettings.categories;
    
    // Types
    if ((types & UIUserNotificationTypeBadge)!=0)
    {
        [typesArray addObject:NUMINT(UIUserNotificationTypeBadge)];
    }
    if ((types & UIUserNotificationTypeAlert)!=0)
    {
        [typesArray addObject:NUMINT(UIUserNotificationTypeAlert)];
    }
    if ((types & UIUserNotificationTypeSound)!=0)
    {
        [typesArray addObject:NUMINT(UIUserNotificationTypeSound)];
    }
    
    // Categories
    for (id cat in categories) {
        TiAppiOSUserNotificationCategoryProxy *categoryProxy = [[[TiAppiOSUserNotificationCategoryProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
        categoryProxy.notificationCategory = cat;
        [categoriesArray addObject:categoryProxy];
    }
    return [NSDictionary dictionaryWithObjectsAndKeys:
            typesArray, @"types",
            categoriesArray, @"categories",
            nil];
}

@end
#endif
