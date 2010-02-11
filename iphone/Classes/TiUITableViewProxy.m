/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewProxy.h"
#import "TiUITableView.h"
#import "TiUtils.h"
#import "WebFont.h"
#import "TiUITableViewBase.h"
#import "TiViewProxy.h"

NSArray * tableKeys = nil;

@implementation TiUITableViewProxy
@synthesize data;

-(void)setData:(NSArray *)newData withObject:(NSDictionary *)options
{
	ENSURE_TYPE_OR_NIL(newData,NSArray);
	ENSURE_TYPE_OR_NIL(options,NSDictionary);

	NSArray * oldData = [data autorelease];
	data = [[NSMutableArray alloc] initWithCapacity:[newData count]];
	
	for (TiUITableViewRowProxy * thisEntry in newData)
	{
		ENSURE_TABLE_VIEW_ROW(thisEntry);
		[data addObject:thisEntry];
	}
	
	NSArray * dataCopy = [data copy];
	[self.modelDelegate propertyChanged:@"data" oldValue:oldData newValue:dataCopy proxy:self];
//
//	[self enqueueAction:[NSArray arrayWithObjects:dataCopy,options,nil] withType:TiUITableViewDispatchSetDataWithAnimation];
	[dataCopy release];
}

-(void)setData:(NSArray *)newData
{
	[self setData:newData withObject:nil];
}
















#pragma mark Internal

-(id<NSFastEnumeration>)validKeys
{
	if (tableKeys == nil) {
		tableKeys = [[NSArray alloc] initWithObjects:@"template",
					  @"rowHeight",@"backgroundColor",@"borderColor",
					  @"marginTop",@"marginLeft",@"marginRight",@"marginBottom",
					  @"sections",@"editing",@"moving",@"editable",
					  @"search",@"filterAttribute",@"index",
					  @"data",nil];
	}
	return tableKeys;
}

-(void)_configure
{	
	// initialize to FALSE values so you can access their values before invoking the first state change
	[self replaceValue:[NSNumber numberWithBool:NO] forKey:@"editing" notification:NO];
	[self replaceValue:[NSNumber numberWithBool:NO] forKey:@"moving" notification:NO];
}

-(void)_initWithCallback:(KrollCallback*)callback_
{
	[self addEventListener:[NSArray arrayWithObjects:@"click",callback_,nil]];
}

-(void)enqueueActionOnMainThread:(id)args
{
	TiUITableViewDispatchType type = [[args objectAtIndex:0] intValue];
	NSArray *a = [args objectAtIndex:1];
	TiUITableViewBase *table = (TiUITableViewBase*)self.modelDelegate;
	[table dispatchAction:a withType:type];
}

-(void)enqueueAction:(id)args withType:(TiUITableViewDispatchType)type
{
	// if we don't have a view attached don't dispatch
	if (self.modelDelegate==nil || [self viewAttached]==NO)
	{
		return;
	}
	if ([NSThread isMainThread])
	{
		TiUITableViewBase *table = (TiUITableViewBase*)self.modelDelegate;
		[table dispatchAction:args withType:type];
	}
	else 
	{
		[self performSelectorOnMainThread:@selector(enqueueActionOnMainThread:) withObject:[NSArray arrayWithObjects:[NSNumber numberWithInt:type],args,nil] waitUntilDone:NO];
	}

}


#pragma mark Public APIs


- (NSNumber *) indexByName:(id)name
{
	ENSURE_SINGLE_ARG(name,NSString);
	unsigned int index = 0;
	for (id row in data)
	{
		id value = [row valueForKey:@"name"];
		if ([name isEqual:value])
		{
			return [NSNumber numberWithInt:index];
		}
		index++;
	}
	return [NSNumber numberWithInt:-1];
}

- (void) insertRowAfter:(NSArray *)args
{
	ENSURE_ARG_COUNT(args,2);

	int rowIndex = [[args objectAtIndex:0] intValue];
	ENSURE_VALUE_RANGE(rowIndex,0,[data count]-1);

	TiUITableViewRowProxy *newRow = [args objectAtIndex:1];
	ENSURE_TABLE_VIEW_ROW(newRow);

	[data insertObject:newRow atIndex:rowIndex+1];
	
	[self enqueueAction:[NSArray arrayWithObjects:[NSNumber numberWithInt:rowIndex],newRow,VALUE_AT_INDEX_OR_NIL(args,2),nil]
			withType:TiUITableViewDispatchInsertRowAfter];
}

