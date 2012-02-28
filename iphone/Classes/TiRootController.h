/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TiWindowProxy.h"

/**
 Protocol for root controller.
 */
@protocol TiRootController
@required

/**
 Tells the root controller that a window became focused.
 @param focusedViewController The focused view controller.
 */
-(void)windowFocused:(UIViewController*)focusedViewController;

/**
 Tells the root controller that a window was closed.
 @param closedViewController The closed view controller.
 */
-(void)windowClosed:(UIViewController *)closedViewController;

/**
 Tells the root controller to resize it's view to the size of main screen.
 @return The bounds of the view after resize. 
 */
-(CGRect)resizeView;

/**
 Tells the root controller to reposition all it's subviews.
 */
-(void)repositionSubviews;

/**
 Tells the root controller to set background color on it's view.
 @param color The color to set.
 @see setBackgroundImage:
 */
-(void)setBackgroundColor:(UIColor*)color;

/**
 Tells the root controller to set background image on it's view.
 @param backgroundImage The background image to set.
 @see setBackgroundColor:
 */
-(void)setBackgroundImage:(UIImage*) backgroundImage;

/**
 Tells the root controller that the view controller will hide.
 @param focusedViewController The view controller to hide.
 @param animated The animation flag.
 */
- (void)willHideViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;

/**
 Tells the root controller that the view controller was hidden.
 @param focusedViewController The view controller hidden.
 @param animated The animation flag.
 */
- (void)didHideViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;

/**
 Tells the root controller that the view controller will show.
 @param focusedViewController The view controller to show.
 @param animated The animation flag.
 */
- (void)willShowViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;

/**
 Tells the root controller that the view controller was shown.
 @param focusedViewController The view controller shown.
 @param animated The animation flag.
 */
- (void)didShowViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;

/**
 Tells the root controller that the keyboard received a focus.
 @param visibleProxy The view proxy that received keyboard focus.
 */
-(void)didKeyboardFocusOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)visibleProxy;

/**
 Tells the root controller that the keyboard was blurred.
 @param blurredProxy The view proxy that blurred keyboard focus.
 */
-(void)didKeyboardBlurOnProxy:(TiViewProxy<TiKeyboardFocusableView> *)blurredProxy;

/**
 Returns if the window proxy is the top window.
 @param window The window proxy
 @return _YES_ if the window proxy is the top window, _NO_ otherwise.
 */
-(BOOL)isTopWindow:(TiWindowProxy*)window;

@end
