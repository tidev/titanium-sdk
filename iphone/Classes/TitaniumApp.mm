/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#include <stdio.h>
#include <execinfo.h>

#import "TitaniumApp.h"
#import "Webcolor.h"
#import "TiBase.h"
#import "TitaniumErrorController.h"
#import <QuartzCore/QuartzCore.h>

TitaniumApp* sharedApp;

NSString * const kTitaniumUserAgentPrefix = @"Appcelerator Titanium"; 

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

@implementation TitaniumApp

@synthesize window;

+ (TitaniumApp*)app
{
	return sharedApp;
}

-(void)changeNetworkStatus:(NSNumber*)yn
{
	ENSURE_UI_THREAD(changeNetworkStatus,yn);
	[UIApplication sharedApplication].networkActivityIndicatorVisible = [TiUtils boolValue:yn];
}

-(void)startNetwork
{
	[networkActivity lock];
	networkActivityCount++;
	if (networkActivityCount==1)
	{
		[self changeNetworkStatus:[NSNumber numberWithBool:YES]];
	}
	[networkActivity unlock];
}

-(void)stopNetwork
{
	[networkActivity lock];
	networkActivityCount--;
	if (networkActivityCount==0)
	{
		[self changeNetworkStatus:[NSNumber numberWithBool:NO]];
	}
	[networkActivity unlock];
}

-(NSDictionary*)launchOptions
{
	return launchOptions;
}

- (UIView*)attachSplash
{
	CGFloat splashY = -TI_STATUSBAR_HEIGHT;
	if ([[UIApplication sharedApplication] isStatusBarHidden])
	{
		splashY = 0;
	}
	RELEASE_TO_NIL(loadView);
	UIScreen *screen = [UIScreen mainScreen];
	loadView = [[UIImageView alloc] initWithFrame:CGRectMake(0, splashY, screen.bounds.size.width, screen.bounds.size.height)];
	loadView.image = [UIImage imageNamed:@"Default.png"];
	[controller.view addSubview:loadView];
	return loadView;
}

- (void)loadSplash
{
	sharedApp = self;
	networkActivity = [[NSLock alloc] init];
	networkActivityCount = 0;
	
	// attach our main view controller
	controller = [[TitaniumViewController alloc] init];
	[window addSubview:controller.view];
	controller.view.backgroundColor = [UIColor clearColor];
	
	
	// create our loading view
	[self attachSplash];
	
    [window makeKeyAndVisible];
}

- (BOOL)isSplashVisible
{
	return splashDone==NO;
}

-(UIView*)splash
{
	return loadView;
}

- (void)hideSplash:(id)event
{
	// this is called when the first window is loaded
	// and should only be done once (obviously) - the
	// caller is responsible for setting up the animation
	// context before calling this and committing it afterwards
	if (loadView!=nil && splashDone==NO)
	{
		splashDone = YES;
		[loadView removeFromSuperview];
		RELEASE_TO_NIL(loadView);
	}
}

- (void)boot
{
	kjsBridge = [[KrollBridge alloc] initWithHost:self];
	xhrBridge = [[XHRBridge alloc] initWithHost:self];
	
	[kjsBridge boot:self url:nil preload:nil];
	[xhrBridge boot:self url:nil preload:nil];

	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardDidHide:) name:UIKeyboardDidHideNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardDidShow:) name:UIKeyboardDidShowNotification object:nil];
}

- (void)booted:(id)bridge
{
	if ([bridge isKindOfClass:[KrollBridge class]])
	{
		NSLog(@"[DEBUG] application booted in %f ms", ([NSDate timeIntervalSinceReferenceDate]-started) * 1000);
		fflush(stderr);
	}
}

- (void)applicationDidFinishLaunching:(UIApplication *)application 
{
	NSSetUncaughtExceptionHandler(&MyUncaughtExceptionHandler);
    [self loadSplash];
	[self boot];
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions_
{
	started = [NSDate timeIntervalSinceReferenceDate];
	NSSetUncaughtExceptionHandler(&MyUncaughtExceptionHandler);
    [self loadSplash];
	
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
		[launchOptions setObject:notification forKey:@"notification"];
		[launchOptions removeObjectForKey:UIApplicationLaunchOptionsRemoteNotificationKey];
		// trigger manually since this method isn't called when we have this delegate implemented 
		[self application:application didReceiveRemoteNotification:notification];
	}
	
	[self boot];
	
	return YES;
}

- (void)applicationWillTerminate:(UIApplication *)application
{
	[[NSNotificationCenter defaultCenter] postNotificationName:kTitaniumShutdownNotification object:self];
	
	[kjsBridge shutdown];
	[xhrBridge shutdown];
	RELEASE_TO_NIL(kjsBridge);
	RELEASE_TO_NIL(xhrBridge);
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application
{
	//FIXME: UIColorFlushCache();
	[kjsBridge gc];
	[xhrBridge gc];
}

-(TitaniumViewController*)controller
{
	return controller;
}

//TODO: this should be compiled out in production mode
-(void)showModalError:(NSString*)message
{
	ENSURE_UI_THREAD(showModalError,message);
	TitaniumErrorController *error = [[[TitaniumErrorController alloc] initWithError:message] autorelease];
	[controller presentModalViewController:error animated:YES];
}

-(void)showModalController:(UIViewController*)modalController animated:(BOOL)animated
{
	UINavigationController *navController = [controller navigationController];
	if (navController==nil)
	{
//TODO: Fix me!
//		navController = [controller currentNavController];
	}
	// if we have a nav controller, use him, otherwise use our root controller
	if (navController!=nil)
	{
		[navController presentModalViewController:modalController animated:animated];
	}
	else
	{
		[controller presentModalViewController:modalController animated:animated];
	}
}

-(void)dismissModalController:(BOOL)animated
{
	UINavigationController *navController = [controller navigationController];
	if (navController==nil)
	{
//		navController = [controller currentNavController];
	}
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
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardDidHideNotification object:nil];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardDidShowNotification object:nil];
	RELEASE_TO_NIL(kjsBridge);
	RELEASE_TO_NIL(xhrBridge);
	RELEASE_TO_NIL(loadView);
	RELEASE_TO_NIL(window);
	RELEASE_TO_NIL(launchOptions);
	RELEASE_TO_NIL(controller);
	RELEASE_TO_NIL(networkActivity);
	RELEASE_TO_NIL(userAgent);
    [super dealloc];
}

- (NSString*)userAgent
{
	if (userAgent==nil)
	{
		UIDevice *currentDevice = [UIDevice currentDevice];
		NSString *currentLocaleIdentifier = [[NSLocale currentLocale] localeIdentifier];
		NSString *currentDeviceInfo = [NSString stringWithFormat:@"%@/%@; %@; %@;",[currentDevice model],[currentDevice systemVersion],[currentDevice systemName],currentLocaleIdentifier];
		userAgent = [[NSString stringWithFormat:@"%@/%s (%@)",kTitaniumUserAgentPrefix,TI_VERSION_STR,currentDeviceInfo] retain];
	}
	return userAgent;
}

-(BOOL)isKeyboardShowing
{
	return keyboardShowing;
}

#pragma mark Keyboard Delegates

- (void)keyboardDidHide:(NSNotification*)notification 
{
	keyboardShowing = NO;
}

- (void)keyboardDidShow:(NSNotification*)notification
{
	keyboardShowing = YES;
}

@end
