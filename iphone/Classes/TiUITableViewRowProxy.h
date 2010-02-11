/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"

@class TiUITableViewRowProxy;
@protocol TiUITableViewRowParent
-(NSDictionary *)locationOfRow:(TiUITableViewRowProxy *)row;
-(void)row:(TiUITableViewRowProxy *)row changedValue:(id)newValue oldValue:(id)oldValue forKey:(NSString *)key;
@end



@class WebFont, TiUITableViewCell;
@interface TiUITableViewRowProxy : TiProxy<LayoutAutosizing> {

@private
	NSMutableArray * children; //Like TiViewProxy.
	TiProxy<TiUITableViewRowParent> * parent; //This is what added the row.
		//It can be either groupedSection proxy or a tableView proxy.
		//This is not retained to avoid retain loops.
	
	TiDimension  rowHeight;
	TiDimension  minRowHeight;
	TiDimension  maxRowHeight;
}

#pragma mark Internal stuff

@property(nonatomic,readwrite,retain)	NSMutableArray * children;
@property(nonatomic,readwrite,assign)	TiProxy<TiUITableViewRowParent> * parent;

-(TiUITableViewCell *)cellForTableView:(UITableView *)tableView;

-(CGFloat)rowHeightForWidth:(CGFloat)rowWidth;
//This is called either internally or if the rowHeight of a table/section is 'auto'.
-(CGFloat)autoRowHeightForWidth:(CGFloat) rowWidth;

#pragma mark JS-exposed properties

//Accessors use the default stuff. Setters grab the dimension version just for caching.

//@property(nonatomic,readwrite,copy)	id	rowHeight;
-(void)setRowHeight:(id)newValue;
//@property(nonatomic,readwrite,copy)	id	minRowHeight;
-(void)setMinRowHeight:(id)newValue;
//@property(nonatomic,readwrite,copy)	id	maxRowHeight;
-(void)setMaxRowHeight:(id)newValue;

//Everything else is done by TiProxy.

-(void)add:(id)args;
-(void)remove:(id)args;


@end

#define ENSURE_TABLE_VIEW_ROW(x)	\
if(![x isKindOfClass:[TiUITableViewRowProxy class]])	\
{	\
if(IS_NULL_OR_NIL(x))	\
{	\
x=nil;	\
}	\
else	\
{	\
ENSURE_TYPE(x,NSDictionary);	\
NSDictionary * oldProperties = (NSDictionary *)x;	\
x = [[[TiUITableViewRowProxy alloc] _initWithPageContext:[self pageContext]] autorelease];	\
[x _initWithProperties:oldProperties];	\
}	\
}

#define ENSURE_NIL_PARENT(x)	ENSURE_VALUE_CONSISTENCY([x parent],nil)
