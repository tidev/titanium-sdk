/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIDASHBOARDVIEW

#import "LauncherView.h"
#import <TitaniumKit/TiUIView.h>

@interface TiUIDashboardView : TiUIView <LauncherViewDelegate> {

  @private
  LauncherView *launcher;
}

- (LauncherView *)launcher;
- (void)setViewData_:(NSArray *)data;
- (void)startEditing;
- (void)stopEditing;

@end

#endif
