/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2015 by Appcelerator, Inc. All Rights Reserved.
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
#import "TiAppiOSUserDefaultsProxy.h"
#import "TiAppiOSUserActivityProxy.h"
#import <MobileCoreServices/MobileCoreServices.h>
#if IS_XCODE_7
#import "TiAppiOSSearchableItemAttributeSetProxy.h"
#import "TiAppiOSSearchableItemProxy.h"
#import "TiAppiOSSearchableIndexProxy.h"
#endif
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
	if (count == 1 && [type isEqual:@"notification"]) {
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveLocalNotification:) name:kTiLocalNotification object:nil];
	}
    if (count == 1 && [type isEqual:@"localnotificationaction"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveLocalNotificationAction:) name:kTiLocalNotificationAction object:nil];
    }
    if (count == 1 && [type isEqual:@"remotenotificationaction"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveRemoteNotificationAction:) name:kTiRemoteNotificationAction object:nil];
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
    if ([TiUtils isIOS8OrGreater]){
        if ((count == 1) && [type isEqual:@"usernotificationsettings"]) {
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector
             (didRegisterUserNotificationSettingsNotification:) name:kTiUserNotificationSettingsNotification object:nil];
        }
        if ((count == 1) && [type isEqual:@"watchkitextensionrequest"]) {
        [[NSNotificationCenter defaultCenter] addObserver:self
                                                 selector:@selector(didReceiveWatchExtensionRequestNotification:) name:kTiWatchKitExtensionRequest object:nil];
        }
        if ((count == 1) && [type isEqual:@"continueactivity"]) {
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveContinueActivityNotification:) name:kTiContinueActivity object:nil];
        }
    }
    
    if([TiUtils isIOS9OrGreater]){
        if ((count == 1) && [type isEqual:@"shortcutitemclick"]) {
            [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector
             (didReceiveApplicationShortcutNotification:) name:kTiApplicationShortcut object:nil];
        }
    }

}

-(void)_listenerRemoved:(NSString*)type count:(int)count
{
	if (count == 0 && [type isEqual:@"notification"]) {
		[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiLocalNotification object:nil];
	}
    if (count == 0 && [type isEqual:@"localnotificationaction"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiLocalNotificationAction object:nil];
    }
    if (count == 0 && [type isEqual:@"remotenotificationaction"]) {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiRemoteNotificationAction object:nil];
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
    
    if ([TiUtils isIOS8OrGreater]){
        if ((count == 1) && [type isEqual:@"usernotificationsetting"]) {
            [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiUserNotificationSettingsNotification object:nil];
        }
        if ((count == 1) && [type isEqual:@"watchkitextensionrequest"]) {
            [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiWatchKitExtensionRequest object:nil];
        }
        if ((count == 1) && [type isEqual:@"continueactivity"]) {
            [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiContinueActivity object:nil];
        }
    }
    
    if([TiUtils isIOS9OrGreater]){
        if ((count == 1) && [type isEqual:@"shortcutitemclick"]) {
            [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiApplicationShortcut object:nil];
        }
    }
    
}

#pragma mark Public
#if IS_XCODE_7

-(void)didReceiveApplicationShortcutNotification:(NSNotification*)info
{
    NSDictionary *event = @{
        @"title" : [[info userInfo] valueForKey:@"title"],
        @"subtitle" : [[info userInfo] valueForKey:@"subtitle"],
        @"itemtype" : [[info userInfo] valueForKey:@"type"],
        @"userInfo" : [[info userInfo] objectForKey:@"userInfo"],
    };
    
    [self fireEvent:@"shortcutitemclick" withObject:event];
}

#ifdef USE_TI_APPIOSSEARCHABLEINDEX
-(id)createSearchableIndex:(id)unused
{
    if (![TiUtils isIOS9OrGreater]) {
        return nil;
    }
    
    TiAppiOSSearchableIndexProxy *proxy = [[[TiAppiOSSearchableIndexProxy alloc]init] autorelease];
    return proxy;
}
#endif

