/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiRootController.h"
#import "TiWindowProxy.h"

/**
 The class represent root controller in a view hierarchy.
 */
@protocol TiUIViewControllerIOS6Support <NSObject>
/* Legacy support: UIViewController methods introduced in iOS 6.0
 * For those still on 5.1, we have to declare these methods so the
 * the compiler knows the right return datatypes.
 */
@optional
- (BOOL)shouldAutorotate;
- (NSUInteger)supportedInterfaceOrientations;
// Returns interface orientation masks.
- (UIInterfaceOrientation)preferredInterfaceOrientationForPresentation;

@end

@interface TiRootViewController : UIViewController<UIApplicationDelegate,TiRootController,TiOrientationController,TiUIViewControllerIOS6Support> {
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
	UIInterfaceOrientation orientationHistory[4]; // Physical device orientation history
    BOOL forceOrientation; // Force orientation flag
    
	UIInterfaceOrientation windowOrientation; // Current emulated orientation

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
    BOOL forcingStatusBarOrientation;
}

/**
 Returns visibility of on-screen keyboard.
 */
@property(nonatomic,readonly) BOOL keyboardVisible;

/*
 Returns image view being displayed while application's view is loading.
 */
@property(nonatomic,readonly) UIImageView * defaultImageView;

/**
 Returns current window orientation.
 */
@property(nonatomic,readonly) UIInterfaceOrientation windowOrientation;

/*
 Tells the controller to hides and release the default image view.
 @see defaultImageView
 */
-(void)dismissDefaultImageView;

/*
 Provides access to background color of the view represented by the root view controller.
 @see backgroundImage
 */
@property(nonatomic,readwrite,retain)	UIColor * backgroundColor;

/*
 Provides access to background image of the view represented by the root view controller.
 @see backgroundColor
 */
@property(nonatomic,readwrite,retain)	UIImage * backgroundImage;

/**
 Returns currently focused view controller.
 @return Focused view controller.
 */
-(UIViewController *)focusedViewController;

-(void)windowFocused:(UIViewController*)focusedViewController;
-(void)windowClosed:(UIViewController *)closedViewController;

/**
 Tells the controller to resize its view to the size of main screen.
 @return The bounds of the view after resize. 
 */
-(CGRect)resizeView;

/**
 Tells the controller to resize its view to the size of main screen adjusted according to visibility of status bar.
 @return The bounds of the view after resize. 
 */
-(CGRect)resizeViewForStatusBarHidden;

/**
 Tells the controller to reposition all its subviews.
 */
-(void)repositionSubviews;

-(void)refreshOrientationWithDuration:(NSTimeInterval) duration;
-(NSTimeInterval)suggestedRotationDuration;

/**
 Tells the controller to rotate to the specified orientation.
 @param newOrientation The new orientation.
 @param duration The rotation animation duration.
 */
-(void)manuallyRotateToOrientation:(UIInterfaceOrientation)newOrientation duration:(NSTimeInterval)duration;

-(UIInterfaceOrientation)lastValidOrientation;

/**
 Tells the controller to open the specified window proxy.
 @param window The window proxy to open.
 @param args Reserved for future use. 
 */
- (void)openWindow:(TiWindowProxy *)window withObject:(id)args;

/**
 Tells the controller to close the specified window proxy.
 @param window The window proxy to close.
 @param args Reserved for future use. 
 */
- (void)closeWindow:(TiWindowProxy *)window withObject:(id)args;

@end

@interface TiRootViewController (unsupported_internal)
/*
 *	Methods declarations stored or moved in this category are NOT to be used
 *	by modules, as these methods can be added or removed from Titanium as
 *	needed, and have not been vetted for long-term use. This category itself
 *	may be moved to a private header later on, even.
 */

-(void)dismissKeyboard;
-(TiWindowProxy*)topWindow;
@property(nonatomic,readonly) TiViewProxy<TiKeyboardFocusableView> * keyboardFocusedProxy;

@end
