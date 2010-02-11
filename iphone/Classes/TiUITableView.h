/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUITableViewBase.h"
#import "TiViewProxy.h"
#import "TiUISearchBarProxy.h"

@interface TiUITableView : TiUITableViewBase<UISearchBarDelegate> {

	TiUISearchBarProxy * searchField;
	UIView * tableHeaderView;
	
	UIButton * searchScreenView;
	UITableView *searchTableView;
	
	NSString * filterAttribute;
	NSMutableArray * searchResultIndexes;
	
	NSMutableArray * sectionIndex;
	NSMutableDictionary * sectionIndexMap;
}

-(void)addRowWithTransaction:(TiUITableViewTransaction *)transaction;


@end
