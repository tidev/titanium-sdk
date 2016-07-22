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
#import "TiAppiOSUserNotificationActionProxy.h"
#import "TiAppiOSUserNotificationCategoryProxy.h"
#import "TiAppiOSUserDefaultsProxy.h"
#import "TiAppiOSUserActivityProxy.h"
#import "TiAppiOSSearchableItemAttributeSetProxy.h"
#import "TiAppiOSSearchableItemProxy.h"
#import "TiAppiOSSearchableIndexProxy.h"

#ifdef USE_TI_APPIOSUSERNOTIFICATIONCENTER
#import "TiAppiOSUserNotificationCenterProxy.h"
#endif

#if IS_XCODE_8
#import <UserNotifications/UserNotifications.h>
#endif

#import <MobileCoreServices/MobileCoreServices.h>
#import <CoreLocation/CLCircularRegion.h>

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

-(void)didReceiveApplicationShortcutNotification:(NSNotification*)info
{
    NSMutableDictionary *event = [[NSMutableDictionary alloc] initWithDictionary: @{
        @"title" : [[info userInfo] valueForKey:@"title"],
        @"itemtype" : [[info userInfo] valueForKey:@"type"]
    }];
    
    if ([[info userInfo] valueForKey:@"subtitle"] != nil) {
        [event setValue:[[info userInfo] valueForKey:@"subtitle"] forKey:@"subtitle"];
    }
    
    if ([[info userInfo] objectForKey:@"userInfo"] != nil) {
        [event setValue:[[info userInfo] objectForKey:@"userInfo"] forKey:@"userInfo"];
    }
    
    [self fireEvent:@"shortcutitemclick" withObject:event];
}

#ifdef USE_TI_APPIOSUSERNOTIFICATIONCENTER
-(id)UserNotificationCenter
{
    if (UserNotificationCenter == nil) {
        UserNotificationCenter = [[TiAppiOSUserNotificationCenterProxy alloc] _initWithPageContext:[self executionContext]];
        [self rememberProxy:UserNotificationCenter];
    }
    return UserNotificationCenter;
}
#endif

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

