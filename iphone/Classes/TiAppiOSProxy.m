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
#import "TiAppiOSNotificationActionProxy.h"
#import "TiAppiOSNotificationCategoryProxy.h"


@implementation TiAppiOSProxy

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self];
	RELEASE_TO_NIL(backgroundServices);
	[super dealloc];
}

-(NSString*)apiName
{
    return @"Ti.App.iOS";
}

-(void)_listenerAdded:(NSString*)type count:(int)count
{
	if (count == 1 && [type isEqual:@"notification"])
	{
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveLocalNotification:) name:kTiLocalNotification object:nil];
	}
    if (count == 1 && [type isEqual:@"backgroundNotification"])
    {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveBackgroundLocalNotification:) name:kTiBackgroundLocalNotification object:nil];
    }

    if ((count == 1) && [type isEqual:@"backgroundfetch"]) {
        NSArray* backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
        if ([backgroundModes containsObject:@"fetch"]) {
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveBackgroundFetchNotification:) name:kTiBackgroundFetchNotification object:nil];
        } else {
            DebugLog(@"[ERROR] Cannot add backgroundfetch eventListener. Please add `fetch` to UIBackgroundModes inside info.plist ");
        }
    }
    if ((count == 1) && [type isEqual:@"silentpush"]) {
        NSArray* backgroundModes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"UIBackgroundModes"];
        if ([backgroundModes containsObject:@"remote-notification"]) {
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveSilentPushNotification:) name:kTiSilentPushNotification object:nil];
        } else {
            DebugLog(@"[ERROR] Cannot add silentpush eventListener. Please add `remote-notification` to UIBackgroundModes inside info.plist ");
        }
    }
    if ((count == 1) && [type isEqual:@"backgroundtransfer"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveBackgroundTransferNotification:) name:kTiBackgroundTransfer object:nil];
    }
    if ((count == 1) && [type isEqual:@"downloadcompleted"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveDownloadFinishedNotification:) name:kTiURLDownloadFinished object:nil];
    }
    if ((count == 1) && [type isEqual:@"sessioncompleted"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveSessionCompletedNotification:) name:kTiURLSessionCompleted object:nil];
    }
    if ((count ==1) && [type isEqual:@"sessioneventscompleted"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveSessionEventsCompletedNotification:) name:kTiURLSessionEventsCompleted object:nil];
    }
    if ((count == 1) && [type isEqual:@"downloadprogress"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveDownloadProgressNotification:) name:kTiURLDowloadProgress object:nil];
    }
    if ((count == 1) && [type isEqual:@"uploadprogress"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveUploadProgressNotification:) name:kTiURLUploadProgress object:nil];
    }
}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (count == 0 && [type isEqual:@"notification"])
	{
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiLocalNotification object:nil];
	}
    if (count == 0 && [type isEqual:@"backgroundNotification"])
    {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiBackgroundLocalNotification object:nil];
    }

    if ((count == 1) && [type isEqual:@"backgroundfetch"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiBackgroundFetchNotification object:nil];
    }
    if ((count == 1) && [type isEqual:@"sessioneventscompleted"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiURLSessionEventsCompleted object:nil];
    }
    if ((count == 1) && [type isEqual:@"silentpush"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiSilentPushNotification object:nil];
    }
    if ((count == 1) && [type isEqual:@"backgroundtransfer"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiBackgroundTransfer object:nil];
    }
    if ((count == 1) && [type isEqual:@"sessioncompleted"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiURLSessionCompleted object:nil];
    }
    if ((count == 1) && [type isEqual:@"downloadfinished"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiURLDownloadFinished object:nil];
    }
    if ((count == 1) && [type isEqual:@"downloadprogress"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiURLDowloadProgress object:nil];
    }
    if ((count == 1) && [type isEqual:@"uploadprogress"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiURLUploadProgress object:nil];
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

-(id)createUserNotificationAction:(id)args
{

    //for iOS8 or greater only
    if(![TiUtils isIOS8OrGreater]) {
        return nil;
    }
    
    ENSURE_SINGLE_ARG(args,NSDictionary);
    UIMutableUserNotificationAction *notifAction = [[UIMutableUserNotificationAction alloc] init];
    
    id identifier = [args objectForKey:@"identifier"];
    
    if (identifier!=nil)
    {
        notifAction.identifier = identifier;
//        DebugLog(identifier);
    }
    
    id title = [args objectForKey:@"title"];
    
    if (title!=nil)
    {
        notifAction.title = title;
//        DebugLog(title);
    }
    
    UIUserNotificationActivationMode activationMode = [TiUtils intValue:[args objectForKey:@"activationMode"]];
    notifAction.activationMode = activationMode;

    //id destructive = [args objectForKey:@"destructive"];
    BOOL destructive = [TiUtils boolValue:[args objectForKey:@"destructive"]];
    
    notifAction.destructive = destructive;
/*    if (destructive!=nil)
    {
        if ([destructive isEqual:@"true"]) {
            notifAction.destructive = YES;
        }
        else if ([destructive isEqual:@"false"]) {
            notifAction.destructive = NO;
        }
        //   notifAction.destructive = [destructive boolValue];
        NSLog(@"destructive is %@", destructive);
    }*/
    
    //id authenticationRequired = [args objectForKey:@"authenticationRequired"];
    BOOL authenticationRequired = [TiUtils boolValue:[args objectForKey:@"authenticationRequired"]];
    notifAction.authenticationRequired = authenticationRequired;
/*    if (authenticationRequired!=nil)
    {
        if ([authenticationRequired isEqual:@"true"]) {
            notifAction.authenticationRequired = YES;
        }
        else if ([authenticationRequired isEqual:@"false"]) {
            notifAction.authenticationRequired = NO;
        }
        //   notifAction.destructive = [destructive boolValue];
        NSLog(@"authentication is %@", authenticationRequired);
        //   notifAction.authenticationRequired = [authenticationRequired boolValue];
    }
  */
    NSLog(notifAction.description);
    TiAppiOSNotificationActionProxy *ap = [[[TiAppiOSNotificationActionProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    ap.notificationAction = notifAction;
    
    [notifAction release];
    return ap;
}

-(id)createUserNotificationCategory:(id)args
{
    //for iOS8 or greater only
    if(![TiUtils isIOS8OrGreater]) {
        return nil;
    }
    
    ENSURE_SINGLE_ARG(args,NSDictionary);
    UIMutableUserNotificationCategory *notifCategory = [[UIMutableUserNotificationCategory alloc] init];
    
    id identifier = [args objectForKey:@"identifier"];
    
    if (identifier!=nil)
    {
        notifCategory.identifier = identifier;
//        DebugLog(identifier);
    }
    
    /*       id contextMode = [args objectForKey:@"contextMode"];
     
     NSUInteger contextModeSelected = UIUserNotificationActionContextDefault;
     
     if (contextMode!=nil)
     {
     if ([contextMode isEqual:@"default"]) {
     contextModeSelected = UIUserNotificationActionContextDefault;
     }
     else if ([contextMode isEqual:@"minimal"]) {
     contextModeSelected = UIUserNotificationActionContextMinimal;
     }
     }*/
    id actionsForDefaultContext = [args objectForKey:@"actionsForDefaultContext"];
    
    id actionsForMinimalContext = [args objectForKey:@"actionsForMinimalContext"];
    
//    DebugLog(@"assigning actions into arrays");
    
    UIMutableUserNotificationAction *acceptAction = [[UIMutableUserNotificationAction alloc]init];
    
    if (actionsForDefaultContext != nil) {
        NSMutableArray *afdc = [[NSMutableArray alloc] init];
        
        for(TiAppiOSNotificationActionProxy* action in actionsForDefaultContext)
        {
            [afdc addObject:action.notificationAction];
//            NSLog(@"action added for default context %@", action.notificationAction.description);
        }
        
        [notifCategory setActions:afdc forContext:UIUserNotificationActionContextDefault];
  //      DebugLog(@"There are actions set for default");
    }
    if (actionsForMinimalContext != nil) {
        NSMutableArray *afmc = [[NSMutableArray alloc] init];
        
        for(TiAppiOSNotificationActionProxy* action in actionsForMinimalContext)
        {
            [afmc addObject:action.notificationAction];
  //          NSLog(@"action added for minimal context %@", action.notificationAction.description);
        }
        
        [notifCategory setActions:afmc forContext:UIUserNotificationActionContextMinimal];
        
  //      DebugLog(@"There are actions set for minimal");
        //        NSLog(actionsForMinimalContext.description);
    }
    
    TiAppiOSNotificationCategoryProxy *cp = [[[TiAppiOSNotificationCategoryProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    
    cp.notificationCategory = notifCategory;
    
    [notifCategory release];
    return cp;
    
}
-(void)registerForLocalNotifications:(id)args
{
	if(![TiUtils isIOS8OrGreater]) return;
	ENSURE_SINGLE_ARG(args, NSDictionary)
	// TODO: Add "categories" when implementing interactive notifications
    id categories = [args objectForKey:@"categories"];
    
    NSMutableSet *categoriesSet = nil;
    if (categories!=nil)
    {
     //   DebugLog(@"[DEBUG] categories avail");
        categoriesSet = [[NSMutableSet alloc] init];
        
        for (TiAppiOSNotificationCategoryProxy *category in categories)
        {
            [categoriesSet addObject:category.notificationCategory];
//            NSLog(@"[DEBUG] added category: %@", category.notificationCategory);
        }
    }
    else {
       // DebugLog(@"[DEBUG] no categories");
    }
    
//    UIUserNotificationSettings *userSettings = [UIUserNotificationSettings settingsForTypes:types categories:categoriesSet];

	// NSSet* categories = [NSSet setWithArray: [args objectForKey:@"categories"]];
	UIUserNotificationType types = [TiUtils intValue:[args objectForKey:@"types"] def:0];
	
	UIUserNotificationSettings *notif = [UIUserNotificationSettings settingsForTypes:types categories:categoriesSet];
	[[UIApplication sharedApplication] registerUserNotificationSettings:notif];

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
    
    if([TiUtils isIOS8OrGreater]) {
        id category = [args objectForKey:@"category"];
        if (category != nil)
        {
            localNotif.category = category;
        }
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

-(void)didReceiveBackgroundLocalNotification:(NSNotification*)note
{
    NSDictionary *notification = [note object];
//    DebugLog(@"[DEBUG] KIAT note background local notification delegate here");
    [self fireEvent:@"backgroundNotification" withObject:notification];
}


-(void)didReceiveBackgroundFetchNotification:(NSNotification*)note
{
    [self fireEvent:@"backgroundfetch" withObject:[note userInfo]];
}

-(void)didReceiveSilentPushNotification:(NSNotification*)note
{
    [self fireEvent:@"silentpush" withObject:[note userInfo]];
}

-(void)didReceiveBackgroundTransferNotification:(NSNotification*)note
{
    [self fireEvent:@"backgroundtransfer" withObject:[note userInfo]];
}

-(void)didReceiveDownloadFinishedNotification:(NSNotification*)note
{
    [self fireEvent:@"downloadcompleted" withObject:[note userInfo]];
}

-(void)didReceiveSessionCompletedNotification:(NSNotification*)note
{
    [self fireEvent:@"sessioncompleted" withObject:[note userInfo]];
}

-(void)didReceiveSessionEventsCompletedNotification:(NSNotification*)note
{
    [self fireEvent:@"sessioneventscompleted" withObject:[note userInfo]];
}
-(void)didReceiveDownloadProgressNotification:(NSNotification*)note
{
    [self fireEvent:@"downloadprogress" withObject:[note userInfo]];
}

-(void)didReceiveUploadProgressNotification:(NSNotification*)note
{
    [self fireEvent:@"uploadprogress" withObject:[note userInfo]];
}

-(void)setMinimumBackgroundFetchInterval:(id)value
{
    ENSURE_TYPE(value, NSNumber);
    if ([TiUtils isIOS7OrGreater]) {
        double fetchInterval = [TiUtils doubleValue:value];
        fetchInterval = MAX(MIN(fetchInterval, UIApplicationBackgroundFetchIntervalNever),UIApplicationBackgroundFetchIntervalMinimum);
        [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:fetchInterval];
    } else {
        DebugLog(@"[ERROR] Methond only available on iOS 7 and above.");
    }
}

-(void)endBackgroundHandler:(id)arg
{
    ENSURE_SINGLE_ARG(arg, NSString);
    if ([arg rangeOfString:@"Session"].location != NSNotFound) {
        [[TiApp app] completionHandlerForBackgroundTransfer:arg];
    } else {
        [[TiApp app] completionHandler:arg withResult:1];
    }
}

-(NSNumber*)BACKGROUNDFETCHINTERVAL_MIN {
    if ([TiUtils isIOS7OrGreater]) {
        return NUMDOUBLE(UIApplicationBackgroundFetchIntervalMinimum);
    }
    return nil;
}

-(NSNumber*)BACKGROUNDFETCHINTERVAL_NEVER {
    if ([TiUtils isIOS7OrGreater]) {
        return NUMDOUBLE(UIApplicationBackgroundFetchIntervalNever);
    }
    return nil;
}

-(NSNumber*)NOTIFICATION_TYPE_NONE
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeNone);
	}
	return NUMINT(0);
}

-(NSNumber*)NOTIFICATION_TYPE_BADGE
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeBadge);
	}
	return NUMINT(0);
}

-(NSNumber*)NOTIFICATION_TYPE_SOUND
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeSound);
	}
	return NUMINT(0);
}

