//
//  TiApp+Scenes.m
//  Titanium
//
//  Created by Hans Knöchel on 04.05.24.
//

#import "TiApp+Scenes.h"

#import <CoreSpotlight/CoreSpotlight.h>

#import <TitaniumKit/ImageLoader.h>
#import <TitaniumKit/TiExceptionHandler.h>
#import <TitaniumKit/TiLogServer.h>

@implementation TiApp (Scenes)

- (void)sceneWillResignActive:(UIScene *)scene
{
  [self tryToInvokeSelector:@selector(sceneWillResignActive:)
              withArguments:[NSOrderedSet orderedSetWithObject:scene]];

  if ([self forceSplashAsSnapshot]) {
    [window addSubview:[self splashScreenView]];
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiSuspendNotification object:self];

  // suspend any image loading
  [[ImageLoader sharedLoader] suspend];
  [kjsBridge gc];
}

- (void)sceneDidBecomeActive:(UIScene *)scene
{
  [self tryToInvokeSelector:@selector(sceneDidBecomeActive:)
              withArguments:[NSOrderedSet orderedSetWithObject:scene]];

  if ([self forceSplashAsSnapshot] && splashScreenView != nil) {
    [[self splashScreenView] removeFromSuperview];
    RELEASE_TO_NIL(splashScreenView);
  }

  // NOTE: Have to fire a separate but non-'resume' event here because there is SOME information
  // (like new URL) that is not passed through as part of the normal foregrounding process.
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiResumedNotification object:self];

  // resume any image loading
  [[ImageLoader sharedLoader] resume];
}

- (void)sceneDidEnterBackground:(UIScene *)scene
{
  [self tryToInvokeSelector:@selector(sceneDidEnterBackground:)
              withArguments:[NSOrderedSet orderedSetWithObject:scene]];

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiPausedNotification object:self];

  if (backgroundServices == nil) {
    return;
  }

  UIApplication *app = [UIApplication sharedApplication];
  TiApp *tiapp = self;
  bgTask = [app beginBackgroundTaskWithExpirationHandler:^{
    // Synchronize the cleanup call on the main thread in case
    // the task actually finishes at around the same time.
    TiThreadPerformOnMainThread(
        ^{
          if (bgTask != UIBackgroundTaskInvalid) {
            [app endBackgroundTask:bgTask];
            bgTask = UIBackgroundTaskInvalid;
          }
        },
        NO);
  }];
  // Start the long-running task and return immediately.
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    // Do the work associated with the task.
    [tiapp beginBackgrounding];
  });
}

- (void)sceneWillEnterForeground:(UIScene *)scene
{
  [self tryToInvokeSelector:@selector(sceneWillEnterForeground:)
              withArguments:[NSOrderedSet orderedSetWithObject:scene]];

  [self flushCompletionHandlerQueue];
  [sessionId release];
  sessionId = [[TiUtils createUUID] retain];

  //TIMOB-3432. Ensure url is cleared when resume event is fired.
  [launchOptions removeObjectForKey:@"url"];
  [launchOptions removeObjectForKey:@"source"];

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiResumeNotification object:self];

  if (backgroundServices == nil) {
    return;
  }

  [self endBackgrounding];
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  UIOpenURLContext *primaryContext = URLContexts.allObjects.firstObject;

  NSDictionary<UIApplicationOpenURLOptionsKey, id> *options = @{
    UIApplicationOpenURLOptionsSourceApplicationKey : NULL_IF_NIL(primaryContext.options.sourceApplication)
  };

  [self application:[UIApplication sharedApplication] openURL:primaryContext.URL options:options];
}

- (UISceneConfiguration *)application:(UIApplication *)application configurationForConnectingSceneSession:(UISceneSession *)connectingSceneSession options:(UISceneConnectionOptions *)options
{
  return [[UISceneConfiguration alloc] initWithName:@"Default Configuration" sessionRole:connectingSceneSession.role];
}

- (void)scene:(UIScene *)scene willConnectToSession:(UISceneSession *)session options:(UISceneConnectionOptions *)connectionOptions
{
  // Initialize the root-window
  window = [[UIWindow alloc] initWithWindowScene:(UIWindowScene *)scene];

  // Initialize the launch options to be used by the client
  launchOptions = [[NSMutableDictionary alloc] init];

  // Retain connectionOptions for later use
  if (self.connectionOptions != connectionOptions) {
    [self.connectionOptions release]; // Release any existing object
    self.connectionOptions = [connectionOptions retain]; // Retain the new object
  }

  // If we have a APNS-UUID, assign it
  NSString *apnsUUID = [[NSUserDefaults standardUserDefaults] stringForKey:@"APNSRemoteDeviceUUID"];
  if (apnsUUID != nil) {
    remoteDeviceUUID = [apnsUUID copy];
  }

  [[UNUserNotificationCenter currentNotificationCenter] setDelegate:self];

  // Get some launch options to validate before finish launching. Some of them
  // need to be mapepd from native to JS-types to be used by the client
  NSURL *urlOptions = connectionOptions.URLContexts.allObjects.firstObject.URL;
  NSString *sourceBundleId = connectionOptions.sourceApplication;
  UNNotificationResponse *notification = connectionOptions.notificationResponse;
  UIApplicationShortcutItem *shortcut = connectionOptions.shortcutItem;

  // Map user activity if exists
  NSUserActivity *userActivity = connectionOptions.userActivities.allObjects.firstObject;
  if (userActivity != nil) {
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
    [launchOptions setObject:@{ @"UIApplicationLaunchOptionsUserActivityKey" : dict }
                      forKey:UIApplicationLaunchOptionsUserActivityDictionaryKey];
  }

  // Map launched URL
  if (urlOptions != nil) {
    [launchOptions setObject:[urlOptions absoluteString] forKey:@"url"];
  }

  // Map launched App-ID
  if (sourceBundleId != nil) {
    [launchOptions setObject:sourceBundleId forKey:@"source"];
  }

  // Generate remote notification if available
  if (notification != nil && [notification.notification.request.trigger isKindOfClass:[UNPushNotificationTrigger class]]) {
    [self generateNotification:@{ @"aps" : notification.notification.request.content.userInfo }];
  }

  // Save shortcut item for later
  if (shortcut != nil) {
    launchedShortcutItem = [shortcut retain];
  }

  // Queue selector for usage in modules / Hyperloop
  [self tryToInvokeSelector:@selector(scene:willConnectToSession:options:)
              withArguments:[NSOrderedSet orderedSetWithObjects:scene, connectionOptions, nil]];

  // Catch exceptions
  [TiExceptionHandler defaultExceptionHandler];

  // Enable device logs (e.g. for physical devices)
  if ([[TiSharedConfig defaultConfig] logServerEnabled]) {
    [[TiLogServer defaultLogServer] start];
  }

  // Initialize the root-controller
  [self initController];

  // If a "application-launch-url" is set, launch it directly
  [self launchToUrl];

  // Boot our kroll-core
  [self boot];

  // Create application support directory if not exists
  [self createDefaultDirectories];
}

@end
