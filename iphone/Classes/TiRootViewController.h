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

//Keyboard handling -- This can probably be done in a better way.
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

- (void)openWindow:(TiWindowProxy *)window withObject:(id)args;
- (void)closeWindow:(TiWindowProxy *)window withObject:(id)args;

-(UIInterfaceOrientation)mostRecentlyAllowedOrientation;

@end
