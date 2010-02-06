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

- (void)evalJS:(NSString*)code
{
	if ([code isKindOfClass:[NSArray class]])
	{
		code = [(NSArray*)code objectAtIndex:0];
	}
	[[self view] performSelectorOnMainThread:@selector(evalJS:) withObject:code waitUntilDone:NO];
}

@end

