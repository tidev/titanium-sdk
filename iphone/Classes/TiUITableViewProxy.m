/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewProxy.h"
#import "TiUITableView.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewSectionProxy.h"
#import "TiUITableViewAction.h"
#import "TiUtils.h"
#import "WebFont.h"
#import "TiViewProxy.h"

@implementation TiUITableViewProxy

#pragma mark Internal 

-(TiUITableViewRowProxy*)newTableViewRowFromDict:(NSDictionary*)data
{
	TiUITableViewRowProxy *proxy = [[[TiUITableViewRowProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
	[proxy _initWithProperties:data];
	return proxy;
}


#pragma mark Public APIs

-(NSNumber*)getIndexByName:(id)args
{
	ENSURE_SINGLE_ARG(args,NSString);
	
	int c = 0;
	
	for (TiUITableViewSectionProxy *section in [self valueForKey:@"data"])
	{
		for (TiUITableViewRowProxy *row in [section rows])
		{
			if ([args isEqualToString:[row valueForKey:@"name"]])
			{
				return NUMINT(c);
			}
			c++;
		}
	}
	return NUMINT(-1);
}

-(void)updateRow:(id)args
{
	// this is for backwards compat
	
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *data = [args objectAtIndex:1];
	NSDictionary *anim = [args count] > 2 ? [args objectAtIndex:2] : nil;
	
	NSArray *existingData = [self valueForKey:@"data"];
	if (existingData!=nil)
	{
		TiUITableView *table = (TiUITableView*) [self view];
		TiUITableViewRowProxy *row = [table rowForIndex:index section:nil];
		if (row!=nil)
		{
			[row updateRow:data withObject:anim];
		}
	}
}

-(void)deleteRow:(id)args
{
	// this is for backwards compat
	
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *anim = [args count] > 1 ? [args objectAtIndex:1] : nil;
	
	NSArray *existingData = [self valueForKey:@"data"];
	if (existingData!=nil)
	{
		TiUITableView *table = (TiUITableView*) [self view];
		TiUITableViewRowProxy *row = [table rowForIndex:index section:nil];
		if (row!=nil)
		{
			[table deleteRow:row animation:anim];
		}
	}
}

-(void)insertRowBefore:(id)args
{
	// this is for backwards compat
	
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *data = [args objectAtIndex:1];
	NSDictionary *anim = [args count] > 2 ? [args objectAtIndex:2] : nil;
	
	NSArray *existingData = [self valueForKey:@"data"];
	if (existingData!=nil)
	{
		TiUITableView *table = (TiUITableView*) [self view];
		TiUITableViewRowProxy *newrow = [self newTableViewRowFromDict:data];
		TiUITableViewRowProxy *row = [table rowForIndex:index section:nil];
		[table insertRow:newrow before:row animation:anim];
	}
}

-(void)insertRowAfter:(id)args
{
	// this is for backwards compat
	
	int index = [TiUtils intValue:[args objectAtIndex:0]];
	NSDictionary *data = [args objectAtIndex:1];
	NSDictionary *anim = [args count] > 2 ? [args objectAtIndex:2] : nil;
	
	NSArray *existingData = [self valueForKey:@"data"];
	if (existingData!=nil)
	{
		TiUITableView *table = (TiUITableView*) [self view];
		TiUITableViewRowProxy *newrow = [self newTableViewRowFromDict:data];
		TiUITableViewRowProxy *row = [table rowForIndex:index section:nil];
		[table insertRow:newrow after:row animation:anim];
	}
}

-(void)appendRow:(id)args
{
	// this is for backwards compat
	
	NSDictionary *data = [args objectAtIndex:0];
	NSDictionary *anim = [args count] > 1 ? [args objectAtIndex:1] : nil;
	
	NSArray *existingData = [self valueForKey:@"data"];
	if (existingData!=nil)
	{
		TiUITableView *table = (TiUITableView*) [self view];
		TiUITableViewRowProxy *newrow = [self newTableViewRowFromDict:data];
		[table appendRow:newrow animation:anim];
	}
}

-(void)setData:(id)args 
{
	ENSURE_ARRAY(args);
	
	// this is on the non-UI thread. let's do the work here before we pass
	// it over to the view which will be on the UI thread
	
	NSMutableArray *data = [NSMutableArray arrayWithCapacity:[args count]];

	Class dictionaryClass = [NSDictionary class];
	Class sectionClass = [TiUITableViewSectionProxy class];
	Class rowClass = [TiUITableViewRowProxy class];
	
	TiUITableViewSectionProxy *section = nil;
	
	for (id row in args)
	{
		if ([row isKindOfClass:dictionaryClass])
		{
			NSDictionary *dict = (NSDictionary*)row;
			TiUITableViewRowProxy *rowProxy = [self newTableViewRowFromDict:dict];
			NSString *header = [dict objectForKey:@"header"];
			if (section == nil || header!=nil)
			{
				section = [[[TiUITableViewSectionProxy alloc] _initWithPageContext:[self executionContext] args:nil] autorelease];
				[section setValue:header forUndefinedKey:@"headerTitle"];
				NSString *footer = [dict objectForKey:@"footer"];
				if (footer!=nil)
				{
					[section setValue:footer forUndefinedKey:@"footerTitle"];
				}
				[data addObject:section];
			}
			[section add:rowProxy];
		}
		else if ([row isKindOfClass:sectionClass])
		{
			section = (TiUITableViewSectionProxy*)row;
			[data addObject:section];
		}
		else if ([row isKindOfClass:rowClass])
		{
			if (section == nil)
			{
				section = [[[TiUITableViewSectionProxy alloc] _initWithPageContext:[self executionContext] args:nil] autorelease];
				[data addObject:section];
			}
			[section add:row];
		}
	}
	
	[self replaceValue:data forKey:@"data" notification:YES];
}

@end 
