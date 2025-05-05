/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_WATCHSESSION

#import <TitaniumKit/TiModule.h>
#import <WatchConnectivity/WatchConnectivity.h>

@interface WatchSessionModule : TiModule <WCSessionDelegate> {
  @private
  WCSession *watchSession;
}

@property (nonatomic, readonly) NSNumber *ACTIVATION_STATE_NOT_ACTIVATED;
@property (nonatomic, readonly) NSNumber *ACTIVATION_STATE_INACTIVE;
@property (nonatomic, readonly) NSNumber *ACTIVATION_STATE_ACTIVATED;

@end

#endif
