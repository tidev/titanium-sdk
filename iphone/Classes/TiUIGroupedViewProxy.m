/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIGroupedViewProxy.h"
#import "TiUIGroupedSectionProxy.h"
#import "TiUIGroupedView.h"
#import "TiUtils.h"

@implementation TiUIGroupedViewProxy

#pragma mark Internal


#define CHECK_FOR_DATA_NOT_NIL(data) \
if (data==nil)\
{\
	[self throwException:TiExceptionInternalInconsistency subreason:@"sections has not been set yet" location:CODELOCATION];\
}\

#define CHECK_FOR_DATA_AND_CREATE \
if (data==nil)\
{\
	data = [[NSMutableArray alloc] init];\
	[self setValue:data forKey:@"sections"];\
	[data release];\
}\


-(TiUIView*)newView
{
	return [[TiUIGroupedView alloc] initWithFrame:CGRectZero];
}

#pragma mark Public APIs

- (void) addSection:(NSArray *)args
{
	id newdata = [args objectAtIndex:0];
	NSMutableArray *data = [self valueForKey:@"sections"];
	CHECK_FOR_DATA_AND_CREATE
	[data addObject:newdata];
	[self enqueueAction:args withType:TiUITableViewDispatchAddSection];
}

- (void) insertSectionBefore:(NSArray *)args
{
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	id newdata = [args objectAtIndex:1];
	NSMutableArray *data = [self valueForKey:@"sections"];
	CHECK_FOR_DATA_NOT_NIL(data);
	[data insertObject:newdata atIndex:index];
	[self enqueueAction:args withType:TiUITableViewDispatchInsertSectionBefore];
}

- (void) insertSectionAfter:(NSArray *)args
{
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	id newdata = [args objectAtIndex:1];
	NSMutableArray *data = [self valueForKey:@"sections"];
	CHECK_FOR_DATA_NOT_NIL(data);
	[data insertObject:newdata atIndex:index+1];
	[self enqueueAction:args withType:TiUITableViewDispatchInsertSectionAfter];
}

- (void) deleteSection:(NSArray *)args
{
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSMutableArray *data = [self valueForKey:@"sections"];
	CHECK_FOR_DATA_NOT_NIL(data);
	[data removeObjectAtIndex:index];
	[self enqueueAction:args withType:TiUITableViewDispatchDeleteSection];
}

- (void) updateSection:(NSArray *)args
{
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	id newdata = [args objectAtIndex:1];
	NSMutableArray *data = [self valueForKey:@"sections"];
	CHECK_FOR_DATA_NOT_NIL(data);
	[data replaceObjectAtIndex:index withObject:newdata];
	[self enqueueAction:args withType:TiUITableViewDispatchUpdateSection];
}

- (void) setSections:(id)newdata withObject:(NSDictionary*)options
{
	NSMutableArray *data = [self valueForKey:@"sections"];
	CHECK_FOR_DATA_AND_CREATE
	[data removeAllObjects];
	// support passing in an array or even just a single section
	if ([newdata isKindOfClass:[NSArray class]])
	{
		[data setArray:newdata];
		[self enqueueAction:[NSArray arrayWithObjects:newdata,options,nil] withType:TiUITableViewDispatchSetSectionWithAnimation];
	}
	else
	{
		[data addObject:newdata];
		[self enqueueAction:[NSArray arrayWithObjects:[NSArray arrayWithObject:newdata],options,nil] withType:TiUITableViewDispatchSetSectionWithAnimation];
	}
}

@end
