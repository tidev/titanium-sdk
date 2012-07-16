/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <stdio.h>
#include <execinfo.h>

#import "TiApp.h"
#import "Webcolor.h"
#import "TiBase.h"
#import "TiErrorController.h"
#import "NSData+Additions.h"
#import "ImageLoader.h"
#import "TiDebugger.h"
#import <QuartzCore/QuartzCore.h>
#import <AVFoundation/AVFoundation.h>
#import "ApplicationDefaults.h"
#import <libkern/OSAtomic.h>

#ifdef KROLL_COVERAGE
# import "KrollCoverage.h"
#endif

TiApp* sharedApp;

int TiDebugPort = 2525;

extern NSString * const TI_APPLICATION_DEPLOYTYPE;
extern NSString * const TI_APPLICATION_NAME;
extern NSString * const TI_APPLICATION_VERSION;

NSString * TITANIUM_VERSION;

extern void UIColorFlushCache();

#define SHUTDOWN_TIMEOUT_IN_SEC	3
#define TIV @"TiVerify"

//
// thanks to: http://www.restoroot.com/Blog/2008/10/18/crash-reporter-for-iphone-applications/
//
void MyUncaughtExceptionHandler(NSException *exception) 
{
	static BOOL insideException = NO;
	
	// prevent recursive exceptions
	if (insideException==YES)
	{
		exit(1);
		return;
	}
	
	insideException = YES;
    NSArray *callStackArray = [exception callStackReturnAddresses];
    int frameCount = [callStackArray count];
    void *backtraceFrames[frameCount];
	
    for (int i=0; i<frameCount; i++) 
	{
        backtraceFrames[i] = (void *)[[callStackArray objectAtIndex:i] unsignedIntegerValue];
    }
	
	char **frameStrings = backtrace_symbols(&backtraceFrames[0], frameCount);
	
	NSMutableString *stack = [[NSMutableString alloc] init];
	
	[stack appendString:@"[ERROR] The application has crashed with an unhandled exception. Stack trace:\n\n"];
	
	if(frameStrings != NULL) 
	{
		for(int x = 0; x < frameCount; x++) 
		{
			if(frameStrings[x] == NULL) 
			{ 
				break; 
			}
			[stack appendFormat:@"%s\n",frameStrings[x]];
		}
		free(frameStrings);
	}
	[stack appendString:@"\n"];
			 
	NSLog(@"%@",stack);
		
	[stack release];
	
	//TODO - attempt to report the exception
	insideException=NO;
}

BOOL applicationInMemoryPanic = NO;

TI_INLINE void waitForMemoryPanicCleared();   //WARNING: This must never be run on main thread, or else there is a risk of deadlock!

@interface TiApp()
-(void)checkBackgroundServices;
@end

@implementation TiApp


-(void)clearMemoryPanic
{
    applicationInMemoryPanic = NO;
}

@synthesize window, remoteNotificationDelegate, controller;

+(void)initialize
{
	TiThreadInitalize();
}

+ (TiApp*)app
{
	return sharedApp;
}

+(TiRootViewController*)controller;
{
	return [sharedApp controller];
}

-(TiContextGroupRef)contextGroup
{
	if(contextGroup == nil)
	{
		contextGroup = TiContextGroupCreate();
		TiContextGroupRetain(contextGroup);
	}
	return contextGroup;
}


+(TiContextGroupRef)contextGroup
{
	return [sharedApp contextGroup];
}


