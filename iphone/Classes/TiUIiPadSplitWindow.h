/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_UIIPADSPLITWINDOW

// if we use a split window, we need to include the ipad popover
#ifndef USE_TI_UIIPADPOPOVER
#define USE_TI_UIIPADPOPOVER
#endif

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
#import "TiUIView.h"
#import "TiSplitViewController.h"

#import "MGSplitViewController.h"

@class TiUIiPadPopoverProxy;

@interface TiUIiPadSplitWindow : TiUIView<UISplitViewControllerDelegate,MGSplitViewControllerDelegate> {

@private
	MGSplitViewController *controller;
}

-(UIViewController*)controller;
-(void)setToolbar:(id)items withObject:(id)properties;

@end

#endif


#endif