/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UITABLEVIEW

#import "TiViewProxy.h"
#import "TiDimension.h"

@class TiUITableViewCell;
@class TiUITableView;
@class TiUITableViewSectionProxy;

typedef enum  
{
    TiCellBackgroundViewPositionTop, 
    TiCellBackgroundViewPositionMiddle, 
    TiCellBackgroundViewPositionBottom
} TiCellBackgroundViewPosition;

@interface TiUITableViewRowProxy : TiViewProxy <TiProxyDelegate>
{
@private
	NSString *tableClass;
	TiUITableView *table;
	TiUITableViewSectionProxy *section;
	TiDimension height;
	CGFloat rowHeight;
	
	UIView * rowContainerView;
	BOOL modifyingRow;
	BOOL attaching;
	NSInteger row;
	BOOL rowRendered;
	TiUITableViewCell* callbackCell;
}

#pragma mark Public APIs

@property(nonatomic,readonly)	NSString *tableClass;

#pragma mark Framework

@property(nonatomic,readwrite,assign) TiUITableView *table;
@property(nonatomic,readwrite,assign) TiUITableViewSectionProxy *section;
@property(nonatomic,readwrite,assign) NSInteger row;
@property(nonatomic,readwrite,assign) TiUITableViewCell* callbackCell;

-(void)initializeTableViewCell:(UITableViewCell*)cell;
-(void)renderTableViewCell:(UITableViewCell*)cell;
-(CGFloat)rowHeight:(CGRect)bounds;
-(TiProxy *)touchedViewProxyInCell:(UITableViewCell *)targetCell;
-(id)createEventObject:(id)initialObject;
-(void)triggerAttach;
-(void)updateRow:(NSDictionary*)data withObject:(NSDictionary*)properties;

@end

#endif