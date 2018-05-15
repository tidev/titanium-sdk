/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_PLATFORM

#import "TiModule.h"
#import <JavaScriptCore/JavaScriptCore.h>

@protocol TiPlatformDisplayCapsExports <JSExport>

@property (nonatomic, readonly) NSString *apiName;
@property (nonatomic, readonly) NSString *density;
@property (nonatomic, readonly) NSNumber *dpi;
@property (nonatomic, readonly) NSNumber *logicalDensityFactor;
@property (nonatomic, readonly) NSNumber *platformHeight;
@property (nonatomic, readonly) NSNumber *platformWidth;
// TODO xdpi
// TODO ydpi

@end

@interface TiPlatformDisplayCaps : TiModule <TiPlatformDisplayCapsExports>
@end

#endif
