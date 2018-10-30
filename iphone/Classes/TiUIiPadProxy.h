/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <TitaniumKit/TiProxy.h>

#ifdef USE_TI_UIIPAD

#ifdef USE_TI_UIIPADPOPOVER
#import "TiUIiPadPopoverProxy.h"
#endif

@interface TiUIiPadProxy : TiProxy {

  @private
}

#ifdef USE_TI_UIIPADPOPOVER
@property (nonatomic, readonly) NSNumber *POPOVER_ARROW_DIRECTION_UP;
@property (nonatomic, readonly) NSNumber *POPOVER_ARROW_DIRECTION_DOWN;
@property (nonatomic, readonly) NSNumber *POPOVER_ARROW_DIRECTION_LEFT;
@property (nonatomic, readonly) NSNumber *POPOVER_ARROW_DIRECTION_RIGHT;
@property (nonatomic, readonly) NSNumber *POPOVER_ARROW_DIRECTION_ANY;
@property (nonatomic, readonly) NSNumber *POPOVER_ARROW_DIRECTION_UNKNOWN;

- (id)createPopover:(id)args;
#endif

@end

#endif
