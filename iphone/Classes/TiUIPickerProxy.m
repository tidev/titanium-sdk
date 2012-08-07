/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIPICKER

#import "TiUIPickerProxy.h"
#import "TiUIPickerColumnProxy.h"
#import "TiUIPickerRowProxy.h"
#import "TiUIPicker.h"
#import "TiUtils.h"

NSArray* pickerKeySequence;

@implementation TiUIPickerProxy

-(NSArray *)keySequence
{
	if (pickerKeySequence == nil)
	{
		pickerKeySequence = [[NSArray arrayWithObjects:@"type",@"minDate",@"maxDate",nil] retain];
	}
	return pickerKeySequence;
}

-(void)_configure
{
	[self replaceValue:NUMINT(-1) forKey:@"type" notification:NO];
	[self replaceValue:nil forKey:@"value" notification:NO];
	[super _configure];
}

-(void)_destroy
{
	RELEASE_TO_NIL(selectOnLoad);
	[super _destroy];
}

-(void)viewDidAttach
{
    //Window might not have opened yet, so delay till we get windowDidOpen
    if (selectOnLoad != nil && windowOpened) {
        [self setSelectedRow:selectOnLoad];
        RELEASE_TO_NIL(selectOnLoad);
    }
    [super viewDidAttach];
}

-(void)windowDidOpen
{
    [super windowDidOpen];
    if (selectOnLoad != nil) {
        [self setSelectedRow:selectOnLoad];
        RELEASE_TO_NIL(selectOnLoad);
    }
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

-(void)windowWillOpen
{
	[super windowWillOpen];
	
	// Tell all of the picker bits that their window has opened.  Can't operate
	// on the rows array directly; they're returned as a copy from the column.
	for (TiUIPickerColumnProxy* column in [self columns]) {
		for (NSInteger i=0; i < [column rowCount]; i++) {
			[[column rowAt:i] windowWillOpen];
		}
	}
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

#pragma mark support methods for add: 

-(void)addPickerRow:(NSDictionary*)params {
	ENSURE_UI_THREAD(addPickerRow,params);
	TiUIPickerRowProxy *row = [params objectForKey:@"row"];
	TiUIPickerColumnProxy *column = [params objectForKey:@"column"];
	NSNumber* rowIndex = [column addRow:row];
	
	if (windowOpened) {
		[row windowWillOpen];
		[row windowDidOpen];
	}
	
	[self reloadColumn:column];
	if ([TiUtils boolValue:[row valueForUndefinedKey:@"selected"] def:NO])
	{
		TiThreadPerformOnMainThread(^{[[self picker] selectRow:
				[NSArray arrayWithObjects:NUMINT(0),rowIndex,nil]];}, NO);
	}
}

-(void)addPickerColumn:(NSDictionary*)params {
	ENSURE_UI_THREAD_1_ARG(params);
	NSMutableArray *columns = [params objectForKey:@"columns"];
	TiUIPickerColumnProxy *column = [params objectForKey:@"column"];
	if (windowOpened) {
		for (NSInteger i=0; i < [column rowCount]; i++) {
			TiUIPickerRowProxy* row = [column rowAt:i];
			
			[row windowWillOpen];
			[row windowDidOpen];
		}
	}
	
	[columns addObject:column];
	[self reloadColumn:column];
}

-(void)addRowOfColumns:(NSDictionary*)params {
	ENSURE_UI_THREAD_1_ARG(params);
	NSMutableArray *columns = [params objectForKey:@"columns"];
	NSArray *data = [params objectForKey:@"data"];
	for (id column in data)
	{
		if (windowOpened) {
			for (NSInteger i=0; i < [column rowCount]; i++) {
				TiUIPickerRowProxy* row = [column rowAt:i];
				
				[row windowWillOpen];
				[row windowDidOpen];
			}
		}
		
		[columns addObject:column];
	}
}

-(void)addRowOfDicts:(NSDictionary*)params {
	ENSURE_UI_THREAD_1_ARG(params);
	TiUIPickerRowProxy *row = [params objectForKey:@"row"];
	TiUIPickerColumnProxy *column = [params objectForKey:@"column"];
	NSNumber* rowIndex = [params objectForKey:@"rowIndex"];
	if (windowOpened) {
		[row windowWillOpen];
		[row windowDidOpen];
	}
	[self reloadColumn:column];
	if ([TiUtils boolValue:[row valueForUndefinedKey:@"selected"] def:NO])
	{
		[self setSelectedRow:[NSArray arrayWithObjects:NUMINT(0),rowIndex,NUMBOOL(NO),nil]];
	}
}

-(void)addDefault:(NSDictionary*)params {
	ENSURE_UI_THREAD_1_ARG(params);
	TiUIPickerColumnProxy *column = [params objectForKey:@"column"];
	NSArray *data = [params objectForKey:@"data"];
	for (id item in data)
	{
		ENSURE_TYPE(item,TiUIPickerRowProxy);
		
		if (windowOpened) {
			[item windowWillOpen];
			[item windowDidOpen];
		}
		
		[column addRow:item];
	}
	[self reloadColumn:column];
}

#pragma mark Public APIs 

-(void)add:(id)args
{
	// TODO: Probably take advantage of Jeff's performance improvements in ordinary views.
	// But DO NOT do this until after release!
	id data = [args objectAtIndex:0];
	
	if ([data isKindOfClass:[TiUIPickerRowProxy class]])
	{
		TiUIPickerRowProxy *row = (TiUIPickerRowProxy*)data;
		TiUIPickerColumnProxy *column = [self columnAt:0];
		NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:row, @"row", column, @"column", nil];
		[self addPickerRow:params];
	}
	else if ([data isKindOfClass:[TiUIPickerColumnProxy class]])
	{
		NSMutableArray *columns = [self columns];
		TiUIPickerColumnProxy* column = (TiUIPickerColumnProxy*)data;
		NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:columns, @"columns", column, @"column", nil];
		[self addPickerColumn:params];
	}
	else if ([data isKindOfClass:[NSArray class]])
	{
		// peek to see what our first row is ... 
		id firstRow = [data objectAtIndex:0];
		
		// if an array of columns, just add them
		if ([firstRow isKindOfClass:[TiUIPickerColumnProxy class]])
		{
			NSMutableArray *columns = [self columns];
			NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:columns, @"columns", data, @"data", nil];
			[self addRowOfColumns:params];
		}
		else if ([firstRow isKindOfClass:[NSDictionary class]])
		{
			for (id rowdata in data)
			{
				TiUIPickerRowProxy *row = [[TiUIPickerRowProxy alloc] _initWithPageContext:[self executionContext] args:[NSArray arrayWithObject:rowdata]];
				TiUIPickerColumnProxy *column = [self columnAt:0];
				NSNumber* rowIndex = [column addRow:row];
				[row release];

				NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:row, @"row", column, @"column", rowIndex, @"rowIndex", nil];
				[self addRowOfDicts:params];
			}
		}
		else
		{
			TiUIPickerColumnProxy *column = [self columnAt:0];
			NSDictionary* params = [NSDictionary dictionaryWithObjectsAndKeys:column, @"column", data, @"data", nil];
			[self addDefault:params];
		}
	}
}

