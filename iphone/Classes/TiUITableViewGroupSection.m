/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITableViewGroupSection.h"
#import "TiUtils.h"
#import "TiColor.h"

#import "TiUITableViewRowProxy.h"
#import "TiUIGroupedSectionProxy.h"

@implementation TiUITableViewGroupSection

@synthesize header,headerColor,headerFont;
@synthesize footer,footerColor,footerFont;
@synthesize rowHeight, minRowHeight, maxRowHeight;
@synthesize isOptionList,data;
@synthesize proxy, parentView;


-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)thisProxy
{
	if (thisProxy != proxy)
	{
		return;
	}
	DoProxyDelegateChangedValuesWithProxy(self, key, oldValue, newValue, proxy);
}

-(BOOL)isRepositionProperty:(NSString*)key
{
	return NO;
}

-(void)setParentNeedsRefreshing;
{
	if (parentView == nil)
	{
		return;
	}

	[parentView performSelectorOnMainThread:@selector(refreshSection:) withObject:self waitUntilDone:NO];
}

- (void) dealloc
{
	RELEASE_TO_NIL(header);
	RELEASE_TO_NIL(headerColor);
	RELEASE_TO_NIL(headerFont);

	RELEASE_TO_NIL(footer);
	RELEASE_TO_NIL(footerColor);
	RELEASE_TO_NIL(footerFont);

	proxy = nil; //NOT RETAINED\
	parentView = nil; //NOT RETAINED

	RELEASE_TO_NIL(data);
	[super dealloc];
}

#define DECLARE_GROUP_SETTER(funct,extraction)	\
-(void)funct##_:(id)value	\
{	\
	[self funct:extraction];	\
	[self setParentNeedsRefreshing];	\
}

DECLARE_GROUP_SETTER(setHeader,[TiUtils stringValue:value])
DECLARE_GROUP_SETTER(setFooter,[TiUtils stringValue:value])

DECLARE_GROUP_SETTER(setHeaderColor,[[TiUtils colorValue:value] _color])
DECLARE_GROUP_SETTER(setFooterColor,[[TiUtils colorValue:value] _color])

DECLARE_GROUP_SETTER(setHeaderFont,[[TiUtils fontValue:value] font])
DECLARE_GROUP_SETTER(setFooterFont,[[TiUtils fontValue:value] font])

DECLARE_GROUP_SETTER(setRowHeight,[TiUtils dimensionValue:value])
DECLARE_GROUP_SETTER(setMinRowHeight,[TiUtils dimensionValue:value])
DECLARE_GROUP_SETTER(setMaxRowHeight,[TiUtils dimensionValue:value])

DEFINE_EXCEPTIONS

#pragma mark Javascript-facing data accessors

- (int) countOfData
{
	return [data count];
}

- (TiUITableViewRowProxy *) objectInDataAtIndex: (int)index
{
	if ((index<0) || (index >= [data count]))
	{
		return nil;
	}
	return [data objectAtIndex:index];
}

-(void) addObjectToData:(TiUITableViewRowProxy *)newRowData
{
	if (data == nil)
	{
		data = [[NSMutableArray alloc] initWithObjects:newRowData,nil];
	}
	else
	{
		[data addObject:newRowData];
	}
}

- (void) insertObject:(TiUITableViewRowProxy *)newRowData inDataAtIndex:(int)index
{
	if ((index < 0) || (index > [data count]))
	{
		//Todo: Throw exception?
		return;
	}
	if (data == nil)
	{
		data = [[NSMutableArray alloc] initWithObjects:newRowData,nil];
	}
	else
	{
		[data insertObject:newRowData atIndex:index];
	}
}

- (void) removeObjectFromDataAtIndex:(int)index
{
}

- (void)replaceObjectInDataAtIndex:(int)index withObject:(NSDictionary *)newRowData
{
}

- (void) setData:(id)newData
{
}

@end
