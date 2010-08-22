/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStylesheet.h"

@implementation TiStylesheet

-(id)init
{
	if ((self = [super init]))
	{
		NSString *mainBundlePath = [[NSBundle mainBundle] bundlePath];
		NSString *plistPath = [mainBundlePath stringByAppendingPathComponent:@"stylesheet.plist"];
		NSLog(@"[DEBUG] reading stylesheet from: %@",plistPath);
		NSDictionary *dictionary = [[NSDictionary alloc] initWithContentsOfFile:plistPath];
		classesDict = [[dictionary objectForKey:@"classes"] retain];
		classesDictByDensity = [[dictionary objectForKey:@"classes_density"] retain];
		idsDict = [[dictionary objectForKey:@"ids"] retain];
		idsDictByDensity = [[dictionary objectForKey:@"ids_density"] retain];
		[dictionary release];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(classesDict);
	RELEASE_TO_NIL(classesDictByDensity);
	RELEASE_TO_NIL(idsDict);
	RELEASE_TO_NIL(idsDictByDensity);
	[super dealloc];
}

-(id)stylesheet:(NSString*)objectId type:(NSString*)type density:(NSString*)density basename:(NSString*)basename
{
#ifdef DEBUG	
	NSLog(@"[DEBUG] stylesheet -> objectId: %@, type: %@, density: %@, basename: %@",objectId,type,density,basename);
#endif
	
	NSDictionary* classes = [[classesDict objectForKey:basename] objectForKey:type];
	NSDictionary* classesD = [[[classesDictByDensity objectForKey:basename] objectForKey:density] objectForKey:type];
	NSDictionary* ids = [[idsDict objectForKey:basename] objectForKey:objectId];
	NSDictionary* idsD = [[[idsDictByDensity objectForKey:basename] objectForKey:density] objectForKey:objectId];
	NSMutableDictionary *result = [NSMutableDictionary dictionary];
	if (classes!=nil)
	{
		[result addEntriesFromDictionary:classes];
	}
	if (classesD!=nil)
	{
		[result addEntriesFromDictionary:classesD];
	}
	if (ids!=nil)
	{
		[result addEntriesFromDictionary:ids];
	}
	if (idsD!=nil)
	{
		[result addEntriesFromDictionary:idsD];
	}

	return result;
}


@end
