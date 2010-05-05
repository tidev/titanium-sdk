/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADSPLITWINDOW

#import "TiUIView.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

@class TiUIiPadPopoverProxy;

@interface TiUIiPadSplitWindow : TiUIView<UISplitViewControllerDelegate> {

@private
	UISplitViewController *controller;
	TiViewProxy *masterProxy; // don't retain
	TiViewProxy *detailProxy; // don't retain
	TiUIiPadPopoverProxy *popoverProxy;
	UIPopoverController *popover;
}

-(UIViewController*)controller;
-(void)setToolbar:(id)items withObject:(id)properties;

@end

#endif


#endif