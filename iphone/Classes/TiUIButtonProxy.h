/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import "TiToolbarButton.h"
#import "TiUINavBarButton.h"
#import <TitaniumKit/TiToolbar.h>
#import <TitaniumKit/TiViewProxy.h>

@interface TiUIButtonProxy : TiViewProxy <TiToolbarButton> {
  @private
  UIButtonType styleCache;
  TiUINavBarButton *button;
  id<TiToolbar> toolbar; // weak
}

@end

#endif
