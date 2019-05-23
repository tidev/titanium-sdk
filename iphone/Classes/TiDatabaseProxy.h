/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE
@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;
#import "PlausibleDatabase.h"

@class TiDatabaseResultSetProxy; // forward declare

@protocol TiDatabaseProxyExports <JSExport>
// Properties (and accessors)
// TODO: Change JSValue* return type to TiFile* when it's moved to obj-c API
READONLY_PROPERTY(JSValue *, file, File);
// FIXME These properties aren't marked readonly in docs!
READONLY_PROPERTY(NSUInteger, lastInsertRowId, LastInsertRowId);
READONLY_PROPERTY(NSString *, name, Name);
READONLY_PROPERTY(NSUInteger, rowsAffected, RowsAffected);

// Methods
- (void)close;
// This supports varargs, but we hack it in the impl to check currentArgs
- (TiDatabaseResultSetProxy *)execute:(NSString *)sql;
- (void)remove;

@end

@interface TiDatabaseProxy : ObjcProxy <TiDatabaseProxyExports> {
  @protected
  NSString *name;
  PLSqliteDatabase *database;
  NSMutableArray *statements;
}

/**
  @deprecated Only here for backwards compatibility with SDK < 8.1.0. Use `init` instead.
  */
- (id)_initWithPageContext:(__unused id<TiEvaluator>)pageContext __attribute__((deprecated));

- (void)install:(NSString *)path name:(NSString *)name_;
- (void)open:(NSString *)name_;

#pragma mark Internal

- (void)removeStatement:(PLSqliteResultSet *)statement;
- (PLSqliteDatabase *)database;

@end

#endif