-(void)startNetwork
{
	ENSURE_UI_THREAD_0_ARGS;
	networkActivityCount ++;
	if (networkActivityCount == 1)
	{
		[[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:YES];
	}
}

-(void)stopNetwork
{
	ENSURE_UI_THREAD_0_ARGS;
	networkActivityCount --;
	if (networkActivityCount == 0)
	{
		[[UIApplication sharedApplication] setNetworkActivityIndicatorVisible:NO];
	}
}

-(NSDictionary*)launchOptions
{
	return launchOptions;
}


-(void)initController
{
	sharedApp = self;
	
	// attach our main view controller
	controller = [[TiRootViewController alloc] init];
	
	// attach our main view controller... IF we haven't already loaded the main window.
	[window setRootViewController:controller];
    [window makeKeyAndVisible];
}

-(BOOL)windowIsKeyWindow
{
    return [window isKeyWindow];
}

-(UIView *) topMostView
{
    UIWindow  *currentKeyWindow_ = [[UIApplication sharedApplication] keyWindow];
    return [[currentKeyWindow_ subviews] lastObject];
}
-(void)attachXHRBridgeIfRequired
{
#ifdef USE_TI_UIWEBVIEW
	if (xhrBridge==nil)
	{
		xhrBridge = [[XHRBridge alloc] initWithHost:self];
		[xhrBridge boot:self url:nil preload:nil];
	}
#endif
}
//To load application Defaults 
- (void) loadUserDefaults
{
	NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
	NSDictionary *appDefaults = [ApplicationDefaults copyDefaults];
	if(appDefaults != nil)
	{
		[defaults registerDefaults:appDefaults];
	}
	[appDefaults release];
}

- (void)boot
{
	DebugLog(@"[INFO] %@/%@ (%s.__GITHASH__)",TI_APPLICATION_NAME,TI_APPLICATION_VERSION,TI_VERSION_STR);
	
	sessionId = [[TiUtils createUUID] retain];
	TITANIUM_VERSION = [[NSString stringWithCString:TI_VERSION_STR encoding:NSUTF8StringEncoding] retain];

	NSString *filePath = [[NSBundle mainBundle] pathForResource:@"debugger" ofType:@"plist"];
    if (filePath != nil) {
        NSMutableDictionary *params = [[NSMutableDictionary alloc] initWithContentsOfFile:filePath];
        NSString *host = [params objectForKey:@"host"];
        NSString *port = [params objectForKey:@"port"];
        if (host != nil && ![host isEqual:@""] && ![host isEqual:@"__DEBUGGER_HOST__"])
        {
            [self setDebugMode:YES];
            TiDebuggerStart(host,[port intValue]);
        }
        [params release];
    }
	
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
	if ([bridge isKindOfClass:[KrollBridge class]])
	{
		DebugLog(@"[DEBUG] Application booted in %f ms", ([NSDate timeIntervalSinceReferenceDate]-started) * 1000);
		fflush(stderr);
		TiThreadPerformOnMainThread(^{[self validator];}, YES);
	}
}

- (void)applicationDidFinishLaunching:(UIApplication *)application 
{
	NSSetUncaughtExceptionHandler(&MyUncaughtExceptionHandler);
	[self initController];
	[self loadUserDefaults];
	[self boot];
}

- (void)generateNotification:(NSDictionary*)dict
{
	// Check and see if any keys from APS and the rest of the dictionary match; if they do, just
	// bump out the dictionary as-is
	remoteNotification = [[NSMutableDictionary alloc] initWithDictionary:dict];
	NSDictionary* aps = [dict objectForKey:@"aps"];
	for (id key in aps) 
	{
		if ([dict objectForKey:key] != nil) {
			DebugLog(@"[WARN] Conflicting keys in push APS dictionary and notification dictionary `%@`, not copying to toplevel from APS", key);
			continue;
		}
		[remoteNotification setValue:[aps valueForKey:key] forKey:key];
	}
	DebugLog(@"[WARN] Accessing APS keys from toplevel of notification is deprecated");
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions_
{
	started = [NSDate timeIntervalSinceReferenceDate];
	NSSetUncaughtExceptionHandler(&MyUncaughtExceptionHandler);

	// nibless window
	window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];

	[self initController];

	// get the current remote device UUID if we have one
	NSString *curKey = [[NSUserDefaults standardUserDefaults] stringForKey:@"APNSRemoteDeviceUUID"];
	if (curKey!=nil)
	{
		remoteDeviceUUID = [curKey copy];
	}

	launchOptions = [[NSMutableDictionary alloc] initWithDictionary:launchOptions_];
	
	NSURL *urlOptions = [launchOptions objectForKey:UIApplicationLaunchOptionsURLKey];
	NSString *sourceBundleId = [launchOptions objectForKey:UIApplicationLaunchOptionsSourceApplicationKey];
	NSDictionary *notification = [launchOptions objectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
	
	// reset these to be a little more common if we have them
	if (urlOptions!=nil)
	{
		[launchOptions setObject:[urlOptions absoluteString] forKey:@"url"];
		[launchOptions removeObjectForKey:UIApplicationLaunchOptionsURLKey];
	}
	if (sourceBundleId!=nil)
	{
		[launchOptions setObject:sourceBundleId forKey:@"source"];
		[launchOptions removeObjectForKey:UIApplicationLaunchOptionsSourceApplicationKey];
	}
	if (notification!=nil)
	{
		[self generateNotification:notification];
	}
	[self loadUserDefaults];
	[self boot];
	
	return YES;
}

- (BOOL)application:(UIApplication *)application handleOpenURL:(NSURL *)url
{
	[launchOptions removeObjectForKey:UIApplicationLaunchOptionsURLKey];	
	[launchOptions setObject:[url absoluteString] forKey:@"url"];
    return YES;
}

-(void)waitForKrollProcessing
{
	CGFloat timeLeft = [[UIApplication sharedApplication] backgroundTimeRemaining]-1.0;
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
	}
	else if(timeLeft < 0.0) {
		return;
	}
	TiThreadProcessPendingMainThreadBlocks(timeLeft, NO, nil);
}

- (void)applicationWillTerminate:(UIApplication *)application
{
	NSNotificationCenter * theNotificationCenter = [NSNotificationCenter defaultCenter];

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
	[self waitForKrollProcessing];

	RELEASE_TO_NIL(condition);
	RELEASE_TO_NIL(kjsBridge);
#ifdef USE_TI_UIWEBVIEW 
	RELEASE_TO_NIL(xhrBridge);
#endif	
	RELEASE_TO_NIL(remoteNotification);
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
    [self performSelector:@selector(clearMemoryPanic) withObject:nil afterDelay:0.0];
}

-(void)applicationWillResignActive:(UIApplication *)application
{
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiSuspendNotification object:self];
	
	// suspend any image loading
	[[ImageLoader sharedLoader] suspend];
	[kjsBridge gc];
	
#ifdef USE_TI_UIWEBVIEW
	[xhrBridge gc];
#endif 
	[self waitForKrollProcessing];
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
	// NOTE: Have to fire a separate but non-'resume' event here because there is SOME information
	// (like new URL) that is not passed through as part of the normal foregrounding process.
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiResumedNotification object:self];
	
	// resume any image loading
	[[ImageLoader sharedLoader] resume];
}