#ifdef USE_TI_APPIOSSEARCHABLEITEM
-(id)createSearchableItem:(id)args
{
    if (![TiUtils isIOS9OrGreater]) {
        return nil;
    }
    if (![NSThread isMainThread]) {
        __block id result;
        TiThreadPerformOnMainThread(^{result = [[self createSearchableItem:args] retain];}, YES);
        return [result autorelease];
    }
    
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    NSString* uniqueIdentifier = nil;
    ENSURE_ARG_FOR_KEY(uniqueIdentifier, args, @"uniqueIdentifier", NSString);
    
    NSString* domainIdentifier = nil;
    ENSURE_ARG_FOR_KEY(domainIdentifier, args, @"domainIdentifier", NSString);
    
    TiAppiOSSearchableItemAttributeSetProxy *attributeSet = nil;
    ENSURE_ARG_FOR_KEY(attributeSet, args, @"attributeSet", TiAppiOSSearchableItemAttributeSetProxy);
    
    TiAppiOSSearchableItemProxy *proxy = [[[TiAppiOSSearchableItemProxy alloc]
                                           initWithUniqueIdentifier:uniqueIdentifier
                                           withDomainIdentifier:domainIdentifier
                                           withAttributeSet:attributeSet.attributes] autorelease];
    return proxy;
}
#endif

#ifdef USE_TI_APPIOSSEARCHABLEITEMATTRIBUTESET
-(id)createSearchableItemAttributeSet:(id)args
{
    if (![TiUtils isIOS9OrGreater]) {
        return nil;
    }
    if (![NSThread isMainThread]) {
        __block id result;
        TiThreadPerformOnMainThread(^{result = [[self createSearchableItemAttributeSet:args] retain];}, YES);
        return [result autorelease];
    }
    ENSURE_SINGLE_ARG(args,NSDictionary);
    NSString* itemContentType = nil;
    ENSURE_ARG_FOR_KEY(itemContentType, args, @"itemContentType", NSString);
    
    NSMutableDictionary *props = [NSMutableDictionary dictionaryWithDictionary:args];
    [props removeObjectForKey:@"itemContentType"]; //remove to avoid duplication
    
    TiAppiOSSearchableItemAttributeSetProxy *proxy = [[[TiAppiOSSearchableItemAttributeSetProxy alloc] initWithItemContentType:itemContentType withProps:props] autorelease];

    return proxy;
}
#endif

#endif

#ifdef USE_TI_APPIOSUSERACTIVITY
-(id)createUserActivity:(id)args
{
    if (![NSThread isMainThread]) {
        __block id result;
        TiThreadPerformOnMainThread(^{result = [[self createUserActivity:args] retain];}, YES);
        return [result autorelease];
    }
    NSString* activityType;
    ENSURE_SINGLE_ARG(args,NSDictionary);
    ENSURE_ARG_FOR_KEY(activityType, args, @"activityType", NSString);
    
    TiAppiOSUserActivityProxy *userActivityProxy = [[[TiAppiOSUserActivityProxy alloc] initWithOptions:args] autorelease];

    return userActivityProxy;
}
#endif

