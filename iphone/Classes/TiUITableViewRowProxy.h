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
    TiCellBackgroundViewPositionBottom,
	TiCellBackgroundViewPositionSingleLine
} TiCellBackgroundViewPosition;

@interface TiUITableViewRowProxy : TiViewProxy <TiProxyDelegate>
{
@private
	NSString *tableClass;
	TiUITableView *table;
	TiUITableViewSectionProxy *section;
	TiDimension height;
	TiDimension leftCap;
	TiDimension topCap;
	BOOL configuredChildren;
	int dirtyRowFlags;
	BOOL subviewIsAnimating;
	UIView * rowContainerView;
	BOOL modifyingRow;
	BOOL attaching;
	NSInteger row;
	TiUITableViewCell* callbackCell;
}

#pragma mark Public APIs

@property(nonatomic,readonly)	NSString *tableClass;

#pragma mark Framework

@property(nonatomic,readwrite,assign) TiUITableView *table;
@property(nonatomic,readwrite,assign) TiUITableViewSectionProxy *section;
@property(nonatomic,readwrite,assign) NSInteger row;
@property(nonatomic,readwrite,assign) TiUITableViewCell* callbackCell;

+(void)clearTableRowCell:(UITableViewCell*)cell;
-(void)initializeTableViewCell:(UITableViewCell*)cell;
-(CGFloat)sizeWidthForDecorations:(CGFloat)oldWidth forceResizing:(BOOL)force;
-(CGFloat)rowHeight:(CGFloat)width;
-(TiProxy *)touchedViewProxyInCell:(UITableViewCell *)targetCell atPoint:(CGPoint*)point;
-(id)createEventObject:(id)initialObject;
-(void)triggerAttach;
-(void)updateRow:(NSDictionary*)data withObject:(NSDictionary*)properties;

@end

#endif