-(void)applicationDidEnterBackground:(UIApplication *)application
{
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiPausedNotification object:self];
	[TiUtils queueAnalytics:@"ti.background" name:@"ti.background" data:nil];

	if (backgroundServices==nil)
	{
		return;
	}
	
	UIApplication* app = [UIApplication sharedApplication];
	TiApp *tiapp = self;
	bgTask = [app beginBackgroundTaskWithExpirationHandler:^{
        // Synchronize the cleanup call on the main thread in case
        // the task actually finishes at around the same time.
        dispatch_async(dispatch_get_main_queue(), ^{
            if (bgTask != UIBackgroundTaskInvalid)
            {
                [app endBackgroundTask:bgTask];
                bgTask = UIBackgroundTaskInvalid;
            }
        });
    }];
	// Start the long-running task and return immediately.
    dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
		
        // Do the work associated with the task.
		[tiapp beginBackgrounding];
    });
	[self waitForKrollProcessing];
}

-(void)applicationWillEnterForeground:(UIApplication *)application
{
    [sessionId release];
    sessionId = [[TiUtils createUUID] retain];
    
    //TIMOB-3432. Ensure url is cleared when resume event is fired.
    [launchOptions removeObjectForKey:@"url"];

	[[NSNotificationCenter defaultCenter] postNotificationName:kTiResumeNotification object:self];
	
	[TiUtils queueAnalytics:@"ti.foreground" name:@"ti.foreground" data:nil];
    
	if (backgroundServices==nil)
	{
		return;
	}
	
	[self endBackgrounding];

}

-(id)remoteNotification
{
	return remoteNotification;
}

#pragma mark Push Notification Delegates

