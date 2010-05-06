/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITOOLBAR

#import "TiUIToolbarProxy.h"
#import "TiUIToolbar.h"

@implementation TiUIToolbarProxy

USE_VIEW_FOR_VERIFY_HEIGHT

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~UIViewAutoresizingFlexibleHeight;
}

-(UIToolbar*)toolbar
{
	TiUIToolbar *theview = (TiUIToolbar*) [self view];
	return [theview toolBar];
}

@end

#endif