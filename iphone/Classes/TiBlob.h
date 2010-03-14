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

-(id)initWithImage:(UIImage*)image;
-(id)initWithData:(NSData*)data_ mimetype:(NSString*)mimetype_;
-(id)initWithFile:(NSString*)path;

-(void)setImage:(UIImage*)image;
-(void)setMimeType:(NSString*)mime type:(TiBlobType)type;

-(TiBlobType)type;
-(NSString*)mimeType;

-(NSData*)data;
-(UIImage*)image;
-(NSString*)path;

-(BOOL)writeTo:(NSString*)path error:(NSError**)error;


@end
