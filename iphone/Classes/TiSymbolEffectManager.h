/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

API_AVAILABLE(ios(17))
@interface TiSymbolEffectManager : NSObject

- (instancetype)initWithConfiguration:(NSDictionary *)configuration;

@property (nonatomic, strong) NSDictionary *configuration;
@property (nonatomic, strong) NSSymbolEffect *symbolEffect;
@property (nonatomic, strong) NSSymbolEffectOptions *symbolEffectOptions;

@end

NS_ASSUME_NONNULL_END
