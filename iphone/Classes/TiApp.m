/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <stdio.h>

#import "ApplicationDefaults.h"
#import "ImageLoader.h"
#import "Mimetypes.h"
#import "NSData+Additions.h"
#import "TiApp.h"
#import "TiBase.h"
#import "TiErrorController.h"
#import "TiExceptionHandler.h"
#import "Webcolor.h"
#import <AVFoundation/AVFoundation.h>
#import <CoreSpotlight/CoreSpotlight.h>
#import <QuartzCore/QuartzCore.h>
#import <libkern/OSAtomic.h>
#ifdef KROLL_COVERAGE
#import "KrollCoverage.h"
#endif
#ifndef USE_JSCORE_FRAMEWORK
#import "TiDebugger.h"
#import "TiProfiler/TiProfiler.h"
#endif
#ifndef DISABLE_TI_LOG_SERVER
#import "TiLogServer.h"
#endif

TiApp *sharedApp;

int TiDebugPort = 2525;

extern NSString *const TI_APPLICATION_DEPLOYTYPE;
extern NSString *const TI_APPLICATION_NAME;
extern NSString *const TI_APPLICATION_VERSION;
extern BOOL const TI_APPLICATION_SHOW_ERROR_CONTROLLER;

NSString *TITANIUM_VERSION;

extern void UIColorFlushCache();

#define SHUTDOWN_TIMEOUT_IN_SEC 3
#define TIV @"TiVerify"
#define TI_BACKGROUNDFETCH_MAX_INTERVAL 29

BOOL applicationInMemoryPanic = NO;

TI_INLINE void waitForMemoryPanicCleared(); //WARNING: This must never be run on main thread, or else there is a risk of deadlock!

@interface TiApp ()
- (void)checkBackgroundServices;
- (void)appBoot;
@end

@implementation TiApp

- (void)clearMemoryPanic
{
  applicationInMemoryPanic = NO;
}

@synthesize window, remoteNotificationDelegate, controller;
@synthesize disableNetworkActivityIndicator;
@synthesize remoteNotification;
@synthesize pendingCompletionHandlers;
@synthesize backgroundTransferCompletionHandlers;
@synthesize localNotification;
@synthesize appBooted;
@synthesize userAgent;

#ifdef TI_USE_KROLL_THREAD
+ (void)initialize
{
  TiThreadInitalize();
}
#endif

+ (TiApp *)app
{
  return sharedApp;
}

+ (TiRootViewController *)controller;
{
  return [sharedApp controller];
}

- (TiContextGroupRef)contextGroup
{
  if (contextGroup == nil) {
    contextGroup = TiContextGroupCreate();
    TiContextGroupRetain(contextGroup);
  }
  return contextGroup;
}

+ (TiContextGroupRef)contextGroup
{
  return [sharedApp contextGroup];
}

- (NSMutableDictionary *)queuedBootEvents
{
  if (queuedBootEvents == nil) {
    queuedBootEvents = [[[NSMutableDictionary alloc] init] retain];
  }

  return queuedBootEvents;
}

- (void)startNetwork
{
  ENSURE_UI_THREAD_0_ARGS;
  if (OSAtomicIncrement32(&networkActivityCount) == 1) {
    [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:!disableNetworkActivityIndicator];
  }
}

- (void)stopNetwork
{
  ENSURE_UI_THREAD_0_ARGS;
  if (OSAtomicDecrement32(&networkActivityCount) == 0) {
    [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
  }
}

- (void)setDisableNetworkActivityIndicator:(BOOL)value
{
  disableNetworkActivityIndicator = value;
  [[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:(!disableNetworkActivityIndicator && (networkActivityCount > 0))];
}

- (NSDictionary *)launchOptions
{
  return launchOptions;
}

- (void)initController
{
  sharedApp = self;

  // attach our main view controller
  controller = [[TiRootViewController alloc] init];
  // attach our main view controller... IF we haven't already loaded the main window.
  [window setRootViewController:controller];
  [window makeKeyAndVisible];
}

- (BOOL)windowIsKeyWindow
{
  return [window isKeyWindow];
}

- (UIView *)topMostView
{
  UIWindow *currentKeyWindow_ = [[UIApplication sharedApplication] keyWindow];
  return [[currentKeyWindow_ subviews] lastObject];
}
- (void)attachXHRBridgeIfRequired
{
#ifdef USE_TI_UIWEBVIEW
  if (xhrBridge == nil) {
    xhrBridge = [[XHRBridge alloc] initWithHost:self];
    [xhrBridge boot:self url:nil preload:nil];
  }
#endif
}

- (void)launchToUrl
{
  NSDictionary *launchDefaults = [ApplicationDefaults launchUrl];
  if (launchDefaults != nil) {
    UIApplication *app = [UIApplication sharedApplication];
    NSURL *url = [NSURL URLWithString:[launchDefaults objectForKey:@"application-launch-url"]];
    if ([app canOpenURL:url]) {
      [app openURL:url];
    } else {
      DebugLog(@"[WARN] The launch-url provided : %@ is invalid.", [launchDefaults objectForKey:@"application-launch-url"]);
    }
  }
}

- (void)createDefaultDirectories
{
  NSError *error = nil;
  [[NSFileManager defaultManager] URLForDirectory:NSApplicationSupportDirectory
                                         inDomain:NSUserDomainMask
                                appropriateForURL:nil
                                           create:YES
                                            error:&error];
  if (error) {
    DebugLog(@"[ERROR]  %@ %@", error, [error userInfo]);
  }
}

- (void)boot
{
  DebugLog(@"[INFO] %@/%@ (%s.__GITHASH__)", TI_APPLICATION_NAME, TI_APPLICATION_VERSION, TI_VERSION_STR);

  sessionId = [[TiUtils createUUID] retain];
  TITANIUM_VERSION = [[NSString stringWithCString:TI_VERSION_STR encoding:NSUTF8StringEncoding] retain];
#ifndef USE_JSCORE_FRAMEWORK
  NSString *filePath = [[NSBundle mainBundle] pathForResource:@"debugger" ofType:@"plist"];
  if (filePath != nil) {
    NSMutableDictionary *params = [[[NSMutableDictionary alloc] initWithContentsOfFile:filePath] autorelease];
    NSString *host = [params objectForKey:@"host"];
    NSInteger port = [[params objectForKey:@"port"] integerValue];
    if (([host length] > 0) && ![host isEqualToString:@"__DEBUGGER_HOST__"]) {
      [self setDebugMode:YES];
      TiDebuggerStart(host, port);
    }
#if !TARGET_IPHONE_SIMULATOR
    else {
      NSString *airkey = [params objectForKey:@"airkey"];
      if (([airkey length] > 0) && ![airkey isEqualToString:@"__DEBUGGER_AIRKEY__"]) {
        NSArray *hosts = nil;
        NSString *hostsString = [params objectForKey:@"hosts"];
        if (![hostsString isEqualToString:@"__DEBUGGER_HOSTS__"]) {
          hosts = [hostsString componentsSeparatedByCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@","]];
        }
        TiDebuggerDiscoveryStart(airkey, hosts, ^(NSString *host, NSInteger port) {
          if (host != nil) {
            [self setDebugMode:YES];
            TiDebuggerStart(host, port);
          }
          [self appBoot];
        });
        return;
      }
    }
#endif
  }
  filePath = [[NSBundle mainBundle] pathForResource:@"profiler" ofType:@"plist"];
  if (!self.debugMode && filePath != nil) {
    NSMutableDictionary *params = [[[NSMutableDictionary alloc] initWithContentsOfFile:filePath] autorelease];
    NSString *host = [params objectForKey:@"host"];
    NSInteger port = [[params objectForKey:@"port"] integerValue];
    if (([host length] > 0) && ![host isEqualToString:@"__PROFILER_HOST__"]) {
      [self setProfileMode:YES];
      TiProfilerStart(host, port);
    }
#if !TARGET_IPHONE_SIMULATOR
    else {
      NSString *airkey = [params objectForKey:@"airkey"];
      if (([airkey length] > 0) && ![airkey isEqualToString:@"__PROFILER_AIRKEY__"]) {
        NSArray *hosts = nil;
        NSString *hostsString = [params objectForKey:@"hosts"];
        if (![hostsString isEqualToString:@"__PROFILER_HOSTS__"]) {
          hosts = [hostsString componentsSeparatedByCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@","]];
        }
        TiProfilerDiscoveryStart(airkey, hosts, ^(NSString *host, NSInteger port) {
          if (host != nil) {
            [self setProfileMode:YES];
            TiProfilerStart(host, port);
          }
          [self appBoot];
        });
        return;
      }
    }
#endif
  }
#endif
  [self appBoot];
}

