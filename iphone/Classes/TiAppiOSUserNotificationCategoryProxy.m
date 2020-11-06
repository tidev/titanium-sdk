/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserNotificationCategoryProxy.h"
#import "TiAppiOSUserNotificationActionProxy.h"
#import <TitaniumKit/TiUtils.h>

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
#if IS_SDK_IOS_12
    NSString *categorySummaryFormat = [properties valueForKey:@"categorySummaryFormat"];
#endif

    NSMutableArray *defaultActions = [NSMutableArray new];
    NSMutableArray *minimalActions = [NSMutableArray new];

    // Prepare default actions
    for (TiAppiOSUserNotificationActionProxy *action in actionsForDefaultContext) {
      [defaultActions addObject:[action notificationAction]];
    }

    // Prepare minimal actions (iOS < 10 only)
    for (TiAppiOSUserNotificationActionProxy *action in actionsForMinimalContext) {
      [minimalActions addObject:[action notificationAction]];
    }

    // Pre-validate intent identifiers to be a String
    if (intentIdentifiers != nil) {
      for (id intentIdentifier in intentIdentifiers) {
        if (![intentIdentifier isKindOfClass:[NSString class]]) {
          DebugLog(@"[ERROR] All elements in \"intentIdentifiers\" must be a String, \"%@\" is not!", intentIdentifier);
        }
      }
    }

    // For iOS 11+, offer new constructors
    if ([TiUtils isIOSVersionOrGreater:@"11.0"]) {
#if IS_SDK_IOS_12
      // For iOS 12+, use the "hiddenPreviewsBodyPlaceholder" and "categorySummaryFormat" constructor
      if ([TiUtils isIOSVersionOrGreater:@"12.0"]) {
        _notificationCategory = [[UNNotificationCategory categoryWithIdentifier:identifier
                                                                        actions:defaultActions
                                                              intentIdentifiers:intentIdentifiers
                                                  hiddenPreviewsBodyPlaceholder:hiddenPreviewsBodyPlaceholder
                                                          categorySummaryFormat:categorySummaryFormat
                                                                        options:options] retain];
      } else {
#endif
        // For iOS 11, use the "hiddenPreviewsBodyPlaceholder" constructor
        _notificationCategory = [[UNNotificationCategory categoryWithIdentifier:identifier
                                                                        actions:defaultActions
                                                              intentIdentifiers:intentIdentifiers
                                                  hiddenPreviewsBodyPlaceholder:hiddenPreviewsBodyPlaceholder
                                                                        options:options] retain];
#if IS_SDK_IOS_12
      }
#endif
    } else {
      // For iOS < 11, use the default constructor
      _notificationCategory = [[UNNotificationCategory categoryWithIdentifier:identifier
                                                                      actions:defaultActions
                                                            intentIdentifiers:intentIdentifiers
                                                                      options:options] retain];
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
