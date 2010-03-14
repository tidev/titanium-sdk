/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUIPickerProxy.h"
#import "TiUIPickerColumnProxy.h"
#import "TiUIPickerRowProxy.h"
#import "TiUIPicker.h"
#import "TiUtils.h"

@implementation TiUIPickerProxy

-(void)_configure
{
	[self replaceValue:NUMINT(-1) forKey:@"type" notification:NO];
	[super _configure];
}

-(BOOL)supportsNavBarPositioning
{
	return NO;
}

-(NSMutableArray*)columns
{
	NSMutableArray* columns = [self valueForUndefinedKey:@"columns"];
	if (columns==nil)
	{
		columns = [NSMutableArray array];
		[self replaceValue:columns forKey:@"columns" notification:NO];
	}
	return columns;
}

-(TiUIPicker*)picker
{
	return (TiUIPicker*)[self view];
}

-(TiUIPickerColumnProxy*)columnAt:(NSInteger)index
{
	NSMutableArray *columns = [self columns];
	if (index < [columns count])
	{
		return [columns objectAtIndex:index];
	}
	TiUIPickerColumnProxy *column = [[TiUIPickerColumnProxy alloc] _initWithPageContext:[self executionContext]];
	column.column = index;
	[columns addObject:column];
	[column release];
	return column;
}

#pragma mark Public APIs 

-(void)add:(id)args
{
	id data = [args objectAtIndex:0];
	
	TiUIPicker *picker = [self picker];
	
	if ([data isKindOfClass:[TiUIPickerRowProxy class]])
	{
		TiUIPickerRowProxy *row = (TiUIPickerRowProxy*)data;
		TiUIPickerColumnProxy *column = [self columnAt:0];
		[column addRow:row];
		[picker performSelectorOnMainThread:@selector(reloadColumn:) withObject:column waitUntilDone:NO];
	}
	else if ([data isKindOfClass:[NSArray class]])
	{
		TiUIPickerColumnProxy *column = [self columnAt:0];
		for (id item in data)
		{
			ENSURE_TYPE(item,TiUIPickerRowProxy);
			[column addRow:item];
		}
		[picker performSelectorOnMainThread:@selector(reloadColumn:) withObject:column waitUntilDone:NO];
	}
}

-(void)remove:(id)args
{
	//TODO
}


-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~(UIViewAutoresizingFlexibleHeight);
}

USE_VIEW_FOR_VERIFY_HEIGHT


@end
