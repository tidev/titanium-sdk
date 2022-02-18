/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiWindowProxy.h>

#ifdef USE_TI_UINAVIGATIONWINDOW
#import "TiUINavigationWindowProxy.h"
#endif

@interface TiWindowProxy (Addons)

#if defined(USE_TI_UINAVIGATIONWINDOW)
- (TiUINavigationWindowProxy *)navigationWindow;
#endif

@end
