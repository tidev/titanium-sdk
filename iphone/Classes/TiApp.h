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
#import <TiCore/TiContextRef.h>

@interface TiApp : TiHost <UIApplicationDelegate> 
{
	UIWindow *window;
	UIImageView *loadView;
	BOOL splashAttached;
	BOOL loaded;
	BOOL handledModal;

	TiContextGroupRef contextGroup;
	KrollBridge *kjsBridge;

#ifdef USE_TI_UIWEBVIEW
	XHRBridge *xhrBridge;
#endif
	
	NSMutableDictionary *launchOptions;
	NSTimeInterval started;
	
	int networkActivityCount; //We now can use atomic increment/decrement instead. This value is 0 upon initialization anyways.
	
	UIViewController<TiRootController> *controller;
	NSString *userAgent;
	NSString *remoteDeviceUUID;
	
	id remoteNotificationDelegate;
	NSDictionary* remoteNotification;
	
	NSString *sessionId;

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
	UIBackgroundTaskIdentifier bgTask;
	NSMutableArray *backgroundServices;
	NSMutableArray *runningServices;
	UILocalNotification *localNotification;
#endif	
}

@property (nonatomic, retain) IBOutlet UIWindow *window;
@property (nonatomic, assign) id remoteNotificationDelegate;
@property (nonatomic, readonly) NSDictionary* remoteNotification;
@property (nonatomic, retain) UIViewController<TiRootController>* controller;
@property (nonatomic, readonly) TiContextGroupRef contextGroup;
+(TiApp*)app;
//Convenience method
+(UIViewController<TiRootController>*)controller;
+(TiContextGroupRef)contextGroup;

-(void)attachXHRBridgeIfRequired;

- (UIImage*)defaultImageForOrientation:(UIDeviceOrientation) orientation;

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

-(KrollBridge*)krollBridge;


#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0

-(void)beginBackgrounding;
-(void)endBackgrounding;
-(void)registerBackgroundService:(TiProxy*)proxy;
-(void)unregisterBackgroundService:(TiProxy*)proxy;
-(void)stopBackgroundService:(TiProxy*)proxy;
-(UILocalNotification*)localNotification;
#endif

@end

