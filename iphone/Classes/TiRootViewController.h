/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRootController.h"

@class TiProxy;
@class TiWindowProxy;

#define MAX_ORIENTATIONS	7

@interface TiRootViewController : UIViewController<UIApplicationDelegate,TiRootController> {
@private
	NSMutableArray *windowViewControllers;	
	TiWindowProxy *currentWindow;	//NOT RETAINED
	
	UIColor * backgroundColor;
	UIImage * backgroundImage;

	BOOL	allowedOrientations[MAX_ORIENTATIONS];
	NSTimeInterval	orientationRequestTimes[MAX_ORIENTATIONS];
	UIInterfaceOrientation lastOrientation;
	
	UIInterfaceOrientation windowOrientation;


	NSMutableArray * viewControllerStack;
	BOOL isCurrentlyVisible;
}

@property(nonatomic,readwrite,retain)	UIColor * backgroundColor;
@property(nonatomic,readwrite,retain)	UIImage * backgroundImage;

-(UIViewController *)focusedViewController;

-(void)windowFocused:(UIViewController*)focusedViewController;
-(void)windowClosed:(UIViewController *)closedViewController;

-(CGRect)resizeView;
-(void)repositionSubviews;

-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)orientation;
-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration;

-(void)refreshOrientationModesIfNeeded:(TiWindowProxy *)oldCurrentWindow;
-(void)enforceOrientationModesFromWindow:(TiWindowProxy *) newCurrentWindow;

-(void)setOrientationModes:(NSArray *)newOrientationModes;

;
- (void)willHideViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;
- (void)didHideViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;
- (void)willShowViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;
- (void)didShowViewController:(UIViewController *)focusedViewController animated:(BOOL)animated;

@end
