/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "TitaniumModule.h"
#import "KrollBridge.h"
#import "TitaniumApp.h"
#import "TiUtils.h"

@implementation TitaniumModule

-(id)version
{
	return [NSString stringWithCString:TI_VERSION_STR encoding:NSUTF8StringEncoding];
}

-(id)userAgent
{
	return [[TitaniumApp app] userAgent];
}

-(void)include:(NSArray*)jsfiles
{
	for (id file in jsfiles)
	{
		// only allow includes that are local to our execution context url
		// for security, refuse to load non-compiled in Javascript code
		NSString *rootPath = [[self _baseURL] path];
		NSURL *url = [[NSURL fileURLWithPath:[NSString stringWithFormat:@"%@/%@",rootPath,file]] standardizedURL];
		NSLog(@"[DEBUG] include url: %@",[url absoluteString]);
		[[self executionContext] evalFile:[url absoluteString]];
	}
}


@end
