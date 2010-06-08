/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIIPADSPLITWINDOW
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
#import <Foundation/Foundation.h>
#import "TiRootController.h"
#import "TiRootViewController.h"

@interface TiSplitViewController : UISplitViewController<TiRootController> {
	TiRootViewController* titaniumRoot; // Need to hold onto this so we can handle orientations properly
}

-(id)initWithRootController:(TiRootViewController*)controller;

@end

#endif
#endif