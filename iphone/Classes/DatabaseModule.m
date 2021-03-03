/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE

#import "DatabaseModule.h"
#import "TiDatabaseProxy.h"

@implementation DatabaseModule

- (void)startup
{
  // enable multi-threading
}

- (NSString *)apiName
{
  return @"Ti.Database";
}

- (JSValue *)open:(NSString *)path
{
  TiDatabaseProxy *db = [[[TiDatabaseProxy alloc] init] autorelease];
  [db open:path];
  return [self NativeToJSValue:db];
}

- (JSValue *)install:(NSString *)path withName:(NSString *)dbName
{
  TiDatabaseProxy *db = [[[TiDatabaseProxy alloc] init] autorelease];
  [db install:path name:dbName];
  return [self NativeToJSValue:db];
}

#define DB_CONSTANT(name, num) \
  -(DatabaseFieldType)name     \
  {                            \
    return num;                \
  }

DB_CONSTANT(FIELD_TYPE_UNKNOWN, FieldTypeUnknown)
DB_CONSTANT(FIELD_TYPE_STRING, FieldTypeString)
DB_CONSTANT(FIELD_TYPE_INT, FieldTypeInt)
DB_CONSTANT(FIELD_TYPE_FLOAT, FieldTypeFloat)
DB_CONSTANT(FIELD_TYPE_DOUBLE, FieldTypeDouble);

@end

#endif
