/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@class TiProxy;
@class TiWindowProxy;

#define MAX_ORIENTATIONS	7

@interface TiRootViewController : UIViewController<UIApplicationDelegate> {
@private
	NSMutableArray *windowViewControllers;	
	TiWindowProxy *currentWindow;	//NOT RETAINED
	
	UIColor * backgroundColor;
	UIImage * backgroundImage;
	
	BOOL	allowedOrientations[MAX_ORIENTATIONS];
	NSTimeInterval	orientationRequestTimes[MAX_ORIENTATIONS];
	UIInterfaceOrientation lastOrientation;
	
	UIInterfaceOrientation windowOrientation;

}

@property(nonatomic,readwrite,retain)	UIColor * backgroundColor;
@property(nonatomic,readwrite,retain)	UIImage * backgroundImage;

-(void)windowFocused:(UIViewController*)focusedViewController;
-(void)windowClosed:(UIViewController *)closedViewController;

-(CGRect)resizeView;
-(void)repositionSubviews;

-(void) manuallyRotateToOrientation:(UIInterfaceOrientation)orientation;
-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration;

-(void)refreshOrientationModesIfNeeded:(TiWindowProxy *)oldCurrentWindow;
-(void)enforceOrientationModesFromWindow:(TiWindowProxy *) newCurrentWindow;

-(void)setOrientationModes:(NSArray *)newOrientationModes;

@end
