/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#ifdef USE_TI_APPIOS

@interface TiAppiOSNotificationActionProxy : TiProxy {
}

@property (nonatomic, retain) UIMutableUserNotificationAction *notificationAction;

@property (nonatomic, assign) NSString *identifier;
@property (nonatomic, assign) NSString *title;
@property (nonatomic, assign) NSNumber *activationMode;

@end

#endif