- (void)appBoot
{
  kjsBridge = [[KrollBridge alloc] initWithHost:self];

  [kjsBridge boot:self url:nil preload:nil];
  [[UIApplication sharedApplication] beginReceivingRemoteControlEvents];
}

- (void)validator
{
  [[[NSClassFromString(TIV) alloc] init] autorelease];
}
- (void)booted:(id)bridge
{
  if ([bridge isKindOfClass:[KrollBridge class]]) {
    DebugLog(@"[DEBUG] Application booted in %f ms", ([NSDate timeIntervalSinceReferenceDate] - started) * 1000);
    fflush(stderr);
    appBooted = YES;

    if (launchedShortcutItem != nil) {
      [self handleShortcutItem:launchedShortcutItem queueToBootIfNotLaunched:YES];
      RELEASE_TO_NIL(launchedShortcutItem);
    }

    if (queuedBootEvents != nil) {
      for (NSString *notificationName in queuedBootEvents) {
        [[NSNotificationCenter defaultCenter] postNotificationName:notificationName object:self userInfo:[queuedBootEvents objectForKey:notificationName]];
      }
      RELEASE_TO_NIL(queuedBootEvents);
    }

    TiThreadPerformOnMainThread(^{
      [self validator];
    },
        YES);
  }
}

- (void)applicationDidFinishLaunching:(UIApplication *)application
{
  [TiExceptionHandler defaultExceptionHandler];
#ifndef DISABLE_TI_LOG_SERVER
  [TiLogServer startServer];
#endif
  [self initController];
  [self launchToUrl];
  [self boot];
}

- (UIImageView *)splashScreenImage
{
  if (splashScreenImage == nil) {
    splashScreenImage = [[UIImageView alloc] init];
    [splashScreenImage setBackgroundColor:[UIColor yellowColor]];
    [splashScreenImage setAutoresizingMask:UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth];
    [splashScreenImage setContentMode:UIViewContentModeScaleToFill];

    UIDeviceOrientation imageOrientation;
    UIUserInterfaceIdiom imageIdiom;

    UIImage *defaultImage = [controller defaultImageForOrientation:
                                            (UIDeviceOrientation)[[UIApplication sharedApplication] statusBarOrientation]
                                              resultingOrientation:&imageOrientation
                                                             idiom:&imageIdiom];
    if ([TiUtils isIPad] && ![TiUtils isIOS8OrGreater]) {
      CGAffineTransform transform;
      switch ([[UIApplication sharedApplication] statusBarOrientation]) {
      case UIInterfaceOrientationPortraitUpsideDown:
        transform = CGAffineTransformMakeRotation(M_PI);
        break;
      case UIInterfaceOrientationLandscapeLeft:
        transform = CGAffineTransformMakeRotation(-M_PI_2);
        break;
      case UIInterfaceOrientationLandscapeRight:
        transform = CGAffineTransformMakeRotation(M_PI_2);
        break;
      default:
        transform = CGAffineTransformIdentity;
        break;
      }
      [splashScreenImage setTransform:transform];
    }
    [splashScreenImage setImage:defaultImage];
    [splashScreenImage setFrame:[[UIScreen mainScreen] bounds]];
  }
  return splashScreenImage;
}

