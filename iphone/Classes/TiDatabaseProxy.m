/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE

#import "TiDatabaseProxy.h"
#import "TiDatabaseResultSetProxy.h"
@import TitaniumKit.TiFilesystemFileProxy;
@import TitaniumKit.TiUtils;

@implementation TiDatabaseProxy

#pragma mark Internal

- (void)dealloc
{
  [self _destroy];
  RELEASE_TO_NIL(name);
  [super dealloc];
}

- (void)shutdown:(id)sender
{
  if (database != nil) {
    [self performSelector:@selector(close:) withObject:nil];
  }
}

- (void)_destroy
{
  WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  [[NSNotificationCenter defaultCenter] removeObserver:self name:kTiShutdownNotification object:nil];
  [self shutdown:nil];
  [super _destroy];
}

- (void)_configure
{
  WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(shutdown:) name:kTiShutdownNotification object:nil];
  [super _configure];
}

- (NSString *)apiName
{
  return @"Ti.Database.DB";
}

- (NSString *)dbDir
{
  // See this apple tech note for why this changed: https://developer.apple.com/library/ios/#qa/qa1719/_index.html
  // Apparently following these guidelines is now required for app submission

  NSString *rootDir = [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) objectAtIndex:0];
  NSString *dbPath = [rootDir stringByAppendingPathComponent:@"Private Documents"];
  NSFileManager *fm = [NSFileManager defaultManager];

  BOOL isDirectory;
  BOOL exists = [fm fileExistsAtPath:dbPath isDirectory:&isDirectory];

  // Because of sandboxing, this should never happen, but we still need to handle it.
  if (exists && !isDirectory) {
    NSLog(@"[WARN] Recreating file %@... should be a directory and isn't.", dbPath);
    [fm removeItemAtPath:dbPath error:nil];
    exists = NO;
  }

  // create folder, and migrate the old one if necessary
  if (!exists) {
    [fm createDirectoryAtPath:dbPath withIntermediateDirectories:YES attributes:nil error:nil];
  }

  // Migrate any old data if available
  NSString *oldRoot = [NSSearchPathForDirectoriesInDomains(NSApplicationSupportDirectory, NSUserDomainMask, YES) objectAtIndex:0];
  NSString *oldPath = [oldRoot stringByAppendingPathComponent:@"database"];
  BOOL oldCopyExists = [fm fileExistsAtPath:oldPath isDirectory:&isDirectory];
  if (oldCopyExists && isDirectory) {
    NSDirectoryEnumerator *contents = [fm enumeratorAtPath:oldPath];
    //This gives relative paths. So create full path before moving
    for (NSString *oldFile in contents) {
      [fm moveItemAtPath:[oldPath stringByAppendingPathComponent:oldFile] toPath:[dbPath stringByAppendingPathComponent:oldFile] error:nil];
    }

    // Remove the old copy after migrating everything
    [fm removeItemAtPath:oldPath error:nil];
  }

  return dbPath;
}

- (NSString *)dbPath:(NSString *)name_
{
  NSString *dbDir = name_;
  if (![name_ hasPrefix:@"/"] && ![name_ hasPrefix:@"file:"]) {
    dbDir = [[self dbDir] stringByAppendingPathComponent:name_];
  }

  return [dbDir stringByAppendingPathExtension:@"sql"];
}

- (void)open:(NSString *)name_
{
  name = [name_ retain];
  NSString *path = [self dbPath:name];

  database = [[PLSqliteDatabase alloc] initWithPath:path];
  if (![database open]) {
    [self throwException:@"couldn't open database" subreason:name_ location:CODELOCATION];
  }
}

- (void)install:(NSString *)path name:(NSString *)name_
{
  BOOL isDirectory;
  NSFileManager *fm = [NSFileManager defaultManager];
  NSURL *url = [TiUtils toURL:path proxy:self];
  path = [url path];

#if TARGET_IPHONE_SIMULATOR
  //TIMOB-6081. Resources are right now symbolic links when running in simulator) so the copy method
  //of filemanager just creates a link to the original resource.
  //Resolve the symbolic link if running in simulator
  NSError *pathError = nil;
  NSDictionary *attributes = [fm attributesOfItemAtPath:path error:&pathError];
  if (pathError != nil) {
    [self throwException:@"Could not retrieve attributes" subreason:[pathError description] location:CODELOCATION];
  }
  NSString *fileType = [attributes valueForKey:NSFileType];
  if ([fileType isEqual:NSFileTypeSymbolicLink]) {
    pathError = nil;
    path = [fm destinationOfSymbolicLinkAtPath:path error:&pathError];

    if (pathError != nil) {
      [self throwException:@"Could not resolve symbolic link" subreason:[pathError description] location:CODELOCATION];
    }
  }

#endif

  BOOL exists = [fm fileExistsAtPath:path isDirectory:&isDirectory];
  if (!exists) {
    [self throwException:@"invalid database install path" subreason:path location:CODELOCATION];
  }

  // get the install path
  NSString *installPath = [self dbPath:name_];

  // see if we have already installed the DB
  exists = [fm fileExistsAtPath:installPath isDirectory:&isDirectory];
  if (!exists) {
    NSError *error = nil;
    // install it by copying it
    [fm copyItemAtPath:path toPath:installPath error:&error];
    if (error != nil) {
      [self throwException:@"couldn't install database" subreason:[error description] location:CODELOCATION];
    }
  }

  [self open:name_];
}

