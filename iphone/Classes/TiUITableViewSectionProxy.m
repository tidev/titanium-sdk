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
	RELEASE_TO_NIL(rows);
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

-(void)add:(TiUITableViewRowProxy*)proxy
{
	if (rows==nil)
	{
		rows = [[NSMutableArray array] retain];
	}
	[rows addObject:proxy];
}

-(void)remove:(TiUITableViewRowProxy*)proxy
{
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

-(void)setHeaderTitle:(NSString *)title
{
	[super replaceValue:title forKey:@"headerTitle" notification:NO];
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:nil animation:nil section:self.section type:TiUITableViewActionSectionReload] autorelease];
	[table dispatchAction:action];
}

-(void)setFooterTitle:(NSString*)title
{
	[super replaceValue:title forKey:@"footerTitle" notification:NO];
	TiUITableViewAction *action = [[[TiUITableViewAction alloc] initWithRow:nil animation:nil section:self.section type:TiUITableViewActionSectionReload] autorelease];
	[table dispatchAction:action];
}

@end
