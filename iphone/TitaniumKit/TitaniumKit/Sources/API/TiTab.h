/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiTabGroup.h"

@class TiProxy;
@class TiWindowProxy;
@class KrollPromise;

/**
 The protocol for tabs.
 */
@protocol TiTab

@required

/**
 Returns the tag group associated with the tab.
 @return A tab group.
 */
- (TiProxy<TiTabGroup> *)tabGroup;

/**
 Returns the navigation controller associated with the tab.
 @return A navigation controller.
 */
- (UINavigationController *)controller;

- (KrollPromise *)openWindow:(NSArray *)args;
- (KrollPromise *)closeWindow:(NSArray *)args;

/**
 Tells the tab that its associated window is closing.
 @param window The window being closed.
 @param animated _YES_ if window close is animated, _NO_ otherwise.
 */
- (void)windowClosing:(TiWindowProxy *)window animated:(BOOL)animated;

@end
