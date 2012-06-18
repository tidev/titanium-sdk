/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "LocaleModule.h"
#import "TiUtils.h"
#import "TiLocale.h"

@implementation LocaleModule

-(id)getString:(id)args
{
	NSString *key = [args objectAtIndex:0];
	NSString *def = [args count] > 1 ? [args objectAtIndex:1] : nil;
	return [TiLocale getString:key comment:def];
}

-(id)currentLanguage
{
	return [TiLocale defaultLocale];
}

-(id)getCurrentLanguage:(id)arg
{
	return [self currentLanguage];
}

-(id)getCurrentCountry:(id)arg
{
	return [[NSLocale currentLocale] objectForKey:NSLocaleCountryCode];
}

-(id)getCurrentLocale:(id)arg
{
	// Have to return "lan-COUNTRY" instead of "lan_COUNTRY" to conform to Android
	return [[[NSLocale currentLocale] localeIdentifier] stringByReplacingOccurrencesOfString:@"_" withString:@"-"];
}

-(id)getCurrencyCode:(id)arg
{
	ENSURE_SINGLE_ARG(arg, NSString);
	return [[[[NSLocale alloc] initWithLocaleIdentifier:arg] autorelease] objectForKey:NSLocaleCurrencyCode];
}

-(id)getCurrencySymbol:(id)arg
{
	ENSURE_SINGLE_ARG(arg, NSString);
	NSString* localeID = [NSLocale localeIdentifierFromComponents:[NSDictionary dictionaryWithObject:arg forKey:NSLocaleCurrencyCode]];
	NSLocale* locale = [[[NSLocale alloc] initWithLocaleIdentifier:localeID] autorelease];
	NSString* currency = [locale objectForKey:NSLocaleCurrencySymbol];
	// Many countries do $ and iOS (correctly) differentiates them when provided only with currecy code.  However
	// this doesn't match Android.  So, if the currency contains a $, that's all we return.
	if ([currency hasSuffix:@"$"]) {
		return @"$";
	}
	return currency;
}

-(id)getLocaleCurrencySymbol:(id)arg
{
	ENSURE_SINGLE_ARG(arg, NSString);
	return [[[[NSLocale alloc] initWithLocaleIdentifier:arg] autorelease] objectForKey:NSLocaleCurrencySymbol];
}

-(void)setLanguage:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	[TiLocale setLocale:args];
}

@end
