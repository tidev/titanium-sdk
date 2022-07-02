/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_UIIOSTABLEVIEWSTYLE) || defined(USE_TI_UIIOSLISTVIEWSTYLE)

#import <TitaniumKit/TiProxy.h>

@interface TiUIiOSTableViewStyleProxy : TiProxy {
}

@property (nonatomic, readonly) NSNumber *PLAIN;
@property (nonatomic, readonly) NSNumber *GROUPED;

@end

#endif
