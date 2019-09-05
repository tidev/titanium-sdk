/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserNotificationActionProxy.h"
#import <TitaniumKit/TiUtils.h>

#ifdef USE_TI_APPIOS

@implementation TiAppiOSUserNotificationActionProxy

- (void)dealloc
{
  RELEASE_TO_NIL(_notificationAction);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.App.iOS.UserNotificationAction";
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  if (_notificationAction == nil) {
    if ([TiUtils isIOSVersionOrGreater:@"10.0"]) {
      id identifier = [properties valueForKey:@"identifier"];
      id title = [properties valueForKey:@"title"];
      id activationMode = [properties valueForKey:@"activationMode"];
      id authenticationRequired = [properties valueForKey:@"authenticationRequired"];
      id destructive = [properties valueForKey:@"destructive"];
      id behavior = [properties valueForKey:@"behavior"];
      id textInputButtonTitle = [properties valueForKey:@"textInputButtonTitle"];
      id textInputButtonPlaceholder = [properties valueForKey:@"textInputButtonPlaceholder"];

      UNNotificationActionOptions options = UNNotificationActionOptionNone;

      if (destructive) {
        options |= UNNotificationActionOptionDestructive;
      }

      if (authenticationRequired) {
        options |= UNNotificationActionOptionAuthenticationRequired;
      }

      // Important: The UNNoticationAction class is creation-only, so the manual setters are only
      // for the iOS < 10 UIUserNotificationAction
      if (behavior && [TiUtils intValue:behavior def:UIUserNotificationActionBehaviorDefault] == UIUserNotificationActionBehaviorTextInput) {
        _notificationAction = [[UNTextInputNotificationAction actionWithIdentifier:identifier
                                                                             title:title
                                                                           options:options
                                                              textInputButtonTitle:textInputButtonTitle
                                                              textInputPlaceholder:textInputButtonPlaceholder] retain];

        [super _initWithProperties:properties];
        return;
      } else {
        _notificationAction = [[UNNotificationAction actionWithIdentifier:identifier
                                                                    title:title
                                                                  options:[TiUtils intValue:activationMode]] retain];
      }
    } else {
      _notificationAction = [[UIMutableUserNotificationAction new] retain];
    }
  }

  [super _initWithProperties:properties];
}

- (id)notificationAction
{
  return _notificationAction;
}

#pragma mark Public API's

- (void)setActivationMode:(id)value
{
  if ([TiUtils isIOSVersionOrGreater:@"10.0"]) {
    return; // Not available on iOS 10+
  }

  [(UIMutableUserNotificationAction *)[self notificationAction] setActivationMode:[TiUtils intValue:value]];
}

- (void)setBehavior:(id)value
{
  if ([TiUtils isIOSVersionOrGreater:@"10.0"]) {
    return; // Not available on iOS 10+
  }

  [(UIMutableUserNotificationAction *)[self notificationAction] setBehavior:[TiUtils intValue:value]];
}

- (void)setDestructive:(id)value
{
  if ([TiUtils isIOSVersionOrGreater:@"10.0"]) {
    return; // Not available on iOS 10+
  }

  [(UIMutableUserNotificationAction *)[self notificationAction] setDestructive:[TiUtils boolValue:value]];
}

- (void)setAuthenticationRequired:(id)value
{
  if ([TiUtils isIOSVersionOrGreater:@"10.0"]) {
    return; // Not available on iOS 10+
  }

  [(UIMutableUserNotificationAction *)[self notificationAction] setAuthenticationRequired:[TiUtils boolValue:value]];
}

@end

#endif
