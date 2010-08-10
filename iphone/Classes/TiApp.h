/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

#import "TiHost.h"
#import "KrollBridge.h"
#ifdef USE_TI_UIWEBVIEW
	#import "XHRBridge.h"
#endif
#import "TiRootViewController.h"

@interface TiApp : TiHost <UIApplicationDelegate> 
{
	UIWindow *window;
	UIImageView *loadView;
	BOOL splashAttached;
	BOOL loaded;
	BOOL handledModal;
	
	KrollBridge *kjsBridge;

#ifdef USE_TI_UIWEBVIEW
	XHRBridge *xhrBridge;
#endif
	
	NSMutableDictionary *launchOptions;
	NSTimeInterval started;
	
	NSLock *networkActivity;
	int networkActivityCount;
	
	// TODO: Create a specialized SplitView controller if necessary
	UIViewController<TiRootController> *controller;
	NSString *userAgent;
	NSString *remoteDeviceUUID;
	
	BOOL keyboardShowing;
	id remoteNotificationDelegate;
	NSDictionary* remoteNotification;
	
	NSString *sessionId;
}

@property (nonatomic, retain) IBOutlet UIWindow *window;
@property (nonatomic, assign) id remoteNotificationDelegate;
@property (nonatomic, readonly) NSDictionary* remoteNotification;
@property (nonatomic, retain) UIViewController<TiRootController>* controller;

+(TiApp*)app;

-(void)attachXHRBridgeIfRequired;

-(BOOL)isSplashVisible;
-(void)hideSplash:(id)event;
-(UIView*)splash;
-(void)loadSplash;
-(UIView*)attachSplash;
-(NSDictionary*)launchOptions;
-(NSString*)remoteDeviceUUID;

-(void)startNetwork;
-(void)stopNetwork;

-(void)showModalError:(NSString*)message;

-(void)showModalController:(UIViewController*)controller animated:(BOOL)animated;
-(void)hideModalController:(UIViewController*)controller animated:(BOOL)animated;

-(NSString*)userAgent;
-(NSString*)sessionId;

-(BOOL)isKeyboardShowing;

-(KrollBridge*)krollBridge;

@end

