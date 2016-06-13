/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiModule.h"

#ifdef USE_TI_UTILS


@interface UtilsModule : TiModule {
 
@private

}

@property (nonatomic, readonly)NSNumber* ENCODE_TYPE_LF;
@property (nonatomic, readonly)NSNumber* ENCODE_TYPE_CR;
@property (nonatomic, readonly)NSNumber* ENCODE_TYPE_64;
@property (nonatomic, readonly)NSNumber* ENCODE_TYPE_76;

@end

#endif
