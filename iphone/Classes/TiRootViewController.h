/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRootController.h"
#import "TiWindowProxy.h"


#define MAX_ORIENTATIONS	7

@interface TiRootViewController : UIViewController<UIApplicationDelegate,TiRootController,TiOrientationController> {
@private
	NSMutableArray *windowViewControllers;	
	
	UIColor * backgroundColor;
	UIImage * backgroundImage;

	TiOrientationFlags	allowedOrientations;
	NSTimeInterval	orientationRequestTimes[MAX_ORIENTATIONS];

	UIInterfaceOrientation lastOrientation;
	UIInterfaceOrientation windowOrientation;

	NSMutableArray * viewControllerStack;
	BOOL isCurrentlyVisible;
	
	//TiOrientationController variables.
	NSMutableArray * windowProxies;
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

-(void)setOrientationModes:(NSArray *)newOrientationModes;

@end
