/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "TiViewProxy.h"

/**
 Protocol for orientation controller.
 */
@protocol TiOrientationController <NSObject>
@required
-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;
@property(nonatomic,readonly)           TiOrientationFlags orientationFlags;
@property(nonatomic,readwrite,assign)   id<TiOrientationController> parentOrientationController;

@end

/**
 Protocol for Window
 */
@protocol TiWindowProtocol <NSObject>
@required
-(void)open:(id)args;
-(void)close:(id)args;
-(UIViewController<TiOrientationController>*)contentController;
@optional
-(BOOL)_handleOpen:(id)args;
-(BOOL)_handleClose:(id)args;
@end

/**
 Protocol for containment controller
 */
@protocol TiControllerContainment <NSObject>
@required
-(void)willOpenWindow:(id<TiWindowProtocol>)theWindow;
-(void)didOpenWindow:(id<TiWindowProtocol>)theWindow;
-(void)willCloseWindow:(id<TiWindowProtocol>)theWindow;
-(void)didCloseWindow:(id<TiWindowProtocol>)theWindow;

@end

@protocol TiRootControllerProtocol <NSObject>
/**
 The protocol for root controller.
 It is not intended to be implemented by clients.
 @see TiRootControllerNeue
 */

@required

//Background Control
-(void)setBackgroundImage:(UIImage*)arg;
-(void)setBackgroundColor:(UIColor*)arg;
-(void)dismissDefaultImage;

//Keyboard stuff
-(BOOL)keyboardVisible;
-(void)dismissKeyboard;
-(void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy;
-(void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)blurredProxy;

//ViewController stuff
-(TiOrientationFlags)getDefaultOrientations;
-(UIViewController*)topPresentedController;
-(UIViewController<TiControllerContainment>*)topContainerController;
@end
