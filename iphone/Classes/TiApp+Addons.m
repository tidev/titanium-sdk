/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiApp+Addons.h"
#ifdef USE_TI_APPIOS
#import <CoreSpotlight/CoreSpotlight.h>
#endif

@implementation TiApp (Addons)

#pragma mark Background Fetch API's

#ifdef USE_TI_FETCH

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  [self tryToInvokeSelector:@selector(application:performFetchWithCompletionHandler:)
              withArguments:[NSOrderedSet orderedSetWithObjects:application, [completionHandler copy], nil]];

  //Only for simulator builds
  NSArray *backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
  if ([backgroundModes containsObject:@"fetch"]) {

    // Generate unique key with timestamp.
    NSString *key = [NSString stringWithFormat:@"Fetch-%f", [[NSDate date] timeIntervalSince1970]];

    // Store the completionhandler till we can come back and send appropriate message.
    if (pendingCompletionHandlers == nil) {
      pendingCompletionHandlers = [[NSMutableDictionary alloc] init];
    }

    [pendingCompletionHandlers setObject:[[completionHandler copy] autorelease] forKey:key];

    [self tryToPostBackgroundModeNotification:[NSMutableDictionary dictionaryWithObjectsAndKeys:key, @"handlerId", nil]
                         withNotificationName:kTiBackgroundFetchNotification];

    // We will go ahead and keeper a timer just in case the user returns the value too late - this is the worst case scenario.
    NSTimer *flushTimer = [NSTimer timerWithTimeInterval:TI_BACKGROUNDFETCH_MAX_INTERVAL
                                                  target:self
                                                selector:@selector(fireCompletionHandler:)
                                                userInfo:key
                                                 repeats:NO];

    [[NSRunLoop mainRunLoop] addTimer:flushTimer forMode:NSDefaultRunLoopMode];
  }
}

#endif

#pragma mark Remote Notifications API's

#ifdef USE_TI_SILENTPUSH

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  // Forward the callback
  if ([self respondsToSelector:@selector(application:didReceiveRemoteNotification:)]) {
    [self application:application didReceiveRemoteNotification:userInfo];
  }

  [self tryToInvokeSelector:@selector(application:didReceiveRemoteNotification:fetchCompletionHandler:)
              withArguments:[NSOrderedSet orderedSetWithObjects:application, userInfo, [completionHandler copy], nil]];

  //This only here for Simulator builds.

  NSArray *backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
  if ([backgroundModes containsObject:@"remote-notification"]) {

    // Generate unique key with timestamp.
    NSString *key = [NSString stringWithFormat:@"SilentPush-%f", [[NSDate date] timeIntervalSince1970]];

    // Store the completionhandler till we can come back and send appropriate message.
    if (pendingCompletionHandlers == nil) {
      pendingCompletionHandlers = [[NSMutableDictionary alloc] init];
    }

    [pendingCompletionHandlers setObject:[[completionHandler copy] autorelease] forKey:key];

    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:key, @"handlerId", nil];
    [dict addEntriesFromDictionary:userInfo];

    [self tryToPostBackgroundModeNotification:dict
                         withNotificationName:kTiSilentPushNotification];

    // We will go ahead and keeper a timer just in case the user returns the value too late - this is the worst case scenario.
    NSTimer *flushTimer = [NSTimer timerWithTimeInterval:TI_BACKGROUNDFETCH_MAX_INTERVAL target:self selector:@selector(fireCompletionHandler:) userInfo:key repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:flushTimer forMode:NSDefaultRunLoopMode];
  }
}
#endif

#pragma mark Handoff Delegates

#ifdef USE_TI_APPIOS
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity restorationHandler:(void (^)(NSArray *_Nullable))restorationHandler
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:@{ @"activityType" : [userActivity activityType] }];

  if ([TiUtils isIOSVersionOrGreater:@"9.0"] && [[userActivity activityType] isEqualToString:CSSearchableItemActionType]) {
    if ([userActivity userInfo] != nil) {
      [dict setObject:[[userActivity userInfo] objectForKey:CSSearchableItemActivityIdentifier] forKey:@"searchableItemActivityIdentifier"];
    }
  }

  if ([userActivity title] != nil) {
    [dict setObject:[userActivity title] forKey:@"title"];
  }

  if ([userActivity webpageURL] != nil) {
    [dict setObject:[[userActivity webpageURL] absoluteString] forKey:@"webpageURL"];
  }

  if ([userActivity userInfo] != nil) {
    [dict setObject:[userActivity userInfo] forKey:@"userInfo"];
  }

  // Update launchOptions so that we send only expected values rather than NSUserActivity
  NSMutableDictionary *userActivityDict = [NSMutableDictionary dictionaryWithDictionary:launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey]];
  [userActivityDict setObject:dict forKey:@"UIApplicationLaunchOptionsUserActivityKey"];
  [launchOptions setObject:userActivityDict forKey:UIApplicationLaunchOptionsUserActivityDictionaryKey];

  [self tryToInvokeSelector:@selector(application:continueUserActivity:restorationHandler:)
              withArguments:[NSOrderedSet orderedSetWithObjects:application, userActivity, [restorationHandler copy], nil]];

  if (appBooted) {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiContinueActivity object:self userInfo:dict];
  } else {
    [[self queuedBootEvents] setObject:dict forKey:kTiContinueActivity];
  }

  return YES;
}
#endif

#pragma mark Push Notification Delegates

#ifdef USE_TI_NETWORKREGISTERFORPUSHNOTIFICATIONS

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
  // NOTE: this is called when the app is *running* after receiving a push notification
  // otherwise, if the app is started from a push notification, this method will not be
  // called
  RELEASE_TO_NIL(remoteNotification);
  [self generateNotification:userInfo];

  [self tryToInvokeSelector:@selector(application:didReceiveRemoteNotification:)
              withArguments:[NSOrderedSet orderedSetWithObjects:application, userInfo, nil]];
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{

  NSString *token = [TiUtils convertToHexFromData:deviceToken];

  RELEASE_TO_NIL(remoteDeviceUUID);
  remoteDeviceUUID = [token copy];

  NSString *curKey = [[NSUserDefaults standardUserDefaults] stringForKey:@"APNSRemoteDeviceUUID"];
  if (curKey == nil || ![curKey isEqualToString:remoteDeviceUUID]) {
    // this is the first time being registered, we need to indicate to our backend that we have a
    // new registered device to enable this device to receive notifications from the cloud
    [[NSUserDefaults standardUserDefaults] setObject:remoteDeviceUUID forKey:@"APNSRemoteDeviceUUID"];
    NSDictionary *userInfo = [NSDictionary dictionaryWithObject:remoteDeviceUUID forKey:@"deviceid"];
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiRemoteDeviceUUIDNotification object:self userInfo:userInfo];
    DebugLog(@"[DEBUG] Registered new device for remote push notifications: %@", remoteDeviceUUID);
  }

  [self tryToInvokeSelector:@selector(application:didRegisterForRemoteNotificationsWithDeviceToken:)
              withArguments:[NSOrderedSet orderedSetWithObjects:application, deviceToken, nil]];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  [self tryToInvokeSelector:@selector(application:didFailToRegisterForRemoteNotificationsWithError:)
              withArguments:[NSOrderedSet orderedSetWithObjects:application, error, nil]];
}

#endif

@end
