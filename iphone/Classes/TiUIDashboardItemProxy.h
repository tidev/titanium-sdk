/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "LauncherItem.h"
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIDashboardItemProxy : TiViewProxy {
  @private
  LauncherItem *item;
}

@property (nonatomic, readwrite, retain) LauncherItem *item;

@end

#endif
