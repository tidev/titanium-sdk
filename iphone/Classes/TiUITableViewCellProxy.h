/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiViewProxy.h"


@class TiUITableViewCell;
@class WebFont;

@interface TiUITableViewCellProxy : TiProxy {

#pragma mark BUG BARRIER
	WebFont * fontDesc;
	
	NSMutableDictionary * jsonValues;
	NSMutableDictionary * imagesCache;
	
	NSMutableSet * imageKeys;
	NSMutableArray * layoutArray;
	
//	TiViewProxy * inputProxy;
	
	TiUITableViewCellProxy * templateCell;
	
	TiDimension  rowHeight;
	TiDimension  minRowHeight;
	TiDimension  maxRowHeight;
	BOOL isAutoHeight;

	BOOL isButton;
	
}

-(TiUITableViewCell *)cellForTableView:(UITableView *)tableView;


#pragma mark BUG BARRIER


@property(nonatomic,readwrite,copy)	NSMutableDictionary * jsonValues;

@property(nonatomic,readonly)	NSString * title;
@property(nonatomic,readonly)	NSString * html;
@property(nonatomic,readonly)	NSString * name;
@property(nonatomic,readonly)	NSString * value;

@property(nonatomic,readonly,copy)	UIImage * image;
//@property(nonatomic,readwrite,retain)	NativeControlProxy * inputProxy;
@property(nonatomic,readwrite,retain)	TiUITableViewCellProxy * templateCell;

@property(nonatomic,readwrite,assign)	UITableViewCellAccessoryType accessoryType;
@property(nonatomic,readwrite,assign)	BOOL isButton;
@property(nonatomic,readwrite,assign)	TiDimension  rowHeight;
@property(nonatomic,readwrite,assign)	TiDimension  minRowHeight;
@property(nonatomic,readwrite,assign)	TiDimension  maxRowHeight;
@property(nonatomic,readwrite,retain)	WebFont* fontDesc;

@property(nonatomic,readonly)	NSMutableSet * imageKeys;
@property(nonatomic,readonly)	NSMutableArray * layoutArray;

- (void) useProperties: (NSDictionary *) propDict withProxy: (TiProxy *) proxy;

- (UIFont *) font;


- (UIColor *) colorForKey:(NSString *) key;
- (NSString *) stringForKey: (NSString *) key;
- (UIImage *) imageForKey: (NSString *) key;
- (UIImage *) stretchableImageForKey: (NSString *) key;
//- (TitaniumBlobWrapper *) blobWrapperForKey: (NSString *) key;

- (BOOL) stringForKey:(NSString *)key containsString: (NSString *)matchString;

+ cellDataWithProperties:(NSDictionary *)properties proxy:(TiProxy *)proxy font:(WebFont *)defaultFont template:(TiUITableViewCellProxy *)templateCell;
- (float) computedAutoHeightForTable:(UITableView *)tableView;


@end