- (void)generateNotification:(NSDictionary *)dict
{
  // Check and see if any keys from APS and the rest of the dictionary match; if they do, just
  // bump out the dictionary as-is
  remoteNotification = [[NSMutableDictionary alloc] initWithDictionary:dict];
  NSDictionary *aps = [dict objectForKey:@"aps"];
  for (id key in aps) {
    if ([dict objectForKey:key] != nil) {
      DebugLog(@"[WARN] Conflicting keys in push APS dictionary and notification dictionary `%@`, not copying to toplevel from APS", key);
      continue;
    }
    [remoteNotification setValue:[aps valueForKey:key] forKey:key];
  }
}

- (BOOL)application:(UIApplication *)application shouldAllowExtensionPointIdentifier:(UIApplicationExtensionPointIdentifier)extensionPointIdentifier
{
  BOOL allowsCustomKeyboard = [TiUtils boolValue:[[TiApp tiAppProperties] objectForKey:@"allow-custom-keyboards"] def:YES];

  if ([extensionPointIdentifier isEqualToString:UIApplicationKeyboardExtensionPointIdentifier] && !allowsCustomKeyboard) {
    return NO;
  }

  return YES;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions_
{
  started = [NSDate timeIntervalSinceReferenceDate];
  [TiExceptionHandler defaultExceptionHandler];
#ifndef DISABLE_TI_LOG_SERVER
  [TiLogServer startServer];
#endif

  // nibless window
  window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];

  [self initController];

  // get the current remote device UUID if we have one
  NSString *curKey = [[NSUserDefaults standardUserDefaults] stringForKey:@"APNSRemoteDeviceUUID"];
  if (curKey != nil) {
    remoteDeviceUUID = [curKey copy];
  }

  launchOptions = [[NSMutableDictionary alloc] initWithDictionary:launchOptions_];

  NSURL *urlOptions = [launchOptions objectForKey:UIApplicationLaunchOptionsURLKey];
  NSString *sourceBundleId = [launchOptions objectForKey:UIApplicationLaunchOptionsSourceApplicationKey];
  NSDictionary *notification = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];

  [launchOptions setObject:NUMBOOL([[launchOptions objectForKey:UIApplicationLaunchOptionsLocationKey] boolValue]) forKey:@"launchOptionsLocationKey"];
  [launchOptions removeObjectForKey:UIApplicationLaunchOptionsLocationKey];

  localNotification = [[[self class] dictionaryWithLocalNotification:[launchOptions objectForKey:UIApplicationLaunchOptionsLocalNotificationKey]] retain];
  [launchOptions removeObjectForKey:UIApplicationLaunchOptionsLocalNotificationKey];

  // reset these to be a little more common if we have them
  if (urlOptions != nil) {
    [launchOptions setObject:[urlOptions absoluteString] forKey:@"url"];
    [launchOptions removeObjectForKey:UIApplicationLaunchOptionsURLKey];
  }
  if (sourceBundleId != nil) {
    [launchOptions setObject:sourceBundleId forKey:@"source"];
    [launchOptions removeObjectForKey:UIApplicationLaunchOptionsSourceApplicationKey];
  }
  if (notification != nil) {
    [self generateNotification:notification];
  }

  if ([TiUtils isIOS9OrGreater] == YES) {
    UIApplicationShortcutItem *shortcut = [launchOptions objectForKey:UIApplicationLaunchOptionsShortcutItemKey];

    if (shortcut != nil) {
      launchedShortcutItem = [shortcut retain];
    }
  }

  [self launchToUrl];
  [self boot];
  [self createDefaultDirectories];
  return YES;
}

// Handle URL-schemes / iOS >= 9
- (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<NSString *, id> *)options
{
  [launchOptions removeObjectForKey:UIApplicationLaunchOptionsURLKey];
  [launchOptions setObject:[url absoluteString] forKey:@"url"];
  [launchOptions removeObjectForKey:UIApplicationLaunchOptionsSourceApplicationKey];

  [launchOptions setObject:[options objectForKey:UIApplicationOpenURLOptionsSourceApplicationKey] ?: [NSNull null] forKey:@"source"];

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiApplicationLaunchedFromURL object:self userInfo:launchOptions];

  return YES;
}

// Handle URL-schemes / iOS < 9
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  [launchOptions removeObjectForKey:UIApplicationLaunchOptionsURLKey];
  [launchOptions setObject:[url absoluteString] forKey:@"url"];
  [launchOptions removeObjectForKey:UIApplicationLaunchOptionsSourceApplicationKey];

  [launchOptions setObject:sourceApplication ?: [NSNull null] forKey:@"source"];

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiApplicationLaunchedFromURL object:self userInfo:launchOptions];

  return YES;
}

#pragma mark
#pragma mark Background Fetch iOS 7

#ifdef USE_TI_FETCH

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{

  //Only for simulator builds
  NSArray *backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
  if ([backgroundModes containsObject:@"fetch"]) {

    // Generate unique key with timestamp.
    id key = [NSString stringWithFormat:@"Fetch-%f", [[NSDate date] timeIntervalSince1970]];

    // Store the completionhandler till we can come back and send appropriate message.
    if (pendingCompletionHandlers == nil) {
      pendingCompletionHandlers = [[NSMutableDictionary alloc] init];
    }

    [pendingCompletionHandlers setObject:[[completionHandler copy] autorelease] forKey:key];

    [self tryToPostBackgroundModeNotification:[NSMutableDictionary dictionaryWithObjectsAndKeys:key, @"handlerId", nil]
                         withNotificationName:kTiBackgroundFetchNotification];

    // We will go ahead and keeper a timer just in case the user returns the value too late - this is the worst case scenario.
    NSTimer *flushTimer = [NSTimer timerWithTimeInterval:TI_BACKGROUNDFETCH_MAX_INTERVAL target:self selector:@selector(fireCompletionHandler:) userInfo:key repeats:NO];
    [[NSRunLoop mainRunLoop] addTimer:flushTimer forMode:NSDefaultRunLoopMode];
  }
}

#endif

#pragma mark Remote and Local Notifications iOS 8

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiUserNotificationSettingsNotification object:self userInfo:notificationSettings];
}

- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forLocalNotification:(UILocalNotification *)notification withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)())completionHandler
{
  RELEASE_TO_NIL(localNotification);
  localNotification = [[TiApp dictionaryWithLocalNotification:notification withIdentifier:identifier] retain];

  if ([TiUtils isIOS9OrGreater] == YES) {
    [localNotification setValue:responseInfo[UIUserNotificationActionResponseTypedTextKey] forKey:@"typedText"];
  }

  [self tryToPostNotification:localNotification withNotificationName:kTiLocalNotificationAction completionHandler:completionHandler];
}

// iOS 9+
- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo withResponseInfo:(NSDictionary *)responseInfo completionHandler:(void (^)())completionHandler
{
  [self handleRemoteNotificationWithIdentifier:identifier
                                   andUserInfo:userInfo
                                  responseInfo:responseInfo
                             completionHandler:completionHandler];
}

// iOS < 9
- (void)application:(UIApplication *)application handleActionWithIdentifier:(NSString *)identifier forRemoteNotification:(NSDictionary *)userInfo completionHandler:(void (^)())completionHandler
{
  [self handleRemoteNotificationWithIdentifier:identifier
                                   andUserInfo:userInfo
                                  responseInfo:nil // iOS 9+ only
                             completionHandler:completionHandler];
}

#pragma mark Apple Watchkit handleWatchKitExtensionRequest
- (void)application:(UIApplication *)application
    handleWatchKitExtensionRequest:(NSDictionary *)userInfo
                             reply:(void (^)(NSDictionary *replyInfo))reply
{

  // Generate unique key with timestamp.
  id key = [NSString stringWithFormat:@"watchkit-reply-%f", [[NSDate date] timeIntervalSince1970]];

  if (pendingReplyHandlers == nil) {
    pendingReplyHandlers = [[NSMutableDictionary alloc] init];
  }

  [pendingReplyHandlers setObject:[[reply copy] autorelease] forKey:key];

  NSMutableDictionary *dic = [[[NSMutableDictionary alloc] init] autorelease];
  [dic setObject:key forKey:@"handlerId"];
  if (userInfo != nil) {
    [dic setObject:userInfo forKey:@"userInfo"];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiWatchKitExtensionRequest object:self userInfo:dic];
}

- (void)watchKitExtensionRequestHandler:(id)key withUserInfo:(NSDictionary *)userInfo
{
  if (pendingReplyHandlers == nil) {
    DebugLog(@"[ERROR] No WatchKitExtensionRequest have been recieved yet");
    return;
  }

  if ([pendingReplyHandlers objectForKey:key]) {
    void (^replyBlock)(NSDictionary *input);
    replyBlock = [pendingReplyHandlers objectForKey:key];
    replyBlock(userInfo);
    [pendingReplyHandlers removeObjectForKey:key];
  } else {
    DebugLog(@"[ERROR] The specified WatchKitExtensionRequest Handler with ID: %@ has already expired or removed from the system", key);
  }
}

#pragma mark -

#pragma mark Helper Methods

- (void)tryToPostNotification:(NSDictionary *)_notification withNotificationName:(NSString *)_notificationName completionHandler:(void (^)())completionHandler
{
  typedef void (^NotificationBlock)();

  NotificationBlock myNotificationBlock = ^void() {
    [[NSNotificationCenter defaultCenter] postNotificationName:_notificationName object:self userInfo:_notification];

    if (completionHandler != nil) {
      completionHandler();
    }
  };

  if (appBooted) {
    myNotificationBlock();
  } else {
    [[self queuedBootEvents] setObject:_notification forKey:_notificationName];
  }
}

- (void)tryToPostBackgroundModeNotification:(NSMutableDictionary *)userInfo withNotificationName:(NSString *)notificationName
{
  //Check to see if the app booted and we still have the completionhandler in the system
  NSString *key = [userInfo objectForKey:@"handlerId"];
  BOOL shouldContinue = NO;
  if ([key rangeOfString:@"Session"].location != NSNotFound) {
    if ([backgroundTransferCompletionHandlers objectForKey:key] != nil) {
      shouldContinue = YES;
    }
  } else if ([pendingCompletionHandlers objectForKey:key] != nil) {
    shouldContinue = YES;
  }
  if (!shouldContinue) {
    return;
  }
  if (appBooted) {
    [[NSNotificationCenter defaultCenter] postNotificationName:notificationName object:self userInfo:userInfo];
  } else {
    [[self queuedBootEvents] setObject:userInfo forKey:notificationName];
  }
}

//Clear out  the pendingCompletionHandlerQueue
- (void)flushCompletionHandlerQueue
{
  if (pendingCompletionHandlers != nil) {
    for (id key in pendingCompletionHandlers) {
      [self completionHandler:key withResult:2]; //UIBackgroundFetchResultFailed
    }
  }
  RELEASE_TO_NIL(pendingCompletionHandlers);
}

// This method gets called when the wall clock runs out and the completionhandler is still there.
- (void)fireCompletionHandler:(NSTimer *)timer
{
  id key = timer.userInfo;
  if ([pendingCompletionHandlers objectForKey:key]) {
    [self completionHandler:key withResult:UIBackgroundFetchResultFailed];
    //Send a event signalling the that backgroundfetch ended.
  }
}

// Gets called when user ends finishes with backgrounding stuff. By default this would always be called with UIBackgroundFetchResultNoData.
- (void)completionHandler:(id)key withResult:(int)result
{
  if ([pendingCompletionHandlers objectForKey:key]) {
    void (^completionHandler)(UIBackgroundFetchResult);
    completionHandler = [pendingCompletionHandlers objectForKey:key];
    completionHandler(result);
    [pendingCompletionHandlers removeObjectForKey:key];
  } else {
    DebugLog(@"[ERROR] The specified Completion Handler with ID: %@ has already expired or removed from the system", key);
  }
}

