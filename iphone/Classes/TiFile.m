/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiFile.h"
#import "TiBase.h"
#import "TiBlob.h"

@implementation TiFile

- (void)dealloc
{
  if (_deleteOnExit) {
    [[NSFileManager defaultManager] removeItemAtPath:_path error:nil];
  }
}

- (id)initWithPath:(NSString *)path
{
  if (self = [super init]) {
    _path = path;
  }
  return self;
}

- (id)initWithTempFilePath:(NSString *)path
{
  if (self = [self initWithPath:path]) {
    _deleteOnExit = YES;
  }
  return self;
}

- (NSString *)path
{
  return _path;
}

- (unsigned long long)size
{
  NSFileManager *fm = [NSFileManager defaultManager];
  NSError *error = nil;
  NSDictionary *resultDict = [fm attributesOfItemAtPath:_path error:&error];
  id resultType = [resultDict objectForKey:NSFileType];
  if ([resultType isEqualToString:NSFileTypeSymbolicLink]) {
    // TODO: We should be translating all symlinks into their actual paths always
    NSString *realPath = [fm destinationOfSymbolicLinkAtPath:_path error:nil];
    if (realPath != nil) {
      resultDict = [fm attributesOfItemAtPath:realPath error:&error];
    }
  }
  if (error != nil) {
    return 0;
  }
  id result = [resultDict objectForKey:NSFileSize];
  return [result unsignedLongLongValue];
}

- (id)blob
{
  return [[TiBlob alloc] _initWithPageContext:[self pageContext] andFile:_path];
}

- (id)toBlob:(id)args
{
  return [self blob];
}

+ (TiFile *)createTempFile:(NSString *)extension
{
  NSString *tempDir = NSTemporaryDirectory();
  NSError *error = nil;

  NSFileManager *fm = [NSFileManager defaultManager];
  if (![fm fileExistsAtPath:tempDir]) {
    [fm createDirectoryAtPath:tempDir withIntermediateDirectories:YES attributes:nil error:&error];
    if (error != nil) {
      //TODO: ?
      return nil;
    }
  }

  int timestamp = (int)(time(NULL) & 0xFFFFL);
  NSString *resultPath;
  do {
    resultPath = [tempDir stringByAppendingPathComponent:[NSString stringWithFormat:@"%X.%@", timestamp, extension]];
    timestamp++;
  } while ([fm fileExistsAtPath:resultPath]);

  // create empty file
  [[NSData data] writeToFile:resultPath options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&error];

  if (error != nil) {
    //TODO: ?
    return nil;
  }

  return [[TiFile alloc] initWithTempFilePath:resultPath];
}

@end
