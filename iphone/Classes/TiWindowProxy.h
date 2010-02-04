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

// specialization for TiViews that act like top level 
// windows when opened, closed, etc.
//
@interface TiWindowProxy : TiViewProxy {
@protected
	BOOL opened;
	BOOL focused;
	BOOL fullscreen;
	BOOL modal;
	BOOL restoreFullscreen;
	TiViewProxy<TiTab> *tab;
	UIViewController *controller;
	UINavigationController *navbar;
@private
	BOOL attached;
	BOOL readdTempView;
	BOOL closeTempView;
	UIColor *tempColor;
	TiViewProxy *tempView; //used during initial temp animation

}

#pragma mark Public APIs

@property(nonatomic,readonly)	NSNumber *opened;
@property(nonatomic,readonly)	NSNumber *focused;

-(void)open:(id)args;
-(void)close:(id)args;
-(TiProxy*)tabGroup;
-(TiProxy<TiTab>*)tab;

#pragma mark Internal
-(void)_attachViewToTopLevelWindow;
-(void)_windowReady;
-(BOOL)_topLevelWindowHasChildren;
-(BOOL)_isChildOfTab;
-(void)_performTopLevelWindowAnimation:(TiAnimation*)animation view:(TiViewProxy*)newView;
-(void)_associateTab:(UIViewController*)controller_ navBar:(UINavigationController*)navbar_ tab:(TiProxy<TiTab>*)tab_;
-(UIViewController*)controller;
-(void)setController:(UIViewController *)controller;
-(void)setNavController:(UINavigationController*)navController;
-(UIWindow*)_window;
-(BOOL)_handleOpen:(id)args;
-(BOOL)_handleClose:(id)args;
-(void)_tabAttached;
-(void)_tabDetached;
-(void)_tabFocus;
-(void)_tabBlur;
-(void)setupWindowDecorations;

@end
