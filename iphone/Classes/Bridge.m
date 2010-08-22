/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "Bridge.h"
#import "SBJSON.h"
#import "TiModule.h"
#import "TiHost.h"

@implementation Bridge

-(id)initWithHost:(TiHost*)host_
{
	if (self = [self init])
	{
		host = [host_ retain];
	}
	return self;
}

-(void) dealloc
{
	RELEASE_TO_NIL(host);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(callback);
	RELEASE_TO_NIL(basename);
	[super dealloc];
}

- (TiHost*)host
{
	return host;
}

- (NSString*)basename
{
	if (basename == nil)
	{
		// for app.js, url will always be nil
		if (url == nil)
		{
			basename = [@"app" retain];
		}
		else
		{
			NSString *last = [[url path] lastPathComponent];
			basename = [[last stringByReplacingOccurrencesOfString:@".js" withString:@""] retain];
		}
	}
	return basename;
}

-(void)shutdown:(NSCondition*)condition
{
}

-(void)gc
{
}

-(void)booted
{
	if (callback!=nil)
	{
		[callback performSelector:@selector(booted:) withObject:self];
		[callback release];
		callback = nil;
	}
	[url release];
	url=nil;
}

-(void)boot:(id)callback_ url:(NSURL*)url_ preload:(NSDictionary*)preload
{
	url = [url_ retain];
	callback = [callback_ retain];
}

@end
