/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiUISearchBarProxy.h"
#import "TiUITableViewAction.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewSectionProxy.h"
#import <TitaniumKit/TiDimension.h>
#import <TitaniumKit/TiUIView.h>
#ifdef USE_TI_UIREFRESHCONTROL
#import "TiUIRefreshControlProxy.h"
#endif
@class TiGradientLayer;

// Overloads hilighting to send touchbegin/touchend events
@interface TiUITableViewCell : UITableViewCell {
  TiUITableViewRowProxy *proxy;
  TiGradientLayer *gradientLayer;
  TiGradient *backgroundGradient;
  TiGradient *selectedBackgroundGradient;
  CGPoint hitPoint;
}
@property (nonatomic, readonly) CGPoint hitPoint;
@property (nonatomic, readwrite, retain) TiUITableViewRowProxy *proxy;

- (id)initWithStyle:(UITableViewCellStyle)style_ reuseIdentifier:(NSString *)reuseIdentifier_ row:(TiUITableViewRowProxy *)row_;

- (void)handleEvent:(NSString *)type;

- (void)setBackgroundGradient_:(TiGradient *)newGradient;
- (void)setSelectedBackgroundGradient_:(TiGradient *)newGradient;

- (void)updateGradientLayer:(BOOL)useSelected withAnimation:(BOOL)animated;
- (CGSize)computeCellSize;

@end

@interface TiUITableView : TiUIView <UISearchResultsUpdating, UISearchControllerDelegate, UIScrollViewDelegate, UITableViewDelegate, UITableViewDataSource, UISearchBarDelegate, TiScrolling, TiProxyObserver> {
  @private
  UITableView *tableview;
  BOOL moving;
  BOOL editing;
  BOOL searchHidden;
  BOOL hideOnSearch; // For backcompat, default 'true'
  BOOL animateHide;
  BOOL editable;
  BOOL moveable;
  NSMutableArray *sectionIndex;
  NSMutableDictionary *sectionIndexMap;
  TiDimension rowHeight;
  TiDimension minRowHeight;
  TiDimension maxRowHeight;
  TiUISearchBarProxy *searchField;
  UIView *tableHeaderView;
  UIView *tableHeaderPullView;
  UIButton *searchScreenView;
  NSString *filterAttribute;
  NSString *searchString;
  BOOL searchActivated;
  BOOL filterAnchored;
  BOOL filterCaseInsensitive;
  BOOL allowsSelectionSet;
  UISearchController *searchController;
  UIViewController *searchControllerPresenter;
  UIView *dimmingView;
  BOOL _dimsBackgroundDuringPresentation;
  TiViewProxy *headerViewProxy;
  TiViewProxy *footerViewProxy;
  BOOL viewWillDetach;
#ifdef USE_TI_UIREFRESHCONTROL
  TiUIRefreshControlProxy *_refreshControlProxy;
#endif
  UIEdgeInsets defaultSeparatorInsets;
  UIEdgeInsets rowSeparatorInsets;
  CGPoint tableContentOffset;
  BOOL isSearched;
  BOOL isSearchBarInNavigation;
}

@property (nonatomic, assign) BOOL viewWillDetach;
@property (nonatomic, assign) BOOL shouldDelayScrolling;
@property (nonatomic, retain) NSMutableArray *searchResultIndexes;

#pragma mark Framework
- (CGFloat)tableRowHeight:(CGFloat)height;
- (NSInteger)indexForRow:(TiUITableViewRowProxy *)row;
- (TiUITableViewRowProxy *)rowForIndex:(NSInteger)index section:(NSInteger *)section;
- (void)updateSearchView;
- (void)replaceData:(NSArray *)data animation:(UITableViewRowAnimation)animation;

- (void)dispatchAction:(TiUITableViewAction *)action;
- (void)scrollToIndex:(NSInteger)index position:(UITableViewScrollPosition)position animated:(BOOL)animated;
- (void)scrollToTop:(NSInteger)top animated:(BOOL)animated;
- (NSIndexPath *)indexPathFromSearchIndex:(NSInteger)index;
- (IBAction)hideSearchScreen:(id)sender;
- (UITableView *)tableView;
- (void)setScrollsToTop_:(id)value;
- (void)setContentOffset_:(id)args withObject:(id)obj;

#pragma Private
- (void)selectRow:(id)args;
- (void)deselectRow:(id)args;
- (void)reloadDataFromCount:(NSUInteger)oldCount toCount:(NSUInteger)newCount animation:(UITableViewRowAnimation)animation;
- (void)refreshSearchControllerUsingReload:(BOOL)reloadSearch;
- (void)viewResignFocus;
- (void)viewGetFocus;
@end

#endif
