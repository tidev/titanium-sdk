/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITAB

#import "TiViewProxy.h"
#import "TiTab.h"

@class TiUITabGroupProxy;
@class TiUITabController;
@class TiWindowProxy;

@interface TiUITabProxy : TiViewProxy<TiTab,UINavigationControllerDelegate> {
@private
	UINavigationController *controller;
	TiUITabController *rootController;
	
	TiUITabGroupProxy *tabGroup;
	TiUITabController *current;
	TiWindowProxy *closingWindow;
	BOOL opening;
	BOOL systemTab;
}

-(UINavigationController*)controller;
-(void)setTabGroup:(TiUITabGroupProxy*)proxy;
-(void)removeFromTabGroup;
-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated;

#pragma mark Public APIs

-(TiProxy*)tabGroup;
-(void)open:(NSArray*)args;
-(void)close:(NSArray*)args;
-(void)setTitle:(id)title;
-(void)setIcon:(id)title;
-(void)setBadge:(id)title;
-(void)setActive:(id)value;

- (void)handleWillBlur;
- (void)handleDidBlur:(NSDictionary *)event;
- (void)handleWillFocus;
- (void)handleDidFocus:(NSDictionary *)event;
- (void)handleWillShowViewController:(UIViewController *)viewController;
- (void)handleDidShowViewController:(UIViewController *)viewController;

@end

#endif