/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcProxy.h"
#import <JavaScriptCore/JavaScriptCore.h>

//@class TiFile; // forward declare
@class TiBlob;
@class UIImage;

@protocol BlobExports <JSExport>

// Properties (and accessors)
// FIXME: Change to TiFile* once it's been moved to a new obj-c proxy
/**
 Returns the blob file.
 @return The file.
 */
READONLY_PROPERTY(JSValue *, file, File);
/**
 Returns height if the blob object is an image, _0_ otherwise.
 */
READONLY_PROPERTY(NSUInteger, height, Height);
/**
 Returns the data length.
 */
READONLY_PROPERTY(NSUInteger, length, Length);
/**
 Returns the blob mime type.
 @return The mime type string.
 */
READONLY_PROPERTY(NSString *, mimeType, MimeType);
/**
 Returns the blob native path (Android compatibility).
 @return The blob native path.
 */
READONLY_PROPERTY(NSString *, nativePath, NativePath);
/**
 Return the data size.
 
 For file, data returns the size in bytes, for image, returns the width x height.
 */
READONLY_PROPERTY(NSUInteger, size, Size);
/**
 Return a textual representation of the blob.
 
 The method converts data into a textual representation. Appropriate only for types TiBlobTypeFile and TiBlobTypeData.
 */
READONLY_PROPERTY(NSString *, text, Text);
/**
 Returns width if the blob object is an image, _0_ otherwise.
 */
READONLY_PROPERTY(NSUInteger, width, Width);

// Methods
- (void)append:(TiBlob *)blob;
- (TiBlob *)imageAsCompressed:(float)compressionQuality;
- (TiBlob *)imageAsCropped:(NSDictionary *)options;
JSExportAs(imageAsResized,
           -(TiBlob *)imageAsResized
           : (NSUInteger)width withHeight
           : (NSUInteger)height);
JSExportAs(imageAsThumbnail,
           -(TiBlob *)imageAsThumbnail
           : (NSUInteger)size withBorder
           : (NSNumber *)optionalBorderSize withRadius
           : (NSNumber *)optionalCornerRadius);
- (TiBlob *)imageWithAlpha;
JSExportAs(imageWithRoundedCorner,
           -(TiBlob *)imageWithRoundedCorner
           : (NSUInteger)cornerSize withBorder
           : (NSNumber *)optionalBorderSize);
- (TiBlob *)imageWithTransparentBorder:(NSUInteger)size;
- (NSString *)toString; // FIXME This doesn't seem to override the JS impl. I think we need to find a way to modify the property post-init to override it!

@end

typedef enum {
  TiBlobTypeImage = 0,
  TiBlobTypeFile = 1,
  TiBlobTypeData = 2
} TiBlobType;

/**
 Blob object class.
 */
@interface TiBlob : ObjcProxy <BlobExports> {
  @private
  TiBlobType type;
  NSString *mimetype;
  NSData *data;
  UIImage *image;
  NSString *path;
  BOOL imageLoadAttempted;
}

/**
 Initialize the blob with an image.
 @param image The image
 */
- (id)initWithImage:(UIImage *)image;

/**
 Initialize the blob with data.
 @param data_ The raw data.
 @param mimetype_ The data mime type.
 */
- (id)initWithData:(NSData *)data_ mimetype:(NSString *)mimetype_;

/**
 Initialize the blob with contents of a file.
 @param path The path to the file.
 */
- (id)initWithFile:(NSString *)path;

/**
 Initialises blob with data.
 @param data Th data to set.
 */
- (void)setData:(NSData *)data;

/**
 Initializes blob with image.
 @param image The image to set.
 */
- (void)setImage:(UIImage *)image;

/**
 Sets the blob type.
 @param mime The mime type string.
 @param type The blob type.
 */
- (void)setMimeType:(NSString *)mime type:(TiBlobType)type;

/**
 Returns the blob type.
 @return The blob type.
 */
- (TiBlobType)type;

/**
 Returns the blob raw data.
 @return The raw data.
 */
- (NSData *)data;

/**
 Returns the blob image.
 @return The image or _nil_ if the blob data cannot represent an image.
 */
- (UIImage *)image;

/**
 Returns the blob file path.
 @return The file path.
 */
- (NSString *)path;

/**
 Tells the blob to write its data to a file.
 @param path The file path.
 @param error The error result if failed.
 @return _YES_ if the write operation succeeded, _NO_ otherwise.
 */
- (BOOL)writeTo:(NSString *)path error:(NSError **)error;

#pragma mark Image specific blob manipulations

@end
