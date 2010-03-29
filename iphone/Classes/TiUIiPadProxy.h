/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef IPAD

#import "TiProxy.h"

@interface TiUIiPadProxy : TiProxy {

@private

}

@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_UP;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_DOWN;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_LEFT;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_RIGHT;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_ANY;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_UNKNOWN;


//TODO: need to figure out how to do the correct module resolution for submodules

-(id)createPopover:(id)args;
-(id)createSplitWindow:(id)args;

@end

#endif