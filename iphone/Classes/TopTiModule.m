/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TopTiModule.h"
#import "KrollBridge.h"
#import "TiApp.h"
#import "TiUtils.h"

@implementation TopTiModule

-(id)version
{
	return @"__VERSION__";
}

-(id)buildDate
{
	return @"__TIMESTAMP__";
}

-(id)buildHash
{
	return @"__GITHASH__";
}

-(id)userAgent
{
	return [[TiApp app] userAgent];
}

-(void)include:(NSArray*)jsfiles
{
	id<TiEvaluator> context = [self executionContext];
	NSURL * oldUrl = [context currentURL];
	NSURL * rootURL = (oldUrl != nil)?oldUrl:[self _baseURL];

	for (id file in jsfiles)
	{
		// only allow includes that are local to our execution context url
		// for security, refuse to load non-compiled in Javascript code
		NSURL *url = [NSURL URLWithString:file relativeToURL:rootURL];
#ifdef DEBUG
		NSLog(@"[DEBUG] include url: %@",[url absoluteString]);
#endif
		[context setCurrentURL:url];
		[context evalFile:[url absoluteString]];
	}
	
	[context setCurrentURL:oldUrl];
}

#ifdef DEBUG
// an internal include that works with absolute URLs (debug mode only)
-(void)includeAbsolute:(NSArray*)jsfiles
{
	for (id file in jsfiles)
	{
		NSLog(@"[DEBUG] absolute url: %@", file);

		NSURL *url = nil;
		if (![file hasPrefix:@"file:"]) {
			url = [NSURL URLWithString:file];
		} else {
			url = [[NSURL fileURLWithPath:file] standardizedURL];
		}
		NSLog(@"[DEBUG] include absolute url: %@", [url absoluteString]);
		[[self executionContext] evalFile:[url absoluteString]];
	}
}
#endif
@end
