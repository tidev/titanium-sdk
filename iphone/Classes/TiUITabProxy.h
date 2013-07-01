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
@class TiUITabController;
@class TiWindowProxy;

@interface TiUITabProxy : TiViewProxy<TiTab,UINavigationControllerDelegate,TiOrientationController> {
@private
	UINavigationController *controller;
	TiUITabController *rootController;
	//This is an assign only property. TabGroup retains instances of tab.
	TiUITabGroupProxy *tabGroup;
	TiUITabController *current;
    
    NSArray* controllerStack;
    NSMutableArray* closingWindows;
    
	BOOL opening;
	BOOL systemTab;
	BOOL transitionIsAnimating;
	
	id<TiOrientationController> parentOrientationController;
}

@property(nonatomic,readwrite,assign)	id<TiOrientationController> parentOrientationController;
-(void)childOrientationControllerChangedFlags:(id<TiOrientationController>) orientationController;

-(UINavigationController*)controller;
-(void)setTabGroup:(TiUITabGroupProxy*)proxy;
-(void)removeFromTabGroup;
-(void)closeWindow:(TiWindowProxy *)window animated:(BOOL)animated;
-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated;

#pragma mark Public APIs

-(TiProxy*)tabGroup;
-(void)open:(id)args;
-(void)close:(id)args;
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