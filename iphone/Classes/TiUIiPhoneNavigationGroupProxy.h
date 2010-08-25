/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONENAVIGATIONGROUP

#import "TiViewProxy.h"
#import "TiWindowProxy.h"

@interface TiUIiPhoneNavigationGroupProxy : TiViewProxy<TiOrientationController> {
@private
}

-(UINavigationController*)controller;

@end

#endif