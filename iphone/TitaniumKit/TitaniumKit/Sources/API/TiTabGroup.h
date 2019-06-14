/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>

/**
 The tab group protocol
 */
@protocol TiTabGroup

/**
 Returns the tab bar for the tag group.
 @return The tag bar.
 */
- (UITabBar *)tabbar;

@end
