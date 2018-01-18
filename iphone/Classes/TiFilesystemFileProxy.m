/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if defined(USE_TI_FILESYSTEM) || defined(USE_TI_DATABASE) || defined(USE_TI_MEDIA)

#import "TiFilesystemFileProxy.h"
#import "TiBase.h"
#import "TiBlob.h"
#import "TiFilesystemFileStreamProxy.h"
#import "TiUtils.h"
#include <sys/xattr.h>

#define FILE_TOSTR(x) \
  ([x isKindOfClass:[TiFilesystemFileProxy class]]) ? [(TiFilesystemFileProxy *)x nativePath] : [TiUtils stringValue:x]

@implementation TiFilesystemFileProxy

- (id)initWithFile:(NSString *)path
{
  if (self = [super init]) {
    path = path;
  }
  return self;
}

- (NSString *)apiName
{
  return @"Ti.Filesystem.File";
}

- (NSString *)nativePath
{
  return [[NSURL fileURLWithPath:_path] absoluteString];
}

- (NSNumber *)exists:(id)args
{
  return NUMBOOL([[NSFileManager defaultManager] fileExistsAtPath:_path]);
}

- (NSNumber *)readonly
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:_path error:&error];
  if (error != nil) {
    [self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];
  }
  return [resultDict objectForKey:NSFileImmutable];
}

- (NSNumber *)createTimestamp
{
  DEPRECATED_REPLACED(@"Filesystem.File.createTimestamp", @"7.1.0", @"Filesystem.File.createTimestamp()");
  return [self createTimestamp:nil];
}

- (NSNumber *)modificationTimestamp
{
  DEPRECATED_REPLACED(@"Filesystem.File.modificationTimestamp", @"7.1.0", @"Filesystem.File.modificationTimestamp()");
  return [self modificationTimestamp:nil];
}

- (NSNumber *)createTimestamp:(id)unused
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:_path error:&error];
  if (error != nil) {
    [self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];
  }
  // Have to do this one up special because of 3.x bug where NSFileCreationDate is sometimes undefined
  NSDate *result = [resultDict objectForKey:NSFileCreationDate];
  if (result == nil) {
    result = [resultDict objectForKey:NSFileModificationDate];
  }

  return @([result timeIntervalSince1970]);
}

- (NSNumber *)modificationTimestamp:(id)unused
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:_path error:&error];
  if (error != nil) {
    [self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];
  }
  NSDate *result = [resultDict objectForKey:NSFileModificationDate];

  return @([result timeIntervalSince1970]);
}

- (NSNumber *)symbolicLink
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:_path error:&error];
  if (error != nil) {
    [self throwException:TiExceptionOSError subreason:[error localizedDescription] location:CODELOCATION];
  }
  NSString *fileType = [resultDict objectForKey:NSFileType];

  return NUMBOOL([fileType isEqualToString:NSFileTypeSymbolicLink]);
}

- (NSNumber *)writable
{
  return NUMBOOL(![[self readonly] boolValue]);
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

- (NSArray *)getDirectoryListing:(id)args
{
  NSError *error = nil;
  NSArray *resultArray = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:_path error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Could not receive directory listing: %@", error.localizedDescription);
  }
  return resultArray;
}

- (NSNumber *)spaceAvailable:(id)args
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfFileSystemForPath:_path error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Could not receive available space: %@", error.localizedDescription);
    return @(0.0);
  }
  return [resultDict objectForKey:NSFileSystemFreeSize];
}

- (NSString *)getProtectionKey:(id)args
{
  NSError *error = nil;
  NSDictionary *resultDict = [[NSFileManager defaultManager] attributesOfItemAtPath:_path error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Error getting protection key: %@", [TiUtils messageFromError:error]);
    return nil;
  }
  return [resultDict objectForKey:NSFileProtectionKey];
}

- (NSNumber *)setProtectionKey:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  NSError *error = nil;
  [[NSFileManager defaultManager] setAttributes:[NSDictionary dictionaryWithObjectsAndKeys:args, NSFileProtectionKey, nil] ofItemAtPath:_path error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Error setting protection key: %@", [TiUtils messageFromError:error]);
    return NUMBOOL(NO);
  }
  return NUMBOOL(YES);
}

- (NSNumber *)createDirectory:(id)args
{
  BOOL result = NO;
  NSError *error = nil;
  if (![[NSFileManager defaultManager] fileExistsAtPath:_path]) {
    BOOL recurse = args != nil && [args count] > 0 ? [TiUtils boolValue:[args objectAtIndex:0]] : NO;
    result = [[NSFileManager defaultManager] createDirectoryAtPath:_path withIntermediateDirectories:recurse attributes:nil error:&error];
  }
  if (error != nil) {
    NSLog(@"[ERROR] Cannot create directory: %@", error.localizedDescription);
    return @NO;
  }
  return NUMBOOL(result);
}

