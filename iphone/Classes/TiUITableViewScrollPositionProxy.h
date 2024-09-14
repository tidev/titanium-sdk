/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UITABLEVIEWSCROLLPOSITION) || defined(USE_TI_UILISTVIEWSCROLLPOSITION)

#import <TitaniumKit/TiProxy.h>

@interface TiUITableViewScrollPositionProxy : TiProxy {

  @private
}

@property (nonatomic, readonly) NSNumber *NONE;
@property (nonatomic, readonly) NSNumber *TOP;
@property (nonatomic, readonly) NSNumber *MIDDLE;
@property (nonatomic, readonly) NSNumber *BOTTOM;

@end

#endif
