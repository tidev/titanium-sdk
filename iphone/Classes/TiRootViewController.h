/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRootController.h"
#import "TiWindowProxy.h"

@interface TiRootViewController : UIViewController<UIApplicationDelegate,TiRootController,TiOrientationController> {
@private
//Presentation: background image and color.
	UIColor * backgroundColor;
	UIImage * backgroundImage;

//View Controller stack:
	/*
	 *	Due to historical reasons, there are three arrays that track views/
	 *	windows/viewcontrollers that are 'opened' on the rootViewController.
	 *	For best results, this should be realigned with a traditional container-
	 *	style view controller, perhaps even something proxy-agnostic in the
	 *	future. TODO: Refactor viewController arrays.
	 */
	NSMutableArray *windowViewControllers;	
	NSMutableArray * viewControllerStack;
	NSMutableArray * windowProxies;

//While no windows are onscreen, present default.png
	UIImageView * defaultImageView;
	
//Orientation handling:
	TiOrientationFlags	allowedOrientations;
	UIInterfaceOrientation orientationHistory[4];

	UIInterfaceOrientation windowOrientation;

	BOOL isCurrentlyVisible;

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

@property(nonatomic,readonly) BOOL keyboardVisible;
@property(nonatomic,readonly) UIImageView * defaultImageView;
-(void)dismissDefaultImageView;

@property(nonatomic,readwrite,retain)	UIColor * backgroundColor;
@property(nonatomic,readwrite,retain)	UIImage * backgroundImage;

-(UIViewController *)focusedViewController;

-(void)windowFocused:(UIViewController*)focusedViewController;
-(void)windowClosed:(UIViewController *)closedViewController;

-(CGRect)resizeView;
-(CGRect)resizeViewForStatusBarHidden:(BOOL)statusBarHidden;
-(void)repositionSubviews;

-(void)refreshOrientationWithDuration:(NSTimeInterval) duration;
-(NSTimeInterval)suggestedRotationDuration;
-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration;
-(UIInterfaceOrientation)lastValidOrientation;

- (void)openWindow:(TiWindowProxy *)window withObject:(id)args;
- (void)closeWindow:(TiWindowProxy *)window withObject:(id)args;

@end
