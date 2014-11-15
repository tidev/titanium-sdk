/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
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

-(UIMutableUserNotificationAction*) notificationAction
{
	if (_notificationAction == nil) {
		_notificationAction = [[UIMutableUserNotificationAction alloc] init];
	}
	return _notificationAction;
}

-(NSString*)identifier
{
	return [[self notificationAction] identifier];
}
-(NSString*)title
{
	return [[self notificationAction] title];
}
-(NSNumber*)activationMode
{
	return NUMINT([[self notificationAction] activationMode]);
}

-(void)setIdentifier:(NSString*)args
{
	[[self notificationAction] setIdentifier: args];
}
-(void)setTitle:(NSString*)args
{
	[[self notificationAction] setTitle: args];
}
-(void)setActivationMode:(NSNumber*)args
{
	UIUserNotificationActivationMode activationMode = [TiUtils intValue:args def:0];
	[[self notificationAction] setActivationMode: activationMode];
}
@end

#endif
