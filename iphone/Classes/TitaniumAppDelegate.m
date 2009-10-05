/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumAppDelegate.h"
#import "TitaniumUIViewController.h"
#import "TitaniumAppProtocol.h"
#import "TitaniumCmdThread.h"
#import "TitaniumActionSheetHelper.h"
#import "TitaniumInvocationGenerator.h"
#import "TitaniumViewController.h"
#import "TitaniumHost.h"

#import "Webcolor.h"

#import "Logging.h"

@implementation TitaniumAppDelegate

@synthesize window, loadingView;
@synthesize viewController;
@synthesize currentHost;
@synthesize isShowingDialog;

#ifdef MODULE_TI_GESTURE
@synthesize lastAcceleration;
#endif

+ (TitaniumAppDelegate *) sharedDelegate;
{
	return (TitaniumAppDelegate *) [[UIApplication sharedApplication] delegate];
}


- (void) setViewController: (UIViewController *) newViewController;
{
	if (viewController == newViewController) return;
	
	[[viewController view] removeFromSuperview];
	[viewController release];
	viewController = newViewController;
	[viewController retain];
	[window addSubview:[viewController view]];
}

- (BOOL)shouldTakeCareOfUrl:(NSURL *)requestURL useSystemBrowser: (BOOL) useSystemBrowser;
{
	NSString * scheme = [requestURL scheme];
	NSString * title = nil;
	TitaniumActionSheetHelper * resultHelper = nil;
	
	if ([scheme isEqualToString:@"tel"] || [scheme isEqualToString:@"sms"]){
		NSString * phoneResource = [requestURL resourceSpecifier];
		NSString * phoneNumber;
		NSRange colonPos = [phoneResource rangeOfString:@";"];
		if (colonPos.location != NSNotFound){
			phoneNumber = [phoneResource substringToIndex:colonPos.location];
		} else {
			phoneNumber = phoneResource;
		}

		NSURL * callURL = [NSURL URLWithString:[@"tel:" stringByAppendingString:phoneResource]];
		NSInvocation * callInvoc = [TitaniumInvocationGenerator invocationWithTarget:[UIApplication sharedApplication] selector:@selector(openURL:) object:callURL];
		[callInvoc retainArguments];

		NSURL * textURL = [NSURL URLWithString:[@"sms:" stringByAppendingString:phoneResource]];
		NSInvocation * textInvoc = [TitaniumInvocationGenerator invocationWithTarget:[UIApplication sharedApplication] selector:@selector(openURL:) object:textURL];
		[textInvoc retainArguments];
		
		resultHelper = [[TitaniumActionSheetHelper alloc] init];
		[resultHelper addButton:callInvoc title:[NSString stringWithFormat:@"Call %@",phoneNumber]];
		[resultHelper addButton:textInvoc title:[NSString stringWithFormat:@"SMS %@",phoneNumber]];
	}

	if ([scheme isEqualToString:@"mailto"]){
		NSString * emailAddy = [requestURL resourceSpecifier];
		NSRange ampPos = [emailAddy rangeOfString:@"&"];
		if (ampPos.location != NSNotFound){
			emailAddy = [emailAddy substringToIndex:ampPos.location];
		}
		title = [NSString stringWithFormat:@"Mail %@",emailAddy];
	}

	if ([scheme isEqualToString:@"http"] || [scheme isEqualToString:@"https"]){
		NSString * host = [requestURL host];

		if (([host hasSuffix:@".youtube.com"] || [host isEqualToString:@"youtube.com"]) && [[requestURL path] isEqualToString:@"/watch"]){
			title = @"Watch Video";
		} else if ([host hasSuffix:@"phobos.apple.com"]) {
			title = @"Go To App Store";
		} else if (useSystemBrowser && [host hasSuffix:@"maps.google.com"]){
			title = @"View Map";
		} else if (useSystemBrowser) {
			title = [NSString stringWithFormat:@"Visit %@",host];
		}
	}

	if (title != nil){
		NSInvocation * browseInvoc = [TitaniumInvocationGenerator invocationWithTarget:[UIApplication sharedApplication] selector:@selector(openURL:) object:requestURL];
		[browseInvoc retainArguments];
		
		if (resultHelper==nil) resultHelper = [[TitaniumActionSheetHelper alloc] init];
		[resultHelper addButton:browseInvoc title:title];
	}
	
	if (resultHelper != nil){
		if (isShowingDialog) {
			[resultHelper release]; //We didn't need it after all!
		} else {
			isShowingDialog = YES;
			[resultHelper addCancelButton];
			[resultHelper showSheetInMainThread];
		}
		return YES;
	}
	
	return NO;
}

- (void)applicationDidFinishLaunching:(UIApplication *)application;
{
	CLOCKSTAMP("Did Finish Launching");
	[TitaniumAppProtocol registerSpecialProtocol];
	//Note to self. Have to generate a new host for a new app, but more importantly, to retain the old host.
	//Find and parse XML of project
	[self launchTitaniumApp:nil];
	CLOCKSTAMP("Launched app");

	
#ifdef MODULE_TI_GESTURE
	if([[[UIDevice currentDevice] systemVersion] hasPrefix:@"2."])[UIAccelerometer sharedAccelerometer].delegate = self;
#endif	
}

- (void)applicationWillTerminate:(UIApplication *)application;
{
	[currentHost endModules];
	[currentHost release];
	currentHost = nil;
}

- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application;
{
	UIColorFlushCache();
	[currentHost flushCache];
}

- (void)showLoadingView;
{
	if(![loadingView isHidden])return;
	[loadingView setHidden:NO];
}

- (void)hideLoadingView;
{
	if([loadingView isHidden])return;
	[loadingView setHidden:YES];
}

- (void)launchTitaniumApp: (NSString *) appPath;
{
	if (abortLaunchingApp) {
		abortLaunchingApp = NO;
		return;
	}
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

	if (appPath == nil) appPath = [[NSBundle mainBundle] resourcePath];
	self.currentHost = [[[TitaniumHost alloc] init] autorelease];

	[currentHost setAppResourcesPath:appPath];	
	[currentHost startModules];
	//Currenthost will do the reading and setting of the views.
	[window insertSubview:loadingView atIndex:1];
	[window makeKeyAndVisible];
	[pool release];
}

- (void)dealloc {
	[loadingView release];
	[currentHost release];
    [viewController release];
    [window release];
    [super dealloc];
}

#ifdef MODULE_TI_GESTURE

#ifndef __IPHONE_3_0
typedef int UIEventSubtype;
#define UIEventSubtypeMotionShake	1
#endif

// using iPhone 2.2 this is how we do shake
- (void) accelerometer:(UIAccelerometer *)accelerometer didAccelerate:(UIAcceleration *)acceleration {
	
	if (self.lastAcceleration)
	{
		if (!histeresisExcited && L0AccelerationIsShaking(self.lastAcceleration, acceleration, 0.7)) {
			histeresisExcited = YES;
			TitaniumViewController * currentView = [[TitaniumHost sharedHost] visibleTitaniumViewController];
			[currentView motionEnded:UIEventSubtypeMotionShake withEvent:nil];
		} else if (histeresisExcited && !L0AccelerationIsShaking(self.lastAcceleration, acceleration, 0.2)) {
			histeresisExcited = NO;
		}
	}
	self.lastAcceleration = acceleration;
}
#endif


@end