- (void)removeStatement:(PLSqliteResultSet *)statement
{
  [statement close];
  if (statements != nil) {
    [statements removeObject:statement];
  }
}

- (NSArray *)sqlParams:(NSArray *)array
{
  NSMutableArray *result = [NSMutableArray arrayWithCapacity:[array count]];
  for (JSValue *jsValue in array) {
    // This uses the Titanium conversion method. We could probably write a nicer one
    // that simply used the Obj-C JSC API checking isString/isDate/isArray/isObject/isBoolean/isNumber
    id value = [self JSValueToNative:jsValue];
    if (value == nil) {
      [result addObject:[NSNull null]];
    } else {
      [result addObject:value];
    }
  }

  return result;
}

- (TiDatabaseResultSetProxy *)execute:(NSString *)sql
{
  sql = [sql stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];

  NSError *error = nil;
  PLSqlitePreparedStatement *statement = (PLSqlitePreparedStatement *)[database prepareStatement:sql error:&error];
  if (error != nil) {
    [self throwException:@"invalid SQL statement" subreason:[error description] location:CODELOCATION];
  }
  // Check for varargs for perepared statement params
  NSArray *currentArgs = [JSContext currentArguments];
  if ([currentArgs count] > 1) {
    JSValue *possibleParams = [currentArgs objectAtIndex:1];
    NSArray *params;
    if ([possibleParams isArray]) {
      params = [possibleParams toArray];
    } else {
      params = [self sqlParams:[currentArgs subarrayWithRange:NSMakeRange(1, [currentArgs count] - 1)]];
    }
    [statement bindParameters:params];
  }

  PLSqliteResultSet *result = (PLSqliteResultSet *)[statement executeQuery];

  if ([[result fieldNames] count] == 0) {
    [result next]; // we need to do this to make sure lastInsertRowId and rowsAffected work
    [result close];
    return nil;
  }

  if (statements == nil) {
    statements = [[NSMutableArray alloc] initWithCapacity:5];
  }

  [statements addObject:result];

  TiDatabaseResultSetProxy *proxy = [[[TiDatabaseResultSetProxy alloc] initWithResults:result database:self] autorelease];

  return proxy;
}

- (void)close
{
  if (statements != nil) {
    for (PLSqliteResultSet *result in statements) {
      [result close];
    }
    RELEASE_TO_NIL(statements);
  }
  if (database != nil) {
    if ([database goodConnection]) {
      @try {
        [database close];
      }
      @catch (NSException *e) {
        NSLog(@"[WARN] attempting to close database, returned error: %@", e);
      }
    }
    RELEASE_TO_NIL(database);
  }
}

- (void)remove
{
  NSString *dbPath = [self dbPath:name];
  [[NSFileManager defaultManager] removeItemAtPath:dbPath error:nil];
}

- (NSUInteger)lastInsertRowId
{
  if (database != nil) {
    return [database lastInsertRowId];
  }
  return 0;
}
GETTER_IMPL(NSUInteger, lastInsertRowId, LastInsertRowId);

- (NSUInteger)rowsAffected
{
  if (database != nil) {
    return sqlite3_changes([database sqliteDB]);
  }
  return 0;
}
GETTER_IMPL(NSUInteger, rowsAffected, RowsAffected);

- (NSString *)name
{
  return name;
}
GETTER_IMPL(NSString *, name, Name);

- (JSValue *)file
{
  return [self NativeToJSValue:[[[TiFilesystemFileProxy alloc] initWithFile:[self dbPath:name]] autorelease]];
}
GETTER_IMPL(JSValue *, file, File);

#pragma mark Internal
- (PLSqliteDatabase *)database
{
  return database;
}

@end

#endif
