/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "AnalyticsModule.h"

@implementation AnalyticsModule

//TODO: force the Analytics module to be loaded on startup
//TODO: make it configurable

-(void)startup
{
	static bool AnalyticsStarted = NO;
	
	if (AnalyticsStarted)
	{
		return;
	}
	
	AnalyticsStarted = YES;
	
	//TODO: schedule analytics
}

-(void)shutdown:(id)sender
{
	//TODO: force sending of analytics
}

@end
