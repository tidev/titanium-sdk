/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStylesheet.h"
#import "TiBase.h"

#define DEBUG_STYLESHEETS 0

@implementation TiStylesheet

- (id)init
{
  if ((self = [super init])) {
    NSString *mainBundlePath = [[NSBundle mainBundle] bundlePath];
    NSString *plistPath = [mainBundlePath stringByAppendingPathComponent:@"stylesheet.plist"];
    DebugLog(@"[DEBUG] Reading stylesheet from: %@", plistPath);
    NSDictionary *dictionary = [[NSDictionary alloc] initWithContentsOfFile:plistPath];
    classesDict = [[dictionary objectForKey:@"classes"] retain];
    classesDictByDensity = [[dictionary objectForKey:@"classes_density"] retain];
    idsDict = [[dictionary objectForKey:@"ids"] retain];
    idsDictByDensity = [[dictionary objectForKey:@"ids_density"] retain];
    tagsDict = [[dictionary objectForKey:@"tags"] retain];
    tagsDictByDensity = [[dictionary objectForKey:@"tags_density"] retain];

#if defined(DEBUG) && DEBUG_STYLESHEETS == 1
    NSLog(@"[STYLESHEET DEBUG] ClassesDict = %@", classesDict);
    NSLog(@"[STYLESHEET DEBUG] ClassesDictByDensity = %@", classesDictByDensity);
    NSLog(@"[STYLESHEET DEBUG] IdsDict = %@", idsDict);
    NSLog(@"[STYLESHEET DEBUG] IdsDictByDensity = %@", idsDictByDensity);
#endif
    [dictionary release];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(classesDict);
  RELEASE_TO_NIL(classesDictByDensity);
  RELEASE_TO_NIL(idsDict);
  RELEASE_TO_NIL(idsDictByDensity);
  RELEASE_TO_NIL(tagsDict);
  RELEASE_TO_NIL(tagsDictByDensity);
  [super dealloc];
}

- (id)stylesheet:(NSString *)objectId density:(NSString *)density basename:(NSString *)basename classes:(NSArray *)classes tags:(NSArray *)tags
{
#if DEBUG_STYLESHEETS == 1
  NSLog(@"[STYLESHEET DEBUG] stylesheet -> objectId: %@, density: %@, basename: %@", objectId, density, basename);
  for (int i = 0; i < [classes count]; i++) {
    NSLog(@"[STYLESHEET DEBUG] -> class: %@", [classes objectAtIndex:i]);
  }

  for (int i = 0; i < [tags count]; i++) {
    NSLog(@"[STYLESHEET DEBUG] -> tag: %@", [tags objectAtIndex:i]);
  }
#endif

  /*
	 CSS selector priority order (lowest to highest) is
	 - Tag selectors
	 - Classes
	 - ID selectors
	*/

  NSMutableDictionary *result = [NSMutableDictionary dictionary];
  if (tags != nil) {
    NSEnumerator *tagEnum = [tags objectEnumerator];
    id tagName;

    while (tagName = [tagEnum nextObject]) {
      NSDictionary *tags = [[tagsDict objectForKey:basename] objectForKey:tagName],
                   *tagsD = [[[tagsDictByDensity objectForKey:basename] objectForKey:density] objectForKey:tagName];

      if (tags != nil) {
        [result addEntriesFromDictionary:tags];
      }
      if (tagsD != nil) {
        [result addEntriesFromDictionary:tagsD];
      }
    }
  }

  NSEnumerator *classEnum = [classes objectEnumerator];
  id className;
  while (className = [classEnum nextObject]) {
    NSDictionary *classes = [[classesDict objectForKey:basename] objectForKey:className];
    NSDictionary *classesD = [[[classesDictByDensity objectForKey:basename] objectForKey:density] objectForKey:className];
    if (classes != nil) {
      [result addEntriesFromDictionary:classes];
    }
    if (classesD != nil) {
      [result addEntriesFromDictionary:classesD];
    }
  }

  NSDictionary *ids = [[idsDict objectForKey:basename] objectForKey:objectId];
  NSDictionary *idsD = [[[idsDictByDensity objectForKey:basename] objectForKey:density] objectForKey:objectId];
  if (ids != nil) {
    [result addEntriesFromDictionary:ids];
  }
  if (idsD != nil) {
    [result addEntriesFromDictionary:idsD];
  }

#if DEBUG_STYLESHEETS == 1
  NSLog(@"[STYLESHEET DEBUG] stylesheet -> %@", result);
#endif
  return result;
}

- (BOOL)basename:(NSString *)basename density:(NSString *)density hasTag:(NSString *)tagName
{
  return ([[tagsDict objectForKey:basename] objectForKey:tagName] != nil ||
      [[[tagsDictByDensity objectForKey:basename] objectForKey:density] objectForKey:tagName]);
}

@end
