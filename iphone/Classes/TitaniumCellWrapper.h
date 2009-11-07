/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <UIKit/UIKit.h>
#import "WebFont.h"

@class TitaniumBlobWrapper, NativeControlProxy;

@interface TitaniumCellWrapper : NSObject
{
	TitaniumFontDescription fontDesc;

	NSMutableDictionary * jsonValues;
	NSMutableDictionary * imagesCache;

	NSMutableSet * imageKeys;
	NSMutableArray * layoutArray;

	NativeControlProxy * inputProxy;

	TitaniumCellWrapper * templateCell;

	float rowHeight;
	BOOL isButton;
	
}
@property(nonatomic,readwrite,copy)	NSMutableDictionary * jsonValues;

@property(nonatomic,readonly)	NSString * title;
@property(nonatomic,readonly)	NSString * html;
@property(nonatomic,readonly)	NSString * name;
@property(nonatomic,readonly)	NSString * value;

@property(nonatomic,readonly,copy)	UIImage * image;
@property(nonatomic,readwrite,retain)	NativeControlProxy * inputProxy;
@property(nonatomic,readwrite,retain)	TitaniumCellWrapper * templateCell;

@property(nonatomic,readwrite,assign)	UITableViewCellAccessoryType accessoryType;
@property(nonatomic,readwrite,assign)	BOOL isButton;
@property(nonatomic,readwrite,assign)	float rowHeight;
@property(nonatomic,readwrite,assign)	TitaniumFontDescription fontDesc;

@property(nonatomic,readonly)	NSMutableSet * imageKeys;
@property(nonatomic,readonly)	NSMutableArray * layoutArray;

- (void) useProperties: (NSDictionary *) propDict withUrl: (NSURL *) baseUrl;
- (NSString *) stringValue;
- (UIFont *) font;

@end
