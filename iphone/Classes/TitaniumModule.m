/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumModule.h"
#import "KrollBridge.h"
#import "TitaniumApp.h"

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
		[pageContext evalFile:file];
	}
}


@end