- (NSNumber *)isFile:(id)unused
{
  BOOL isDirectory;
  return @([[NSFileManager defaultManager] fileExistsAtPath:_path isDirectory:&isDirectory] && !isDirectory);
}

- (NSNumber *)isDirectory:(id)unused
{
  BOOL isDirectory;
  return @([[NSFileManager defaultManager] fileExistsAtPath:_path isDirectory:&isDirectory] && isDirectory);
}

- (TiFilesystemFileStreamProxy *)open:(id)args
{
  NSNumber *mode = nil;
  ENSURE_ARG_AT_INDEX(mode, args, 0, NSNumber);
  ENSURE_VALUE_RANGE([mode intValue], TI_READ, TI_APPEND);

  NSArray *payload = [NSArray arrayWithObjects:[self path], mode, nil];

  return [[TiFilesystemFileStreamProxy alloc] _initWithPageContext:[self executionContext] args:payload];
}

- (NSNumber *)createFile:(id)args
{
  BOOL result = NO;
  if (![[NSFileManager defaultManager] fileExistsAtPath:_path]) {
    BOOL shouldCreate = args != nil && [args count] > 0 ? [TiUtils boolValue:[args objectAtIndex:0]] : NO;
    if (shouldCreate) {
      NSError *error = nil;
      [[NSFileManager defaultManager] createDirectoryAtPath:[_path stringByDeletingLastPathComponent] withIntermediateDirectories:YES attributes:nil error:&error];
      if (error != nil) {
        NSLog(@"[ERROR] Could not create file: %@", error.localizedDescription);
        return @NO;
      }
    }
    NSError *error = nil;
    result = [[NSData data] writeToFile:_path options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&error];
    if (error != nil) {
      NSLog(@"[ERROR] Could not write file: %@", error.localizedDescription);
      return @NO;
    }
  }
  return @(result);
}

- (NSNumber *)deleteDirectory:(id)args
{
  BOOL result = NO;
  BOOL isDirectory = NO;
  BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:_path isDirectory:&isDirectory];
  if (exists && isDirectory) {
    NSError *error = nil;
    BOOL shouldDelete = args != nil && [args count] > 0 ? [TiUtils boolValue:[args objectAtIndex:0]] : NO;
    if (!shouldDelete) {
      NSArray *remainers = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:_path error:&error];
      if (error == nil) {
        if ([remainers count] == 0) {
          shouldDelete = YES;
        }
      } else {
        NSLog(@"[ERROR] Could not receive contents to delete: %@", error.localizedDescription);
      }
    }
    if (shouldDelete) {
      result = [[NSFileManager defaultManager] removeItemAtPath:_path error:&error];
      if (error != nil) {
        NSLog(@"[ERROR] Could not delete directory: %@", error.localizedDescription);
      }
    }
  }
  return @(result);
}

- (NSNumber *)deleteFile:(id)args
{
  BOOL result = NO;
  BOOL isDirectory = YES;
  BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:_path isDirectory:&isDirectory];
  NSError *error = nil;

  if (exists && !isDirectory) {
    result = [[NSFileManager defaultManager] removeItemAtPath:_path error:&error];
  }
  if (error != nil) {
    NSLog(@"[ERROR] Could not delete file: %@", error.localizedDescription);
    return @NO;
  }
  return @(result);
}

- (NSString *)_grabFirstArgumentAsFileName_:(id)args
{
  NSString *arg = [args objectAtIndex:0];
  NSString *file = FILE_TOSTR(arg);
  NSURL *fileUrl = [NSURL URLWithString:file];
  if ([fileUrl isFileURL]) {
    file = [fileUrl path];
  }
  NSString *dest = [file stringByStandardizingPath];

  return dest;
}

- (NSNumber *)copy:(id)args
{
  ENSURE_TYPE(args, NSArray);
  NSError *error = nil;
  NSString *dest = [self _grabFirstArgumentAsFileName_:args];

  if (![dest isAbsolutePath]) {
    NSString *subpath = [_path stringByDeletingLastPathComponent];
    dest = [subpath stringByAppendingPathComponent:dest];
  }

  BOOL result = [[NSFileManager defaultManager] copyItemAtPath:_path toPath:dest error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Could not copy: %@", error.localizedDescription);
    return @NO;
  }
  return @(result);
}