-(void)registerUserNotificationSettings:(id)args
{
	if (![TiUtils isIOS8OrGreater]) return;
	
	ENSURE_SINGLE_ARG(args, NSDictionary);
    
    NSArray *categories;
    NSArray *typesRequested;
    ENSURE_ARG_OR_NIL_FOR_KEY(categories, args, @"categories", NSArray);
    ENSURE_ARG_OR_NIL_FOR_KEY(typesRequested, args, @"types", NSArray);
    
	NSMutableArray *nativeCategories = [NSMutableArray arrayWithCapacity:[categories count]];
	if (categories != nil) {
		for (id category in categories) {
            ENSURE_TYPE(category, TiAppiOSUserNotificationCategoryProxy);
            [nativeCategories addObject:[(TiAppiOSUserNotificationCategoryProxy*)category notificationCategory]];
		}
	}

    NSUInteger types;
    
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        types = UNAuthorizationOptionNone;
#endif
    } else {
        types = UIUserNotificationTypeNone;
    }
    
    if (typesRequested != nil) {
        for (id thisTypeRequested in typesRequested)
        {
            if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
                switch([TiUtils intValue:thisTypeRequested])
                {
                    case UNAuthorizationOptionBadge: // USER_NOTIFICATION_TYPE_BADGE
                    {
                        types |= UNAuthorizationOptionBadge;
                        break;
                    }
                    case UNAuthorizationOptionAlert: // USER_NOTIFICATION_TYPE_ALERT
                    {
                        types |= UNAuthorizationOptionAlert;
                        break;
                    }
                    case UNAuthorizationOptionSound: // USER_NOTIFICATION_TYPE_SOUND
                    {
                        types |= UNAuthorizationOptionSound;
                        break;
                    }
                    case UNAuthorizationOptionCarPlay: // USER_NOTIFICATION_TYPE_CAR_PLAY
                    {
                        types |= UNAuthorizationOptionCarPlay;
                        break;
                    }
                }
#endif
            } else {
                switch([TiUtils intValue:thisTypeRequested]) {
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
    }
 
#if IS_XCODE_8
    [[UNUserNotificationCenter currentNotificationCenter] requestAuthorizationWithOptions:types completionHandler: ^(BOOL granted, NSError *error) {
        if (granted == YES) {
            [[UNUserNotificationCenter currentNotificationCenter] setNotificationCategories:[NSSet setWithArray:nativeCategories]];
        }
        
        if ([self _hasListeners:@"usernotificationsettings"]) {
            NSMutableDictionary *event = [NSMutableDictionary dictionaryWithDictionary:@{@"success": NUMBOOL(granted)}];
            
            if (error) {
                [event setValue:[error localizedDescription] forKey:@"error"];
                [event setValue:NUMINTEGER([error code]) forKey:@"code"];
            }
            
            [self fireEvent:@"usernotificationsettings" withObject:event];
        }
    }];
#else
	UIUserNotificationSettings *notif = [UIUserNotificationSettings settingsForTypes:types
                                                                          categories:[NSSet setWithArray:nativeCategories]];
    TiThreadPerformOnMainThread(^{
        [[UIApplication sharedApplication] registerUserNotificationSettings:notif];
    }, NO);
#endif
}

-(id)createUserNotificationAction:(id)args
{
    return [[[TiAppiOSUserNotificationActionProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}


-(id)createUserNotificationCategory:(id)args
{
    return [[[TiAppiOSUserNotificationCategoryProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
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
    
    DEPRECATED_REPLACED(@"App.iOS.currentUserNotificationSettings", @"6.0.0", @"App.iOS.NotificationCenter.requestUserNotificationSettings");
    
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        DebugLog(@"[ERROR] Please use Ti.App.iOS.NotificationCenter.requestUserNotificationSettings in iOS 10 and later to request user notification settings asynchronously.");
        return;
    } else {
#else
        __block NSDictionary* returnVal = nil;
        TiThreadPerformOnMainThread(^{
            UIUserNotificationSettings *notificationSettings = [[UIApplication sharedApplication] currentUserNotificationSettings];
            returnVal = [[self formatUserNotificationSettings:notificationSettings] retain];
        }, YES);
        
        return [returnVal autorelease];
#endif
    }
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
        TiAppiOSUserNotificationCategoryProxy *categoryProxy = [[[TiAppiOSUserNotificationCategoryProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
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

    id identifier = [args objectForKey:@"identifier"];
    id repeat = [args objectForKey:@"repeat"];
    id date = [args objectForKey:@"date"];
    id region = [args objectForKey:@"region"];
    id alertTitle = [args objectForKey:@"alertTitle"];
    id alertSubtitle = [args objectForKey:@"alertSubtitle"];
    id alertBody = [args objectForKey:@"alertBody"];
    id alertAction = [args objectForKey:@"alertAction"];
    id alertLaunchImage = [args objectForKey:@"alertLaunchImage"];
    id badge = [args objectForKey:@"badge"];
    id category = [args objectForKey:@"category"];
    id userInfo = [args objectForKey:@"userInfo"];
    id sound = [args objectForKey:@"sound"];
    id attachments = [args objectForKey:@"attachments"];

#if IS_XCODE_8
    UNNotificationTrigger *trigger;
    
    if (date) {
        NSCalendar *calendar = [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];

        // Per default, use all components and don't repeat
        NSCalendarUnit components = NSYearCalendarUnit|NSCalendarUnitMonth|NSCalendarUnitDay|NSCalendarUnitHour|NSCalendarUnitMinute|NSCalendarUnitSecond;

        if (repeat != nil) {
            if ([repeat isEqual:@"weekly"]) {
                components = NSCalendarUnitYear;
            } else if ([repeat isEqual:@"daily"]) {
                components = NSCalendarUnitDay;
            } else if ([repeat isEqual:@"yearly"]) {
                components = NSCalendarUnitYear;
            } else if ([repeat isEqual:@"monthly"]) {
                components = NSCalendarUnitMonth;
            } else {
                NSLog(@"[ERROR] Unknown `repeat` value specified. Disabling repeat-behavior.");
            }
        }
        
        trigger = [UNCalendarNotificationTrigger triggerWithDateMatchingComponents:[calendar components:components
                                                                                               fromDate:date]
                                                                           repeats:(repeat != nil)];
    } else if (region) {
        BOOL triggersOnce = [TiUtils boolValue:[region valueForKey:@"triggersOnce"] def:YES];
        double latitude = [TiUtils doubleValue:[region valueForKey:@"latitude"] def:0];
        double longitude = [TiUtils doubleValue:[region valueForKey:@"longitude"] def:0];
        double radius = [TiUtils doubleValue:[region valueForKey:@"radius"] def:kCLDistanceFilterNone];

        CLRegion *circularRegion = [[CLCircularRegion alloc] initWithCenter:CLLocationCoordinate2DMake(latitude, longitude)
                                                                     radius:radius
                                                                 identifier:[TiUtils stringValue:@"identifier"
                                                                                      properties:args
                                                                                             def:@"notification"]];
        
        trigger = [UNLocationNotificationTrigger triggerWithRegion:circularRegion
                                                           repeats:triggersOnce];
    } else {
        DebugLog(@"[ERROR] Notifications in iOS 10 require the either a `date` or `region` property to be set.");
        return;
    }
    
    UNMutableNotificationContent *content = [UNMutableNotificationContent new];
    
    if (alertTitle) {
        [content setTitle:[TiUtils stringValue:alertTitle]];
    }
    
    if (alertSubtitle) {
        [content setSubtitle:[TiUtils stringValue:alertSubtitle]];
    }
    
    if (alertBody) {
        [content setBody:[TiUtils stringValue:alertBody]];
    }
    
    if (alertLaunchImage) {
        [content setLaunchImageName:[TiUtils stringValue:alertLaunchImage]];
    }
    
    if (badge) {
        [content setBadge:[TiUtils numberFromObject:badge]];
    }
    
    if (userInfo) {
        [content setUserInfo:userInfo];
    }
    
    if (attachments) {
        NSMutableArray<UNNotificationAttachment*> *_attachments = [NSMutableArray arrayWithCapacity:[attachments count]];
        for (id attachment in attachments) {
            NSString *_identifier;
            NSString *_url;
            NSDictionary *_options; // e.g. {"UNNotificationAttachmentOptionsTypeHintKey": "test"}
            NSError *error = nil;
            
            ENSURE_ARG_FOR_KEY(_identifier, attachment, @"identifier", NSString);
            ENSURE_ARG_FOR_KEY(_url, attachment, @"url", NSString);
            ENSURE_ARG_OR_NIL_FOR_KEY(_options, attachment, @"options", NSDictionary);
            
            UNNotificationAttachment *_attachment = [UNNotificationAttachment attachmentWithIdentifier:_identifier
                                                                                                   URL:[TiUtils toURL:_url proxy:self]
                                                                                               options:_options
                                                                                                 error:&error];
            if (error != nil) {
                NSLog(@"[ERROR] The attachment \"%@\" is invalid: %@", _identifier, [error localizedDescription]);
                RELEASE_TO_NIL(_attachment);
            } else {
                [_attachments addObject:_attachment];
            }
        }
        [content setAttachments:_attachments];
    }
    
    if (sound) {
        if ([sound isEqual:@"default"]) {
            [content setSound:[UNNotificationSound defaultSound]];
        } else {
            [content setSound:[UNNotificationSound soundNamed:sound]];
        }
    }
    
    if (category != nil && [category isKindOfClass:[TiAppiOSUserNotificationCategoryProxy class]]) {
        [content setCategoryIdentifier:[(TiAppiOSUserNotificationCategoryProxy*)category identifier]];
    } else if (category != nil && [category isKindOfClass:[NSString class]]) {
        [content setCategoryIdentifier:[TiUtils stringValue:category]];
    }
    
    UNNotificationRequest *request = [UNNotificationRequest requestWithIdentifier:[TiUtils stringValue:identifier]
                                                                             content:content
                                                                             trigger:trigger];
    
    TiThreadPerformOnMainThread(^{
        [[UNUserNotificationCenter currentNotificationCenter] addNotificationRequest:request
                                                               withCompletionHandler:^(NSError *error) {
            if (error) {
               DebugLog(@"[ERROR] The notification could not be scheduled: %@", [error localizedDescription]);
            }
        }];
    }, NO);
    
#else
	UILocalNotification *content = [UILocalNotification new];
		
	if (date!=nil) {
		content.fireDate = date;
		content.timeZone = [NSTimeZone defaultTimeZone];
	}
	
	if (repeat!=nil) {
		if ([repeat isEqual:@"weekly"]) {
			content.repeatInterval = NSWeekCalendarUnit;
		}
		else if ([repeat isEqual:@"daily"]) {
			content.repeatInterval = NSDayCalendarUnit;
		}
		else if ([repeat isEqual:@"yearly"]) {
			content.repeatInterval = NSYearCalendarUnit;
		}
		else if ([repeat isEqual:@"monthly"]) {
			content.repeatInterval = NSMonthCalendarUnit;
		}
	}
	
	if (alertBody!=nil) {
		content.alertBody = alertBody;
    }

    if (alertTitle!=nil && [TiUtils isIOS82rGreater]) {
		content.alertTitle = alertTitle;
	}
	
    if (alertAction!=nil) {
		content.alertAction = alertAction;
	}

    if (alertLaunchImage!=nil) {
		content.alertLaunchImage = alertLaunchImage;
	}

    if (badge!=nil) {
		content.applicationIconBadgeNumber = [TiUtils intValue:badge];
	}
    
	if (region!=nil) {
        ENSURE_TYPE(region, NSDictionary);
        
		BOOL regionTriggersOnce = [TiUtils boolValue:[region valueForKey:@"triggersOnce"] def:YES];
		double latitude = [TiUtils doubleValue:[region valueForKey:@"latitude"] def:0];
        double longitude = [TiUtils doubleValue:[region valueForKey:@"longitude"] def:0];
        double radius = [TiUtils doubleValue:[region valueForKey:@"radius"] def:kCLDistanceFilterNone];

		CLLocationCoordinate2D center = CLLocationCoordinate2DMake(latitude, longitude);
        
		if (!CLLocationCoordinate2DIsValid(center)) {
			NSLog(@"[WARN] The provided region is invalid, please check your `latitude` and `longitude`!");
			return;
		}
        
		content.region = [[CLCircularRegion alloc] initWithCenter:center
                                                           radius:radius
                                                       identifier:[TiUtils stringValue:@"identifier"
                                                                            properties:args
                                                                                   def:@"notification"]];
		
		content.regionTriggersOnce = regionTriggersOnce;
	}

	if (sound) {
		if ([sound isEqual:@"default"]) {
			content.soundName = UILocalNotificationDefaultSoundName;
		} else {
			content.soundName = sound;
		}
	}

	if (userInfo) {
		content.userInfo = userInfo;
	}

	if ([TiUtils isIOS8OrGreater]) {
		id category = [args objectForKey:@"category"];
		if (category != nil && [category isKindOfClass:[TiAppiOSUserNotificationCategoryProxy class]]) {
			content.category = [(TiAppiOSUserNotificationCategoryProxy*)category identifier];
		} else if (category != nil && [category isKindOfClass:[NSString class]]) {
			content.category = category;
		}
	}
	
	TiThreadPerformOnMainThread(^{
		if (date != nil || region != nil) {
			[[UIApplication sharedApplication] scheduleLocalNotification:content];
		} else {
			[[UIApplication sharedApplication] presentLocalNotificationNow:content];
		}
	}, NO);
#endif
    
	TiAppiOSLocalNotificationProxy *lp = [[[TiAppiOSLocalNotificationProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	lp.notification = content;

	[content release];
	return lp;
}

-(void)cancelAllLocalNotifications:(id)unused
{
    ENSURE_UI_THREAD(cancelAllLocalNotifications, unused);

    DEPRECATED_REPLACED(@"App.iOS.cancelAllLocalNotifications", @"6.0.0", @"App.iOS.NotificationCenter.removeAllPendingNotifications");
    
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        DebugLog(@"[ERROR] Please use Ti.App.iOS.NotificationCenter.removeAllPendingNotifications in iOS 10 and later.");
        return;
    } else {
#else
        [[UIApplication sharedApplication] cancelAllLocalNotifications];
#endif
    }
}

-(void)cancelLocalNotification:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	ENSURE_UI_THREAD(cancelLocalNotification,args);
    
    DEPRECATED_REPLACED(@"App.iOS.cancelLocalNotification", @"6.0.0", @"App.iOS.NotificationCenter.removePendingNotificationsWithIdentifiers");
    
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        DebugLog(@"[ERROR] Please use Ti.App.iOS.NotificationCenter.removePendingNotificationsWithIdentifiers in iOS 10 and later.");
        return;
    } else {
#else
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
#endif
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
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        return NUMINT(UNAuthorizationOptionNone);
#else
    } else if ([TiUtils isIOS8OrGreater]) {
        return NUMINT(UIUserNotificationTypeNone);
#endif
    }
    return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_BADGE
{
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        return NUMINT(UNAuthorizationOptionBadge);
    } else if ([TiUtils isIOS8OrGreater]) {
#else
        return NUMINT(UIUserNotificationTypeBadge);
#endif
    }
    return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_SOUND
{
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        return NUMINT(UNAuthorizationOptionSound);
    } else if ([TiUtils isIOS8OrGreater]) {
#else
        return NUMINT(UIUserNotificationTypeSound);
#endif
    }
    return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_ALERT
{
    if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
        return NUMINT(UNAuthorizationOptionAlert);
    } else if ([TiUtils isIOS8OrGreater]) {
#else
       return NUMINT(UIUserNotificationTypeAlert);
#endif
    }
    return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_TYPE_CAR_PLAY
{
#if IS_XCODE_8
    if ([TiUtils isIOS10OrGreater]) {
        return NUMINT(UNAuthorizationOptionCarPlay);
    }
#endif
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
    if ([TiUtils isIOS9OrGreater]) {
        return NUMINT(UIUserNotificationActionBehaviorDefault);
    }

    return NUMINT(0);
}

-(NSNumber*)USER_NOTIFICATION_BEHAVIOR_TEXTINPUT
{
    if ([TiUtils isIOS9OrGreater]) {
        return NUMINT(UIUserNotificationActionBehaviorTextInput);
    }

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

#if IS_XCODE_8
MAKE_SYSTEM_PROP(USER_NOTIFICATION_AUTHORIZATION_STATUS_DENIED, UNAuthorizationStatusDenied);
MAKE_SYSTEM_PROP(USER_NOTIFICATION_AUTHORIZATION_STATUS_AUTHORIZED, UNAuthorizationStatusAuthorized);
MAKE_SYSTEM_PROP(USER_NOTIFICATION_AUTHORIZATION_STATUS_NOT_DETERMINED, UNAuthorizationStatusNotDetermined);

MAKE_SYSTEM_PROP(USER_NOTIFICATION_SETTING_ENABLED, UNNotificationSettingEnabled);
MAKE_SYSTEM_PROP(USER_NOTIFICATION_SETTING_DISABLED, UNNotificationSettingDisabled);
MAKE_SYSTEM_PROP(USER_NOTIFICATION_SETTING_NOT_SUPPORTED, UNNotificationSettingNotSupported);

MAKE_SYSTEM_PROP(USER_NOTIFICATION_ALERT_STYLE_NONE, UNAlertStyleNone);
MAKE_SYSTEM_PROP(USER_NOTIFICATION_ALERT_STYLE_ALERT, UNAlertStyleAlert);
MAKE_SYSTEM_PROP(USER_NOTIFICATION_ALERT_STYLE_BANNER, UNAlertStyleBanner);
#endif

@end

#endif
