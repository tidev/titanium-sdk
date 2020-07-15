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

- (NSNumber *)parseDecimal:(NSString *)text withLocaleId:(id)localeId
{
  // Fetch optional locale string argument. (ex: "en-US")
  NSString *localeStringId = nil;
  if ((localeId != nil) && [localeId isKindOfClass:[NSString class]]) {
    localeStringId = (NSString *)localeId;
  }

  // Acquire requested locale if provided or current locale.
  NSLocale *locale = nil;
  if (localeStringId != nil) {
    locale = [[[NSLocale alloc] initWithLocaleIdentifier:localeStringId] autorelease];
  }
  if (locale == nil) {
    locale = [NSLocale currentLocale];
  }

  // Remove localized thousands separators from string if they exist. NSScanner fails to parse them.
  // Note: If locale uses whitespace separators (like French), then remove all whitespace character types.
  NSString *thousandsSeparator = [locale objectForKey:NSLocaleGroupingSeparator];
  NSCharacterSet *whitespaceCharSet = [NSCharacterSet whitespaceCharacterSet];
  if ([thousandsSeparator rangeOfCharacterFromSet: whitespaceCharSet].location != NSNotFound) {
    if ([text rangeOfCharacterFromSet: whitespaceCharSet].location != NSNotFound) {
      text = [[text componentsSeparatedByCharactersInSet: whitespaceCharSet] componentsJoinedByString: @""];
    }
  } else {
    text = [text stringByReplacingOccurrencesOfString:thousandsSeparator withString:@""];
  }

  // Attempt to parse a number from given text. Return not-a-number if failed.
  NSScanner *scanner = [NSScanner localizedScannerWithString:text];
  [scanner setLocale:locale];
  double value = NAN;
  [scanner scanDouble:&value];
  return [NSNumber numberWithDouble:value];
}

- (void)setLanguage:(NSString *)locale
{
  [TiLocale setLocale:locale];
}

@end
