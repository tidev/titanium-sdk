/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppiOSNotificationCategoryProxy.h"
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
-(UIMutableUserNotificationCategory*)notificationCategory
{
	if (_notificationCategory == nil) {
		_notificationCategory = [[UIMutableUserNotificationCategory alloc] init];
	}
	return _notificationCategory;
}

-(NSString*)identifier
{
	return [[self notificationCategory] identifier];
}

-(void)setIdentifier:(NSString *)identifier
{
	[[self notificationCategory] setIdentifier:identifier];
}

@end

#endif
