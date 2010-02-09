/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"
#import "TiUITableViewRowProxy.h"
#import "TiUITableViewGroupSection.h"

#define CHECK_ROW_HEIGHT(rowHeightDimension,tableCell,tableViewObject)	\
if(TiDimensionIsPixels(rowHeightDimension)) \
{ \
return rowHeightDimension.value; \
} \
if(TiDimensionIsAuto(rowHeightDimension)) \
{ \
return [tableCell computedAutoHeightForTable:tableViewObject]; \
}\

typedef enum 
{
	TiUITableViewDispatchInsertRowAfter,
	TiUITableViewDispatchInsertRowBefore,
	TiUITableViewDispatchDeleteRow,
	TiUITableViewDispatchUpdateRow,
	TiUITableViewDispatchAppendRow,
	TiUITableViewDispatchScrollToIndex,
	TiUITableViewDispatchSetDataWithAnimation,
	TiUITableViewDispatchAddSection,
	TiUITableViewDispatchInsertSectionBefore,
	TiUITableViewDispatchInsertSectionAfter,
	TiUITableViewDispatchDeleteSection,
	TiUITableViewDispatchUpdateSection,
	TiUITableViewDispatchSetSectionWithAnimation,
	TiUITableViewDispatchSetEditing,
	TiUITableViewDispatchSetMoving
	
} TiUITableViewDispatchType ;

@interface TiUITableViewBase : TiUIView <UITableViewDelegate,UITableViewDataSource> 
{
@private
	BOOL needsReload;
	BOOL moving;
	BOOL editing;
	BOOL editable; //swipe-to-delete
	
@protected
	UITableView* tableview;
	NSMutableArray *sectionArray;
	
	TiDimension rowHeight;
	TiDimension minRowHeight;
	TiDimension maxRowHeight;
	UIColor *borderColor;	
}

@property(nonatomic,readonly) BOOL editing;
@property(nonatomic,readonly) BOOL moving;

#pragma mark Framework
-(void)dispatchAction:(NSArray*)args withType:(TiUITableViewDispatchType)type;
-(void)replaceData:(id)args reload:(BOOL)reload;
- (TiUITableViewGroupSection *) sectionForIndex: (NSInteger) section;
- (TiUITableViewRowProxy *) cellForIndexPath: (NSIndexPath *) path;
- (NSInteger) sectionIndexForIndex:(NSInteger)theindex;
- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath fromPath:(NSIndexPath*)fromPath wasAccessory: (BOOL) accessoryTapped search: (BOOL) viaSearch name:(NSString*)name;

@end
