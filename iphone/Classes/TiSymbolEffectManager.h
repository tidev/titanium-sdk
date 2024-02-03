//
//  TiSymbolEffectManager.h
//  Titanium
//
//  Created by Hans Knöchel on 03.02.24.
//

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
