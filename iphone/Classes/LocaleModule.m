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
	return [TiLocale currentLocale];
}

-(void)setLanguage:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	[TiLocale setLocale:args];
}

@end