#ifdef USE_TI_NETWORKREGISTERFORPUSHNOTIFICATIONS

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
	// NOTE: this is called when the app is *running* after receiving a push notification
	// otherwise, if the app is started from a push notification, this method will not be 
	// called
	RELEASE_TO_NIL(remoteNotification);
	[self generateNotification:userInfo];
	
	if (remoteNotificationDelegate!=nil)
	{
		[remoteNotificationDelegate performSelector:@selector(application:didReceiveRemoteNotification:) withObject:application withObject:remoteNotification];
	}
}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{ 
	NSString *token = [[[[deviceToken description] stringByReplacingOccurrencesOfString:@"<"withString:@""] 
						stringByReplacingOccurrencesOfString:@">" withString:@""] 
					   stringByReplacingOccurrencesOfString: @" " withString: @""];
	
	RELEASE_TO_NIL(remoteDeviceUUID);
	remoteDeviceUUID = [token copy];
	
	NSString *curKey = [[NSUserDefaults standardUserDefaults] stringForKey:@"APNSRemoteDeviceUUID"];
	if (curKey==nil || ![curKey isEqualToString:remoteDeviceUUID])
	{
		// this is the first time being registered, we need to indicate to our backend that we have a 
		// new registered device to enable this device to receive notifications from the cloud
		[[NSUserDefaults standardUserDefaults] setObject:remoteDeviceUUID forKey:@"APNSRemoteDeviceUUID"];
		NSDictionary *userInfo = [NSDictionary dictionaryWithObject:remoteDeviceUUID forKey:@"deviceid"];
		[[NSNotificationCenter defaultCenter] postNotificationName:kTiRemoteDeviceUUIDNotification object:self userInfo:userInfo];
		DebugLog(@"[DEBUG] Registered new device for remote push notifications: %@",remoteDeviceUUID);
	}
	
	if (remoteNotificationDelegate!=nil)
	{
		[remoteNotificationDelegate performSelector:@selector(application:didRegisterForRemoteNotificationsWithDeviceToken:) withObject:application withObject:deviceToken];
	}
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
	if (remoteNotificationDelegate!=nil)
	{
		[remoteNotificationDelegate performSelector:@selector(application:didFailToRegisterForRemoteNotificationsWithError:) withObject:application withObject:error];
	}
}

#endif

//TODO: this should be compiled out in production mode
-(void)showModalError:(NSString*)message
{
	if ([TI_APPLICATION_DEPLOYTYPE isEqualToString:@"production"])
	{
		NSLog(@"[ERROR] Application received error: %@",message);
		return;
	}
	ENSURE_UI_THREAD(showModalError,message);
	TiErrorController *error = [[[TiErrorController alloc] initWithError:message] autorelease];
	[controller presentModalViewController:error animated:YES];
}

-(void)attachModal:(UIViewController*)modalController toController:(UIViewController*)presentingController animated:(BOOL)animated
{
	UIViewController * currentModalController = [presentingController modalViewController];

	if (currentModalController == modalController)
	{
		DeveloperLog(@"[WARN] Trying to present a modal window that already is a modal window.");
		return;
	}
	if (currentModalController == nil)
	{
		[presentingController presentModalViewController:modalController animated:animated];
		return;
	}
	[self attachModal:modalController toController:currentModalController animated:animated];
}

-(void)showModalController:(UIViewController*)modalController animated:(BOOL)animated
{
//In the rare event that the iPad application started in landscape, has not been rotated,
//And is presenting a modal for the first time, 
		handledModal = YES;

	if(!handledModal)
	{
		handledModal = YES;
		UIView * rootView = [controller view];
		UIView * windowView = [rootView superview];
		[rootView removeFromSuperview];
		[windowView addSubview:rootView];
	}

	/*
	 *	In iPad (TIMOB 7839) there is a bug in iOS where a text field having
	 *	focus during a modal presentation can lead to an edge case.
	 *	The new view is not attached yet, and any current view will be covered
	 *	by the new modal controller. Because of this, there is no valid reason
	 *	to have a text field with focus.
	 */
	[controller dismissKeyboard];

	UINavigationController *navController = nil; //[(TiRootViewController *)controller focusedViewController];
	if (navController==nil)
	{
		navController = [controller navigationController];
	}
	// if we have a nav controller, use him, otherwise use our root controller
	if (navController!=nil)
	{
		[controller windowFocused:modalController];
		[self attachModal:modalController toController:navController animated:animated];
	}
	else
	{
		[self attachModal:modalController toController:controller animated:animated];
	}
}

