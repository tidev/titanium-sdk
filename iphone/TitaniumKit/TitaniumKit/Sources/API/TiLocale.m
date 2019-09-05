/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiLocale.h"
#import "TiBase.h"
#import "TiUtils.h"

@implementation TiLocale

@synthesize currentLocale, bundle;

+ (TiLocale *)instance
{
  static TiLocale *locale;
  if (locale == nil) {
    locale = [[TiLocale alloc] init];
  }
  return locale;
}

- (void)dealloc
{
  RELEASE_TO_NIL(currentLocale);
  RELEASE_TO_NIL(bundle);
  [super dealloc];
}

+ (NSString *)defaultLocale
{
  TiLocale *locale = [TiLocale instance];
  if (locale.currentLocale == nil) {
    NSArray *languages = [[NSUserDefaults standardUserDefaults] objectForKey:@"AppleLanguages"];
    NSString *preferredLang = [languages objectAtIndex:0];

    return [preferredLang substringToIndex:2];
  }
  return locale.currentLocale;
}

+ (void)setLocale:(NSString *)locale
{
  TiLocale *l = [TiLocale instance];
  l.currentLocale = locale;
  NSString *path = [[NSBundle mainBundle] pathForResource:locale ofType:@"lproj"];
  if (path == nil) {
    l.bundle = [NSBundle mainBundle];
  } else {
    l.bundle = [NSBundle bundleWithPath:path];
  }
}

- (void)setCurrentLocale:(NSString *)currentLocale
{
  [[NSUserDefaults standardUserDefaults] setObject:currentLocale forKey:kTiCurrentLocale];
}

- (NSString *)currentLocale
{
  return [[NSUserDefaults standardUserDefaults] stringForKey:kTiCurrentLocale];
}

- (NSBundle *)bundle
{
  NSString *locale = [[NSUserDefaults standardUserDefaults] stringForKey:kTiCurrentLocale];
  NSString *path = [[NSBundle mainBundle] pathForResource:locale ofType:@"lproj"];

  if (locale == nil || path == nil) {
    return NSBundle.mainBundle;
  }

  return [NSBundle bundleWithPath:path];
}

+ (NSString *)getString:(NSString *)key comment:(NSString *)comment
{
  TiLocale *l = [TiLocale instance];
  if (l.bundle == nil) {
    // force the bundle to be loaded
    [TiLocale defaultLocale];
  }
  return [l.bundle localizedStringForKey:key value:comment table:nil];
}

@end
