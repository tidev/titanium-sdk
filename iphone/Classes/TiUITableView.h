/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewSectionProxy.h"
#import "TiUITableViewAction.h"
#import "TiUISearchBarProxy.h"
#import "TiDimension.h"

@interface TiUITableView : TiUIView<UITableViewDelegate,UITableViewDataSource,UISearchBarDelegate,TiUIScrollView> {
@private
	UITableView *tableview;
	NSMutableArray *sections;
	BOOL moving;
	BOOL editing;
	BOOL autohideSearch;
	BOOL searchHidden;
	BOOL editable;
	NSMutableArray * sectionIndex;
	NSMutableDictionary * sectionIndexMap;
	TiDimension rowHeight;
	TiDimension minRowHeight;
	TiDimension maxRowHeight;
	TiUISearchBarProxy * searchField;
	UIView * tableHeaderView;
	UIButton * searchScreenView;
	UITableView *searchTableView;
	NSString * filterAttribute;
	NSMutableArray * searchResultIndexes;
	
	id	lastFocusedView; //DOES NOT RETAIN.	
}

#pragma mark Framework
-(CGFloat)tableRowHeight:(CGFloat)height;
-(NSInteger)indexForRow:(TiUITableViewRowProxy*)row;
-(TiUITableViewRowProxy*)rowForIndex:(NSInteger)index section:(NSInteger*)section;
-(void)updateSearchView;
-(NSMutableArray*)sections;

-(void)dispatchAction:(TiUITableViewAction*)action;
-(void)scrollToIndex:(NSInteger)index position:(UITableViewScrollPosition)position animated:(BOOL)animated;

@end
