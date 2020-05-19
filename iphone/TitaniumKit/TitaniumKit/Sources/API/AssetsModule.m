/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "AssetsModule.h"
#import "KrollModule.h"
#import "TiHost.h"
#import "TiModule.h"
#import "TiUtils.h"

typedef NS_ENUM(NSInteger, FileStatus) {
  FileStatusDoesntExist,
  FileStatusExistsOnDisk,
  FileStatusExistsEncrypted,
  FileStatusUnknown,
};

@implementation AssetsModule

- (NSString *)apiName
{
  return @"Assets";
}

/**
   Used by global.assets.readAsset()
 */
- (NSString *)readAsset:(NSString *)path
{
  NSData *data;
  if ([path hasPrefix:@"/"]) {
    // drop leading '/' to actually make relative to base url/root dir
    path = [self pathByStandarizingPath:[path substringFromIndex:1]];
  } else if (![path hasPrefix:@"."]) {
    // no leading '.' or '/', check if it's a core module's assets
    data = [self loadCoreModuleAsset:path];
  }
  if (data == nil) {
    // check if file exists by using cheat index.json which tells us if on disk or encrypted.
    FileStatus status = [self fileStatus:path];
    NSURL *url_ = [NSURL URLWithString:path relativeToURL:[self _baseURL]];

    switch (status) {
    case FileStatusExistsOnDisk:
      data = [NSData dataWithContentsOfURL:url_]; // load from disk
      break;

    case FileStatusExistsEncrypted:
      data = [TiUtils loadAppResource:url_]; // try to load encrypted file
      break;

    case FileStatusUnknown:
      // There was no index.json so fallback to just trying to read from disk/encryption the slow way
      data = [NSData dataWithContentsOfURL:url_];
      if (data == nil) {
        data = [TiUtils loadAppResource:url_];
      }
      break;

    case FileStatusDoesntExist:
    default:
      return nil;
    }
  }

  if (data != nil) {
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  }
  return nil;
}

- (NSString *)pathByStandarizingPath:(NSString *)relativePath
{
  // Calling [relativePath stringByStandardizingPath]; does not resolve '..' segments because the path isn't absolute!
  // so we hack around it here by making an URL that does point to absolute location...
  NSURL *url_ = [NSURL URLWithString:relativePath relativeToURL:[self _baseURL]];
  // "standardizing" it (i.e. removing '.' and '..' segments properly...
  NSURL *standardizedURL = [url_ standardizedURL];
  // Then asking for the relative path again
  return [[standardizedURL relativePath] stringByStandardizingPath];
}

- (FileStatus)fileStatus:(NSString *)path
{
  NSDictionary *files = [AssetsModule loadIndexJSON];
  if (files.count == 0) {
    // there was no index.json! status is unknown!
    return FileStatusUnknown;
  }
  path = [@"Resources/" stringByAppendingString:path];
  NSNumber *type = files[path];
  if (type == nil) {
    return FileStatusDoesntExist;
  }
  NSInteger intType = [type integerValue];
  return (FileStatus)intType;
}

- (NSData *)loadCoreModuleAsset:(NSString *)path
{
  NSArray<NSString *> *pathComponents = [path pathComponents];
  NSString *moduleID = [pathComponents objectAtIndex:0];

  id module = [KrollModule loadCoreModule:moduleID inContext:JSContext.currentContext];
  if (module == nil) {
    return nil;
  }

  NSRange separatorLocation = [path rangeOfString:@"/"];
  // check rest of path FIXME: Just rejoin pathComponents?
  NSString *assetPath = [path substringFromIndex:separatorLocation.location + 1];
  // Try to load the file as module asset!
  NSString *filepath = [assetPath stringByAppendingString:@".js"];
  return [module loadModuleAsset:filepath];
}

+ (NSDictionary *)loadIndexJSON
{
  static NSDictionary *props;

  if (props == nil) {

    NSString *indexJsonPath = [[TiHost resourcePath] stringByAppendingPathComponent:@"_index_.json"];
    // check for encrypted copy first
    NSData *jsonData = [TiUtils loadAppResource:[NSURL fileURLWithPath:indexJsonPath]];
    if (jsonData == nil) {
      // Not found in encrypted file, this means we're in development mode, get it from the filesystem
      jsonData = [NSData dataWithContentsOfFile:indexJsonPath];
    }

    NSString *errorString = nil;
    // Get the JSON data and create the NSDictionary.
    if (jsonData) {
      NSError *error = nil;
      props = [[NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error] retain];
      errorString = [error localizedDescription];
    } else {
      // If we have no data...
      // This should never happen on a Titanium app using the node.js CLI
      errorString = @"File not found";
    }
    if (errorString != nil) {
      DebugLog(@"[ERROR] Could not load _index_.json require index, error was %@", errorString);
      // Create an empty dictioary to avoid running this code over and over again.
      props = [[NSDictionary dictionary] retain];
    }
  }
  return props;
}

@end