-(id)createUserDefaults:(id)args
{
    NSString *suiteName;
    ENSURE_SINGLE_ARG(args,NSDictionary);
    ENSURE_ARG_FOR_KEY(suiteName, args, @"suiteName", NSString);
    
    NSUserDefaults *defaultsObject = [[[NSUserDefaults alloc] initWithSuiteName:suiteName] autorelease];
    
    TiAppiOSUserDefaultsProxy *userDefaultsProxy = [[[TiAppiOSUserDefaultsProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    
    userDefaultsProxy.defaultsObject = defaultsObject;
    
    return userDefaultsProxy;
}

-(id)registerBackgroundService:(id)args
{
	NSDictionary* a = nil;
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

//TO DO: implement didRegisterUserNotificationSettings delegate?
//remote notifications add 'category'

-(id)createUserNotificationAction:(id)args
{

	if(![TiUtils isIOS8OrGreater]) {
		return nil;
	}

	ENSURE_SINGLE_ARG(args,NSDictionary);
	UIMutableUserNotificationAction *notifAction = [[UIMutableUserNotificationAction alloc] init];

	id identifier = [args objectForKey:@"identifier"];

	if (identifier!=nil) {
		notifAction.identifier = identifier;
	}
    
	id title = [args objectForKey:@"title"];
    
	if (title!=nil) {
		notifAction.title = title;
	}
	
	UIUserNotificationActivationMode activationMode = [TiUtils intValue:[args objectForKey:@"activationMode"]];
	notifAction.activationMode = activationMode;

	BOOL destructive = [TiUtils boolValue:[args objectForKey:@"destructive"]];
    
	notifAction.destructive = destructive;

	BOOL authenticationRequired = [TiUtils boolValue:[args objectForKey:@"authenticationRequired"]];
	notifAction.authenticationRequired = authenticationRequired;
    
#if IS_XCODE_7
    if([TiUtils isIOS9OrGreater] == YES) {
        NSInteger behavior = [TiUtils intValue:[args objectForKey:@"behavior"]];
        notifAction.behavior = behavior;
    }
#endif
    
	TiAppiOSNotificationActionProxy *ap = [[[TiAppiOSNotificationActionProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	ap.notificationAction = notifAction;
    
	[notifAction release];
	return ap;
}

-(id)createUserNotificationCategory:(id)args
{

	if(![TiUtils isIOS8OrGreater]) {
		return nil;
	}
	
	ENSURE_SINGLE_ARG(args,NSDictionary);
	UIMutableUserNotificationCategory *notifCategory = [[UIMutableUserNotificationCategory alloc] init];
	
	id identifier = [args objectForKey:@"identifier"];
	
	if (identifier!=nil) {
		notifCategory.identifier = identifier;
	}
	
	id actionsForDefaultContext = [args objectForKey:@"actionsForDefaultContext"];
	id actionsForMinimalContext = [args objectForKey:@"actionsForMinimalContext"];
	
	if (actionsForDefaultContext != nil) {
		NSMutableArray *afdc = [[NSMutableArray alloc] init];
		
		for(TiAppiOSNotificationActionProxy* action in actionsForDefaultContext) {
			[afdc addObject:action.notificationAction];
		}
		[notifCategory setActions:afdc forContext:UIUserNotificationActionContextDefault];
		RELEASE_TO_NIL(afdc);
	}
	if (actionsForMinimalContext != nil) {
		NSMutableArray *afmc = [[NSMutableArray alloc] init];

		for(TiAppiOSNotificationActionProxy* action in actionsForMinimalContext) {
			[afmc addObject:action.notificationAction];
		}
		[notifCategory setActions:afmc forContext:UIUserNotificationActionContextMinimal];
		RELEASE_TO_NIL(afmc);
    }
    
	TiAppiOSNotificationCategoryProxy *cp = [[[TiAppiOSNotificationCategoryProxy alloc] _initWithPageContext:[self executionContext]] autorelease];

	cp.notificationCategory = notifCategory;

	[notifCategory release];
	return cp;
}

-(void)registerUserNotificationSettings:(id)args
{
	if (![TiUtils isIOS8OrGreater]) return;
	
	ENSURE_SINGLE_ARG(args, NSDictionary);
    
    NSArray *categories;
    NSArray *typesRequested;
    ENSURE_ARG_OR_NIL_FOR_KEY(categories, args, @"categories", NSArray);
    ENSURE_ARG_OR_NIL_FOR_KEY(typesRequested, args, @"types", NSArray);
    
	NSMutableSet *categoriesSet = nil;
	if (categories != nil) {
		categoriesSet = [NSMutableSet set];
		for (id category in categories) {
            ENSURE_TYPE(category, TiAppiOSNotificationCategoryProxy);
            [categoriesSet addObject:[(TiAppiOSNotificationCategoryProxy*)category notificationCategory]];
		}
	}
	
    UIUserNotificationType types = UIUserNotificationTypeNone;
    if (typesRequested != nil) {
        for (id thisTypeRequested in typesRequested)
        {
            NSUInteger value = [TiUtils intValue:thisTypeRequested];
            switch(value)
            {
                case UIUserNotificationTypeBadge: // USER_NOTIFICATION_TYPE_BADGE
                {
                    types |= UIUserNotificationTypeBadge;
                    break;
                }
                case UIUserNotificationTypeAlert: // USER_NOTIFICATION_TYPE_ALERT
                {
                    types |= UIUserNotificationTypeAlert;
                    break;
                }
                case UIUserNotificationTypeSound: // USER_NOTIFICATION_TYPE_SOUND
                {
                    types |= UIUserNotificationTypeSound;
                    break;
                }
            }
        }
    }
    
	UIUserNotificationSettings *notif = [UIUserNotificationSettings settingsForTypes:types categories:categoriesSet];
    TiThreadPerformOnMainThread(^{
        [[UIApplication sharedApplication] registerUserNotificationSettings:notif];
    }, NO);
}

-(NSArray*)supportedUserActivityTypes
{    
    if (![TiUtils isIOS8OrGreater]) {
        return nil;
    }
    
    NSArray *supportedActivityTypes = [[NSBundle mainBundle]
                                       objectForInfoDictionaryKey:@"NSUserActivityTypes"];
    
    return supportedActivityTypes;
}

-(NSDictionary*)currentUserNotificationSettings
{
    if (![TiUtils isIOS8OrGreater]) {
        return nil;
    }
    
    __block NSDictionary* returnVal = nil;
    TiThreadPerformOnMainThread(^{
        UIUserNotificationSettings *notificationSettings = [[UIApplication sharedApplication] currentUserNotificationSettings];
        returnVal = [[self formatUserNotificationSettings:notificationSettings] retain];
    }, YES);
    
    return [returnVal autorelease];;
}

-(NSDictionary*)formatUserNotificationSettings:(UIUserNotificationSettings*)notificationSettings
{
    if (![NSThread isMainThread]) {
        __block NSDictionary*result = nil;
        TiThreadPerformOnMainThread(^{
            result = [[self formatUserNotificationSettings:notificationSettings] retain];
        }, YES);
        return [result autorelease];
        
    }
    NSMutableArray *typesArray = [NSMutableArray array];
    NSMutableArray *categoriesArray = [NSMutableArray array];
    
    NSUInteger types = notificationSettings.types;
    NSSet *categories = notificationSettings.categories;
    
    // Types
    if ((types & UIUserNotificationTypeBadge)!=0)
    {
        [typesArray addObject:NUMINT(UIUserNotificationTypeBadge)];
    }
    if ((types & UIUserNotificationTypeAlert)!=0)
    {
        [typesArray addObject:NUMINT(UIUserNotificationTypeAlert)];
    }
    if ((types & UIUserNotificationTypeSound)!=0)
    {
        [typesArray addObject:NUMINT(UIUserNotificationTypeSound)];
    }
    
    // Categories
    for (id cat in categories) {
        TiAppiOSNotificationCategoryProxy *categoryProxy = [[[TiAppiOSNotificationCategoryProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
        categoryProxy.notificationCategory = cat;
        [categoriesArray addObject:categoryProxy];
    }
    return [NSDictionary dictionaryWithObjectsAndKeys:
            typesArray, @"types",
            categoriesArray, @"categories",
            nil];
}

-(id)scheduleLocalNotification:(id)args
{
	ENSURE_SINGLE_ARG(args,NSDictionary);
	UILocalNotification *localNotif = [[UILocalNotification alloc] init];
	
	id date = [args objectForKey:@"date"];
	
	if (date!=nil) {
		localNotif.fireDate = date;
		localNotif.timeZone = [NSTimeZone defaultTimeZone];
	}
	
	id repeat = [args objectForKey:@"repeat"];
	if (repeat!=nil) {
		if ([repeat isEqual:@"weekly"]) {
			localNotif.repeatInterval = NSWeekCalendarUnit;
		}
		else if ([repeat isEqual:@"daily"]) {
			localNotif.repeatInterval = NSDayCalendarUnit;
		}
		else if ([repeat isEqual:@"yearly"]) {
			localNotif.repeatInterval = NSYearCalendarUnit;
		}
		else if ([repeat isEqual:@"monthly"]) {
			localNotif.repeatInterval = NSMonthCalendarUnit;
		}
	}
	
	id alertBody = [args objectForKey:@"alertBody"];
	if (alertBody!=nil) {
		localNotif.alertBody = alertBody;
	}
	id alertAction = [args objectForKey:@"alertAction"];
	if (alertAction!=nil) {
		localNotif.alertAction = alertAction;
	}
	id alertLaunchImage = [args objectForKey:@"alertLaunchImage"];
	if (alertLaunchImage!=nil) {
		localNotif.alertLaunchImage = alertLaunchImage;
	}

	id badge = [args objectForKey:@"badge"];
	if (badge!=nil) {
		localNotif.applicationIconBadgeNumber = [TiUtils intValue:badge];
	}

	id sound = [args objectForKey:@"sound"];
	if (sound!=nil) {
		if ([sound isEqual:@"default"]) {
			localNotif.soundName = UILocalNotificationDefaultSoundName;
		}
		else {
			localNotif.soundName = sound;
		}
	}

	id userInfo = [args objectForKey:@"userInfo"];
	if (userInfo!=nil) {
		localNotif.userInfo = userInfo;
	}

	if([TiUtils isIOS8OrGreater]) {
		id category = [args objectForKey:@"category"];
		if (category != nil && [category isKindOfClass:[TiAppiOSNotificationCategoryProxy class]]) {
			localNotif.category = [(TiAppiOSNotificationCategoryProxy*)category identifier];
		} else if (category != nil && [category isKindOfClass:[NSString class]]) {
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

-(void)didReceiveContinueActivityNotification:(NSNotification*)notif
{
    NSDictionary *notification = [notif userInfo];
    [self fireEvent:@"continueactivity" withObject:notification];
}

-(void)didReceiveLocalNotification:(NSNotification*)note
{
	NSDictionary *notification = [note object];
	[self fireEvent:@"notification" withObject:notification];
}

-(void)didReceiveLocalNotificationAction:(NSNotification*)note
{
    NSDictionary *notification = [note object];
    [self fireEvent:@"localnotificationaction" withObject:notification];
}

-(void)didReceiveRemoteNotificationAction:(NSNotification*)note
{
    NSDictionary *notification = [note object];
    [self fireEvent:@"remotenotificationaction" withObject:notification];
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

-(void)didRegisterUserNotificationSettingsNotification:(NSNotification*)notificationSettings
{
    [self fireEvent:@"usernotificationsettings"
         withObject:[self formatUserNotificationSettings:(UIUserNotificationSettings*)[notificationSettings object]]];
}

#pragma mark Apple Watchkit notifications

-(void)didReceiveWatchExtensionRequestNotification:(NSNotification*)notif
{
    if ([TiUtils isIOS9OrGreater]) {
        DebugLog(@"[WARN] Deprecated. Please use Ti.App.iOS.WatchConnectivity instead");
    }
    [self fireEvent:@"watchkitextensionrequest" withObject:[notif userInfo]];
}

#pragma mark Apple Watchkit handleWatchKitExtensionRequest reply

-(void)sendWatchExtensionReply:(id)args
{
    if ([TiUtils isIOS9OrGreater]) {
        DebugLog(@"[WARN] Deprecated. Please use Ti.App.iOS.WatchConnectivity instead");
    }
    if(![TiUtils isIOS8OrGreater]) {
        return;
    }
    
    enum Args {
        kArgKey = 0,
        kArgCount,
        kArgUserInfo = kArgCount
    };
    
    ENSURE_TYPE(args,NSArray);
    ENSURE_ARG_COUNT(args, kArgCount);
    
    NSString *key = [TiUtils stringValue:[args objectAtIndex:kArgKey]];

    if([args count] > 1){
        [[TiApp app] watchKitExtensionRequestHandler:key withUserInfo:[args objectAtIndex:kArgUserInfo]];
    }else{
        [[TiApp app] watchKitExtensionRequestHandler:key withUserInfo:nil];
    }
}

-(void)setMinimumBackgroundFetchInterval:(id)value
{
    ENSURE_TYPE(value, NSNumber);
    double fetchInterval = [TiUtils doubleValue:value];
    fetchInterval = MAX(MIN(fetchInterval, UIApplicationBackgroundFetchIntervalNever),UIApplicationBackgroundFetchIntervalMinimum);
    [[UIApplication sharedApplication] setMinimumBackgroundFetchInterval:fetchInterval];
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
    return NUMDOUBLE(UIApplicationBackgroundFetchIntervalMinimum);
}

-(NSNumber*)BACKGROUNDFETCHINTERVAL_NEVER {
    return NUMDOUBLE(UIApplicationBackgroundFetchIntervalNever);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_NONE
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeNone);
	}
	return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_BADGE
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeBadge);
	}
	return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_SOUND
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeSound);
	}
	return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_ALERT
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationTypeAlert);
	}
	return NUMINT(0);
}


-(NSNumber*)USER_NOTIFICATION_ACTIVATION_MODE_BACKGROUND
{
	if ([TiUtils isIOS8OrGreater]) {
		return NUMINT(UIUserNotificationActivationModeBackground);
	}
	return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_ACTIVATION_MODE_FOREGROUND
{
    if ([TiUtils isIOS8OrGreater]) {
        return NUMINT(UIUserNotificationActivationModeForeground);
    }
    return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_BEHAVIOR_DEFAULT
{
#if IS_XCODE_7
    if ([TiUtils isIOS9OrGreater]) {
        return NUMINT(UIUserNotificationActionBehaviorDefault);
    }
#endif
    return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_BEHAVIOR_TEXTINPUT
{
#if IS_XCODE_7
    if ([TiUtils isIOS9OrGreater]) {
        return NUMINT(UIUserNotificationActionBehaviorTextInput);
    }
#endif
    return NUMINT(0);
}

#pragma mark UTI Text Type Constants
-(CFStringRef)UTTYPE_TEXT
{
	return kUTTypeText;
}

-(CFStringRef)UTTYPE_PLAIN_TEXT
{
	return kUTTypePlainText;
}

-(CFStringRef)UTTYPE_UTF8_PLAIN_TEXT
{
	return kUTTypeUTF8PlainText;
}

-(CFStringRef)UTTYPE_UTF16_EXTERNAL_PLAIN_TEXT
{
	return kUTTypeUTF16ExternalPlainText;
}

-(CFStringRef)UTTYPE_UTF16_PLAIN_TEXT
{
	return kUTTypeUTF16PlainText;
}

-(CFStringRef)UTTYPE_RTF
{
	return kUTTypeRTF;
}

-(CFStringRef)UTTYPE_HTML
{
	return kUTTypeHTML;
}

-(CFStringRef)UTTYPE_XML
{
	return kUTTypeXML;
}

-(CFStringRef)UTTYPE_SOURCE_CODE
{
	return kUTTypeSourceCode;
}

-(CFStringRef)UTTYPE_C_SOURCE
{
	return kUTTypeCSource;
}

-(CFStringRef)UTTYPE_OBJECTIVE_C_SOURCE
{
	return kUTTypeObjectiveCSource;
}

-(CFStringRef)UTTYPE_C_PLUS_PLUS_SOURCE
{
	return kUTTypeCPlusPlusSource;
}

-(CFStringRef)UTTYPE_OBJECTIVE_C_PLUS_PLUS_SOURCE
{
	return kUTTypeObjectiveCPlusPlusSource;
}

-(CFStringRef)UTTYPE_C_HEADER
{
	return kUTTypeCHeader;
}

-(CFStringRef)UTTYPE_C_PLUS_PLUS_HEADER
{
	return kUTTypeCPlusPlusHeader;
}

-(CFStringRef)UTTYPE_JAVA_SOURCE
{
	return kUTTypeJavaSource;
}

#pragma mark UTI Composite Content Type Constants
-(CFStringRef)UTTYPE_PDF
{
	return kUTTypePDF;
}

-(CFStringRef)UTTYPE_RTFD
{
	return kUTTypeRTFD;
}

-(CFStringRef)UTTYPE_FLAT_RTFD
{
	return kUTTypeFlatRTFD;
}

-(CFStringRef)UTTYPE_TXN_TEXT_AND_MULTIMEDIA_DATA
{
	return kUTTypeTXNTextAndMultimediaData;
}

-(CFStringRef)UTTYPE_WEB_ARCHIVE
{
	return kUTTypeWebArchive;
}

#pragma mark UTI Image Content Types
-(CFStringRef)UTTYPE_IMAGE
{
	return kUTTypeImage;
}

-(CFStringRef)UTTYPE_JPEG
{
	return kUTTypeJPEG;
}

-(CFStringRef)UTTYPE_JPEG2000
{
	return kUTTypeJPEG2000;
}

-(CFStringRef)UTTYPE_TIFF
{
	return kUTTypeTIFF;
}

-(CFStringRef)UTTYPE_PICT
{
	return kUTTypePICT;
}

-(CFStringRef)UTTYPE_GIF
{
	return kUTTypeGIF;
}

-(CFStringRef)UTTYPE_PNG
{
	return kUTTypePNG;
}

-(CFStringRef)UTTYPE_QUICKTIME_IMAGE
{
	return kUTTypeQuickTimeImage;
}

-(CFStringRef)UTTYPE_APPLE_ICNS
{
	return kUTTypeAppleICNS;
}

-(CFStringRef)UTTYPE_BMP
{
	return kUTTypeBMP;
}

-(CFStringRef)UTTYPE_ICO
{
	return kUTTypeICO;
}

#pragma mark UTI Audio Visual Content Types
-(CFStringRef)UTTYPE_AUDIO_VISUAL_CONTENT
{
	return kUTTypeAudiovisualContent;
}

-(CFStringRef)UTTYPE_MOVIE
{
	return kUTTypeMovie;
}

-(CFStringRef)UTTYPE_VIDEO
{
	return kUTTypeVideo;
}

-(CFStringRef)UTTYPE_AUDIO
{
	return kUTTypeAudio;
}

-(CFStringRef)UTTYPE_QUICKTIME_MOVIE
{
	return kUTTypeQuickTimeMovie;
}

-(CFStringRef)UTTYPE_MPEG
{
	return kUTTypeMPEG;
}

-(CFStringRef)UTTYPE_MPEG4
{
	return kUTTypeMPEG4;
}

-(CFStringRef)UTTYPE_MP3
{
	return kUTTypeMP3;
}

-(CFStringRef)UTTYPE_MPEG4_AUDIO
{
	return kUTTypeMPEG4Audio;
}

-(CFStringRef)UTTYPE_APPLE_PROTECTED_MPEG4_AUDIO
{
	return kUTTypeAppleProtectedMPEG4Audio;
}

-(NSString*)applicationOpenSettingsURL
{
    if ([TiUtils isIOS8OrGreater]) {
        return UIApplicationOpenSettingsURLString;
    }
    return nil;
}

MAKE_SYSTEM_STR(EVENT_ACCESSIBILITY_LAYOUT_CHANGED,@"accessibilitylayoutchanged");
MAKE_SYSTEM_STR(EVENT_ACCESSIBILITY_SCREEN_CHANGED,@"accessibilityscreenchanged");

MAKE_SYSTEM_PROP(FETCH_NEWDATA, 0); //UIBackgroundFetchResultNewData
MAKE_SYSTEM_PROP(FETCH_NODATA, 1); //UIBackgroundFetchResultNoData
MAKE_SYSTEM_PROP(FETCH_FAILED, 2); //UIBackgroundFetchResultFailed

@end

#endif
