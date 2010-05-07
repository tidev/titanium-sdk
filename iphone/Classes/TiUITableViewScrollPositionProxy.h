/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONETABLEVIEWSCROLLPOSITION

#import "TiProxy.h"

@interface TiUITableViewScrollPositionProxy : TiProxy {

@private

}

@property(nonatomic,readonly) NSNumber *NONE;
@property(nonatomic,readonly) NSNumber *TOP;
@property(nonatomic,readonly) NSNumber *MIDDLE;
@property(nonatomic,readonly) NSNumber *BOTTOM;

@end

#endif