/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS

#import <TitaniumKit/KrollBridge.h>
#import <TitaniumKit/TiProxy.h>

@interface TiAppiOSBackgroundServiceProxy : TiProxy {

  @private
  KrollBridge *bridge;
}

- (void)beginBackground;
- (void)endBackground;

@end

#endif
