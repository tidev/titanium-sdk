/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_GESTURE

@interface GestureModule : TiModule {
	NSTimeInterval lastShakeTime;
}

@property(nonatomic,readonly) NSNumber *orientation;

@property(nonatomic,readonly) NSNumber *PORTRAIT;
@property(nonatomic,readonly) NSNumber *LANDSCAPE_LEFT;
@property(nonatomic,readonly) NSNumber *LANDSCAPE_RIGHT;
@property(nonatomic,readonly) NSNumber *UPSIDE_PORTRAIT;
@property(nonatomic,readonly) NSNumber *UNKNOWN;
@property(nonatomic,readonly) NSNumber *FACE_UP;
@property(nonatomic,readonly) NSNumber *FACE_DOWN;


@end

#endif