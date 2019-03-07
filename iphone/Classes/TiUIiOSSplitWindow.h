/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import <TitaniumKit/TiUIWindow.h>

@interface TiUIiOSSplitWindow : TiUIWindow {
  @private
  UIView *masterViewWrapper;
  UIView *detailViewWrapper;
  BOOL showMasterInPortrait;
  BOOL masterIsOverlayed;
  BOOL viewsInitialized;
  BOOL masterViewVisible;

  TiViewProxy *masterProxy;
  TiViewProxy *detailProxy;

  float splitRatioPortrait;
  float splitRatioLandscape;
}

#pragma mark - Titanim Internal Use Only
- (void)setShowMasterInPortrait_:(id)value withObject:(id)animated;
- (void)setMasterIsOverlayed_:(id)value withObject:(id)animated;
- (void)initWrappers;
- (void)cleanup;
- (void)setMasterViewVisible_:(NSNumber *)value;
@end
#endif
