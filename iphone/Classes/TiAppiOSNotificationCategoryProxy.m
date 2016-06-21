/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSNotificationCategoryProxy.h"
#import "TiAppiOSNotificationActionProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSNotificationCategoryProxy

-(void)dealloc
{
	RELEASE_TO_NIL(_notificationCategory);
	[super dealloc];
}

-(NSString*)apiName
{
	return @"Ti.App.iOS.NotificationCategory";
}

-(id)_initWithPageContext:(id<TiEvaluator>)context args:(NSArray *)args
{
    if (_notificationCategory == nil) {
        
        id identifier = [args valueForKey:@"identifier"];
        id actionsForDefaultContext = [args valueForKey:@"actionsForDefaultContext"];
        id actionsForMinimalContext = [args valueForKey:@"actionsForMinimalContext"];
        id intentIdentifiers = [args valueForKey:@"intentIdentifiers"];
        
        NSMutableArray *defaultActions = [NSMutableArray new];
        NSMutableArray *minimalActions = [NSMutableArray new];
        
        for (TiAppiOSNotificationActionProxy *action in actionsForDefaultContext) {
            [defaultActions addObject:[action notificationAction]];
        }
        
        for (TiAppiOSNotificationActionProxy *action in actionsForMinimalContext) {
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
    
    [super _initWithPageContext:context args:args];
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
