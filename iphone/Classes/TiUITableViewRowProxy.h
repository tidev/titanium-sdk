/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"

@class TiUITableView;
@class TiUITableViewSectionProxy;

@interface TiUITableViewRowProxy : TiProxy 
{
@private
	NSString *className;
	TiUITableView *table;
	TiUITableViewSectionProxy *section;
	NSInteger row;
}

#pragma mark Public APIs

@property(nonatomic,readonly) NSString *className;

#pragma mark Framework

@property(nonatomic,readwrite,assign) TiUITableView *table;
@property(nonatomic,readwrite,assign) TiUITableViewSectionProxy *section;
@property(nonatomic,readwrite,assign) NSInteger row;

-(void)initializeTableViewCell:(UITableViewCell*)cell;
-(void)renderTableViewCell:(UITableViewCell*)cell;

-(void)updateRow:(NSDictionary*)data withObject:(NSDictionary*)properties;

@end