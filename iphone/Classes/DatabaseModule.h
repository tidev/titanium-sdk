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

@protocol DatabaseModuleExports <JSExport>

// Constants
CONSTANT(DatabaseFieldType, FIELD_TYPE_DOUBLE);
CONSTANT(DatabaseFieldType, FIELD_TYPE_FLOAT);
CONSTANT(DatabaseFieldType, FIELD_TYPE_INT);
CONSTANT(DatabaseFieldType, FIELD_TYPE_STRING);

// Methods
// TODO: Change JSValue* return type to TiDatabaseProxy* when it's moved to obj-c API
JSExportAs(install,
           -(JSValue *)install
           : (NSString *)path withName
           : (NSString *)dbName);
// TODO: Change JSValue* return type to TiDatabaseProxy* when it's moved to obj-c API
- (JSValue *)open:(NSString *)dbName;

@end

@interface DatabaseModule : ObjcProxy <DatabaseModuleExports>
@end

#endif