-(void)remove:(id)args
{
	//TODO
}

-(id)getSelectedRow:(id)args
{
	ENSURE_SINGLE_ARG(args,NSObject);
	if ([self viewAttached])
	{
		return [(TiUIPicker*)[self view] selectedRowForColumn:[TiUtils intValue:args]];
	}
	return nil;
}

-(void)setSelectedRow:(id)args
{
	ENSURE_UI_THREAD(setSelectedRow,args);
	
	if ([self viewAttached])
	{
		NSInteger column = [TiUtils intValue:[args objectAtIndex:0]];
		NSInteger row = [TiUtils intValue:[args objectAtIndex:1]];
		BOOL animated = [args count]>2 ? [TiUtils boolValue:[args objectAtIndex:2]] : YES;
		[(TiUIPicker*)[self view] selectRowForColumn:column row:row animated:animated];
	}
	else {
		if (selectOnLoad != args) {
			RELEASE_TO_NIL(selectOnLoad);
			// Hilarious!  selectOnLoad CAN'T be animated - otherwise the picker doesn't actually set the row.
			// This is a tasty classic of an Apple bug.  So, we manually set the 'animated' value to NO, 100 of the time.
			NSMutableArray* mutableArgs = [NSMutableArray arrayWithArray:args];
			if ([mutableArgs count] > 2) {
				[mutableArgs replaceObjectAtIndex:2 withObject:NUMBOOL(NO)];
			}
			else {
				[mutableArgs addObject:NUMBOOL(NO)];
			}
			selectOnLoad = [mutableArgs retain];
		}
	}
}

-(UIViewAutoresizing)verifyAutoresizing:(UIViewAutoresizing)suggestedResizing
{
	return suggestedResizing & ~(UIViewAutoresizingFlexibleHeight);
}

USE_VIEW_FOR_VERIFY_HEIGHT
USE_VIEW_FOR_VERIFY_WIDTH


-(void)reloadColumn:(id)column
{
	ENSURE_SINGLE_ARG(column,NSObject);

	if (![self viewAttached])
	{
		return;
	}
	
	//TODO: This is playing with fire here.
	NSArray * columnArray = [self columns];

	int columnIndex = NSNotFound;
	if([column isKindOfClass:[TiUIPickerColumnProxy class]])
	{
		columnIndex = [columnArray indexOfObject:column];
	}
	else
	{
		columnIndex = [TiUtils intValue:column def:NSNotFound];
	}

	ENSURE_VALUE_RANGE(columnIndex,0,[columnArray count]-1);
	[self makeViewPerformSelector:@selector(reloadColumn:) withObject:NUMINT(columnIndex) createIfNeeded:YES waitUntilDone:NO];
}

-(TiDimension)defaultAutoWidthBehavior:(id)unused
{
    return TiDimensionAutoSize;
}
-(TiDimension)defaultAutoHeightBehavior:(id)unused
{
    return TiDimensionAutoSize;
}

@end

#endif