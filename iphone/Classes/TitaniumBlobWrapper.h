/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

//Todo: this should be in a 


@interface TitaniumBlobWrapper : NSObject {
	NSData * dataBlob;
	UIImage * imageBlob;
	BOOL	isLoading;
	NSString * token;
	NSString * filePath;
	NSString * mimeType;
	NSURL * url;
}

//@property(readwrite,nonatomic,retain)	NSString * stringBlob;
//@property(readwrite,nonatomic,assign)	NSStringEncoding stringEncoding;


@property(readwrite,nonatomic,retain)	NSData * dataBlob;
@property(readwrite,nonatomic,assign)	BOOL isLoading;
@property(readwrite,nonatomic,retain)	UIImage * imageBlob;
@property(readwrite,nonatomic,retain)	NSString * token;
@property(readwrite,nonatomic,retain)	NSString * filePath;
@property(readwrite,nonatomic,retain)	NSString * mimeType;
@property(readwrite,nonatomic,retain)	NSURL * url;

- (NSString *) stringValue;
- (NSString *) virtualFileName;
- (NSString *) virtualUrl;

- (void) compress;

@end
