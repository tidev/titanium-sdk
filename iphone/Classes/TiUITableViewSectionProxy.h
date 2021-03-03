/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import <TitaniumKit/TiViewProxy.h>

@class TiUITableViewRowProxy;
@class TiUITableView;

@interface TiUITableViewSectionProxy : TiViewProxy <TiProxyDelegate, NSFastEnumeration> {
  @private
  NSMutableArray<TiUITableViewRowProxy *> *rows;
  TiUITableView *table;
  NSInteger section;
}

@property (nonatomic, readonly) NSMutableArray<TiUITableViewRowProxy *> *rows;
@property (nonatomic, readonly) NSNumber *rowCount;
@property (nonatomic, readonly, assign) NSString *headerTitle;
@property (nonatomic, readonly, assign) NSString *footerTitle;

- (void)add:(id)proxy;
- (void)remove:(id)proxy;

#pragma mark Framework
- (TiUITableViewRowProxy *)rowAtIndex:(NSUInteger)index;
@property (nonatomic, readwrite, assign) TiUITableView *table;
@property (nonatomic, readwrite, assign) NSInteger section;

- (void)triggerSectionUpdate;
- (void)reorderRows;

@end

#endif
