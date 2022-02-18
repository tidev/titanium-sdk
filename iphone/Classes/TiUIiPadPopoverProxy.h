/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPADPOPOVER

#import <TitaniumKit/TiViewController.h>
#import <TitaniumKit/TiViewProxy.h>

//The iPadPopoverProxy should be seen more as like a window or such, because
//The popover controller will contain the viewController, which has the view.
//If the view had the logic, you get some nasty dependency loops.
@interface TiUIiPadPopoverProxy : TiProxy <UIPopoverControllerDelegate, UIPopoverPresentationControllerDelegate, TiProxyObserver> {
  @private
  UIViewController *viewController;
  TiViewProxy *contentViewProxy;

  //We need to hold onto this information for whenever the status bar rotates.
  TiViewProxy *popoverView;
  CGRect popoverRect;
  BOOL animated;
  UIPopoverArrowDirection directions;
  BOOL popoverInitialized;
  BOOL isDismissing;
  NSCondition *closingCondition;
  TiDimension poWidth;
  TiDimension poHeight;
  BOOL deviceRotated;
}

- (void)updatePopover:(NSNotification *)notification;

@end

#endif
