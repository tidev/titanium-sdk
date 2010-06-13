/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TopTiPlusModule.h"

@implementation TopTiPlusModule

@synthesize modules;

-(void)dealloc
{
	RELEASE_TO_NIL(modules);
	[super dealloc];
}

-(id)require:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	return [modules objectForKey:args];
}

@end
