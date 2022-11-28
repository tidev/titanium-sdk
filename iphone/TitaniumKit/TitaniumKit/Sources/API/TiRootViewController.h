/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiControllerProtocols.h"
#import <UIKit/UIKit.h>

@interface TiRootViewController : UIViewController <TiRootControllerProtocol, TiControllerContainment, TiOrientationController> {
  //Default background properties
  UIColor *bgColor;
  UIImage *bgImage;
  UIView *hostView;
  NSInteger curTransformAngle;
  BOOL forceLayout;
  UIView *defaultImageView;

  //Keyboard stuff
  BOOL updatingAccessoryView;
  UIView *enteringAccessoryView; //View that will enter.
  UIView *accessoryView; //View that is onscreen.
  UIView *leavingAccessoryView; //View that is leaving the screen.
  TiViewProxy<TiKeyboardFocusableView> *keyboardFocusedProxy; //View whose becoming key affects things.

  CGRect startFrame; //Where the keyboard was before the handling
  CGRect targetedFrame; //The keyboard place relative to where the accessoryView is moving;
  CGRect endFrame; //Where the keyboard will be after the handling
  BOOL keyboardVisible; //If false, use enterCurve. If true, use leaveCurve.
  UIViewAnimationCurve enterCurve;
  CGFloat enterDuration;
  UIViewAnimationCurve leaveCurve;
  CGFloat leaveDuration;

  //Orientation Stuff
  UIInterfaceOrientation orientationHistory[4];
  BOOL forcingStatusBarOrientation;
  BOOL isCurrentlyVisible;
  TiOrientationFlags defaultOrientations;
  NSMutableArray *containedWindows;
  NSMutableArray *modalWindows;
  BOOL forcingRotation;
  BOOL statusBarInitiallyHidden;
  BOOL viewControllerControlsStatusBar;
  UIStatusBarStyle defaultStatusBarStyle;

  UIInterfaceOrientation deviceOrientation;

  BOOL statusBarIsHidden;
  BOOL statusBarVisibilityChanged;
  NSInteger activeAlertControllerCount;
}

//Titanium Support
- (CGRect)resizeView;
- (void)repositionSubviews;
- (UIView *)topWindowProxyView;
- (NSUInteger)supportedOrientationsForAppDelegate;
- (void)incrementActiveAlertControllerCount;
- (void)decrementActiveAlertControllerCount;
- (UIViewController *)topPresentedController;
- (UIInterfaceOrientation)lastValidOrientation:(TiOrientationFlags)orientationFlags;
- (void)updateStatusBar;
@property (nonatomic, readonly) BOOL statusBarInitiallyHidden;
@property (nonatomic, readonly) UIStatusBarStyle defaultStatusBarStyle;
@property (nonatomic, readonly) BOOL statusBarVisibilityChanged;
@property (nonatomic, readonly) TiViewProxy<TiKeyboardFocusableView> *keyboardFocusedProxy;
- (void)shutdownUi:(id)arg;
- (UIImage *)defaultImageForOrientation:(UIDeviceOrientation)orientation resultingOrientation:(UIDeviceOrientation *)imageOrientation idiom:(UIUserInterfaceIdiom *)imageIdiom;

@end
