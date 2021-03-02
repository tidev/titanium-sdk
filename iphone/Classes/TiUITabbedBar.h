/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2021-Present by Axway, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiUIView.h>

@interface TiUITabbedBar : TiUIView <LayoutAutosizing, UITabBarDelegate> {
  NSInteger selectedIndex;
  BOOL controlSpecifiedWidth;
  UITabBar *tabBar;
}

@end
