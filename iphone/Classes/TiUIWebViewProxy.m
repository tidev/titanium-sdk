/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIWebViewProxy.h"
#import "TiUIWebView.h"
#import "TiUtils.h"

@implementation TiUIWebViewProxy

#pragma mark TiEvaluator

- (TiHost*)host
{
	return [super _host];
}

- (void)evalJS:(NSString*)code
{
	if ([code isKindOfClass:[NSArray class]])
	{
		code = [(NSArray*)code objectAtIndex:0];
	}
	[[self view] performSelectorOnMainThread:@selector(evalJS:) withObject:code waitUntilDone:NO];
}

- (void)evalFile:(NSString*)path
{
	NSURL *url_ = [path hasPrefix:@"file:"] ? [NSURL URLWithString:path] : [NSURL fileURLWithPath:path];
	
	if (![path hasPrefix:@"/"] && ![path hasPrefix:@"file:"])
	{
		NSURL *root = [[self host] baseURL];
		url_ = [NSURL fileURLWithPath:[NSString stringWithFormat:@"%@/%@",root,path]];
	}
	
	NSString *code = [NSString stringWithContentsOfURL:url_ encoding:NSUTF8StringEncoding error:nil];
	
	[self evalJS:code];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_
{
	//FIXME
}

- (id)preloadForKey:(id)key
{
	return nil;
}

- (KrollContext*)krollContext
{
	return nil;
}

@end

