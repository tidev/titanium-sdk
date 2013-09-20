/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiViewProxy.h"
#import "TiTab.h"
#import "TiWindowProxy.h"

@class TiUITabGroupProxy;

@interface TiUITabProxy : TiViewProxy<TiTab,UINavigationControllerDelegate,TiOrientationController> {
@private
	UINavigationController *controller;
	TiWindowProxy *rootWindow;
    TiWindowProxy *current;
	//This is an assign only property. TabGroup retains instances of tab.
	TiUITabGroupProxy *tabGroup;
    
	NSMutableArray* controllerStack;
    
	BOOL opening;
	BOOL systemTab;
	BOOL transitionIsAnimating;
	BOOL hasFocus;
	BOOL iconOriginal;
	BOOL activeIconOriginal;
	
	id<TiOrientationController> parentOrientationController;
}

-(void)setTabGroup:(TiUITabGroupProxy*)proxy;
-(void)removeFromTabGroup;
-(void)closeWindowProxy:(TiWindowProxy *)window animated:(BOOL)animated;

#pragma mark Public APIs

-(TiProxy*)tabGroup;
-(void)setTitle:(id)title;
-(void)setIcon:(id)title;
-(void)setBadge:(id)title;
-(void)setActive:(id)value;

- (void)handleWillBlur;
- (void)handleDidBlur:(NSDictionary *)event;
- (void)handleWillFocus;
- (void)handleDidFocus:(NSDictionary *)event;
- (void)handleWillShowViewController:(UIViewController *)viewController animated:(BOOL)animated;
- (void)handleDidShowViewController:(UIViewController *)viewController animated:(BOOL)animated;

@end

#endif