/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiViewProxy.h>

#import "TiTab.h"
#import "TiUIiOSTransitionAnimationProxy.h"
#import "TiViewController.h"

@interface TiWindowProxy : TiViewProxy <TiWindowProtocol, TiAnimationDelegate> {
  @protected
  TiViewController *controller;
  id<TiOrientationController> parentController;
  TiOrientationFlags _supportedOrientations;
  BOOL opening;
  BOOL opened;
  BOOL closing;
  BOOL focussed;
  BOOL isModal;
  BOOL hidesStatusBar;
  UIStatusBarStyle barStyle;
  TiViewProxy<TiTab> *tab;
  TiAnimation *openAnimation;
  TiAnimation *closeAnimation;
  UIView *animatedOver;
  TiUIiOSTransitionAnimationProxy *transitionProxy;
}

@property (nonatomic, readwrite, assign) TiViewProxy<TiTab> *tab;
@property (nonatomic, readonly) TiProxy *tabGroup;
@property (nonatomic) BOOL isMasterWindow;
@property (nonatomic) BOOL isDetailWindow;

- (void)processForSafeArea;

- (UIViewController *)windowHoldingController;

- (TiUIiOSTransitionAnimationProxy *)transitionAnimation;

@end
