/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIView.h"

//To handle the more tab, we're a delegate of it.
@class TiUITabProxy;
@interface TiUITabGroup : TiUIView<UITabBarControllerDelegate,UINavigationControllerDelegate> {
@private
	UITabBarController *controller;
	TiUITabProxy *focused;
}

-(void)open:(id)args;
-(void)close:(id)args;


-(void)focusVisibleWindow;
-(void)blurVisibleWindow;


@end
