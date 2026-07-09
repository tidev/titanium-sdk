/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiProxy.h>

#ifdef USE_TI_APPIOS

#import "TiAppiOSBackgroundServiceProxy.h"

@interface TiAppiOSProxy : TiProxy {
  @private
  NSMutableDictionary *backgroundServices;

#if defined(USE_TI_APPIOSUSERNOTIFICATIONCENTER)
  TiProxy *UserNotificationCenter;
#endif
}
@property (nonatomic, readonly) NSString *EVENT_ACCESSIBILITY_LAYOUT_CHANGED;
@property (nonatomic, readonly) NSString *EVENT_ACCESSIBILITY_SCREEN_CHANGED;

@end

#endif
