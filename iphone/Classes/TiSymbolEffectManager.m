//
//  TiSymbolEffectManager.m
//  Titanium
//
//  Created by Hans Knöchel on 03.02.24.
//

#import "TiSymbolEffectManager.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiSymbolEffectManager

- (instancetype)initWithConfiguration:(NSDictionary *)configuration
{
  if (self = [self init]) {
    self.configuration = configuration;
  }
  return self;
}

- (NSSymbolEffect *)symbolEffect
{
  NSString *symbolEffectString = [self.configuration valueForKey:@"symbolEffect"];

  if ([symbolEffectString isEqualToString:@"pulse"]) {
    return NSSymbolPulseEffect.effect;
  } else if ([symbolEffectString isEqualToString:@"bounce"]) {
    return NSSymbolBounceEffect.effect;
  } else if ([symbolEffectString isEqualToString:@"appear"]) {
    return NSSymbolAppearEffect.effect;
  } else if ([symbolEffectString isEqualToString:@"disappear"]) {
    return NSSymbolDisappearEffect.effect;
  }

  @throw [NSException exceptionWithName:@"io.tidev.titanium-sdk" reason:@"Invalid symbol effect provided!" userInfo:nil];
}

- (NSSymbolEffectOptions *)symbolEffectOptions
{
  NSDictionary *symbolEffectOptions = [self.configuration valueForKey:@"options"];

  if ([TiUtils boolValue:@"repeating" properties:symbolEffectOptions def:NO]) {
    return [NSSymbolEffectOptions optionsWithRepeating];
  } else if ([TiUtils boolValue:@"nonRepeating" properties:symbolEffectOptions def:NO]) {
    return [NSSymbolEffectOptions optionsWithNonRepeating];
  } else if ([TiUtils intValue:@"repeatCount" properties:symbolEffectOptions def:0] > 0) {
    return [NSSymbolEffectOptions optionsWithRepeatCount:[TiUtils intValue:@"repeatCount" properties:symbolEffectOptions def:0]];
  }

  return [NSSymbolEffectOptions options];
}

@end
