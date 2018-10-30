/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiToolbar.h>

/**
 The protocol is used for any type of UI decoration which needs
 special handling when it is added to a toolbar element.
 */
@protocol TiToolbarButton

/**
 This method is called when the object is attached to a toolbar.
 @param toolbar The toolbar to attach to.
 */
- (void)setToolbar:(id<TiToolbar>)toolbar;

/**
 Returns the toolbar the button is attached to.
 @return The toolbar.
 */
- (id<TiToolbar>)toolbar;

/**
 Whether or not the button it attached to a toolbar.
 @return _YES_ if the button is attached to a toolbar, _NO_ otherwise.
 */
- (BOOL)attachedToToolbar;

@end
