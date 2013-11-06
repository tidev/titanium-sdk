/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiTabGroup.h"

@class TiProxy;
@class TiWindowProxy;

/**
 The protocol for tabs.
 */
@protocol TiTab

@required


/**
 Returns the tag group associated with the tab.
 @return A tab group.
 */
-(TiProxy<TiTabGroup>*)tabGroup;

/**
 Returns the navigation controller associated with the tab.
 @return A navigation controller.
 */
-(UINavigationController*)controller;

-(void)openWindow:(NSArray*)args;
-(void)closeWindow:(NSArray*)args;

/**
 Tells the tab that its associated window is closing.
 @param window The window being closed.
 @param animated _YES_ if window close is anumated, _NO_ otherwise.
 */
-(void)windowClosing:(TiWindowProxy*)window animated:(BOOL)animated;

@end
