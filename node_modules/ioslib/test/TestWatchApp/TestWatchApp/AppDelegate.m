//
//  AppDelegate.m
//  TestWatchApp
//
//  Created by Chris Barber on 8/16/14.
//
//

#import "AppDelegate.h"

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifdef TEST_BASIC_LOGGING
	NSLog(@"[INFO] info test");
	NSLog(@"[DEBUG] debug test");
	NSLog(@"[DEBUG] line 1 test\n[DEBUG] line 2 test");
	NSLog(@"[DEBUG] AUTO_EXIT");
#endif

#ifdef TEST_TIMOCHA
	NSLog(@"[DEBUG] TI_MOCHA_RESULT_START");
	NSLog(@"[DEBUG] {\"foo\":\"bar\"}");
	NSLog(@"[DEBUG] TI_MOCHA_RESULT_STOP");
#endif

#ifdef TEST_TIMOCHA_MULTIPLE_LINES
	NSLog(@"[DEBUG] TI_MOCHA_RESULT_START");
	NSLog(@"[DEBUG] {");
	NSLog(@"[DEBUG] \"foo\":\"bar\"");
	NSLog(@"[DEBUG] }");
	NSLog(@"[DEBUG] TI_MOCHA_RESULT_STOP");
#endif

#ifdef TEST_TIMEOUT
	// do nothing, we want to time out explicitly here
#endif

#ifdef TEST_OBJC_CRASH
	// force a crash (unrecognized selector)
	SEL selector = NSSelectorFromString(@"pleaseCrash");
	[NSObject performSelector:selector];
#endif

#ifdef TEST_C_CRASH
	// force a crash (divide by zero)
	int *x = NULL;
	*x = 99;
#endif

	// Override point for customization after application launch.
	return YES;
}

- (void)applicationWillResignActive:(UIApplication *)application
{
	// Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
	// Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
	// Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
	// If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
	// Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
	// Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
}

- (void)applicationWillTerminate:(UIApplication *)application
{
	// Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
}

@end
