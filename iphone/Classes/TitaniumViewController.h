/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

@class TiProxy;
@class TiWindowProxy;

#define MAX_ORIENTATIONS	7

@interface TitaniumViewController : UIViewController<UIApplicationDelegate> {
@private
	NSMutableArray *windowProxies;	
	TiWindowProxy *currentWindow;	//NOT RETAINED
	
	UIColor * backgroundColor;
	UIImage * backgroundImage;
	
	BOOL	allowedOrientations[MAX_ORIENTATIONS];
	NSTimeInterval	orientationRequestTimes[MAX_ORIENTATIONS];
	UIInterfaceOrientation lastOrientation;
}

@property(nonatomic,readwrite,retain)	UIColor * backgroundColor;
@property(nonatomic,readwrite,retain)	UIImage * backgroundImage;

-(void)windowFocused:(TiProxy*)window;
-(void)windowUnfocused:(TiProxy*)window;
-(void)windowBeforeFocused:(TiProxy*)window;
-(void)windowBeforeUnfocused:(TiProxy*)window;

-(void)windowClosed:(TiProxy *)window;

-(CGRect)resizeView;

-(void) manuallyRotateToOrientation:(UIInterfaceOrientation)orientation;

-(void)refreshOrientationModesIfNeeded:(TiWindowProxy *)oldCurrentWindow;
-(void)enforceOrientationModesFromWindow:(TiWindowProxy *) newCurrentWindow;

-(void)setOrientationModes:(NSArray *)newOrientationModes;

@end
