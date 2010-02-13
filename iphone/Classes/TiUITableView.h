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

@interface TiUITableView : TiUIView<UITableViewDelegate,UITableViewDataSource> {
@private
	UITableView *tableview;
	NSMutableArray *sections;
}

#pragma mark Framework
-(TiUITableViewRowProxy*)rowForIndex:(NSInteger)index section:(NSInteger*)section;
-(void)dispatchAction:(TiUITableViewAction*)action;
-(void)insertRow:(TiUITableViewRowProxy*)row before:(TiUITableViewRowProxy*)before animation:(NSDictionary*)animation;
-(void)insertRow:(TiUITableViewRowProxy*)row after:(TiUITableViewRowProxy*)after animation:(NSDictionary*)animation;
-(void)deleteRow:(TiUITableViewRowProxy*)row animation:(NSDictionary*)animation;
-(void)appendRow:(TiUITableViewRowProxy*)row animation:(NSDictionary*)animation;

@end
