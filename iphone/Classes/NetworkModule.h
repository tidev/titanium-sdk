/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiModule.h"
#import "KrollCallback.h"
#import "Reachability.h"

@interface NetworkModule : TiModule {
@private
	TiNetworkConnectionState state;
	KrollCallback *pushNotificationCallback;
	KrollCallback *pushNotificationError;
	KrollCallback *pushNotificationSuccess;
	Reachability *reachability;
}

@property(nonatomic,readonly) BOOL online;
@property(nonatomic,readonly) NSString* networkTypeName;
@property(nonatomic,readonly) NSInteger networkType;
@property(nonatomic,readonly) NSString* remoteDeviceUUID;

@property(nonatomic,readonly) NSInteger NETWORK_NONE;
@property(nonatomic,readonly) NSInteger NETWORK_WIFI;
@property(nonatomic,readonly) NSInteger NETWORK_MOBILE;
@property(nonatomic,readonly) NSInteger NETWORK_LAN;
@property(nonatomic,readonly) NSInteger NETWORK_UNKNOWN;

@property(nonatomic,readonly) NSInteger NOTIFICATION_TYPE_BADGE;
@property(nonatomic,readonly) NSInteger NOTIFICATION_TYPE_ALERT;
@property(nonatomic,readonly) NSInteger NOTIFICATION_TYPE_SOUND;


-(id)encodeURIComponent:(id)args;
-(id)decodeURIComponent:(id)args;
-(void)addConnectivityListener:(id)args;
-(void)removeConnectivityListener:(id)args;

#pragma mark Private
-(void)updateReachabilityStatus;

@end

