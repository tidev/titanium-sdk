/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiFilesystemBlobProxy.h"

#ifdef USE_TI_FILESYSTEM
#import <TitaniumKit/TiBase.h>

#import <TitaniumKit/Mimetypes.h>
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiFilesystemBlobProxy

- (id)initWithURL:(NSURL *)url_ data:(NSData *)data_
{
  if (self = [super initWithPath:[url_ path]]) {
    url = [url_ retain];
    data = [data_ retain];
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(url);
  RELEASE_TO_NIL(data);
  [super dealloc];
}

- (NSString *)apiName
{
  //Should we return Ti.FileSystem.Blob?
  return @"Ti.Filesystem.File";
}

- (id)nativePath
{
  return [[NSURL fileURLWithPath:path] absoluteString];
}

- (id)exists:(id)args
{
  return NUMBOOL(YES);
}

- (NSNumber *)isFile:(id)unused
{
  return NUMBOOL(YES);
}

- (NSNumber *)isDirectory:(id)unused
{
  return NUMBOOL(NO);
}

- (id)readonly
{
  return NUMBOOL(YES);
}

- (id)symbolicLink
{
  return NUMBOOL(NO);
}

- (id)writable
{
  return NUMBOOL(NO);
}

#define FILENOOP(name)  \
  -(id)name             \
  {                     \
    return NUMBOOL(NO); \
  }

FILENOOP(executable);
FILENOOP(hidden);
FILENOOP(setReadonly
         : (id)x);
FILENOOP(setExecutable
         : (id)x);
FILENOOP(setHidden
         : (id)x);

- (id)createTimestamp:(id)args
{
  return NUMBOOL(NO);
}

- (id)modificationTimestamp:(id)args
{
  return NUMBOOL(NO);
}

- (id)getDirectoryListing:(id)args
{
  return [NSArray array];
}

- (id)spaceAvailable:(id)args
{
  return NUMBOOL(NO);
}

- (id)createDirectory:(id)args
{
  return NUMBOOL(NO);
}

- (id)createFile:(id)args
{
  return NUMBOOL(NO);
}

- (id)deleteDirectory:(id)args
{
  return NUMBOOL(NO);
}

- (id)deleteFile:(id)args
{
  return NUMBOOL(NO);
}

- (id)move:(id)args
{
  return NUMBOOL(NO);
}

- (id)rename:(id)args
{
  return NUMBOOL(NO);
}

- (TiBlob *)read:(id)args
{
  NSString *mimetype = [Mimetypes mimeTypeForExtension:[[url path] lastPathComponent]];
  return [[[TiBlob alloc] initWithData:data mimetype:mimetype] autorelease];
}

- (id)append:(id)args
{
  return NUMBOOL(NO);
}

- (id)write:(id)args
{
  return NUMBOOL(NO);
}

- (id)extension:(id)args
{
  return [path pathExtension];
}

- (id)getParent:(id)args
{
  return nil;
}

- (id)name
{
  return [path lastPathComponent];
}

- (id)resolve:(id)args
{
  return [self nativePath];
}

- (id)description
{
  return path;
}

@end

#endif
