//
//  TiRootControllerNeue.h
//  Titanium
//
//  Created by Vishal Duggal on 7/30/13.
//
//

#import <UIKit/UIKit.h>
#import "TiControllerProtocols.h"

@interface TiRootControllerNeue : UIViewController<TiRootControllerProtocol, TiControllerContainment, TiOrientationController> {
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
    
}

@end
