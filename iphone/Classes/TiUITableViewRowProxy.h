/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiViewProxy.h"
#import "TiDimension.h"

@class TiUITableView;
@class TiUITableViewSectionProxy;

@interface TiUITableViewRowProxy : TiViewProxy <TiProxyDelegate>
{
@private
	NSString *tableClass;
	TiUITableView *table;
	TiUITableViewSectionProxy *section;
	TiDimension height;
	
	UIView * rowContainerView;
	BOOL modifyingRow;
	NSInteger row;
}

#pragma mark Public APIs

@property(nonatomic,readonly)	NSString *tableClass;

#pragma mark Framework

@property(nonatomic,readwrite,assign) TiUITableView *table;
@property(nonatomic,readwrite,assign) TiUITableViewSectionProxy *section;
@property(nonatomic,readwrite,assign) NSInteger row;

-(void)initializeTableViewCell:(UITableViewCell*)cell;
-(void)renderTableViewCell:(UITableViewCell*)cell;
-(CGFloat)rowHeight:(CGRect)bounds;
-(TiProxy *)touchedViewProxyInCell:(UITableViewCell *)targetCell;

-(void)updateRow:(NSDictionary*)data withObject:(NSDictionary*)properties;

@end

#endif