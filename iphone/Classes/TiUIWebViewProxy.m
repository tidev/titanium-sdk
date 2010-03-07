/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIWebViewProxy.h"
#import "TiUIWebView.h"
#import "TiUtils.h"
#import "TiBlob.h"

@implementation TiUIWebViewProxy

- (NSString*)evalJS:(id)code
{
	ENSURE_SINGLE_ARG(code,NSString);
	TiBlob *result = [[[TiBlob alloc] _initWithPageContext:[self executionContext]] autorelease];
	[[self view] performSelectorOnMainThread:@selector(evalJS:) withObject:[NSArray arrayWithObjects:code,result,nil] waitUntilDone:YES];
	return [result text];
}

USE_VIEW_FOR_AUTO_HEIGHT

- (NSString*)html
{
	NSString *html = [self evalJS:@"document.documentElement.outerHTML"];
	// strip out the titanium injection - nobody wants that - and if 
	// you're saving off the HTML, we don't want to save that off since 
	// it's dynamically injected and can't be preserved
	NSRange range = [html rangeOfString:@"<script id=\"titanium"];
	if (range.location!=NSNotFound)
	{
		NSRange nextRange = [html rangeOfString:@"</script" options:0 range:NSMakeRange(range.location, [html length]-range.location) locale:nil];
		if (nextRange.location!=NSNotFound)
		{
			NSString *before = [html substringToIndex:range.location];
			NSString *after = [html substringFromIndex:nextRange.location+9];
			return [NSString stringWithFormat:@"%@%@",before,after];
		}
	}
	return html;
}

@end

