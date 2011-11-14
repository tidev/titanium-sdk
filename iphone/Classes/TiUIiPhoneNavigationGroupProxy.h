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
    // Do we still need this? It was picked up by clang as an error; @synthesize w/o @property.
    id<TiOrientationController> parentOrientationController;
}
@property(nonatomic,assign) id<TiOrientationController> parentOrientationController;
-(UINavigationController*)controller;

-(void)close:(NSArray*)args;

@end

#endif