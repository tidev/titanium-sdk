/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "TiControllerProtocols.h"

@interface TiRootViewController : UIViewController<TiRootControllerProtocol, TiControllerContainment, TiOrientationController> {
    //Default background properties
    UIColor* _bgColor;
    UIImage* _bgImage;
    UIImageView* _defaultImageView;
    
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
    TiOrientationFlags _defaultOrientations;
    TiOrientationFlags _allowedOrientations;
    NSMutableArray* _containedWindows;
    NSMutableArray* _modalWindows;
    
    UIInterfaceOrientation targetOrientation;
    UIInterfaceOrientation deviceOrientation;
}

@end
