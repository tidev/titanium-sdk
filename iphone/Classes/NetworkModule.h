/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORK

#import "TiBase.h"
#import "TiModule.h"
#import "KrollCallback.h"
#import "Reachability.h"

typedef enum {
	READ_MODE = 1,
	WRITE_MODE = 2,
	READ_WRITE_MODE = 3 // Alias for READ | WRITE
} SocketMode;

@interface NetworkModule : TiModule {
@private
	TiNetworkConnectionState state;
	KrollCallback *pushNotificationCallback;
	KrollCallback *pushNotificationError;
	KrollCallback *pushNotificationSuccess;
	Reachability *reachability;
    
    TiProxy* socketProxy;
}

@property(nonatomic,readonly) NSNumber* online;
@property(nonatomic,readonly) NSString* networkTypeName;
@property(nonatomic,readonly) NSNumber* networkType;
@property(nonatomic,readonly) NSString* remoteDeviceUUID;
@property(nonatomic,readonly) NSNumber* remoteNotificationsEnabled;
@property(nonatomic,readonly) NSArray* remoteNotificationTypes;

@property(nonatomic,readonly) NSNumber* NETWORK_NONE;
@property(nonatomic,readonly) NSNumber* NETWORK_WIFI;
@property(nonatomic,readonly) NSNumber* NETWORK_MOBILE;
@property(nonatomic,readonly) NSNumber* NETWORK_LAN;
@property(nonatomic,readonly) NSNumber* NETWORK_UNKNOWN;

@property(nonatomic,readonly) NSNumber* NOTIFICATION_TYPE_BADGE;
@property(nonatomic,readonly) NSNumber* NOTIFICATION_TYPE_ALERT;
@property(nonatomic,readonly) NSNumber* NOTIFICATION_TYPE_SOUND;

@property(readonly, nonatomic) NSNumber* READ_MODE;
@property(readonly, nonatomic) NSNumber* WRITE_MODE;
@property(readonly, nonatomic) NSNumber* READ_WRITE_MODE;
@property(readonly, nonatomic) NSString* INADDR_ANY;

@property(nonatomic, readonly) NSNumber* TLS_VERSION_1_0;
@property(nonatomic, readonly) NSNumber* TLS_VERSION_1_1;
@property(nonatomic, readonly) NSNumber* TLS_VERSION_1_2;

-(id)encodeURIComponent:(id)args;
-(id)decodeURIComponent:(id)args;

#pragma mark Private
-(void)updateReachabilityStatus;

@end

#endif