/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewProxy.h"

@interface TiUIGroupedViewProxy : TiUITableViewProxy 
{
}

#pragma mark Public APIs

- (void) setSections:(NSArray *)newData withObject:(NSDictionary*)options;
- (void) addSection:(NSArray *)args;
- (void) insertSectionBefore:(NSArray *)args;
- (void) insertSectionAfter:(NSArray *)args;
- (void) deleteSection:(NSArray *)args;
- (void) updateSection:(NSArray *)args;

@end
