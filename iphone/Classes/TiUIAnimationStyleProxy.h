/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEANIMATIONSTYLE

#import "TiProxy.h"


@interface TiUIAnimationStyleProxy : TiProxy {

}

@property(nonatomic,readonly) NSNumber *NONE;
@property(nonatomic,readonly) NSNumber *CURL_UP;
@property(nonatomic,readonly) NSNumber *CURL_DOWN;
@property(nonatomic,readonly) NSNumber *FLIP_FROM_LEFT;
@property(nonatomic,readonly) NSNumber *FLIP_FROM_RIGHT;


@end

#endif