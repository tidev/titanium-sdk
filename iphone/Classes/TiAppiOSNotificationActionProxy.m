/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSNotificationActionProxy.h"
#import "TiUtils.h"

#ifdef USE_TI_APPIOS

@implementation TiAppiOSNotificationActionProxy

-(void)dealloc
{
	RELEASE_TO_NIL(_notificationAction);
	[super dealloc];
}

-(NSString*)apiName
{
	return @"Ti.App.iOS.NotificationAction";
}

-(id)_initWithPageContext:(id<TiEvaluator>)context args:(NSArray *)args
{
    if (_notificationAction == nil) {
        
#if IS_XCODE_8
        id identifier = [args valueForKey:@"identifier"];
        id title = [args valueForKey:@"title"];
        id activationMode = [args valueForKey:@"activationMode"];
        id authenticationRequired = [args valueForKey:@"authenticationRequired"];
        id destructive = [args valueForKey:@"destructive"];
        id behavior = [args valueForKey:@"behavior"];
        id textInputButtonTitle = [args valueForKey:@"textInputButtonTitle"];
        id textInputButtonPlaceholder = [args valueForKey:@"textInputButtonPlaceholder"];
        
        UNNotificationActionOptions options = UNNotificationActionOptionNone;
        
        if (destructive) {
            options |= UNNotificationActionOptionDestructive;
        }
        
        if (authenticationRequired) {
            options |= UNNotificationActionOptionAuthenticationRequired;
        }
        
        if (behavior && [TiUtils intValue:behavior def:0] == UIUserNotificationActionBehaviorTextInput) {
            _notificationAction = [UNTextInputNotificationAction actionWithIdentifier:identifier
                                                                                title:title
                                                                              options:options
                                                                 textInputButtonTitle:textInputButtonTitle
                                                                 textInputPlaceholder:textInputButtonPlaceholder];
            return;
        }
        
        _notificationAction = [UNNotificationAction actionWithIdentifier:identifier
                                                                   title:title
                                                                 options:[TiUtils intValue:activationMode]];
#else
        _notificationAction = [UIMutableUserNotificationAction new];
#endif
    }
    
    [super _initWithPageContext:context args:args];
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
