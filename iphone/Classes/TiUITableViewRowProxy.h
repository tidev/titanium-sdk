/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import <TitaniumKit/TiDimension.h>
#import <TitaniumKit/TiViewProxy.h>

@class TiUITableViewCell;
@class TiUITableView;
@class TiUITableViewSectionProxy;

@interface TiUITableViewRowProxy : TiViewProxy <TiProxyDelegate> {
  @private
  NSString *tableClass;
  __weak TiUITableView *table;
  __weak TiUITableViewSectionProxy *section;
  TiDimension height;
  TiDimension leftCap;
  TiDimension topCap;
  BOOL configuredChildren;
  int dirtyRowFlags;
#ifdef TI_USE_AUTOLAYOUT
  TiLayoutView *rowContainerView;
#else
  UIView *rowContainerView;
#endif
  BOOL modifyingRow;
  BOOL attaching;
  NSInteger row;
  __weak TiUITableViewCell *callbackCell;
}

#pragma mark Public APIs

@property (nonatomic, readonly) NSString *tableClass;
@property (nonatomic, readonly) BOOL reusable; // Readonly until reproxy/reuse implemented properly

#pragma mark Framework

@property (nonatomic, readwrite, weak) TiUITableView *table;
@property (nonatomic, readwrite, weak) TiUITableViewSectionProxy *section;
@property (nonatomic, readwrite, assign) NSInteger row;
@property (nonatomic, readwrite, weak) TiUITableViewCell *callbackCell;

- (void)prepareTableRowForReuse;
- (void)initializeTableViewCell:(UITableViewCell *)cell;
- (CGFloat)sizeWidthForDecorations:(CGFloat)oldWidth forceResizing:(BOOL)force;
- (CGFloat)rowHeight:(CGFloat)width;
- (TiProxy *)touchedViewProxyInCell:(UITableViewCell *)targetCell atPoint:(CGPoint *)point;
- (id)createEventObject:(id)initialObject;
- (void)triggerAttach;
- (void)updateRow:(NSDictionary *)data withObject:(NSDictionary *)properties;
- (UIView *)currentRowContainerView; //Private method :For internal use only.
- (void)triggerLayout; //Private method :For internal use only. Called from layoutSubviews of the cell.

@end

#endif
