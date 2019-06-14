/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_DATABASE
@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;

typedef enum {
  FieldTypeUnknown = -1,
  FieldTypeString,
  FieldTypeInt,
  FieldTypeFloat,
  FieldTypeDouble
} DatabaseFieldType;

@class TiDatabaseProxy; // forward declare

@protocol DatabaseModuleExports <JSExport>

// Constants
CONSTANT(DatabaseFieldType, FIELD_TYPE_DOUBLE);
CONSTANT(DatabaseFieldType, FIELD_TYPE_FLOAT);
CONSTANT(DatabaseFieldType, FIELD_TYPE_INT);
CONSTANT(DatabaseFieldType, FIELD_TYPE_STRING);

// Methods
JSExportAs(install,
           -(TiDatabaseProxy *)install
           : (NSString *)path withName
           : (NSString *)dbName);
- (TiDatabaseProxy *)open:(NSString *)dbName;

@end

@interface DatabaseModule : ObjcProxy <DatabaseModuleExports>
@end

#endif
