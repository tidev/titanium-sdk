/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIPHONEROWANIMATIONSTYLE

#import "TiProxy.h"


@interface TiUIRowAnimationStyleProxy : TiProxy {

}

@property(nonatomic,readonly) NSNumber *NONE;
@property(nonatomic,readonly) NSNumber *LEFT;
@property(nonatomic,readonly) NSNumber *RIGHT;
@property(nonatomic,readonly) NSNumber *TOP;
@property(nonatomic,readonly) NSNumber *BOTTOM;
@property(nonatomic,readonly) NSNumber *FADE;

@property(nonatomic,readonly) NSNumber *UP;		// used in KS before 0.9
@property(nonatomic,readonly) NSNumber *DOWN;	// used in KS before 0.9



@end

#endif