// Called to mark the end of background transfer while in the background.
- (void)completionHandlerForBackgroundTransfer:(id)key
{
  if ([backgroundTransferCompletionHandlers objectForKey:key] != nil) {
    void (^completionHandler)();
    completionHandler = [backgroundTransferCompletionHandlers objectForKey:key];
    [backgroundTransferCompletionHandlers removeObjectForKey:key];
    completionHandler();
  } else {
    DebugLog(@"[ERROR] The specified Completion Handler with ID: %@ has already expired or removed from the system", key);
  }
}

#pragma mark
#pragma mark Remote Notifications iOS 7

#ifdef USE_TI_SILENTPUSH
// Delegate callback for Silent Remote Notification.
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult result))completionHandler
{
  // Forward the callback
  if ([self respondsToSelector:@selector(application:didReceiveRemoteNotification:)]) {
    [self application:application didReceiveRemoteNotification:userInfo];
  }

  // This only here for Simulator builds.

  NSArray *backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
  if ([backgroundModes containsObject:@"remote-notification"]) {

    // Generate unique key with timestamp.
    id key = [NSString stringWithFormat:@"SilentPush-%f", [[NSDate date] timeIntervalSince1970]];

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

#pragma mark
#pragma mark Background Transfer Service iOS 7

//Delegate callback for Background Transfer completes.
- (void)application:(UIApplication *)application handleEventsForBackgroundURLSession:(NSString *)identifier completionHandler:(void (^)())completionHandler
{
  // Generate unique key with timestamp.
  id key = [NSString stringWithFormat:@"Session-%f", [[NSDate date] timeIntervalSince1970]];

  // Store the completionhandler till we can come back and send appropriate message.
  if (backgroundTransferCompletionHandlers == nil) {
    backgroundTransferCompletionHandlers = [[NSMutableDictionary alloc] init];
  }

  [backgroundTransferCompletionHandlers setObject:[[completionHandler copy] autorelease] forKey:key];
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:identifier, @"sessionId",
                                                   key, @"handlerId", nil];
  [self tryToPostBackgroundModeNotification:dict withNotificationName:kTiBackgroundTransfer];
}

#pragma mark Background Transfer Service Delegates.

//TODO: Move these delegates to the module post 3.2.0

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didFinishDownloadingToURL:(NSURL *)location
{
  // Copy downloaded file from location to tempFile (in NSTemporaryDirectory), because file in location will be removed after delegate completes
  NSError *error;
  NSFileManager *fileManager = [NSFileManager defaultManager];
  NSString *destinationFilename = location.lastPathComponent;
  NSURL *destinationURL = [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:destinationFilename];
  if ([fileManager fileExistsAtPath:[destinationURL path]]) {
    [fileManager removeItemAtURL:destinationURL error:nil];
  }
  BOOL success = [fileManager copyItemAtURL:location toURL:destinationURL error:&error];
  TiBlob *downloadedData;
  if (!success) {
    DebugLog(@"Unable to copy temp file. Error: %@", [error localizedDescription]);
    downloadedData = [[[TiBlob alloc] initWithData:[NSData dataWithContentsOfURL:location] mimetype:[Mimetypes mimeTypeForExtension:[location absoluteString]]] autorelease];
  } else {
    downloadedData = [[[TiBlob alloc] initWithFile:[destinationURL path]] autorelease];
  }

  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                                       [NSNumber numberWithUnsignedInteger:downloadTask.taskIdentifier], @"taskIdentifier",
                                                   downloadedData, @"data", nil];

  if (session.configuration.identifier) {
    [dict setObject:session.configuration.identifier forKey:@"sessionIdentifier"];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiURLDownloadFinished object:self userInfo:dict];
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask didWriteData:(int64_t)bytesWritten totalBytesWritten:(int64_t)totalBytesWritten totalBytesExpectedToWrite:(int64_t)totalBytesExpectedToWrite
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                                       [NSNumber numberWithUnsignedInteger:downloadTask.taskIdentifier], @"taskIdentifier",
                                                   [NSNumber numberWithUnsignedLongLong:bytesWritten], @"bytesWritten",
                                                   [NSNumber numberWithUnsignedLongLong:totalBytesWritten], @"totalBytesWritten",
                                                   [NSNumber numberWithUnsignedLongLong:totalBytesExpectedToWrite], @"totalBytesExpectedToWrite", nil];

  if (session.configuration.identifier) {
    [dict setObject:session.configuration.identifier forKey:@"sessionIdentifier"];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiURLDowloadProgress object:self userInfo:dict];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didSendBodyData:(int64_t)bytesSent
              totalBytesSent:(int64_t)totalBytesSent
    totalBytesExpectedToSend:(int64_t)totalBytesExpectedToSend
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:NUMUINTEGER(task.taskIdentifier), @"taskIdentifier",
                                                   [NSNumber numberWithUnsignedLongLong:bytesSent], @"bytesSent",
                                                   [NSNumber numberWithUnsignedLongLong:totalBytesSent], @"totalBytesSent",
                                                   [NSNumber numberWithUnsignedLongLong:totalBytesExpectedToSend], @"totalBytesExpectedToSend", nil];

  if (session.configuration.identifier) {
    [dict setObject:session.configuration.identifier forKey:@"sessionIdentifier"];
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiURLUploadProgress object:self userInfo:dict];
}

- (void)URLSession:(NSURLSession *)session task:(NSURLSessionTask *)task didCompleteWithError:(NSError *)error
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                                       [NSNumber numberWithUnsignedInteger:task.taskIdentifier], @"taskIdentifier",
                                                   nil];

  if (session.configuration.identifier) {
    [dict setObject:session.configuration.identifier forKey:@"sessionIdentifier"];
  }

  if (error) {
    NSDictionary *errorinfo = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO), @"success",
                                            NUMINTEGER([error code]), @"errorCode",
                                            [error localizedDescription], @"message",
                                            nil];
    [dict addEntriesFromDictionary:errorinfo];
  } else {
    NSDictionary *success = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES), @"success",
                                          NUMINT(0), @"errorCode",
                                          @"", @"message",
                                          nil];
    [dict addEntriesFromDictionary:success];
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiURLSessionCompleted object:self userInfo:dict];
}

