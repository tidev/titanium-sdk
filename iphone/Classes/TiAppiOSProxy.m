/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSProxy.h"
#import "TiUtils.h"
#import "TiApp.h"

#ifdef USE_TI_APPIOS
#import "TiAppiOSBackgroundServiceProxy.h"
#import "TiAppiOSLocalNotificationProxy.h"

@implementation TiAppiOSProxy

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	RELEASE_TO_NIL(backgroundServices);
	[super dealloc];
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	if (count == 1 && [type isEqual:@"notification"])
	{
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveLocalNotification:) name:kTiLocalNotification object:nil];
	}
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (count == 0 && [type isEqual:@"notification"])
	{
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiLocalNotification object:nil];
	}
}

#pragma mark Public

-(id)registerBackgroundService:(id)args
{
	NSDictionary* a;
	ENSURE_ARG_AT_INDEX(a, args, 0, NSDictionary)
	
	NSString* urlString = [[TiUtils toURL:[a objectForKey:@"url"] proxy:self]absoluteString];
	
	if ([urlString length] == 0) {
		return nil;
	}
	
	if (backgroundServices == nil) {
		backgroundServices = [[NSMutableDictionary alloc]init];
	}
	
	TiAppiOSBackgroundServiceProxy *proxy = [backgroundServices objectForKey:urlString];
	
	if (proxy == nil) {
		proxy = [[[TiAppiOSBackgroundServiceProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
		[backgroundServices setValue:proxy forKey:urlString];
	}
	
	[[TiApp app] registerBackgroundService:proxy];
	return proxy;
}

-(id)scheduleLocalNotification:(id)args
{
	ENSURE_SINGLE_ARG(args,NSDictionary);
	UILocalNotification *localNotif = [[UILocalNotification alloc] init];
	
	id date = [args objectForKey:@"date"];
	
	if (date!=nil)
	{
		localNotif.fireDate = date;
		localNotif.timeZone = [NSTimeZone defaultTimeZone];
	}
	
	id repeat = [args objectForKey:@"repeat"];
	if (repeat!=nil)
	{
		if ([repeat isEqual:@"weekly"])
		{
			localNotif.repeatInterval = NSWeekCalendarUnit;
		}
		else if ([repeat isEqual:@"daily"])
		{
			localNotif.repeatInterval = NSDayCalendarUnit;
		}
		else if ([repeat isEqual:@"yearly"])
		{
			localNotif.repeatInterval = NSYearCalendarUnit;
		}
		else if ([repeat isEqual:@"monthly"])
		{
			localNotif.repeatInterval = NSMonthCalendarUnit;
		}
	}
	
	id alertBody = [args objectForKey:@"alertBody"];
	if (alertBody!=nil)
	{
		localNotif.alertBody = alertBody;
	}
	id alertAction = [args objectForKey:@"alertAction"];
	if (alertAction!=nil)
	{
		localNotif.alertAction = alertAction;
	}
	id alertLaunchImage = [args objectForKey:@"alertLaunchImage"];
	if (alertLaunchImage!=nil)
	{
		localNotif.alertLaunchImage = alertLaunchImage;
	}
	
	id badge = [args objectForKey:@"badge"];
	if (badge!=nil)
	{
		localNotif.applicationIconBadgeNumber = [TiUtils intValue:badge];
	}
	
	id sound = [args objectForKey:@"sound"];
	if (sound!=nil)
	{
		if ([sound isEqual:@"default"])
		{
			localNotif.soundName = UILocalNotificationDefaultSoundName;
		}
		else
		{
			localNotif.soundName = sound;
		}
	}
	
	id userInfo = [args objectForKey:@"userInfo"];
	if (userInfo!=nil)
	{
		localNotif.userInfo = userInfo;
	}
	
	TiThreadPerformOnMainThread(^{
		if (date!=nil) {
			[[UIApplication sharedApplication] scheduleLocalNotification:localNotif];
		}
		else {
			[[UIApplication sharedApplication] presentLocalNotificationNow:localNotif];
		}
	}, NO);
	
	TiAppiOSLocalNotificationProxy *lp = [[[TiAppiOSLocalNotificationProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	lp.notification = localNotif;

	[localNotif release];
	return lp;
}

-(void)cancelAllLocalNotifications:(id)args
{
	ENSURE_UI_THREAD(cancelAllLocalNotifications,args);
	[[UIApplication sharedApplication] cancelAllLocalNotifications];
}

-(void)cancelLocalNotification:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	ENSURE_UI_THREAD(cancelLocalNotification,args);
	NSArray *notifications = [[UIApplication sharedApplication] scheduledLocalNotifications];
	if (notifications!=nil)
	{
		for (UILocalNotification *notification in notifications)
		{
			if([[[notification userInfo] objectForKey:@"id"] isEqual:args])
			{
				[[UIApplication sharedApplication] cancelLocalNotification:notification];
				return;
			}
		}
		
	}
}

-(void)didReceiveLocalNotification:(NSNotification*)note
{
	NSDictionary *notification = [note object];
	[self fireEvent:@"notification" withObject:notification];
}

MAKE_SYSTEM_STR(EVENT_ACCESSIBILITY_LAYOUT_CHANGED,@"accessibilitylayoutchanged");
MAKE_SYSTEM_STR(EVENT_ACCESSIBILITY_SCREEN_CHANGED,@"accessibilityscreenchanged");


@end

#endif
