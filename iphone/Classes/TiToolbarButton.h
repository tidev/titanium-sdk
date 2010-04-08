/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#include "TiToolbar.h"

@protocol TiToolbarButton

-(void)setToolbar:(TiToolbar*)toolbar;
-(TiToolbar*)toolbar;
-(BOOL)attachedToToolbar;

@end
