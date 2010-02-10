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
	for (NSDictionary* row in data)
	{
		id value = [row objectForKey:@"name"];
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
	
	NSNumber * rowNumber = [args objectAtIndex:0];
	ENSURE_METHOD(rowNumber,intValue);
	int rowIndex=[rowNumber intValue];
	
	ENSURE_VALUE_RANGE(rowIndex,0,[data count]-1);

	TiUITableViewRowProxy *newrow = [args objectAtIndex:1];
	ENSURE_TABLE_VIEW_ROW(newrow);
	[data insertObject:newrow atIndex:rowIndex+1];
	
	NSDictionary * options=nil;
	if ([args count]>2)
	{
		options = [args objectAtIndex:2];
	}
	
	[self enqueueAction:[NSArray arrayWithObjects:rowNumber,newrow,options,nil] withType:TiUITableViewDispatchInsertRowAfter];
}

- (void) insertRowBefore:(NSArray *)args
{
	if ([args count] < 2) 
	{
		[self throwException:TiExceptionNotEnoughArguments subreason:nil location:CODELOCATION];
	}
	
	int row = [[args objectAtIndex:0] intValue];
	NSDictionary *newdata = [args objectAtIndex:1];
	NSMutableArray *data = [self valueForKey:@"data"];
	
	if (row < 0 || row >= [data count])
	{
		[self throwException:TiExceptionRangeError subreason:nil location:CODELOCATION];
	}
	
	[data insertObject:newdata atIndex:row-1];
	
	[self enqueueAction:args withType:TiUITableViewDispatchInsertRowBefore];
}

- (void) deleteRow:(NSArray *)args
{
	if ([args count] < 1) 
	{
		[self throwException:TiExceptionNotEnoughArguments subreason:nil location:CODELOCATION];
	}
	
	int row = [[args objectAtIndex:0] intValue];
	NSMutableArray *data = [self valueForKey:@"data"];
	
	if (row < 0 || row >= [data count])
	{
		[self throwException:TiExceptionRangeError subreason:nil location:CODELOCATION];
	}
	
	[data removeObjectAtIndex:row];
	
	[self enqueueAction:args withType:TiUITableViewDispatchDeleteRow];
}

- (void) updateRow:(NSArray *)args
{
	if ([args count] < 2) 
	{
		[self throwException:TiExceptionNotEnoughArguments subreason:nil location:CODELOCATION];
	}
	
	int row = [[args objectAtIndex:0] intValue];
	NSDictionary *newdata = [args objectAtIndex:1];
	NSMutableArray *data = [self valueForKey:@"data"];
	
	if (row < 0 || row >= [data count])
	{
		[self throwException:TiExceptionRangeError subreason:nil location:CODELOCATION];
	}
	
	[data replaceObjectAtIndex:row withObject:newdata];

	[self enqueueAction:args withType:TiUITableViewDispatchUpdateRow];
}

- (void) appendRow:(NSArray *)args
{
	if ([args count] < 1) 
	{
		[self throwException:TiExceptionNotEnoughArguments subreason:nil location:CODELOCATION];
	}
	
	NSDictionary *newdata = [args objectAtIndex:0];
	NSMutableArray *data = [self valueForKey:@"data"];
	
	[data addObject:newdata];
	
	[self enqueueAction:args withType:TiUITableViewDispatchAppendRow];
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

@end 