- (NSNumber *)move:(id)args
{
  ENSURE_TYPE(args, NSArray);
  NSError *error = nil;
  NSString *dest = [self _grabFirstArgumentAsFileName_:args];

  if (![dest isAbsolutePath]) {
    NSString *subpath = [_path stringByDeletingLastPathComponent];
    dest = [subpath stringByAppendingPathComponent:dest];
  }

  BOOL result = [[NSFileManager defaultManager] moveItemAtPath:_path toPath:dest error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Could not move: %@", error.localizedDescription);
    return @NO;
  }
  return @(result);
}

- (NSNumber *)rename:(id)args
{
  ENSURE_TYPE(args, NSArray);
  NSString *dest = [self _grabFirstArgumentAsFileName_:args];
  NSString *ourSubpath = [_path stringByDeletingLastPathComponent];

  if ([dest isAbsolutePath]) {
    NSString *destSubpath = [dest stringByDeletingLastPathComponent];

    if (![ourSubpath isEqualToString:destSubpath]) {
      return NUMBOOL(NO); // rename is not move
    }
  }

  return [self move:args];
}

- (TiBlob *)read:(id)args
{
  BOOL exists = [[NSFileManager defaultManager] fileExistsAtPath:_path];
  if (!exists)
    return nil;
  return [[TiBlob alloc] _initWithPageContext:[self executionContext] andFile:_path];
}

- (NSNumber *)append:(id)args
{
  ENSURE_TYPE(args, NSArray);
  id arg = [args objectAtIndex:0];

  if ([arg isKindOfClass:[TiFile class]]) {
    //allow the ability to append files to another file
    //e.g. file.append(Ti.Filesystem.getFile('somewhere'));

    TiFile *file_arg = (TiFile *)arg;
    NSError *err = nil;
    NSString *contents = [NSString stringWithContentsOfFile:[file_arg path] encoding:NSUTF8StringEncoding error:&err];
    if (contents != nil && err == nil) {
      arg = contents;
    } else {
      NSLog(@"[ERROR] Can't open file (%@) for reading!\n%@", [file_arg path], err);
      return @(NO);
    }
  }

  if ([arg isKindOfClass:[TiBlob class]] ||
      [arg isKindOfClass:[NSString class]]) {

    NSData *data = nil;
    if ([arg isKindOfClass:[NSString class]]) {
      data = [arg dataUsingEncoding:NSUTF8StringEncoding];
    } else {
      data = [(TiBlob *)arg data];
    }

    if (data == nil) {
      return @(NO);
    }

    if (![[NSFileManager defaultManager] fileExistsAtPath:_path]) {
      //create the file if it doesn't exist already
      NSError *writeError = nil;
      [data writeToFile:_path options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&writeError];
      if (writeError != nil) {
        NSLog(@"[ERROR] Could not write data to file at path \"%@\"", _path);
      }
      return @(writeError == nil);
    }

    NSFileHandle *handle = [NSFileHandle fileHandleForUpdatingAtPath:_path];

    unsigned long long offset = [handle seekToEndOfFile];
    [handle writeData:data];

    BOOL success = ([handle offsetInFile] - offset) == [data length];
    [handle closeFile];

    return @(success);
  } else {
    NSLog(@"[ERROR] Can only append blobs and strings");
  }
  return @(NO);
}

- (NSNumber *)write:(id)args
{
  ENSURE_TYPE(args, NSArray);
  id arg = [args objectAtIndex:0];

  //Short-circuit against non-supported types
  if (!([arg isKindOfClass:[TiFile class]] || [arg isKindOfClass:[TiBlob class]]
          || [arg isKindOfClass:[NSString class]])) {
    return @(NO);
  }

  if ([args count] > 1) {
    ENSURE_TYPE([args objectAtIndex:1], NSNumber);

    //We have a second argument, is it truthy?
    //If yes, we'll hand the args to -append:
    NSNumber *append = [args objectAtIndex:1];
    if ([append boolValue] == YES) {
      return [self append:[args subarrayWithRange:NSMakeRange(0, 1)]];
    }
  }
  if ([arg isKindOfClass:[TiBlob class]]) {
    TiBlob *blob = (TiBlob *)arg;
    return @([blob writeTo:_path error:nil]);
  } else if ([arg isKindOfClass:[TiFile class]]) {
    TiFile *file = (TiFile *)arg;
    [[NSFileManager defaultManager] removeItemAtPath:_path error:nil];
    NSError *error = nil;
    [[NSFileManager defaultManager] copyItemAtPath:[file path] toPath:_path error:&error];
    if (error != nil) {
      NSLog(@"[ERROR] Could not write file %@ -> %@. Error: %@", [file path], _path, error);
    }
    return @(error == nil);
  }
  NSString *dataString = [TiUtils stringValue:arg];
  NSData *data = [dataString dataUsingEncoding:NSUTF8StringEncoding];
  NSError *err = nil;
  [data writeToFile:_path options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&err];
  if (err != nil) {
    NSLog(@"[ERROR] Could not write data to file at path \"%@\" - details: %@", _path, err);
  }
  return @(err == nil);
}

