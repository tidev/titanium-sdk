/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"

#ifdef USE_TI_UIIPADSPLITWINDOW
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2
#import "TiWindowProxy.h"

@interface TiUIiPadSplitWindowProxy : TiWindowProxy {

@private
	id<NSObject,TiOrientationController> detailView;
}

@end

#endif
#endif