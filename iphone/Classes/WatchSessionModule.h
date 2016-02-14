/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if IS_XCODE_7
#import "TiModule.h"
#import <WatchConnectivity/watchConnectivity.h>

@interface WatchSessionModule : TiModule<WCSessionDelegate> {
@private
    WCSession *watchSession;
}

@property(nonatomic,readonly) NSNumber* WATCH_SESSION_ACTIVATION_STATE_NOT_ACTIVATED;
@property(nonatomic,readonly) NSNumber* WATCH_SESSION_ACTIVATION_STATE_INACTIVE;
@property(nonatomic,readonly) NSNumber* WATCH_SESSION_ACTIVATION_STATE_ACTIVATED;

@end
#endif