/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiViewProxy.h"
#import "TiAnimation.h"
#import "TiTab.h"
#import "TiUIWindow.h"
#import "TiUIView.h"
#import "TiViewController.h"

/**
 Titanium orientation flags.
 */
typedef enum
{
	TiOrientationNone = 0,
	TiOrientationAny = 0xFFFF,
	
    /**
     Portrait orientation flag.
     */
	TiOrientationPortrait			= 1 << UIInterfaceOrientationPortrait,

    /**
     Upside-down portrait orientation flag.
     */
	TiOrientationPortraitUpsideDown	= 1 << UIInterfaceOrientationPortraitUpsideDown,
	
    /**
     Landscape left orientation flag.
     */
    TiOrientationLandscapeLeft		= 1 << UIInterfaceOrientationLandscapeLeft,
	
    /**
     Landscape right orientation flag.
     */
    TiOrientationLandscapeRight		= 1 << UIInterfaceOrientationLandscapeRight,

    /**
     Landscape (left or right) orientation flag.
     */
    TiOrientationLandscapeOnly		= TiOrientationLandscapeLeft | TiOrientationLandscapeRight,
	
    /**
     Portrait (normal or upside-down) orientation flag.
     */
    TiOrientationPortraitOnly		= TiOrientationPortrait | TiOrientationPortraitUpsideDown,
	
} TiOrientationFlags;

#define TI_ORIENTATION_ALLOWED(flag,bit)	(flag & (1<<bit))
#define TI_ORIENTATION_SET(flag,bit)		(flag |= (1<<bit))

/**
 Protocol for orientation controller.
 */
@protocol TiOrientationController <NSObject>

/**
 Provides access to parent orientation controller.
 */
@property(nonatomic,readwrite,assign)	id<TiOrientationController> parentOrientationController;

/**
 Returns orientation flags.
 */
@property(nonatomic,readonly,assign)	TiOrientationFlags orientationFlags;

/**
 Tells the controller that child orientation controller has changed flags.
 @param orientationController The child orientation controller
 */
-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;

@end

TiOrientationFlags TiOrientationFlagsFromObject(id args);


/**
 The class is a specialization for TiViews that act like top level
 windows when opened, closed, etc.
 */
@interface TiWindowProxy : TiViewProxy<TiAnimationDelegate,TiUIViewController,TiOrientationController> {
@protected
	BOOL opened;
	BOOL focused;
	BOOL fullscreenFlag;
	BOOL modalFlag;
	BOOL restoreFullscreen;
	BOOL navWindow;
	TiViewProxy<TiTab> *tab;
	UIViewController *controller;
	UINavigationController *navController;
@private
	BOOL opening;
	BOOL attached;
	BOOL closing;
	BOOL startingTransitionAnimation;
	int transitionAnimation;
    
    UIView* animatedOver;
	TiAnimation * openAnimation;
	TiAnimation * closeAnimation;
	
	UIView *closeView;
	UIViewController *tempController;

	NSObject<TiOrientationController> * parentOrientationController;
	TiOrientationFlags orientationFlags;
}

/**
 Provides access to parent oriantation controller.
 */
@property(nonatomic,readwrite,assign)	id<TiOrientationController> parentOrientationController;

/**
 Provides access to window orientation flags.
 */
@property(nonatomic,readonly,assign)	TiOrientationFlags orientationFlags;

/**
 Tells the window proxy to fire focus event.
 @param newFocused _YES_ to fire _focus_ event, _blur_ otherwise.
 */
-(void)fireFocus:(BOOL)newFocused;

/**
 Whether or not the window is being opened.
 */
@property(nonatomic,readonly)	BOOL opening;

#pragma mark Public APIs

@property(nonatomic,readonly)	NSNumber *opened;
@property(nonatomic,readonly)	NSNumber *focused;

/**
 Whether or not the window is being closed.
 */
@property(nonatomic,readonly)	BOOL closing;

-(void)open:(id)args;
-(void)close:(id)args;

/*
 Returns the tab group the proxy's window is attached to if any.
 @return The tab group proxy the window is attached to.
 */
-(TiProxy*)tabGroup;

/*
 The tab in tab group the proxy's window is associated with if any.
 @return The tab  proxy the window is accosiated with
 */
-(TiProxy<TiTab>*)tab;

#pragma mark Internal
-(void)attachViewToTopLevelWindow;

/**
 Tells the window proxy when its window is opened.
 */
-(void)windowReady;

-(BOOL)handleFocusEvents;
-(BOOL)_isChildOfTab;
-(void)_associateTab:(UIViewController*)controller_ navBar:(UINavigationController*)navbar_ tab:(TiProxy<TiTab>*)tab_;

/**
 Prepares the window proxy to be added to a UINavigationController.
 
 Called in place of open for windows that belong to navigation groups.
 @param navController The navigation view controller the window proxy will be added to.
 */
-(void)prepareForNavView:(UINavigationController*)navController;

-(BOOL)modalFlagValue;
-(BOOL)restoreFullScreen;
/**
 Returns view controller for the window's view.
 */
@property(nonatomic,readwrite,retain)	UIViewController *controller;

/**
 Returns navigation controller for the window's view.
 */
@property(nonatomic,readwrite,retain)	UINavigationController *navController;

-(void)releaseController;
-(void)replaceController;
-(UIWindow*)_window;
-(BOOL)_handleOpen:(id)args;
-(BOOL)_handleClose:(id)args;
-(void)_tabAttached;
-(void)_tabDetached;
-(void)_tabFocus;
-(void)_tabBlur;

-(void)_tabBeforeFocus;
-(void)_tabBeforeBlur;

/**
 Tells the window proxy to setup window's decorations.
 */
-(void)setupWindowDecorations;

@end
