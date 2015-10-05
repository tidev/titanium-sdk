/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TiControllerProtocols.h"
#import "TiLayoutViewController.h"


@interface TiRootViewController : UIViewController
{
    NSInteger _activeAlertControllerCount;
}
@property (nonatomic, readonly) TiLayoutView* hostingView;
@property (nonatomic, readonly) UIStatusBarStyle defaultStatusBarStyle;
@property (nonatomic, readonly) BOOL statusBarInitiallyHidden;
@property (nonatomic, readonly) TiOrientationFlags defaultOrientations;
@property (nonatomic, assign) TiViewProxy<TiKeyboardFocusableView> * keyboardFocusedProxy;
@property (nonatomic) BOOL keyboardVisible;
@property (nonatomic) BOOL statusBarVisibilityChanged;
@property (nonatomic) BOOL statusBarIsHidden;

-(void)showControllerModal:(UIViewController*)controller animated:(BOOL)animated;
-(void)hideControllerModal:(UIViewController*)controller animated:(BOOL)animated;
-(NSUInteger)supportedOrientationsForAppDelegate;
-(void)setBackgroundColor:(UIColor*)color;
-(void)setBackgroundImage:(UIImage*)image;
-(void)decrementActiveAlertControllerCount;
-(void)incrementActiveAlertControllerCount;
-(TiLayoutViewController*)topContainerController;
-(UIViewController*)topPresentedController;
-(BOOL)statusBarInitiallyHidden;
-(TiLayoutView*)hostingView;
-(void)willOpenWindow:(id<TiWindowProtocol>)theWindow;
-(void)didOpenWindow:(id<TiWindowProtocol>)theWindow;
-(void)willCloseWindow:(id<TiWindowProtocol>)theWindow;
-(void)didCloseWindow:(id<TiWindowProtocol>)theWindow;
-(TiOrientationFlags)defaultOrientations;
-(void)forceOrientationChange;
-(void)dismissKeyboard;
#if defined(DEBUG) || defined(DEVELOPER)
-(void)shutdownUi:(id)arg;
#endif
-(void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy;
-(void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy;
-(void)handleNewKeyboardStatus;
@end