- (void)URLSession:(NSURLSession *)session downloadTask:(NSURLSessionDownloadTask *)downloadTask
     didResumeAtOffset:(int64_t)fileOffset
    expectedTotalBytes:(int64_t)expectedTotalBytes
{
}

- (void)URLSessionDidFinishEventsForBackgroundURLSession:(NSURLSession *)session
{
  NSDictionary *dict = nil;

  if (session.configuration.identifier) {
    dict = @{ @"sessionIdentifier" : session.configuration.identifier };
  }

  [[NSNotificationCenter defaultCenter] postNotificationName:kTiURLSessionEventsCompleted object:self userInfo:dict];
}

#pragma mark

#ifdef TI_USE_KROLL_THREAD
- (void)waitForKrollProcessing
{
  CGFloat timeLeft = [[UIApplication sharedApplication] backgroundTimeRemaining] - 1.0;
  /*
	 *	In the extreme edge case of having come back to the app while
	 *	it's still waiting for Kroll Processing, 
	 *	backgroundTimeRemaining becomes undefined, and so we have
	 *	to limit the time left to a sane number in that case.
	 *	The other reason for the timeLeft limit is to not starve
	 *	possible later calls for waitForKrollProcessing.
	 */
  if (timeLeft > 3.0) {
    timeLeft = 3.0;
  } else if (timeLeft < 0.0) {
    return;
  }
  TiThreadProcessPendingMainThreadBlocks(timeLeft, NO, nil);
}
#endif

