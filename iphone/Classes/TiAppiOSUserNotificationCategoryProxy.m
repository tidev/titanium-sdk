/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserNotificationCategoryProxy.h"
#import "TiAppiOSUserNotificationActionProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSUserNotificationCategoryProxy

- (void)dealloc
{
  RELEASE_TO_NIL(_notificationCategory);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.App.iOS.UserNotificationCategory";
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  if (_notificationCategory == nil) {

    NSString *identifier = [properties valueForKey:@"identifier"];
    NSArray *actionsForDefaultContext = [properties valueForKey:@"actionsForDefaultContext"];
    NSArray *actionsForMinimalContext = [properties valueForKey:@"actionsForMinimalContext"];
    NSArray *intentIdentifiers = [properties valueForKey:@"intentIdentifiers"] ?: @[];
    NSString *hiddenPreviewsBodyPlaceholder = [properties valueForKey:@"hiddenPreviewsBodyPlaceholder"];
    UNNotificationCategoryOptions options = [self categoryOptionsFromArray:[properties valueForKey:@"options"] ?: @[]];

    NSMutableArray *defaultActions = [NSMutableArray new];
    NSMutableArray *minimalActions = [NSMutableArray new];

    for (TiAppiOSUserNotificationActionProxy *action in actionsForDefaultContext) {
      [defaultActions addObject:[action notificationAction]];
    }

    for (TiAppiOSUserNotificationActionProxy *action in actionsForMinimalContext) {
      [minimalActions addObject:[action notificationAction]];
    }

    if (intentIdentifiers) {
      for (id intentIdentifier in intentIdentifiers) {
        if (![intentIdentifier isKindOfClass:[NSString class]]) {
          DebugLog(@"[ERROR] All elements in \"intentIdentifiers\" must be a String, \"%@\" is not!", intentIdentifier);
        }
      }
    }

    // For iOS 10+, use the UserNotifications framerwork
    if ([TiUtils isIOS10OrGreater]) {
      // For iOS 11+, use the "hiddenPreviewsBodyPlaceholder" constructor
      if (hiddenPreviewsBodyPlaceholder != nil && [TiUtils isIOSVersionOrGreater:@"11.0"]) {
        _notificationCategory = [UNNotificationCategory categoryWithIdentifier:identifier
                                                                       actions:defaultActions
                                                             intentIdentifiers:intentIdentifiers
                                                 hiddenPreviewsBodyPlaceholder:hiddenPreviewsBodyPlaceholder
                                                                       options:options];
      } else {
        // For iOS < 11, use the default constructor
        _notificationCategory = [[UNNotificationCategory categoryWithIdentifier:identifier
                                                                        actions:defaultActions
                                                              intentIdentifiers:intentIdentifiers
                                                                        options:options] retain];
      }
    } else {
      // For iOS < 10, use the old constructor
      _notificationCategory = [UIMutableUserNotificationCategory new];

      [_notificationCategory setIdentifier:identifier];
      [_notificationCategory setActions:defaultActions forContext:UIUserNotificationActionContextDefault];
      [_notificationCategory setActions:minimalActions forContext:UIUserNotificationActionContextMinimal];
    }

    RELEASE_TO_NIL(minimalActions);
    RELEASE_TO_NIL(defaultActions);
  }

  [super _initWithProperties:properties];
}

- (id)notificationCategory
{
  return _notificationCategory;
}

- (NSString *)identifier
{
  return [[self notificationCategory] identifier];
}

#pragma mark Helper

- (UNNotificationCategoryOptions)categoryOptionsFromArray:(NSArray *)array
{
  UNNotificationCategoryOptions options = UNNotificationCategoryOptionNone;

  for (id option in array) {
    options |= [TiUtils intValue:option];
  }

  return options;
}

@end

#endif
