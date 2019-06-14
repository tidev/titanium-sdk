/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@class TiBlob; // forward declare
/**
 The main interface for File-based proxies -- this is in the API
 since Filesystem implements it but we want to be able to have other
 modules be able to cast to it transparently (such as database)
 but without causing a compile-time dependency on Filesystem module.
 */
@interface TiFile : TiProxy {
  @protected
  NSString *path;
  BOOL deleteOnExit;
}

/**
 Returns absolute path of the file on file system.
 */
@property (nonatomic, readonly) NSString *path;

/**
 Returns size of the file on file.
 */
@property (nonatomic, readonly) unsigned long long size;

/**
 Creates new instance of TiFile with specified path.
 @param path The absolute path.
 @return A created instance of TiFile.
 */
- (id)initWithPath:(NSString *)path;

/**
 Creates new instance of TiFile for a temporary file with specified path.

 The references file will be deleted on file system when the TiFile object is released.
 @param path The absolute path.
 @return A created instance of TiFile.
 */
- (id)initWithTempFilePath:(NSString *)path;

/**
 Creates a new instance of TiFile for a temporary file created with specified extension in the default temporary folder.
 @param extension The temporary file extension.
 @return A created instance of TiFile.
 */
+ (TiFile *)createTempFile:(NSString *)extension;

/**
 Returns the contents of the file as a TiBlob.
 @return The TiBlob object.
 */
- (TiBlob *)blob;

- (TiBlob *)toBlob:(id)args;

@end
