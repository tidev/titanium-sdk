/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDimension.h"
#import "TiUITableViewRowProxy.h"
#import "TiProxy.h"

/*
	Blain's sit down and think about it.
	Model -- UI pairs:
	TiUITableViewRowProxy -- TiUITableViewCell --very loosely bound.
	TiUIGroupedSectionProxy -- TiUITableViewGroupSection
	TiUITableViewProxy -- TiUITableView
	TIUIGroupedViewProxy -- TiUIGroupedView
	
	Extra items:
	TiUITableViewTitle: A custom view for title views in GroupedView.
	TiUITableViewBase: The base view of the TiUITableView and TiUIGroupedView
	
	
	
	Other relationships:
	GroupedSectionProxy has an array of Rows. --As seen by the JS.
	GroupSection has an array of Rows. --As seen by the UI

	TableViewProxy has an array of Rows. --As seen by the JS.
	TableView has an array of GroupSections --As seen by the UI.
	
	GroupedViewProxy has an array of GroupedSectionProxies. --As seen by the JS
	GroupedView has an array of GroupSections --As seen by the UI.
	
	GroupedSection has a weak pointer to the owning TiUITableViewBase to inform of updates from GroupedSectionProxy.

	
	Responsibilities:
	TableView does the splitting and merging of groupSections.
	GroupSection, for the most part, is relegated to 

*/



@class TiUIGroupedSectionProxy, TiUITableViewBase;
@interface TiUITableViewGroupSection : NSObject</*NSFastEnumeration,NSCopying,*/TiProxyDelegate> {
//Note that all JS-side values are stored in the proxy. This is just the things that are displayed.

	NSString * header;
	UIColor * headerColor;
	UIFont * headerFont;

	NSString * footer;
	UIColor * footerColor;
	UIFont * footerFont;

	TiDimension rowHeight;
	TiDimension minRowHeight;
	TiDimension maxRowHeight;
	
	BOOL isOptionList;

	TiUIGroupedSectionProxy *proxy;
	TiUITableViewBase * parentView;

	NSMutableArray * data;
}

@property(nonatomic,readwrite,copy)		NSString * header;
@property(nonatomic,readwrite,retain)	UIColor * headerColor;
@property(nonatomic,readwrite,retain)	UIFont * headerFont;

@property(nonatomic,readwrite,copy)		NSString * footer;
@property(nonatomic,readwrite,retain)	UIColor * footerColor;
@property(nonatomic,readwrite,retain)	UIFont * footerFont;

@property(nonatomic,readwrite,assign)	TiDimension rowHeight;
@property(nonatomic,readwrite,assign)	TiDimension minRowHeight;
@property(nonatomic,readwrite,assign)	TiDimension maxRowHeight;

@property(nonatomic,readwrite,assign)	BOOL isOptionList;

@property(nonatomic,readwrite,assign)	TiUIGroupedSectionProxy *proxy;
@property(nonatomic,readwrite,assign)	TiUITableViewBase * parentView;

@property(nonatomic,readwrite,retain)	NSMutableArray * data;
-(int)countOfData;
-(TiUITableViewRowProxy *)objectInDataAtIndex:(int)index;
-(void)insertObject:(TiUITableViewRowProxy *)newRow inDataAtIndex:(int)index;
-(void)removeObjectFromDataAtIndex:(int)index;

#pragma mark Internal stuff
-(void)setParentNeedsRefreshing;


@end