- (NSString *)extension:(id)args
{
  return [_path pathExtension];
}

- (NSString *)getParent:(id)args
{
  DEPRECATED_REPLACED(@"Filesystem.File.getParent()", @"7.0.0", @"Filesystem.File.parent");
  return [_path stringByDeletingLastPathComponent];
}

- (TiFilesystemFileProxy *)parent
{
  return [[TiFilesystemFileProxy alloc] initWithFile:[_path stringByDeletingLastPathComponent]];
}

- (NSString *)name
{
  return [_path lastPathComponent];
}

- (NSString *)resolve:(id)args
{
  return _path;
}

- (NSString *)description
{
  return _path;
}

+ (TiFilesystemFileProxy *)makeTemp:(BOOL)isDirectory
{
  NSString *tempDir = NSTemporaryDirectory();
  NSError *error = nil;

  NSFileManager *fm = [NSFileManager defaultManager];
  if (![[NSFileManager defaultManager] fileExistsAtPath:tempDir]) {
    [[NSFileManager defaultManager] createDirectoryAtPath:tempDir withIntermediateDirectories:YES attributes:nil error:&error];
    if (error != nil) {
      NSLog(@"[ERROR] Could not create temporary %@ or directory: %@", isDirectory ? @"directory" : @"file", error.localizedDescription);
      return nil;
    }
  }

  int timestamp = (int)(time(NULL) & 0xFFFFL);
  NSString *resultPath;
  do {
    resultPath = [tempDir stringByAppendingPathComponent:[NSString stringWithFormat:@"%X", timestamp]];
    timestamp++;
  } while ([[NSFileManager defaultManager] fileExistsAtPath:resultPath]);

  if (isDirectory) {
    [[NSFileManager defaultManager] createDirectoryAtPath:resultPath withIntermediateDirectories:NO attributes:nil error:&error];
  } else {
    [[NSData data] writeToFile:resultPath options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&error];
  }

  if (error != nil) {
    NSLog(@"[ERROR] Could not write temporary %@ or directory: %@", isDirectory ? @"directory" : @"file", error.localizedDescription);
    return nil;
  }

  return [[TiFilesystemFileProxy alloc] initWithFile:resultPath];
}

- (NSNumber *)remoteBackup
{
  NSURL *URL = [NSURL fileURLWithPath:[self path]];
  NSError *error;
  NSNumber *isExcluded;

  BOOL success = [URL getResourceValue:&isExcluded
                                forKey:NSURLIsExcludedFromBackupKey
                                 error:&error];
  if (!success) {
    // Doesn't matter what error is set to; this means that we're backing up.
    return @(YES);
  }

  // A value of @NO means backup, so:
  return @([isExcluded isEqualToNumber:@YES] ? NO : YES);
}

- (void)setRemoteBackup:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  BOOL isExcluded = ![TiUtils boolValue:value def:YES];

  [self addSkipBackupAttributeToFolder:[NSURL fileURLWithPath:[self path]] withFlag:isExcluded];
}

- (void)addSkipBackupAttributeToFolder:(NSURL *)folder withFlag:(BOOL)flag
{
  [self addSkipBackupAttributeToItemAtURL:folder withFlag:flag];

  NSError *error = nil;
  NSArray *folderContent = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:[folder path] error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Could not configure remote backup: %@", error.localizedDescription);
  }
  for (NSString *item in folderContent) {
    [self addSkipBackupAttributeToFolder:[NSURL fileURLWithPath:[folder.path stringByAppendingPathComponent:item]] withFlag:flag];
  }
}

- (BOOL)addSkipBackupAttributeToItemAtURL:(NSURL *)URL withFlag:(BOOL)flag
{
  NSError *error = nil;
  BOOL success = [URL setResourceValue:[NSNumber numberWithBool:flag]
                                forKey:NSURLIsExcludedFromBackupKey
                                 error:&error];

  if (!success) {
    NSLog(@"[ERROR] Remote-backup status of %@ could not be changed: %@", [URL lastPathComponent], [error localizedDescription]);
  }

  return success;
}

@end

#endif
