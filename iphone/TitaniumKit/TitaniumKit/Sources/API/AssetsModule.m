/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "AssetsModule.h"
#import "KrollModule.h"
#import "TiHost.h"
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
    // drop leading '/' to actually make relative to resources dir
    NSURL *url = [TiHost resourceBasedURL:[path substringFromIndex:1] baseURL:NULL];
    data = [AssetsModule loadURL:url];
  } else if (![path hasPrefix:@"."]) {
    // no leading '.' or '/', check if it's a core module's assets
    data = [self loadCoreModuleAsset:path];
  }
  if (data == nil) {
    data = [AssetsModule loadFile:path baseURL:[self _baseURL]];
  }

  if (data != nil) {
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  }
  return nil;
}

// TODO: Move all the logic for loading app resources into TiUtils or TiHost so we can centralize calls and not expose AssetsModule everywhere

+ (NSString *)readURL:(NSURL *)url
{
  NSData *data = [AssetsModule loadURL:url];
  if (data != nil) {
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
  }
  return nil;
}

+ (NSData *)loadURL:(NSURL *)url
{
  FileStatus status = FileStatusUnknown;
  // This assumes it's a js or json file already!
  if (url.isFileURL) { // if it's a resource, check index.json listing for status
    status = [AssetsModule fileStatus:[TiHost resourceRelativePath:url]];
  }
  NSData *data;
  switch (status) {
  case FileStatusExistsOnDisk:
    return [NSData dataWithContentsOfURL:url]; // load from disk

  case FileStatusExistsEncrypted:
    return [TiUtils loadAppResource:url]; // try to load encrypted file

  case FileStatusUnknown:
    // There was no index.json so fallback to just trying to read from disk/encryption the slow way
    data = [NSData dataWithContentsOfURL:url];
    if (data == nil) {
      return [TiUtils loadAppResource:url];
    }
    return data;

  case FileStatusDoesntExist:
  default:
    return nil;
  }
}

+ (NSData *)loadFile:(NSString *)path baseURL:(NSURL *)baseURL
{
  // Calling [relativePath stringByStandardizingPath]; does not resolve '..' segments because the path isn't absolute!
  // so we hack around it here by making an URL that does point to absolute location...
  NSURL *url_ = [NSURL URLWithString:path relativeToURL:baseURL];
  // "standardizing" it (i.e. removing '.' and '..' segments properly...
  return [AssetsModule loadURL:[url_ standardizedURL]];
}

+ (FileStatus)fileStatus:(NSString *)path
{
  // if it's not a js or json file, status is unknown!
  NSString *extension = path.pathExtension;
  if (![extension isEqual:@"js"] && ![extension isEqual:@"json"]) {
    return FileStatusUnknown;
  }
  NSDictionary *files = [AssetsModule loadIndexJSON];
  if (files.count == 0) {
    // there was no index.json! status is unknown!
    return FileStatusUnknown;
  }
  if ([path isEqualToString:@"/_index_.json"]) { // we know it exists! we loaded it
    return FileStatusUnknown; // treat as "unknown" since we didn't record if we loaded in normal or encrypted...
  }
  // Initial path is assuemd to be of form: "/ti.main.js", "/app.js" or "/ti.kernel.js"
  // Basically a path that looks absolute but is relative to Resources dir (app root)
  path = [@"Resources" stringByAppendingString:path];
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

  id<Module> module = [KrollModule loadCoreModule:moduleID inContext:JSContext.currentContext];
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
