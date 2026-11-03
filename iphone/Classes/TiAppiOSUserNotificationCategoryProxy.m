/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
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
    NSString *categorySummaryFormat = [properties valueForKey:@"categorySummaryFormat"];

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

    _notificationCategory = [[UNNotificationCategory categoryWithIdentifier:identifier
                                                                    actions:defaultActions
                                                          intentIdentifiers:intentIdentifiers
                                              hiddenPreviewsBodyPlaceholder:hiddenPreviewsBodyPlaceholder
                                                      categorySummaryFormat:categorySummaryFormat
                                                                    options:options] retain];

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
