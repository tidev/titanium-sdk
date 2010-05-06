/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIBUTTON

#import "TiViewProxy.h"
#import "TiUINavBarButton.h"
#import "TiToolbarButton.h"
#import "TiToolbar.h"

@interface TiUIButtonProxy : TiViewProxy<TiToolbarButton> {
@private
	UIButtonType styleCache;
	TiUINavBarButton *button;
	TiToolbar *toolbar;
}

@end

#endif