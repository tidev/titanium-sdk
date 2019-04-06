/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiFile.h"

@class TiFilesystemFileStreamProxy;

@interface TiFilesystemFileProxy : TiFile {
}

- (id)initWithFile:(NSString *)path;

- (TiFilesystemFileStreamProxy *)open:(id)args;

+ (TiFilesystemFileProxy *)makeTemp:(BOOL)isDirectory;

@property (nonatomic, readonly) NSString *name;
@property (nonatomic, readonly) NSString *nativePath;
@property (nonatomic, readonly) NSNumber *readonly;
@property (nonatomic, readonly) NSNumber *writable;
@property (nonatomic, readonly) NSNumber *symbolicLink;
@property (nonatomic, readonly) NSNumber *executable;
@property (nonatomic, readonly) NSNumber *hidden;

@end
