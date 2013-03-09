/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@protocol TiUIListViewDelegate <NSObject>
@required

- (void)dispatchUpdateAction:(void(^)(UITableView *tableView))block;
- (id)dispatchBlockWithResult:(id(^)(void))block;

@end

@interface TiUIListSectionProxy : TiProxy < TiUIListViewDelegate >

@property (nonatomic, readwrite, assign) id<TiUIListViewDelegate> delegate;
@property (nonatomic, readwrite, assign) NSUInteger sectionIndex;

- (NSDictionary *)itemAtIndex:(NSUInteger)index;

// Public API
@property (nonatomic, readonly) NSUInteger itemCount;
@property (nonatomic, readonly) NSArray *items;
@property (nonatomic, readwrite, copy) NSString *headerTitle;
@property (nonatomic, readwrite, copy) NSString *footerTitle;

@end
