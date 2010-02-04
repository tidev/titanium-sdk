/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITableViewGroupSection.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "TiDimension.h"


@implementation TiUITableViewGroupSection

@synthesize header,footer,isOptionList,nullHeader,rowArray,name,templateCell,headerColor,headerFont,footerColor,footerFont;
@synthesize rowHeight, minRowHeight, maxRowHeight, delegate, sectionNumber;


- (id) initWithHeader: (NSString *) headerString footer: (NSString *) footerString withProperties:(NSDictionary*)properties
{
	self = [super init];
	if (self != nil) 
	{
		[self forceHeader:headerString footer:footerString];

		TiColor *hc = [TiUtils colorValue:@"headerColor" properties:properties def:nil];
		TiColor *fc = [TiUtils colorValue:@"footerColor" properties:properties def:nil];
		 
		if (hc!=nil)
		{
			[self setHeaderColor:[hc _color]];
		}
		if (fc!=nil)
		{
			[self setFooterColor:[fc _color]];
		}
		
		WebFont *font = [TiUtils fontValue:[properties objectForKey:@"headerFont"] def:nil];
		
		if (font!=nil && [font font]!=nil)
		{
			[self setHeaderFont:[font font]];
		}

		font = [TiUtils fontValue:[properties objectForKey:@"footerFont"] def:nil];
		
		if (font!=nil && [font font]!=nil)
		{
			[self setFooterFont:[font font]];
		}
		
	}
	return self;
}

- (void) dealloc
{
	RELEASE_TO_NIL(name);
	RELEASE_TO_NIL(header);
	RELEASE_TO_NIL(footer);
	RELEASE_TO_NIL(rowArray);
	RELEASE_TO_NIL(headerColor);
	RELEASE_TO_NIL(headerFont);
	RELEASE_TO_NIL(templateCell);
	[super dealloc];
}

DEFINE_EXCEPTIONS


- (TiUITableViewGroupSection *) copyWithZone:(NSZone *)zone
{
	TiUITableViewGroupSection * result = [[TiUITableViewGroupSection allocWithZone:zone] initWithHeader:header footer:footer withProperties:[NSDictionary dictionary]];
	[result addRowsFromArray:rowArray];
	[result setRowHeight:rowHeight];
	[result setHeaderColor:headerColor];
	[result setHeaderFont:headerFont];
	[result setName:name];
	[result setIsOptionList:isOptionList];
	[result setNullHeader:nullHeader];
	[result setTemplateCell:templateCell];
	return result;
}

- (TiUITableViewGroupSection *) subSectionFromIndex: (int) rowIndex header: (NSString *)newHeader footer: (NSString *)newFooter;
{
	TiUITableViewGroupSection * result = [[TiUITableViewGroupSection alloc] initWithHeader:newHeader footer:newFooter withProperties:[NSDictionary dictionary]];
	int rowCount = [rowArray count];
	if(rowIndex < rowCount) {
		[result addRowsFromArray:[rowArray subarrayWithRange:NSMakeRange(rowIndex,rowCount-rowIndex)]];
	}
	[result setRowHeight:rowHeight];
	[result setHeaderColor:headerColor];
	[result setHeaderFont:headerFont];
	return [result autorelease];
}

- (TiUITableViewGroupSection *) subSectionFromIndex: (int) rowIndex;
{
	TiUITableViewGroupSection * result = [self subSectionFromIndex:rowIndex header:header footer:footer];
	[result setNullHeader:nullHeader];
	[result setRowHeight:rowHeight];
	[result setHeaderColor:headerColor];
	[result setHeaderFont:headerFont];
	return result;
}

#pragma mark Headers and footerString

- (void) forceHeader: (NSString *) headerString footer: (NSString *)footerString
{
	Class stringClass = [NSString class];
	
	if ([headerString respondsToSelector:@selector(stringValue)])
	{
		headerString=[(id)headerString stringValue];
	}
	if ([headerString isKindOfClass:stringClass])
	{
		[self setHeader:headerString];
	}
	else
	{
		[self setHeader:nil];
	}
	
	if ([footerString respondsToSelector:@selector(stringValue)])
	{
		footerString=[(id)footerString stringValue];
	}
	if ([footerString isKindOfClass:stringClass])
	{
		[self setFooter:footerString];
	}
	else
	{
		[self setFooter:nil];
	}
	
	nullHeader = (id)headerString == [NSNull null];	
}

- (BOOL) accceptsHeader: (id) newHeader footer: (id) newFooter
{
	Class stringClass = [NSString class];
	BOOL result;
	
	if ((newHeader == nil) || ([rowArray count]==0))
	{
		result = YES;
	} 
	else if (![newHeader isKindOfClass:stringClass])
	{
		result = NO;
	} 
	else 
	{
		result = ([newHeader length] == 0);
	}
	if (result) 
	{
		if ([newHeader isKindOfClass:stringClass])
		{
			[self setHeader:newHeader];
		} 
		else if (newHeader == [NSNull null])
		{
			nullHeader = YES;
		}
		if ([newFooter isKindOfClass:stringClass])
		{
			[self setFooter:newFooter];
		} 
		else if (newFooter == [NSNull null]) 
		{
			[self setFooter:nil];
		}
	}
	return result;
}



#pragma mark Advanced row array workings.

