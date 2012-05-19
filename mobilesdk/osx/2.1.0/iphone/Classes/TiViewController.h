/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"

/**
 The protocol for view controllers.
 */
@protocol TiUIViewController

@required

/**
 Returns the child view controller, if any.
 @return The child view controller.
 */
- (UIViewController *)childViewController;

/**
 Tells the view controller that its view will appear.
 
 Called when the view is about to made visible.
 @param animated The animation flag.
 */
- (void)viewWillAppear:(BOOL)animated;

/**
 Tells the view controller that its view did appear.
 
 Called when the view has been fully transitioned onto the screen.
 @param animated The animation flag.
 */
- (void)viewDidAppear:(BOOL)animated;

/**
 Tells the view controller that its view will disappear.
 
 Called when the view is dismissed, covered or otherwise hidden.
 @param animated The animation flag.
 */
- (void)viewWillDisappear:(BOOL)animated;

/**
 Tells the view controller that its view did disappear.
 
 Called after the view was dismissed, covered or otherwise hidden.
 @param animated The animation flag.
 */
- (void)viewDidDisappear:(BOOL)animated;

@optional

/**
 Tells the view controller that its view will be rotated to interface orientation.
 @param toInterfaceOrientation The target interface orientation.
 @param duration The duration of the rotation animation.
 */
- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration;

/**
 Tells the view controller to ignore rotation to specified orientation.
 @param orientation The orientation to ignore.
 */
-(void)ignoringRotationToOrientation:(UIInterfaceOrientation)orientation;

@end


/**
 The base class for Titanium view controllers.
 */
@interface TiViewController : UIViewController
{
	TiViewProxy<TiUIViewController> *proxy;
}
/**
 Initialize the view controller with the provided view proxy.
 @param window The view proxy associated with the view controller.
 @return A new view controller.
 */
-(id)initWithViewProxy:(TiViewProxy<TiUIViewController>*)window;

/**
 Provides access to view proxy associated with the view controller.
 */
@property(nonatomic,readwrite,assign)	TiViewProxy<TiUIViewController> *proxy;

@end
