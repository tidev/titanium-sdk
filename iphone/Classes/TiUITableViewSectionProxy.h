/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@class TiUITableViewRowProxy;
@class TiUITableView;

@interface TiUITableViewSectionProxy : TiProxy {
@private
	NSMutableArray *rows;
	TiUITableView *table;
	NSInteger section;
}

@property(nonatomic,readonly) NSMutableArray *rows;
@property(nonatomic,readonly) NSInteger rowCount;
@property(nonatomic,readwrite,assign) NSString *headerTitle;
@property(nonatomic,readwrite,assign) NSString *footerTitle;

-(void)add:(TiUITableViewRowProxy*)proxy;
-(void)remove:(TiUITableViewRowProxy*)proxy;
-(TiUITableViewRowProxy*)rowAtIndex:(NSInteger)index;

#pragma mark Framework
@property(nonatomic,readwrite,assign) TiUITableView *table;
@property(nonatomic,readwrite,assign) NSInteger section;

@end
