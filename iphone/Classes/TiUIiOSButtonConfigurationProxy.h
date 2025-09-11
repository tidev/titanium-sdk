/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIOSBUTTONCONFIGURATION

#import <TitaniumKit/TiProxy.h>

@interface TiUIiOSButtonConfigurationProxy : TiProxy

@property (nonatomic, strong) UIButtonConfiguration *configuration;
@property (nonatomic, retain) UIColor *baseBackgroundColor;
@property (nonatomic, retain) UIColor *baseBackgroundSelectedColor;

@end

#endif
