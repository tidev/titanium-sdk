/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "LocaleModule.h"
#import <TitaniumKit/TiLocale.h>

@implementation LocaleModule

- (NSString *)apiName
{
  return @"Ti.Locale";
}

- (NSString *)getString:(NSString *)key withHint:(id)hint
{
  if (hint != nil && ![hint isKindOfClass:[NSString class]]) {
    hint = nil;
  }
  return [TiLocale getString:key comment:hint];
}

- (NSString *)currentLanguage
{
  return [TiLocale defaultLocale];
}
GETTER_IMPL(NSString *, currentLanguage, CurrentLanguage);

- (NSString *)currentCountry
{
  return [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
}
GETTER_IMPL(NSString *, currentCountry, CurrentCountry);

- (NSString *)currentLocale
{
  // Have to return "lan-COUNTRY" instead of "lan_COUNTRY" to conform to Android
  return [[[NSLocale currentLocale] localeIdentifier] stringByReplacingOccurrencesOfString:@"_" withString:@"-"];
}
GETTER_IMPL(NSString *, currentLocale, CurrentLocale);

- (NSString *)getCurrencyCode:(NSString *)locale
{
  return [[[[NSLocale alloc] initWithLocaleIdentifier:locale] autorelease] objectForKey:NSLocaleCurrencyCode];
}

- (NSString *)getCurrencySymbol:(NSString *)currencyCode
{
  NSString *localeID = [NSLocale localeIdentifierFromComponents:[NSDictionary dictionaryWithObject:currencyCode forKey:NSLocaleCurrencyCode]];
  NSLocale *locale = [[[NSLocale alloc] initWithLocaleIdentifier:localeID] autorelease];
  NSString *currency = [locale objectForKey:NSLocaleCurrencySymbol];
  // Many countries do $ and iOS (correctly) differentiates them when provided only with currecy code.  However
  // this doesn't match Android.  So, if the currency contains a $, that's all we return.
  if ([currency hasSuffix:@"$"]) {
    return @"$";
  }
  return currency;
}

- (NSString *)getLocaleCurrencySymbol:(NSString *)locale
{
  return [[[[NSLocale alloc] initWithLocaleIdentifier:locale] autorelease] objectForKey:NSLocaleCurrencySymbol];
}

- (void)setLanguage:(NSString *)locale
{
  [TiLocale setLocale:locale];
}

@end
