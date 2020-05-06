/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_APPIOS

#import "Titanium-Swift.h"
#import <TitaniumKit/KrollBridge.h>
#import <TitaniumKit/TiProxy.h>

@interface TiAppiOSBackgroundServiceProxy : TiProxy <BackgroundTaskProxy> {

  @private
  KrollBridge *bridge;
}

- (void)beginBackground;
- (void)endBackground;

@end

#endif
