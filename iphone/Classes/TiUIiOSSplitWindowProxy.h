/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSSPLITWINDOW
#import <TitaniumKit/TiWindowProxy.h>

/**
 A window that shows a master and a detail window side by side with the native UISplitViewController.
 The split view controller owns the layout. Its properties are exposed 1:1, see the API docs of the SplitWindow.
 */
@interface TiUIiOSSplitWindowProxy : TiWindowProxy <UISplitViewControllerDelegate> {
  @private
  UISplitViewController *splitController;
  TiWindowProxy *masterWindow;
  TiWindowProxy *detailWindow;
}

@end
#endif
