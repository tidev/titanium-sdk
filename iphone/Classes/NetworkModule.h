/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

typedef enum {
	NetworkModuleConnectionStateNone = 0,
	NetworkModuleConnectionStateWifi = 1,
	NetworkModuleConnectionStateMobile = 2,
	NetworkModuleConnectionStateLan = 3,
	NetworkModuleConnectionStateUnknown = 4,	
} NetworkModuleConnectionState;


@interface NetworkModule : TiModule {
@private
	NetworkModuleConnectionState state;
	NSString *remoteDeviceUUID;
}

@property(nonatomic,readonly) NSNumber* online;
@property(nonatomic,readonly) NSString* networkTypeName;
@property(nonatomic,readonly) NSNumber* networkType;
@property(nonatomic,readonly) NSString* remoteDeviceUUID;

@property(nonatomic,readonly) NSNumber* NETWORK_NONE;
@property(nonatomic,readonly) NSNumber* NETWORK_WIFI;
@property(nonatomic,readonly) NSNumber* NETWORK_MOBILE;
@property(nonatomic,readonly) NSNumber* NETWORK_LAN;
@property(nonatomic,readonly) NSNumber* NETWORK_UNKNOWN;


-(id)encodeURIComponent:(id)args;
-(id)decodeURIComponent:(id)args;
-(void)addConnectivityListener:(id)args;
-(void)removeConnectivityListener:(id)args;

#pragma mark Private
-(void)updateReachabilityStatus;

@end

