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

/**
 Blob object class.
 */
@interface TiBlob : TiProxy {
@private
	TiBlobType type;
	NSString *mimetype;
	NSData *data;
	UIImage *image;
	NSString *path;
}

/**
 Returns width if the blob object is an image, _0_ otherwise.
 */
@property(nonatomic,readonly) NSInteger width;

/**
 Returns height if the blob object is an image, _0_ otherwise.
 */
@property(nonatomic,readonly) NSInteger height;


/**
 Return a textual representation of the blob.
 
 The method converts data into a textual representation. Appropriate only for types TiBlobTypeFile and TiBlobTypeData.
 */
@property(nonatomic,readonly) NSString* text;

/**
 Returns the data length.
 */
@property(nonatomic,readonly) NSNumber* length;

/**
 Return the data size.
 
 For file, data returns the size in bytes, for image, returns the width x height.
 */
@property(nonatomic,readonly) NSInteger size;

/**
 Initialize the blob with an image.
 @param image The image
 */
-(id)initWithImage:(UIImage*)image;

/**
 Initialize the blob with data.
 @param data_ The raw data.
 @param mimetype_ The data mime type.
 */
-(id)initWithData:(NSData*)data_ mimetype:(NSString*)mimetype_;

/**
 Initialize the blob with contents of a file.
 @param path The path to the file.
 */
-(id)initWithFile:(NSString*)path;

/**
 Initialises blob with data.
 @param data Th data to set.
 */
-(void)setData:(NSData*)data;

/**
 Initializes blob with image.
 @param image The image to set.
 */
-(void)setImage:(UIImage*)image;

/**
 Sets the blob type.
 @param mime The mime type string.
 @param type The blob type.
 */
-(void)setMimeType:(NSString*)mime type:(TiBlobType)type;

/**
 Returns the blob type.
 @return The blob type.
 */
-(TiBlobType)type;

/**
 Returns the blob mime type.
 @return The mime type string.
 */
-(NSString*)mimeType;

/**
 Returns the blob raw data.
 @return The raw data.
 */
-(NSData*)data;

/**
 Returns the blob image.
 @return The image or _nil_ if the blob data cannot represent an image.
 */
-(UIImage*)image;

/**
 Returns the blob file path.
 @return The file path.
 */
-(NSString*)path;

/**
 Returns the blob native path (Android compatibility).
 @return The blob native path.
 */
-(id)nativePath;

/**
 Tells the blob to write its data to a file.
 @param path The file path.
 @param error The error result if failed.
 @return _YES_ if the write operation succeeded, _NO_ otherwise.
 */
-(BOOL)writeTo:(NSString*)path error:(NSError**)error;

#pragma mark Image specific blob manipulations


@end
