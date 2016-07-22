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
        
        id identifier = [properties valueForKey:@"identifier"];
        id title = [properties valueForKey:@"title"];
        id activationMode = [properties valueForKey:@"activationMode"];
        id authenticationRequired = [properties valueForKey:@"authenticationRequired"];
        id destructive = [properties valueForKey:@"destructive"];
        id behavior = [properties valueForKey:@"behavior"];
        id textInputButtonTitle = [properties valueForKey:@"textInputButtonTitle"];
        id textInputButtonPlaceholder = [properties valueForKey:@"textInputButtonPlaceholder"];
        
        if ([TiUtils isIOS10OrGreater]) {
#if IS_XCODE_8
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
            } else {
                _notificationAction = [[UNNotificationAction actionWithIdentifier:identifier
                                                                            title:title
                                                                          options:[TiUtils intValue:activationMode]] retain];
            }
#endif
        } else {
            _notificationAction = [[UIMutableUserNotificationAction new] retain];
        }
    }
    
    [super _initWithProperties:properties];
}

- (id)notificationAction
{
	return _notificationAction;
}

#pragma mark Public API's

#if !defined(IS_XCODE_8)
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
