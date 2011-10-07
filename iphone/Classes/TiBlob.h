/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

typedef enum {
	TiBlobTypeImage = 0,
	TiBlobTypeFile = 1,
	TiBlobTypeData = 2
} TiBlobType;


@interface TiBlob : TiProxy {
@private
	TiBlobType type;
	NSString *mimetype;
	NSData *data;
	UIImage *image;
	NSString *path;
}

// these are only appropriate for image type and return 0 otherwise
@property(nonatomic,readonly) NSInteger width;
@property(nonatomic,readonly) NSInteger height;

// return a textual representation of the blob
@property(nonatomic,readonly) NSString* text;

// Returns the data length
@property(nonatomic,readonly) NSNumber* length;

// for file, data returns the size in bytes
// for image, returns the width x height
@property(nonatomic,readonly) NSInteger size;

-(id)initWithImage:(UIImage*)image;
-(id)initWithData:(NSData*)data_ mimetype:(NSString*)mimetype_;
-(id)initWithFile:(NSString*)path;

-(void)setData:(NSData*)data;
-(void)setImage:(UIImage*)image;
-(void)setMimeType:(NSString*)mime type:(TiBlobType)type;

-(TiBlobType)type;
-(NSString*)mimeType;

-(NSData*)data;
-(UIImage*)image;
-(NSString*)path;
-(NSString*)nativePath; // Android compatibility

-(BOOL)writeTo:(NSString*)path protect:(int)protect error:(NSError**)error;

#pragma mark Image specific blob manipulations


@end
