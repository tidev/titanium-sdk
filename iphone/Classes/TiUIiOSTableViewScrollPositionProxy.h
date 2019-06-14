/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTABLEVIEWSCROLLPOSITION) || defined(USE_TI_UIIOSLISTVIEWSCROLLPOSITION)

#import <TitaniumKit/TiProxy.h>

@interface TiUIiOSTableViewScrollPositionProxy : TiProxy {

  @private
}

@property (nonatomic, readonly) NSNumber *NONE;
@property (nonatomic, readonly) NSNumber *TOP;
@property (nonatomic, readonly) NSNumber *MIDDLE;
@property (nonatomic, readonly) NSNumber *BOTTOM;

@end

#endif
