/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiUITableViewSectionProxy.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewAction.h"
#import	"TiUITableView.h"
#import "TiUtils.h"

@implementation TiUITableViewSectionProxy

@synthesize rows, table, section;

#pragma mark Internal 

-(void)_destroy
{
	self.modelDelegate = nil;
	RELEASE_TO_NIL(rows);
	[super _destroy];
}

-(void)_initWithProperties:(NSDictionary *)properties
{
	[super _initWithProperties:properties];
	self.modelDelegate = self;
}	

-(void)reorderRows
{
	NSInteger index = 0;
	for (TiUITableViewRowProxy *row in rows)
	{
		row.row = index++;
	}
}

-(void)triggerSectionUpdate
{
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:nil animation:nil section:self.section type:TiUITableViewActionSectionReload] autorelease];
	[table dispatchAction:action];
}

#pragma mark Public APIs

-(NSInteger)rowCount
{
	return rows!=nil ? [rows count] : 0;
}

-(TiUITableViewRowProxy*)rowAtIndex:(NSInteger)index
{
	return rows!=nil ? [rows objectAtIndex:index] : nil;
}

-(void)add:(id)proxy
{
	ENSURE_SINGLE_ARG(proxy,TiUITableViewRowProxy);
	if (rows==nil)
	{
		rows = [[NSMutableArray array] retain];
	}
	[rows addObject:proxy];
}

-(void)remove:(id)proxy
{
	ENSURE_SINGLE_ARG(proxy,TiUITableViewRowProxy);
	if (rows!=nil)
	{
		[rows removeObject:proxy];
	}
}

-(NSString*)headerTitle
{
	return [super valueForUndefinedKey:@"headerTitle"];
}

-(NSString*)footerTitle
{
	return [super valueForUndefinedKey:@"footerTitle"];
}

#pragma mark Delegate 

-(void)propertyChanged:(NSString*)key oldValue:(id)oldValue newValue:(id)newValue proxy:(TiProxy*)proxy
{
	// these properties should trigger a re-paint for the row
	static NSSet * TableViewSectionProperties = nil;
	if (TableViewSectionProperties==nil)
	{
		TableViewSectionProperties = [[NSSet alloc] initWithObjects:
								  @"headerTitle", @"footerTitle",
								  @"headerView", @"footerView",
								  nil];
	}
	
	
	if ([TableViewSectionProperties member:key]!=nil)
	{
		[self triggerSectionUpdate];
	}
}

-(BOOL)isRepositionProperty:(NSString*)key
{
	return NO;
}

@end
