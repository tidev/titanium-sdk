/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiTab.h"
#import "TiViewController.h"
#import "TiViewProxy.h"

#import "TiUIiOSTransitionAnimationProxy.h"

@class KrollPromise;

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
  BOOL forceModal;
  UIStatusBarStyle barStyle;
  TiViewProxy<TiTab> *tab;
  TiAnimation *openAnimation;
  TiAnimation *closeAnimation;
  UIView *animatedOver;
  TiUIiOSTransitionAnimationProxy *transitionProxy;
  KrollPromise *openPromise;
  KrollPromise *closePromise;
}

@property (nonatomic, readwrite, assign) TiViewProxy<TiTab> *tab;
@property (nonatomic, readonly) TiProxy *tabGroup;
@property (nonatomic) BOOL isMasterWindow;
@property (nonatomic) BOOL isDetailWindow;
@property (nonatomic) BOOL safeAreaInsetsUpdated;

- (void)processForSafeArea;
- (UIViewController *)windowHoldingController;
- (TiUIiOSTransitionAnimationProxy *)transitionAnimation;

@end
