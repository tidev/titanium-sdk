/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef IPAD

#import "TiUIView.h"
#import "TiViewController.h"

@interface TiUIiPadPopover : TiUIView<UIPopoverControllerDelegate> {
@private
	UIPopoverController *controller;
	TiViewController *viewController;
}

@end


#endif