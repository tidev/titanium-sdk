/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStylesheet.h"

#define DEBUG_STYLESHEETS 0

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
		
#if defined(DEBUG) && DEBUG_STYLESHEETS==1
		NSLog(@"[DEBUG] classesDict = %@",classesDict);
		NSLog(@"[DEBUG] classesDictByDensity = %@",classesDictByDensity);
		NSLog(@"[DEBUG] idsDict = %@",idsDict);
		NSLog(@"[DEBUG] idsDictByDensity = %@",idsDictByDensity);
#endif
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

-(id)stylesheet:(NSString*)objectId density:(NSString*)density basename:(NSString*)basename classes:(NSArray*)classes
{
#if DEBUG_STYLESHEETS==1
	NSLog(@"[DEBUG] stylesheet -> objectId: %@, density: %@, basename: %@",objectId,density,basename);
	for (int i = 0; i < [classes count]; i++) {
		NSLog(@"[DEBUG] -> class: %@",[classes objectAtIndex:i]);
	}
#endif
	NSMutableDictionary *result = [NSMutableDictionary dictionary];
	NSEnumerator *classEnum = [classes objectEnumerator];
	id className;
	while (className = [classEnum nextObject])
	{
		NSDictionary* classes = [[classesDict objectForKey:basename] objectForKey:className];
		NSDictionary* classesD = [[[classesDictByDensity objectForKey:basename] objectForKey:density] objectForKey:className];
		if (classes!=nil)
		{
			[result addEntriesFromDictionary:classes];
		}
		if (classesD!=nil)
		{
			[result addEntriesFromDictionary:classesD];
		}
	}

	NSDictionary* ids = [[idsDict objectForKey:basename] objectForKey:objectId];
	NSDictionary* idsD = [[[idsDictByDensity objectForKey:basename] objectForKey:density] objectForKey:objectId];
	if (ids!=nil)
	{
		[result addEntriesFromDictionary:ids];
	}
	if (idsD!=nil)
	{
		[result addEntriesFromDictionary:idsD];
	}

#if DEBUG_STYLESHEETS==1
	NSLog(@"[DEBUG] stylesheet -> %@",result);
#endif
	return result;
}

-(BOOL)basename:(NSString *)basename density:(NSString *)density hasClass:(NSString *)className
{
	return ([[classesDict objectForKey:basename] objectForKey:className] != nil ||
			[[[classesDictByDensity objectForKey:basename] objectForKey:density] objectForKey:className]);
}

@end
