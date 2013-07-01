/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIPHONETABLEVIEWSTYLE) || defined(USE_TI_UIIPHONELISTVIEWSTYLE)

#import "TiProxy.h"

@interface TiUIiPhoneTableViewStyleProxy : TiProxy {
}

@property(nonatomic,readonly) NSNumber *PLAIN;
@property(nonatomic,readonly) NSNumber *GROUPED;

@end

#endif