- (void)applicationWillTerminate:(UIApplication *)application
{
  NSNotificationCenter *theNotificationCenter = [NSNotificationCenter defaultCenter];
  _willTerminate = YES;
  //This will send out the 'close' message.
  [theNotificationCenter postNotificationName:kTiWillShutdownNotification object:self];
  NSCondition *condition = [[NSCondition alloc] init];

#ifdef USE_TI_UIWEBVIEW
  [xhrBridge shutdown:nil];
#endif

#ifdef KROLL_COVERAGE
  [KrollCoverageObject releaseCoverage];
#endif
  //These shutdowns return immediately, yes, but the main will still run the close that's in their queue.
  [kjsBridge shutdown:condition];

#ifndef DISABLE_TI_LOG_SERVER
  [TiLogServer stopServer];
#endif

  // THE CODE BELOW IS WRONG.
  // It only waits until ONE context has signialed that it has shut down; then we proceed along our merry way.
  // This might lead to problems like contexts not getting cleaned up properly due to premature app termination.
  // Plus, it blocks the main thread... meaning that we can have deadlocks if any context is currently executing
  // a request that requires operations on the main thread.
  [condition lock];
  [condition waitUntilDate:[NSDate dateWithTimeIntervalSinceNow:SHUTDOWN_TIMEOUT_IN_SEC]];
  [condition unlock];

  //This will shut down the modules.
  [theNotificationCenter postNotificationName:kTiShutdownNotification object:self];
#ifdef TI_USE_KROLL_THREAD
  [self waitForKrollProcessing];
#endif
  RELEASE_TO_NIL(condition);
  RELEASE_TO_NIL(kjsBridge);
#ifdef USE_TI_UIWEBVIEW
  RELEASE_TO_NIL(xhrBridge);
#endif
  RELEASE_TO_NIL(remoteNotification);
  RELEASE_TO_NIL(pendingCompletionHandlers);
  RELEASE_TO_NIL(backgroundTransferCompletionHandlers);
  RELEASE_TO_NIL(sessionId);
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application
{
  applicationInMemoryPanic = YES;
  [Webcolor flushCache];
// don't worry about KrollBridge since he's already listening
#ifdef USE_TI_UIWEBVIEW
  [xhrBridge gc];
#endif
  [self performSelector:@selector(clearMemoryPanic)
             withObject:nil
             afterDelay:0.0];
}

- (void)applicationWillResignActive:(UIApplication *)application
{
  if ([self forceSplashAsSnapshot]) {
#ifdef LAUNCHSCREEN_STORYBOARD
    UIStoryboard *sb = [UIStoryboard storyboardWithName:@"LaunchScreen" bundle:nil];
    UIViewController *vc = [sb instantiateInitialViewController];
    [[[self controller] topPresentedController] presentViewController:vc animated:NO completion:nil];
#else
    [window addSubview:[self splashScreenImage]];
#endif
  }
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiSuspendNotification object:self];

  // suspend any image loading
  [[ImageLoader sharedLoader] suspend];
  [kjsBridge gc];

#ifdef USE_TI_UIWEBVIEW
  [xhrBridge gc];
#endif
#ifdef TI_USE_KROLL_THREAD
  [self waitForKrollProcessing];
#endif
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
  // We should think about placing this inside "applicationWillBecomeActive" instead to make
  // the UI re-useable again more quickly
  if ([self forceSplashAsSnapshot]) {
#ifdef LAUNCHSCREEN_STORYBOARD
    [[[self controller] topPresentedController] dismissViewControllerAnimated:NO
                                                                   completion:nil];
#else
    if (splashScreenImage != nil) {
      [[self splashScreenImage] removeFromSuperview];
      RELEASE_TO_NIL(splashScreenImage);
    }
#endif
  }

  // NOTE: Have to fire a separate but non-'resume' event here because there is SOME information
  // (like new URL) that is not passed through as part of the normal foregrounding process.
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiResumedNotification object:self];

  // resume any image loading
  [[ImageLoader sharedLoader] resume];
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiPausedNotification object:self];

  if (backgroundServices == nil) {
    return;
  }

  UIApplication *app = [UIApplication sharedApplication];
  TiApp *tiapp = self;
  bgTask = [app beginBackgroundTaskWithExpirationHandler:^{
    // Synchronize the cleanup call on the main thread in case
    // the task actually finishes at around the same time.
    TiThreadPerformOnMainThread(^{
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
#ifdef TI_USE_KROLL_THREAD
  [self waitForKrollProcessing];
#endif
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
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

#pragma mark Handoff Delegates

#ifdef USE_TI_APPIOS
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
      restorationHandler:(void (^)(NSArray *restorableObjects))restorationHandler
{

  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:@{ @"activityType" : [userActivity activityType] }];

  if ([TiUtils isIOS9OrGreater] && [[userActivity activityType] isEqualToString:CSSearchableItemActionType]) {
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

  if (remoteNotificationDelegate != nil) {
    [remoteNotificationDelegate performSelector:@selector(application:didReceiveRemoteNotification:) withObject:application withObject:remoteNotification];
  }
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  NSString *token = [[[[deviceToken description] stringByReplacingOccurrencesOfString:@"<" withString:@""]
      stringByReplacingOccurrencesOfString:@">"
                                withString:@""]
      stringByReplacingOccurrencesOfString:@" "
                                withString:@""];

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

  if (remoteNotificationDelegate != nil) {
    [remoteNotificationDelegate performSelector:@selector(application:didRegisterForRemoteNotificationsWithDeviceToken:) withObject:application withObject:deviceToken];
  }
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  if (remoteNotificationDelegate != nil) {
    [remoteNotificationDelegate performSelector:@selector(application:didFailToRegisterForRemoteNotificationsWithError:) withObject:application withObject:error];
  }
}

#endif

//TODO: this should be compiled out in production mode
- (void)showModalError:(NSString *)message
{
  if (TI_APPLICATION_SHOW_ERROR_CONTROLLER == NO) {
    NSLog(@"[ERROR] Application received error: %@", message);
    return;
  }
  ENSURE_UI_THREAD(showModalError, message);
  TiErrorController *error = [[[TiErrorController alloc] initWithError:message] autorelease];
  [self showModalController:error animated:YES];
}

- (void)showModalController:(UIViewController *)modalController animated:(BOOL)animated
{
  [controller showControllerModal:modalController animated:animated];
}

- (void)hideModalController:(UIViewController *)modalController animated:(BOOL)animated
{
  [controller hideControllerModal:modalController animated:animated];
}

- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window
{
  if ([self windowIsKeyWindow]) {
    return [controller supportedOrientationsForAppDelegate];
  }

  //UIInterfaceOrientationMaskAll = 30;
  return 30;
}

- (void)dealloc
{
  RELEASE_TO_NIL(kjsBridge);
#ifdef USE_TI_UIWEBVIEW
  RELEASE_TO_NIL(xhrBridge);
#endif
  RELEASE_TO_NIL(loadView);
  RELEASE_TO_NIL(window);
  RELEASE_TO_NIL(launchOptions);
  RELEASE_TO_NIL(controller);
  RELEASE_TO_NIL(userAgent);
  RELEASE_TO_NIL(remoteDeviceUUID);
  RELEASE_TO_NIL(remoteNotification);
  RELEASE_TO_NIL(splashScreenImage);
#ifndef USE_JSCORE_FRAMEWORK
  if ([self debugMode]) {
    TiDebuggerStop();
  }
#endif
  RELEASE_TO_NIL(backgroundServices);
  RELEASE_TO_NIL(localNotification);
  [super dealloc];
}

- (NSString *)systemUserAgent
{
  UIDevice *currentDevice = [UIDevice currentDevice];
  NSString *currentLocaleIdentifier = [[NSLocale currentLocale] localeIdentifier];
  NSString *currentDeviceInfo = [NSString stringWithFormat:@"%@/%@; %@; %@;", [currentDevice model], [currentDevice systemVersion], [currentDevice systemName], currentLocaleIdentifier];
  NSString *kTitaniumUserAgentPrefix = [NSString stringWithFormat:@"%s%s%s %s%s", "Appc", "eler", "ator", "Tita", "nium"];
  return [NSString stringWithFormat:@"%@/%s (%@)", kTitaniumUserAgentPrefix, TI_VERSION_STR, currentDeviceInfo];
}

- (NSString *)userAgent
{
  return !userAgent ? [self systemUserAgent] : userAgent;
}

- (NSString *)remoteDeviceUUID
{
  return remoteDeviceUUID;
}

- (NSString *)sessionId
{
  return sessionId;
}

- (KrollBridge *)krollBridge
{
  return kjsBridge;
}

#pragma mark Backgrounding

- (void)beginBackgrounding
{
  if (runningServices == nil) {
    runningServices = [[NSMutableArray alloc] initWithCapacity:[backgroundServices count]];
  }

  for (TiProxy *proxy in backgroundServices) {
    [runningServices addObject:proxy];
    [proxy performSelector:@selector(beginBackground)];
  }
  [self checkBackgroundServices];
}

- (void)endBackgrounding
{
  for (TiProxy *proxy in backgroundServices) {
    [proxy performSelector:@selector(endBackground)];
    [runningServices removeObject:proxy];
  }

  [self checkBackgroundServices];
  RELEASE_TO_NIL(runningServices);
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
  RELEASE_TO_NIL(localNotification);
  localNotification = [[[self class] dictionaryWithLocalNotification:notification] retain];

  [self tryToPostNotification:localNotification withNotificationName:kTiLocalNotification completionHandler:nil];
}

- (BOOL)handleShortcutItem:(UIApplicationShortcutItem *)shortcutItem queueToBootIfNotLaunched:(BOOL)bootWait
{
  if (shortcutItem.type == nil) {
    NSLog(@"[ERROR] The shortcut type property is required");
    return NO;
  }

  NSMutableDictionary *dict = [NSMutableDictionary
      dictionaryWithObjectsAndKeys:shortcutItem.type, @"type",
      nil];

  if (shortcutItem.localizedTitle != nil) {
    [dict setObject:shortcutItem.localizedTitle forKey:@"title"];
  }

  if (shortcutItem.localizedSubtitle != nil) {
    [dict setObject:shortcutItem.localizedSubtitle forKey:@"subtitle"];
  }

  if (shortcutItem.userInfo != nil) {
    [dict setObject:shortcutItem.userInfo forKey:@"userInfo"];
  }

  // Update launchOptions to include the mapped dictionary-shortcut instead of the UIShortcutItem
  [launchOptions setObject:dict forKey:UIApplicationLaunchOptionsShortcutItemKey];

  if (appBooted) {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiApplicationShortcut
                                                        object:self
                                                      userInfo:dict];
  } else if (bootWait) {
    [[self queuedBootEvents] setObject:dict forKey:kTiApplicationShortcut];
  }

  return YES;
}

- (void)handleRemoteNotificationWithIdentifier:(NSString *)identifier
                                   andUserInfo:(NSDictionary *)userInfo
                                  responseInfo:(NSDictionary *)responseInfo
                             completionHandler:(void (^)())completionHandler
{
  RELEASE_TO_NIL(remoteNotification);
  [self generateNotification:userInfo];

  NSMutableDictionary *event = [[NSMutableDictionary alloc] init];
  NSString *category = remoteNotification[@"category"];

  event[@"data"] = remoteNotification;

  if (identifier != nil) {
    event[@"identifier"] = identifier;
  }
  if (responseInfo[UIUserNotificationActionResponseTypedTextKey] != nil) {
    event[@"typedText"] = responseInfo[UIUserNotificationActionResponseTypedTextKey];
  }
  if (category != nil) {
    event[@"category"] = category;
  }

  [self tryToPostNotification:[event autorelease] withNotificationName:kTiRemoteNotificationAction completionHandler:completionHandler];
}

- (void)application:(UIApplication *)application
    performActionForShortcutItem:(UIApplicationShortcutItem *)shortcutItem
               completionHandler:(void (^)(BOOL succeeded))completionHandler
{

  BOOL handledShortCutItem = [self handleShortcutItem:shortcutItem queueToBootIfNotLaunched:NO];
  completionHandler(handledShortCutItem);
}

- (void)registerBackgroundService:(TiProxy *)proxy
{
  if (backgroundServices == nil) {
    backgroundServices = [[NSMutableArray alloc] initWithCapacity:1];
  }

  //Only add if it isn't already added
  if (![backgroundServices containsObject:proxy]) {
    [backgroundServices addObject:proxy];
  }
}

- (void)checkBackgroundServices
{
  if ([runningServices count] == 0) {
    // Synchronize the cleanup call on the main thread in case
    // the expiration handler is fired at the same time.
    TiThreadPerformOnMainThread(^{
      if (bgTask != UIBackgroundTaskInvalid) {
        [[UIApplication sharedApplication] endBackgroundTask:bgTask];
        bgTask = UIBackgroundTaskInvalid;
      }
    },
        NO);
  }
}

- (void)unregisterBackgroundService:(TiProxy *)proxy
{
  [backgroundServices removeObject:proxy];
  [runningServices removeObject:proxy];
  [self checkBackgroundServices];
}

- (void)stopBackgroundService:(TiProxy *)proxy
{
  [runningServices removeObject:proxy];
  [self checkBackgroundServices];
}

#define NOTNIL(v) ((v == nil) ? (id)[NSNull null] : v)

+ (NSDictionary *)dictionaryWithLocalNotification:(UILocalNotification *)notification withIdentifier:(NSString *)identifier
{
  if (notification == nil) {
    return nil;
  }
  NSMutableDictionary *event = [NSMutableDictionary dictionary];
  [event setObject:NOTNIL([notification fireDate]) forKey:@"date"];
  [event setObject:NOTNIL([[notification timeZone] name]) forKey:@"timezone"];
  [event setObject:NOTNIL([notification alertBody]) forKey:@"alertBody"];
  [event setObject:NOTNIL([notification alertAction]) forKey:@"alertAction"];
  [event setObject:NOTNIL([notification alertLaunchImage]) forKey:@"alertLaunchImage"];
  [event setObject:NOTNIL([notification soundName]) forKey:@"sound"];
  [event setObject:NUMINTEGER([notification applicationIconBadgeNumber]) forKey:@"badge"];
  [event setObject:NOTNIL([notification userInfo]) forKey:@"userInfo"];
  [event setObject:NUMBOOL([[UIApplication sharedApplication] applicationState] != UIApplicationStateActive) forKey:@"inBackground"];
  //include category for ios8
  if ([TiUtils isIOS8OrGreater]) {
    [event setObject:NOTNIL([notification category]) forKey:@"category"];
    [event setObject:NOTNIL(identifier) forKey:@"identifier"];
  }

  return event;
}
+ (NSDictionary *)dictionaryWithLocalNotification:(UILocalNotification *)notification
{
  return [self dictionaryWithLocalNotification:notification withIdentifier:nil];
}

// Returns an NSDictionary with the properties from tiapp.xml
// this is called from Ti.App.Properties and other places.
+ (NSDictionary *)tiAppProperties
{
  static NSDictionary *props;

  if (props == nil) {
    // Get the props from the encrypted json file
    NSString *tiAppPropertiesPath = [[TiHost resourcePath] stringByAppendingPathComponent:@"_app_props_.json"];
    NSData *jsonData = [TiUtils loadAppResource:[NSURL fileURLWithPath:tiAppPropertiesPath]];

    if (jsonData == nil) {
      // Not found in encrypted file, this means we're in development mode, get it from the filesystem
      jsonData = [NSData dataWithContentsOfFile:tiAppPropertiesPath];
    }

    NSString *errorString = nil;
    // Get the JSON data and create the NSDictionary.
    if (jsonData) {
      NSError *error = nil;
      props = [[NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error] retain];
      errorString = [error localizedDescription];
    } else {
      // If we have no data...
      // This should never happen on a Titanium app using the node.js CLI
      errorString = @"File not found";
    }
    if (errorString != nil) {
      // Let the developer know that we could not load the tiapp.xml properties.
      DebugLog(@"[ERROR] Could not load tiapp.xml properties, error was %@", errorString);
      // Create an empty dictioary to avoid running this code over and over again.
      props = [[NSDictionary dictionary] retain];
    }
  }
  return props;
}

@end
