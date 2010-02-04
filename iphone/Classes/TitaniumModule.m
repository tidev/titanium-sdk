/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumModule.h"
#import "KrollBridge.h"

@implementation TitaniumModule

-(id)version
{
	//FIXME
	return @"0.9";
}

-(id)userAgent
{
	//FIXME
#ifdef IPAD	
	return [NSString stringWithFormat:@"Mozilla/5.0 (iPad; U; CPU iPhone OS 3_2_0 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Version/4.0 Mobile/7D11 Safari/528.16 Titanium/%@",[self version]];
#else
	return [NSString stringWithFormat:@"Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_1_2 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Version/4.0 Mobile/7D11 Safari/528.16 Titanium/%@",[self version]];
#endif
}

-(void)include:(NSArray*)jsfiles
{
	for (id file in jsfiles)
	{
		[pageContext evalFile:file];
	}
}


@end
