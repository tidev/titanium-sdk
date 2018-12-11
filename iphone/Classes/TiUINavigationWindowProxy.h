/**
 * Axway Titanium
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_UINAVIGATIONWINDOW) || defined(USE_TI_UIIOSNAVIGATIONWINDOW)

@import TitaniumKit.TiWindowProxy;

@interface TiUINavigationWindowProxy : TiWindowProxy <UINavigationControllerDelegate, UIGestureRecognizerDelegate, TiOrientationController, TiTab> {
  @private
  UINavigationController *navController;
  TiWindowProxy *rootWindow;
  TiWindowProxy *current;
  BOOL transitionIsAnimating;
  BOOL transitionWithGesture;
}

// Private API
- (void)_setFrame:(CGRect)bounds;

@end

#endif
