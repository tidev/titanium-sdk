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

@interface TiWindowViewController : UIViewController
{
	TiWindowProxy *proxy;
}
-(id)initWithWindow:(TiWindowProxy*)window;
@property(nonatomic,readonly)	TiWindowProxy *proxy;
@end

// specialization for TiViews that act like top level 
// windows when opened, closed, etc.
//
@interface TiWindowProxy : TiViewProxy<TiAnimationDelegate> {
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
	BOOL splashTransitionAnimation;
	int transitionAnimation;
	NSMutableArray *reattachWindows;
	UIView *closeView;
	UIViewController *tempController;
}

-(void)fireFocus:(BOOL)newFocused;

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

@property(nonatomic,readwrite,retain)	UIViewController *controller;
@property(nonatomic,readwrite,retain)	UINavigationController *navController;

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
- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)toInterfaceOrientation duration:(NSTimeInterval)duration;

@end
