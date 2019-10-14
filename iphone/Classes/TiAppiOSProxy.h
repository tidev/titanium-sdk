/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiProxy.h>

#ifdef USE_TI_APPIOS

#import "TiAppiOSBackgroundServiceProxy.h"

@interface TiAppiOSProxy : TiProxy {
  @private
  NSMutableDictionary *backgroundServices;

#ifdef USE_TI_APPIOSUSERNOTIFICATIONCENTER
  TiProxy *UserNotificationCenter;
#endif
}
@property (nonatomic, readonly) NSString *EVENT_ACCESSIBILITY_LAYOUT_CHANGED;
@property (nonatomic, readonly) NSString *EVENT_ACCESSIBILITY_SCREEN_CHANGED;

#ifdef DEBUG
- (void)garbageCollectForDebugging:(id)args;
#endif

@end

#endif
