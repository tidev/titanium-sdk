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

@interface TiUITableViewTransaction : NSObject
{
	int	sectionIndex;	//On TableView, this is ignored.
	int rowIndex;

	id value;
//TableView:
//This can be a single row if doing an insert or update row
//This can be an array if doing a 'setData'
//This can be an NSString if a 'changeHeader'

//GroupedView:
//This can be a single row if doing an insert or update row
//This can be a groupSection if doing an insert or update section
//This can be an array if a setData of a section is done
//This can be an array if a setSections is done
	
	UITableViewRowAnimation animation;
}
@property(nonatomic,readwrite,assign)	int	sectionIndex;
@property(nonatomic,readwrite,assign)	int rowIndex;
@property(nonatomic,readwrite,retain)	id value;
@property(nonatomic,readwrite,assign)	UITableViewRowAnimation animation;

-(void)setAnimationToIndex:(int)index ofArguments:(NSArray *)args;

@end


@class TiUITableViewRowProxy, TiUITableViewGroupSection;
@interface TiUITableViewBase : TiUIView <UITableViewDelegate,UITableViewDataSource> 
{
@private
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
- (TiUITableViewGroupSection *) sectionForIndex: (NSInteger) section;
- (TiUITableViewRowProxy *) cellForIndexPath: (NSIndexPath *) path;
- (NSInteger) sectionIndexForIndex:(NSInteger)theindex;
- (void)triggerActionForIndexPath: (NSIndexPath *)indexPath fromPath:(NSIndexPath*)fromPath wasAccessory: (BOOL) accessoryTapped search: (BOOL) viaSearch name:(NSString*)name;

@end
