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
#import "TiBuffer.h"

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
	for (id file in jsfiles)
	{
		// only allow includes that are local to our execution context url
		// for security, refuse to load non-compiled in Javascript code
		NSString *rootPath = [[self _baseURL] path];	 	
		NSURL *url = [[NSURL fileURLWithPath:[NSString stringWithFormat:@"%@/%@",rootPath,file]] standardizedURL];
#ifdef DEBUG
		NSLog(@"[DEBUG] include url: %@",[url absoluteString]);
#endif
		[[self executionContext] evalFile:[url absoluteString]];
	}
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

// TODO: Temp for socket testing; remove/rework for release.
-(TiBuffer*)createBuffer:(id)arg
{
    ENSURE_SINGLE_ARG(arg, NSDictionary);
    
    id data = [arg valueForKey:@"data"];
    int length = [[arg valueForKey:@"length"] intValue];
    
    if (data != nil) {
        if ([data isKindOfClass:[NSString class]]) {
            TiBuffer* buffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
            [buffer setData:[NSMutableData dataWithData:[data dataUsingEncoding:NSUTF8StringEncoding]]];
            return buffer;
        }
        else if ([data isKindOfClass:[TiBlob class]]) {
            TiBuffer* buffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
            [buffer setData:[NSMutableData dataWithData:[data data]]];
            return buffer;
        }
    }
    
    return [[[TiBuffer alloc] _initWithPageContext:[self executionContext] args:[NSArray arrayWithObject:arg]] autorelease];
}

@end
