/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserNotificationCategoryProxy.h"
#import "TiAppiOSUserNotificationActionProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSUserNotificationCategoryProxy

-(void)dealloc
{
	RELEASE_TO_NIL(_notificationCategory);
	[super dealloc];
}

-(NSString*)apiName
{
	return @"Ti.App.iOS.UserNotificationCategory";
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    if (_notificationCategory == nil) {
        
        // TODO: Grab properties from self (proxy) instead of local copy
        id identifier = [properties valueForKey:@"identifier"];
        id actionsForDefaultContext = [properties valueForKey:@"actionsForDefaultContext"];
        id actionsForMinimalContext = [properties valueForKey:@"actionsForMinimalContext"];
        id intentIdentifiers = [properties valueForKey:@"intentIdentifiers"];
        
        NSMutableArray *defaultActions = [NSMutableArray new];
        NSMutableArray *minimalActions = [NSMutableArray new];
        
        for (TiAppiOSUserNotificationActionProxy *action in actionsForDefaultContext) {
            [defaultActions addObject:[action notificationAction]];
        }
        
        for (TiAppiOSUserNotificationActionProxy *action in actionsForMinimalContext) {
            [minimalActions addObject:[action notificationAction]];
        }
        
        if (!intentIdentifiers) {
            intentIdentifiers = @[];
        }
        
#if IS_XCODE_8
        _notificationCategory = [UNNotificationCategory categoryWithIdentifier:identifier
                                                                       actions:defaultActions
                                                                minimalActions:minimalActions
                                                             intentIdentifiers:intentIdentifiers
                                                                       options:UNNotificationCategoryOptionNone];
#else
        _notificationCategory = [[UIMutableUserNotificationCategory alloc] init];
        [_notificationCategory setIdentifier:identifier];
        [_notificationCategory setActions:defaultActions forContext:UIUserNotificationActionContextDefault];
        [_notificationCategory setActions:minimalActions forContext:UIUserNotificationActionContextMinimal];
#endif
    }
    
    [super _initWithProperties:properties];
}

#if IS_XCODE_8
-(UNNotificationCategory*)notificationCategory
#else
-(UIUserNotificationCategory*)notificationCategory
#endif
{
	return _notificationCategory;
}

-(NSString*)identifier
{
	return [[self notificationCategory] identifier];
}

@end

#endif