- (NSUInteger) rowCount;
{
	return [rowArray count];
}

- (void) addRow: (CellDataWrapper *) newRow
{
	if (rowArray == nil){
		rowArray = [[NSMutableArray alloc] initWithObjects:newRow,nil];
	} else {
		[rowArray addObject:newRow];
	}
}

- (void) insertRow: (CellDataWrapper *) newRow atIndex: (int) index
{
	if (rowArray == nil){
		rowArray = [[NSMutableArray alloc] initWithObjects:newRow,nil];
	} else {
		[rowArray insertObject:newRow atIndex:index];
	}
}

- (void) addRowsFromArray: (NSArray *) otherArray
{
	if(otherArray == nil)return;
	if (rowArray == nil){
		rowArray = [otherArray mutableCopy];
	} else {
		[rowArray addObjectsFromArray:otherArray];
	}
}

- (void) addRowsFromSection: (TiUITableViewGroupSection *) otherSection
{
	[self addRowsFromArray:[otherSection rowArray]];
}

- (void) trimToIndex: (int) rowIndex;
{
	int rowCount = [rowArray count];
	if(rowIndex < rowCount) {
		[rowArray removeObjectsInRange:NSMakeRange(rowIndex, rowCount-rowIndex)];
	}
}

- (void) removeRowAtIndex: (int) rowIndex
{
	if((rowIndex < 0) || (rowIndex >= [rowArray count]))return;
	[rowArray removeObjectAtIndex:rowIndex];
}

- (CellDataWrapper *) rowForIndex: (NSUInteger) rowIndex
{
	if (rowIndex >= [rowArray count]) return nil;
	CellDataWrapper * result = [rowArray objectAtIndex:rowIndex];
	return result;
}

- (NSUInteger)countByEnumeratingWithState:(NSFastEnumerationState *)state objects:(id *)stackbuf count:(NSUInteger)len
{
	return [rowArray countByEnumeratingWithState:state objects:stackbuf count:len];
}

#pragma mark Javascript-facing data accessors

- (int) countOfData
{
	return [self rowCount];
}

- (NSDictionary *) objectInDataAtIndex: (int)index
{
	return [[self rowForIndex:index] jsonValues];
}

- (void) insertObject:(NSDictionary *)newRowData inDataAtIndex:(int)index
{
	ENSURE_TYPE(newRowData,NSDictionary);
	ENSURE_VALUE_RANGE(index,0,[self countOfData]);
	
	CellDataWrapper * newRow = [CellDataWrapper cellDataWithProperties:newRowData proxy:delegate font:[WebFont tableRowFont] template:templateCell];
	[self insertRow:newRow atIndex:index];
}

- (void) removeObjectFromDataAtIndex:(int)index
{
	ENSURE_VALUE_RANGE(index,0,[self countOfData]-1);
	
	[self removeRowAtIndex:index];
}

- (void)replaceObjectInDataAtIndex:(int)index withObject:(NSDictionary *)newRowData
{
	ENSURE_TYPE(newRowData,NSDictionary);
	ENSURE_VALUE_RANGE(index,0,[self countOfData]-1);
	
	CellDataWrapper * newRow = [CellDataWrapper cellDataWithProperties:newRowData proxy:delegate font:[WebFont tableRowFont] template:templateCell];
	[rowArray replaceObjectAtIndex:index withObject:newRow];
}

- (void) setData:(id)newData
{
	ENSURE_TYPE_OR_NIL(newData,NSArray);
	
	if (rowArray == nil)
	{
		rowArray = [[NSMutableArray alloc] initWithCapacity:[newData count]];
	} 
	else 
	{
		[rowArray removeAllObjects];
	}	
	
	for (NSDictionary * thisRowData in newData) 
	{
		ENSURE_DICT(thisRowData);
		CellDataWrapper * thisRow = [CellDataWrapper cellDataWithProperties:thisRowData proxy:delegate font:[WebFont tableRowFont] template:templateCell];
		[rowArray addObject:thisRow];
	}
}

#pragma mark Javascript exposed area

- (void)insertRowAfter:(NSArray *)args
{
	NSNumber * rowNumber = [args objectAtIndex:0];
	NSDictionary * newRowData = [args objectAtIndex:1];
	[self insertObject:newRowData inDataAtIndex:[rowNumber intValue]+1];
}

- (void)insertRowBefore:(NSArray *)args
{
	NSNumber * rowNumber = [args objectAtIndex:0];
	NSDictionary * newRowData = [args objectAtIndex:1];
	[self insertObject:newRowData inDataAtIndex:[rowNumber intValue]];	
}

- (void)deleteRow:(NSArray *)args
{
	NSNumber * rowNumber = [args objectAtIndex:0];
	[self removeObjectFromDataAtIndex:[rowNumber intValue]];	
}

- (void)updateRow:(NSArray *)args
{
	NSNumber * rowNumber = [args objectAtIndex:0];
	NSDictionary * newRowData = [args objectAtIndex:1];
	[self replaceObjectInDataAtIndex:[rowNumber intValue] withObject:newRowData];
}

- (void)appendRow:(NSArray *)args
{
	NSDictionary * newRowData = [args objectAtIndex:0];
	[self insertObject:newRowData inDataAtIndex:[self countOfData]];
}

@end
