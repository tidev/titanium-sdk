/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiFile.h"


@implementation TiFile

-(void)dealloc
{
	RELEASE_TO_NIL(path);
	[super dealloc];
}

-(NSString*)path
{
	return path;
}

@end
