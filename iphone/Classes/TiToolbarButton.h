/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "TiToolbar.h"

/**
 The protocol for toolbar button.
 */
@protocol TiToolbarButton

/**
 Attaches the toolbar button to the specified toolbar.
 @param toolbar The toolbar to attach to.
 */
-(void)setToolbar:(TiToolbar*)toolbar;

/**
 Returns the toolbar the button is attached to.
 @return The toolbar.
 */
-(TiToolbar*)toolbar;

/**
 Returns if the button it attached to a toolbar.
 @return _YES_ if the button is attached to a toolbar, _NO_ otherwise.
 */
-(BOOL)attachedToToolbar;

@end
