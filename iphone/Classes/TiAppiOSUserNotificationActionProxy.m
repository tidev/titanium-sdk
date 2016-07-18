/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSUserNotificationActionProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSUserNotificationActionProxy

-(void)dealloc
{
	RELEASE_TO_NIL(_notificationAction);
	[super dealloc];
}

-(NSString*)apiName
{
	return @"Ti.App.iOS.UserNotificationAction";
}

-(void)_initWithProperties:(NSDictionary *)properties
{
    if (_notificationAction == nil) {
        
#if IS_XCODE_8
        id identifier = [properties valueForKey:@"identifier"];
        id title = [properties valueForKey:@"title"];
        id activationMode = [properties valueForKey:@"activationMode"];
        id authenticationRequired = [properties valueForKey:@"authenticationRequired"];
        id destructive = [properties valueForKey:@"destructive"];
        id behavior = [properties valueForKey:@"behavior"];
        id textInputButtonTitle = [properties valueForKey:@"textInputButtonTitle"];
        id textInputButtonPlaceholder = [properties valueForKey:@"textInputButtonPlaceholder"];
        
        UNNotificationActionOptions options = UNNotificationActionOptionNone;
        
        if (destructive) {
            options |= UNNotificationActionOptionDestructive;
        }
        
        if (authenticationRequired) {
            options |= UNNotificationActionOptionAuthenticationRequired;
        }
        
        if (behavior && [TiUtils intValue:behavior def:0] == UIUserNotificationActionBehaviorTextInput) {
            _notificationAction = [[UNTextInputNotificationAction actionWithIdentifier:identifier
                                                                                title:title
                                                                              options:options
                                                                 textInputButtonTitle:textInputButtonTitle
                                                                 textInputPlaceholder:textInputButtonPlaceholder] retain];

            [super _initWithProperties:properties];
            return;
        }
        
        _notificationAction = [[UNNotificationAction actionWithIdentifier:identifier
                                                                   title:title
                                                                 options:[TiUtils intValue:activationMode]] retain];
#else
        _notificationAction = [[UIMutableUserNotificationAction new] retain];
#endif
    }
    
    [super _initWithProperties:properties];
}

#if IS_XCODE_8
-(UNNotificationAction*) notificationAction
#else
-(UIMutableUserNotificationAction*) notificationAction
#endif
{
	return _notificationAction;
}

#pragma mark Public API's

#if IS_XCODE_8
    // The iOS 10 API's are creation-only, so there are no proxy setters
#else
- (void)setIdentifier:(id)value
{
    [[self notificationAction] setIdentifier:value];
}

- (void)setTitle:(id)value
{
    [[self notificationAction] setTitle:value];
}

- (void)setActivationMode:(id)value
{
    [[self notificationAction] setActivationMode:[TiUtils intValue:value]];
}

- (void)setBehavior:(id)value
{
    [[self notificationAction] setBehavior:[TiUtils intValue:value]];
}

- (void)setDestructive:(id)value
{
    [[self notificationAction] setDestructive:[TiUtils boolValue:value]];
}

- (void)setAuthenticationRequired:(id)value
{
    [[self notificationAction] setAuthenticationRequired:[TiUtils boolValue:value]];
}
#endif

@end

#endif
