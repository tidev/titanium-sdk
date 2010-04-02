/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

@interface TiUIiPadProxy : TiProxy {

@private

}

@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_UP;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_DOWN;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_LEFT;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_RIGHT;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_ANY;
@property(nonatomic,readonly) NSNumber* POPOVER_ARROW_DIRECTION_UNKNOWN;


-(id)createPopover:(id)args;
-(id)createSplitWindow:(id)args;
-(id)createDocumentViewer:(id)args;

@end


#endif
