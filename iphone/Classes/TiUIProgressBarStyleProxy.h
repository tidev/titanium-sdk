/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEPROGRESSBARSTYLE

#import "TiProxy.h"

@interface TiUIProgressBarStyleProxy : TiProxy {

}

@property(nonatomic,readonly) NSNumber *DEFAULT;
@property(nonatomic,readonly) NSNumber *PLAIN;
@property(nonatomic,readonly) NSNumber *BAR;

@end

#endif