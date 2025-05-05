/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import <TitaniumKit/TiTabGroup.h>
#import <TitaniumKit/TiWindowProxy.h>

@interface TiUITabGroupProxy : TiWindowProxy <TiTabGroup> {
  @private
  NSMutableArray *tabs;
}

- (UITabBar *)tabbar;
- (void)_resetTabArray:(NSArray *)newTabOrder; // Used in tab reordering

#pragma mark - internal use only
- (BOOL)canFocusTabs;
@end

#endif
