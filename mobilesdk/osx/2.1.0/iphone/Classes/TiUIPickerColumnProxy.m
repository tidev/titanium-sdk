/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import "TiUIPickerColumnProxy.h"
#import "TiUIPickerRowProxy.h"
#import "TiUtils.h"

@implementation TiUIPickerColumnProxy

@synthesize column;

-(void)dealloc
{
	RELEASE_TO_NIL(rows);
	[super dealloc];
}

-(NSMutableArray*)rows
{
	// return copy so developer can't directly mutate
	return [[rows copy] autorelease];
}

-(NSInteger)rowCount
{
	return [rows count];
}

-(id)rowAt:(NSInteger)index
{
	return (index < [rows count]) ? [rows objectAtIndex:index] : nil;
}

-(NSNumber*)addRow:(id)row
{
	ENSURE_SINGLE_ARG(row,TiUIPickerRowProxy);
	if (rows==nil)
	{
		rows = [[NSMutableArray arrayWithObject:row] retain];
	}
	else
	{
		[rows addObject:row];
	}
	return NUMINT([rows count]-1);
}

-(void)removeRow:(id)row
{
	ENSURE_SINGLE_ARG(row,TiUIPickerRowProxy);
	if (rows!=nil)
	{
		[rows removeObject:row];
	}
}


@end

#endif