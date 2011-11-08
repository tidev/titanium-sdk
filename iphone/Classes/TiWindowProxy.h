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

typedef enum
{
	TiOrientationNone = 0,
	TiOrientationAny = 0xFFFF,
	
	TiOrientationPortrait			= 1 << UIInterfaceOrientationPortrait,
	TiOrientationPortraitUpsideDown	= 1 << UIInterfaceOrientationPortraitUpsideDown,
	TiOrientationLandscapeLeft		= 1 << UIInterfaceOrientationLandscapeLeft,
	TiOrientationLandscapeRight		= 1 << UIInterfaceOrientationLandscapeRight,

	TiOrientationLandscapeOnly		= TiOrientationLandscapeLeft | TiOrientationLandscapeRight,
	TiOrientationPortraitOnly		= TiOrientationPortrait | TiOrientationPortraitUpsideDown,
	
} TiOrientationFlags;

#define TI_ORIENTATION_ALLOWED(flag,bit)	(flag & (1<<bit))
#define TI_ORIENTATION_SET(flag,bit)		(flag |= (1<<bit))

@protocol TiOrientationController <NSObject>

@property(nonatomic,readwrite,assign)	id<TiOrientationController> parentOrientationController;
@property(nonatomic,readonly,assign)	TiOrientationFlags orientationFlags;
-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;

@end

TiOrientationFlags TiOrientationFlagsFromObject(id args);

// specialization for TiViews that act like top level 
// windows when opened, closed, etc.
//
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


	TiAnimation * openAnimation;
	TiAnimation * closeAnimation;
	
	NSMutableArray *reattachWindows;
	UIView *closeView;
	UIViewController *tempController;

	NSObject<TiOrientationController> * parentOrientationController;
	TiOrientationFlags orientationFlags;
}

@property(nonatomic,readwrite,assign)	id<TiOrientationController> parentOrientationController;
@property(nonatomic,readonly,assign)	TiOrientationFlags orientationFlags;

-(void)fireFocus:(BOOL)newFocused;

@property(nonatomic,readonly)	BOOL opening;

#pragma mark Public APIs

@property(nonatomic,readonly)	NSNumber *opened;
@property(nonatomic,readonly)	NSNumber *focused;
@property(nonatomic,readonly)	BOOL closing;

-(void)open:(id)args;
-(void)close:(id)args;
-(TiProxy*)tabGroup;
-(TiProxy<TiTab>*)tab;

#pragma mark Internal
-(void)attachViewToTopLevelWindow;
-(void)windowReady;
-(BOOL)handleFocusEvents;
-(BOOL)_isChildOfTab;
-(void)_associateTab:(UIViewController*)controller_ navBar:(UINavigationController*)navbar_ tab:(TiProxy<TiTab>*)tab_;
-(void)prepareForNavView:(UINavigationController*)navController_;
-(void)ignoringRotationToOrientation:(UIInterfaceOrientation)orientation;

@property(nonatomic,readwrite,retain)	UIViewController *controller;
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

-(void)setupWindowDecorations;

@end
