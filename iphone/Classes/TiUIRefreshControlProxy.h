/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIREFRESHCONTROL
#import <TitaniumKit/TiProxy.h>

@interface TiUIRefreshControlProxy : TiProxy {
  UIRefreshControl *_refreshControl;
}

#pragma mark - Internal Use Only
- (UIRefreshControl *)control;

@end
#endif
