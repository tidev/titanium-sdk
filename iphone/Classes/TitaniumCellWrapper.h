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
	NSString * title;
	TitaniumFontDescription fontDesc;
	NSString * html;
	NSString * name;
	NSString * value;
	NSURL * imageURL;
	TitaniumBlobWrapper * imageWrapper;
	UITableViewCellAccessoryType accessoryType;
	NativeControlProxy * inputProxy;
	
	BOOL isButton;
	
}
@property(nonatomic,readwrite,copy)	NSString * title;
@property(nonatomic,readwrite,copy)	NSString * html;
@property(nonatomic,readwrite,copy)	NSString * name;
@property(nonatomic,readwrite,copy)	NSString * value;
@property(nonatomic,readwrite,copy)	NSURL * imageURL;
@property(nonatomic,readonly,copy)	UIImage * image;
@property(nonatomic,readwrite,retain)	TitaniumBlobWrapper * imageWrapper;
@property(nonatomic,readwrite,assign)	UITableViewCellAccessoryType accessoryType;
@property(nonatomic,readwrite,retain)	NativeControlProxy * inputProxy;
@property(nonatomic,readwrite,assign)	BOOL isButton;


- (void) useProperties: (NSDictionary *) propDict withUrl: (NSURL *) baseUrl;
- (NSString *) stringValue;
- (UIFont *) font;

@end