-(void)hideModalController:(UIViewController*)modalController animated:(BOOL)animated
{
	UIViewController *navController = [modalController parentViewController];

	//	As of iOS 5, Apple is phasing out the modal concept in exchange for
	//	'presenting', making all non-Ti modal view controllers claim to have
	//	no parent view controller.
	if (navController==nil && [modalController respondsToSelector:@selector(presentingViewController)])
	{
		navController = [modalController presentingViewController];
	}
	[controller windowClosed:modalController];
	if (navController!=nil)
	{
		[navController dismissModalViewControllerAnimated:animated];
	}
	else 
	{
		[controller dismissModalViewControllerAnimated:animated];
	}
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
    if ([self debugMode]) {
        TiDebuggerStop();
    }
	RELEASE_TO_NIL(backgroundServices);
	RELEASE_TO_NIL(localNotification);
	[super dealloc];
}

- (NSString*)userAgent
{
	if (userAgent==nil)
	{
		UIDevice *currentDevice = [UIDevice currentDevice];
		NSString *currentLocaleIdentifier = [[NSLocale currentLocale] localeIdentifier];
		NSString *currentDeviceInfo = [NSString stringWithFormat:@"%@/%@; %@; %@;",[currentDevice model],[currentDevice systemVersion],[currentDevice systemName],currentLocaleIdentifier];
		NSString *kTitaniumUserAgentPrefix = [NSString stringWithFormat:@"%s%s%s %s%s","Appc","eler","ator","Tita","nium"];
		userAgent = [[NSString stringWithFormat:@"%@/%s (%@)",kTitaniumUserAgentPrefix,TI_VERSION_STR,currentDeviceInfo] retain];
	}
	return userAgent;
}

-(NSString*)remoteDeviceUUID
{
	return remoteDeviceUUID;
}

-(NSString*)sessionId
{
	return sessionId;
}

-(KrollBridge*)krollBridge
{
	return kjsBridge;
}

#pragma mark Backgrounding

-(void)beginBackgrounding
{
	if (runningServices == nil) {
		runningServices = [[NSMutableArray alloc] initWithCapacity:[backgroundServices count]];
	}
	
	for (TiProxy *proxy in backgroundServices)
	{
		[runningServices addObject:proxy];
		[proxy performSelector:@selector(beginBackground)];
	}
	[self checkBackgroundServices];
}

-(void)endBackgrounding
{
	for (TiProxy *proxy in backgroundServices)
	{
		[proxy performSelector:@selector(endBackground)];
		[runningServices removeObject:proxy];
	}

	[self checkBackgroundServices];
	RELEASE_TO_NIL(runningServices);
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
	RELEASE_TO_NIL(localNotification);
	localNotification = [notification retain];
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiLocalNotification object:notification userInfo:nil];
}

-(UILocalNotification*)localNotification
{
	return localNotification;
}

-(void)registerBackgroundService:(TiProxy*)proxy
{
	if (backgroundServices==nil)
	{
		backgroundServices = [[NSMutableArray alloc] initWithCapacity:1];
	}
	
	//Only add if it isn't already added
	if (![backgroundServices containsObject:proxy]) {
		[backgroundServices addObject:proxy];
	}
}

-(void)checkBackgroundServices
{
	if ([runningServices count] == 0)
	{		
		// Synchronize the cleanup call on the main thread in case
		// the expiration handler is fired at the same time.
		dispatch_async(dispatch_get_main_queue(), ^{
			if (bgTask != UIBackgroundTaskInvalid)
			{
				[[UIApplication sharedApplication] endBackgroundTask:bgTask];
				bgTask = UIBackgroundTaskInvalid;
			}
		});
	}
}

-(void)unregisterBackgroundService:(TiProxy*)proxy
{
	[backgroundServices removeObject:proxy];
	[runningServices removeObject:proxy];
	[self checkBackgroundServices];
}

-(void)stopBackgroundService:(TiProxy *)proxy
{
	[runningServices removeObject:proxy];
	[self checkBackgroundServices];
}

@end
