/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_MAP

@interface MapModule : TiModule {

}

@property(nonatomic,readonly) NSNumber *STANDARD_TYPE;
@property(nonatomic,readonly) NSNumber *SATELLITE_TYPE;
@property(nonatomic,readonly) NSNumber *HYBRID_TYPE;
@property(nonatomic,readonly) NSNumber *ANNOTATION_RED;
@property(nonatomic,readonly) NSNumber *ANNOTATION_GREEN;
@property(nonatomic,readonly) NSNumber *ANNOTATION_PURPLE;


@end

#endif
