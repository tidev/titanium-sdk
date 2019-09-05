/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <JavaScriptCore/JavaScriptCore.h>
#import <TitaniumKit/ObjcProxy.h>

@protocol LocaleExports <JSExport>

// Properties (and accessors)
READONLY_PROPERTY(NSString *, currentCountry, CurrentCountry);
READONLY_PROPERTY(NSString *, currentLanguage, CurrentLanguage);
READONLY_PROPERTY(NSString *, currentLocale, CurrentLocale);

// Methods
- (NSString *)getCurrencyCode:(NSString *)locale;
- (NSString *)getCurrencySymbol:(NSString *)currencyCode;
- (NSString *)getLocaleCurrencySymbol:(NSString *)locale;
JSExportAs(getString,
           -(NSString *)getString
           : (NSString *)key withHint
           : (id)hint);
- (void)setLanguage:(NSString *)language;

@end

@interface LocaleModule : ObjcProxy <LocaleExports>

@end
