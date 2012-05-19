/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiViewProxy.h"

@class TiUITableViewRowProxy;
@class TiUITableView;

@interface TiUITableViewSectionProxy : TiViewProxy <TiProxyDelegate,NSFastEnumeration> 
{
@private
	NSMutableArray *rows;
	TiUITableView *table;
	NSInteger section;
}

@property(nonatomic,readonly) NSMutableArray *rows;
@property(nonatomic,readonly) NSInteger rowCount;
@property(nonatomic,readonly,assign) NSString *headerTitle;
@property(nonatomic,readonly,assign) NSString *footerTitle;

-(void)add:(id)proxy;
-(void)remove:(id)proxy;

#pragma mark Framework
-(TiUITableViewRowProxy*)rowAtIndex:(NSInteger)index;
@property(nonatomic,readwrite,assign) TiUITableView *table;
@property(nonatomic,readwrite,assign) NSInteger section;

-(void)triggerSectionUpdate;
-(void)reorderRows;

@end

#endif