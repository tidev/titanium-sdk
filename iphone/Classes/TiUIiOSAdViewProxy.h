/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TiUIViewProxy.h"

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0

#ifdef USE_TI_UIIOSADVIEW


@interface TiUIiOSAdViewProxy : TiUIViewProxy {

@private

}

@property(nonatomic,assign) NSString *SIZE_320x50;
@property(nonatomic,assign) NSString *SIZE_480x32;

@end

#endif

#endif