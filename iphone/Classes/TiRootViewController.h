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

#if 0

@interface TiRootViewController : UIViewController<TiRootControllerProtocol, TiControllerContainment, TiOrientationController> {
    //Default background properties
    UIColor* bgColor;
    UIImage* bgImage;
    NSInteger curTransformAngle;
    BOOL forceLayout;
    UIImageView* defaultImageView;
    
    //Keyboard stuff
    BOOL updatingAccessoryView;
    UIView * enteringAccessoryView;	//View that will enter.
    UIView * accessoryView;			//View that is onscreen.
    UIView * leavingAccessoryView;	//View that is leaving the screen.
    TiViewProxy<TiKeyboardFocusableView> * keyboardFocusedProxy; //View whose becoming key affects things.
	
    CGRect startFrame;		//Where the keyboard was before the handling
    CGRect targetedFrame;	//The keyboard place relative to where the accessoryView is moving;
    CGRect endFrame;		//Where the keyboard will be after the handling
    BOOL keyboardVisible;	//If false, use enterCurve. If true, use leaveCurve.
    UIViewAnimationCurve enterCurve;
    CGFloat enterDuration;
    UIViewAnimationCurve leaveCurve;
    CGFloat leaveDuration;
    
    //Orientation Stuff
    UIInterfaceOrientation orientationHistory[4];
    BOOL forcingStatusBarOrientation;
    BOOL isCurrentlyVisible;
    TiOrientationFlags defaultOrientations;
    NSMutableArray* containedWindows;
    NSMutableArray* modalWindows;
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
-(CGRect)resizeView;
-(void)repositionSubviews;
-(UIView *)topWindowProxyView;
-(NSUInteger)supportedOrientationsForAppDelegate;
-(void)incrementActiveAlertControllerCount;
-(void)decrementActiveAlertControllerCount;
-(UIViewController*)topPresentedController;
-(UIInterfaceOrientation) lastValidOrientation:(TiOrientationFlags)orientationFlags;
-(void)updateStatusBar;
@property (nonatomic, readonly) BOOL statusBarInitiallyHidden;
@property (nonatomic, readonly) UIStatusBarStyle defaultStatusBarStyle;
@property (nonatomic, readonly) BOOL statusBarVisibilityChanged;
@property(nonatomic,readonly) TiViewProxy<TiKeyboardFocusableView> * keyboardFocusedProxy;
#if defined(DEBUG) || defined(DEVELOPER)
-(void)shutdownUi:(id)arg;
#endif
- (UIImage*)defaultImageForOrientation:(UIDeviceOrientation) orientation resultingOrientation:(UIDeviceOrientation *)imageOrientation idiom:(UIUserInterfaceIdiom*) imageIdiom;


@end
#endif