-(NSNumber*)NOTIFICATION_TYPE_ALERT
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeAlert);
	}
	return NUMINT(0);
}
/*
-(NSNumber*)NOTIFICATION_ACTION_CONTEXT_DEFAULT
{
    if ([TiUtils isIOS8OrGreater]) {
        return NUMINT(UIUserNotificationActionContextDefault);
    }
    return NUMINT(0);
}*/

-(NSNumber*)NOTIFICATION_ACTIVATION_MODE_BACKGROUND
{
    if ([TiUtils isIOS8OrGreater]) {
        return NUMINT(UIUserNotificationActivationModeBackground);
    }
    return NUMINT(0);
}
-(NSNumber*)NOTIFICATION_ACTIVATION_MODE_FOREGROUND
{
    if ([TiUtils isIOS8OrGreater]) {
        return NUMINT(UIUserNotificationActivationModeForeground);
    }
    return NUMINT(0);
}

MAKE_SYSTEM_STR(EVENT_ACCESSIBILITY_LAYOUT_CHANGED,@"accessibilitylayoutchanged");
MAKE_SYSTEM_STR(EVENT_ACCESSIBILITY_SCREEN_CHANGED,@"accessibilityscreenchanged");

MAKE_SYSTEM_PROP(FETCH_NEWDATA, 0); //UIBackgroundFetchResultNewData
MAKE_SYSTEM_PROP(FETCH_NODATA, 1); //UIBackgroundFetchResultNoData
MAKE_SYSTEM_PROP(FETCH_FAILED, 2); //UIBackgroundFetchResultFailed

@end

#endif
