/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTOOLBAR) || defined(USE_TI_UITOOLBAR)


#import "TiUIiOSToolbarProxy.h"
#import "TiUIiOSToolbar.h"

@implementation TiUIiOSToolbarProxy

USE_VIEW_FOR_VERIFY_HEIGHT

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~UIViewAutoresizingFlexibleHeight;
}

-(UIToolbar*)toolbar
{
	TiUIiOSToolbar *theview = (TiUIiOSToolbar*) [self view];
	return [theview toolBar];
}

@end

#endif