- (void) insertRowBefore:(NSArray *)args
{
	ENSURE_ARG_COUNT(args,2);

	int rowIndex = [[args objectAtIndex:0] intValue];
	ENSURE_VALUE_RANGE(rowIndex,0,[data count]);

	TiUITableViewRowProxy *newRow = [args objectAtIndex:1];
	ENSURE_TABLE_VIEW_ROW(newRow);

	if (([newRow valueForKey:@"header"]==nil) && (rowIndex < [data count]))
	{	//We are inserting before first, but keeping the same header. Thus, we have to transfer the header.
		TiUITableViewRowProxy *oldRow = [data objectAtIndex:rowIndex];
		[newRow setValue:[oldRow valueForKey:@"header"] forKey:@"header"];
		[oldRow setValue:nil forKey:@"header"];
	}
	
	//TODO: Am what I'm doing 100% safe? We're changing some data immediately and some in the main thread.
	//Namely, by the time insertRow is realized, the headers are already swapped.
	//--Blain.
	[data insertObject:newRow atIndex:rowIndex];
	[self enqueueAction:[NSArray arrayWithObjects:[NSNumber numberWithInt:rowIndex],newRow,VALUE_AT_INDEX_OR_NIL(args,2),nil]
			withType:TiUITableViewDispatchInsertRowBefore];
}

- (void) deleteRow:(NSArray *)args
{
	ENSURE_ARG_COUNT(args,1);

	int rowIndex = [[args objectAtIndex:0] intValue];
	ENSURE_VALUE_RANGE(rowIndex,0,[data count]-1);
	
	if (rowIndex < ([data count]-1))
	{
		TiUITableViewRowProxy * doomedRow = [data objectAtIndex:rowIndex];
		TiUITableViewRowProxy * nextRow = [data objectAtIndex:rowIndex+1];
		id transferredHeader = [doomedRow valueForKey:@"header"];
		if((transferredHeader != nil) && ([nextRow valueForKey:@"header"]==nil))
		{
			[nextRow setValue:transferredHeader forKey:@"header"];
		}
	}
	
	[data removeObjectAtIndex:rowIndex];
	[self enqueueAction:[NSArray arrayWithObjects:[NSNumber numberWithInt:rowIndex],VALUE_AT_INDEX_OR_NIL(args,1),nil]
			withType:TiUITableViewDispatchDeleteRow];
}

- (void) updateRow:(NSArray *)args
{
	ENSURE_ARG_COUNT(args,2);

	int rowIndex = [[args objectAtIndex:0] intValue];
	ENSURE_VALUE_RANGE(rowIndex,0,[data count]-1);

	TiUITableViewRowProxy *newRow = [args objectAtIndex:1];
	ENSURE_TABLE_VIEW_ROW(newRow);
	
	[data replaceObjectAtIndex:rowIndex withObject:newRow];
	[self enqueueAction:[NSArray arrayWithObjects:[NSNumber numberWithInt:rowIndex],VALUE_AT_INDEX_OR_NIL(args,2),nil]
			withType:TiUITableViewDispatchUpdateRow];
}

- (void) appendRow:(NSArray *)args
{
	ENSURE_ARG_COUNT(args,1);

	TiUITableViewRowProxy *newRow = [args objectAtIndex:0];
	ENSURE_TABLE_VIEW_ROW(newRow);

	[data addObject:newRow];
	[self enqueueAction:[NSArray arrayWithObjects:newRow,VALUE_AT_INDEX_OR_NIL(args,1),nil]
			withType:TiUITableViewDispatchAppendRow];
}

- (void) scrollToIndex:(NSArray *)args
{
	if ([self viewAttached])
	{
		[self enqueueAction:args withType:TiUITableViewDispatchScrollToIndex];
	}
}

- (void) setEditing:(NSNumber*)edit withObject:(id)obj
{
	// do it without notification since we notify below
	[self replaceValue:[NSArray arrayWithObjects:edit,obj,nil] forKey:@"editing" notification:NO];
	
	if ([self viewAttached])
	{
		[self enqueueAction:[NSArray arrayWithObjects:edit,obj,nil] withType:TiUITableViewDispatchSetEditing];
	}
}

- (void) setMoving:(NSNumber*)move withObject:(id)obj
{
	// do it without notification since we notify below
	[self replaceValue:[NSArray arrayWithObjects:move,obj,nil] forKey:@"moving" notification:NO];
	
	if ([self viewAttached])
	{
		[self enqueueAction:[NSArray arrayWithObjects:move,obj,nil] withType:TiUITableViewDispatchSetMoving];
	}
}

-(NSDictionary *)locationOfRow:(TiUITableViewRowProxy *)row
{
	int listIndex = [data indexOfObject:row];
	
	return [NSDictionary dictionaryWithObjectsAndKeys:
			[NSNumber numberWithInt:listIndex],@"index",
			nil];
}

-(void)row:(TiUITableViewRowProxy *)row changedValue:(id)newValue forKey:(NSString *)key
{
	


}

@end 
