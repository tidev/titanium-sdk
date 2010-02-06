/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDimension.h"
#import "TiUITableViewCellProxy.h"
#import "TiProxy.h"

@interface TiUITableViewGroupSection : NSObject<NSFastEnumeration,NSCopying> {

	NSString * name;
	NSString * header;
	NSString * footer;
	NSMutableArray * rowArray;
	TiDimension rowHeight;
	TiDimension minRowHeight;
	TiDimension maxRowHeight;
	
	BOOL isOptionList;
	BOOL nullHeader;
	
	UIColor * headerColor;
	UIFont * headerFont;
	UIColor * footerColor;
	UIFont * footerFont;
	
	TiUITableViewCellProxy * templateCell;
	TiProxy *delegate;
	
	NSInteger sectionNumber;
}

@property(nonatomic,readwrite,copy)		NSString * header;
@property(nonatomic,readwrite,retain)	UIColor * headerColor;
@property(nonatomic,readwrite,retain)	UIColor * footerColor;
@property(nonatomic,readwrite,retain)	UIFont * headerFont;
@property(nonatomic,readwrite,retain)	UIFont * footerFont;
@property(nonatomic,readwrite,copy)		NSString * footer;
@property(nonatomic,readwrite,copy)		NSString * name;
@property(nonatomic,readonly,assign)	NSUInteger rowCount;
@property(nonatomic,readwrite,assign)	BOOL isOptionList;
@property(nonatomic,readwrite,assign)	BOOL nullHeader;

@property(nonatomic,readwrite,assign)	TiDimension rowHeight;
@property(nonatomic,readwrite,assign)	TiDimension minRowHeight;
@property(nonatomic,readwrite,assign)	TiDimension maxRowHeight;

@property(nonatomic,readwrite,retain)	NSMutableArray * rowArray;
@property(nonatomic,readwrite,retain)	TiUITableViewCellProxy * templateCell;

@property(nonatomic,readwrite,assign)	TiProxy *delegate;
@property(nonatomic,readwrite)			NSInteger sectionNumber;

- (id) initWithHeader: (NSString *) headerString footer: (NSString *) footerString withProperties:(NSDictionary*)properties;
- (void) addRow: (TiUITableViewCellProxy *) newRow;
- (TiUITableViewCellProxy *) rowForIndex: (NSUInteger) rowIndex;
- (void) insertRow:(TiUITableViewCellProxy*)newRow atIndex:(NSInteger)rowIndex;
- (void) removeObjectFromDataAtIndex:(int)index;
- (BOOL) accceptsHeader: (id) newHeader footer: (id) newFooter;
- (void) forceHeader: (NSString *) headerString footer: (NSString *)footerString;
- (void) addRowsFromArray: (NSArray *) otherArray;

#pragma mark public delegate 

- (void)insertRowAfter:(NSArray *)args;
- (void)insertRowBefore:(NSArray *)args;
- (void)deleteRow:(NSArray *)args;
- (void)updateRow:(NSArray *)args;
- (void)appendRow:(NSArray *)args;

@end
