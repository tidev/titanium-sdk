/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"
#import <Foundation/Foundation.h>

/**
 Protocol for orientation controller.
 */
@protocol TiOrientationController <NSObject>
@required
- (void)childOrientationControllerChangedFlags:(id<TiOrientationController>)orientationController;
@property (nonatomic, readonly) TiOrientationFlags orientationFlags;
@property (nonatomic, readwrite, assign) id<TiOrientationController> parentOrientationController;

@end

/**
 Protocol for Window
 */
@protocol TiWindowProtocol <TiOrientationController>

- (void)open:(id)args;
- (void)close:(id)args;
- (BOOL)_handleOpen:(id)args;
- (BOOL)_handleClose:(id)args;
- (BOOL)opening;
- (BOOL)closing;
- (BOOL)isModal;
- (BOOL)hidesStatusBar;
- (BOOL)homeIndicatorAutoHide;
- (UIStatusBarStyle)preferredStatusBarStyle;

// Containing controller will call these callbacks(appearance/rotation) on contained windows when it receives them.
- (void)viewWillAppear:(BOOL)animated;
- (void)viewWillDisappear:(BOOL)animated;
- (void)viewDidAppear:(BOOL)animated;
- (void)viewDidDisappear:(BOOL)animated;
- (void)presentationControllerDidDismiss:(UIPresentationController *)presentationController;
- (void)presentationControllerWillDismiss:(UIPresentationController *)presentationController;

- (void)preferredContentSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container;
- (void)viewWillTransitionToSize:(CGSize)size withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator;
- (void)systemLayoutFittingSizeDidChangeForChildContentContainer:(id<UIContentContainer>)container;
- (void)willTransitionToTraitCollection:(UITraitCollection *)newCollection withTransitionCoordinator:(id<UIViewControllerTransitionCoordinator>)coordinator;

// Focus callbacks from containing or hosting controller
- (void)gainFocus;
- (void)resignFocus;
- (BOOL)handleFocusEvents;

// ViewController support. Always returns TiViewController (or subclass).
- (UIViewController *)hostingController;

@property (nonatomic, readwrite, assign) BOOL isManaged;

@end

/**
 Protocol for containment controller. Implemented by UIViewControllers that can host Titanium Windows
 */
@protocol TiControllerContainment <NSObject>
@required
- (BOOL)canHostWindows;
- (UIView *)hostingView;
//Called by light weight windows from their windowWillOpen, windowWillClose, windowDidOpen, windowDidClose methods
- (void)willOpenWindow:(id<TiWindowProtocol>)theWindow;
- (void)willCloseWindow:(id<TiWindowProtocol>)theWindow;
- (void)didOpenWindow:(id<TiWindowProtocol>)theWindow;
- (void)didCloseWindow:(id<TiWindowProtocol>)theWindow;
- (void)showControllerModal:(UIViewController *)theController animated:(BOOL)animated;
- (void)hideControllerModal:(UIViewController *)theController animated:(BOOL)animated;
@end

@protocol TiRootControllerProtocol <NSObject>
/**
 The protocol for root controller.
 It is not intended to be implemented by clients.
 @see TiRootViewController
 */

@required

//Background Control
- (void)setBackgroundImage:(UIImage *)arg;
- (void)setBackgroundColor:(UIColor *)arg;
- (void)dismissDefaultImage;

//Keyboard stuff
- (BOOL)keyboardVisible;
- (void)dismissKeyboard;
- (void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy;
- (void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)blurredProxy;

//ViewController stuff
- (TiOrientationFlags)getDefaultOrientations;
- (UIViewController *)topPresentedController;
- (UIViewController<TiControllerContainment> *)topContainerController;

@end
