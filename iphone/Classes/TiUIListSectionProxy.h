/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UILISTVIEW

#import <TitaniumKit/TiProxy.h>
@protocol TiUIListViewDelegateView <NSObject>
@required
- (void)updateSearchResults:(id)unused;
@end

@protocol TiUIListViewDelegate <NSObject>
@required

- (void)dispatchUpdateAction:(void (^)(UITableView *tableView))block;
- (void)dispatchBlock:(void (^)(UITableView *tableView))block;
- (id)dispatchBlockWithResult:(id (^)(void))block;
- (id<TiUIListViewDelegateView>)delegateView;
@end

@interface TiUIListSectionProxy : TiProxy <TiUIListViewDelegate>

@property (nonatomic, readwrite, assign) id<TiUIListViewDelegate> delegate;
@property (nonatomic, readwrite, assign) NSUInteger sectionIndex;

// Private API. Used by ListView directly. Not for public comsumption
- (NSDictionary *)itemAtIndex:(NSUInteger)index;
- (void)deleteItemAtIndex:(NSUInteger)index;
- (void)addItem:(NSDictionary *)item atIndex:(NSUInteger)index;

// Public API
@property (nonatomic, readonly) NSUInteger itemCount;
@property (nonatomic, readonly) NSArray *items;
@property (nonatomic, readwrite, copy) NSString *headerTitle;
@property (nonatomic, readwrite, copy) NSString *footerTitle;

@end

#endif
