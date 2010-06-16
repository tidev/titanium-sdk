/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPADPOPOVER) || defined(USE_TI_UIIPADSPLITWINDOW)

#import "TiViewProxy.h"
#import "TiViewController.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

//The iPadPopoverProxy should be seen more as like a window or such, because
//The popover controller will contain the viewController, which has the view.
//If the view had the logic, you get some nasty dependency loops.
@interface TiUIiPadPopoverProxy : TiViewProxy<UIPopoverControllerDelegate> {
@private
	UIPopoverController *popoverController;
	UINavigationController *navigationController;
	TiViewController *viewController;
}

//Because the Popover isn't meant to be placed in anywhere specific, 
@property(nonatomic,readwrite,retain) UIPopoverController *popoverController;
@property(nonatomic,readwrite,retain) TiViewController *viewController;

@end

#endif

#endif