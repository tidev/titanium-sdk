/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_FILESYSTEM

@import JavaScriptCore;
@import TitaniumKit.ObjcProxy;
@import TitaniumKit.TiBase;

@class TiBlob; // forward declare

@protocol FilesystemExports <JSExport>

// Constants
CONSTANT(NSString *, IOS_FILE_PROTECTION_COMPLETE);
CONSTANT(NSString *, IOS_FILE_PROTECTION_COMPLETE_UNLESS_OPEN);
CONSTANT(NSString *, IOS_FILE_PROTECTION_COMPLETE_UNTIL_FIRST_USER_AUTHENTICATION);
CONSTANT(NSString *, IOS_FILE_PROTECTION_NONE);

CONSTANT(TiStreamMode, MODE_APPEND);
CONSTANT(TiStreamMode, MODE_READ);
CONSTANT(TiStreamMode, MODE_WRITE);

// Properties (with accessors)
READONLY_PROPERTY(NSString *, applicationCacheDirectory, ApplicationCacheDirectory);
READONLY_PROPERTY(NSString *, applicationDataDirectory, ApplicationDataDirectory);
READONLY_PROPERTY(NSString *, applicationDirectory, ApplicationDirectory);
READONLY_PROPERTY(NSString *, applicationSupportDirectory, ApplicationSupportDirectory);
READONLY_PROPERTY(NSString *, lineEnding, LineEnding);
READONLY_PROPERTY(NSString *, resourcesDirectory, ResourcesDirectory);
READONLY_PROPERTY(NSString *, separator, Separator);
READONLY_PROPERTY(NSString *, tempDirectory, TempDirectory);

// Methods
- (JSValue *)createTempDirectory; // TODO: Change JSValue* to TiFile* once TiFile is migrated
- (JSValue *)createTempFile; // TODO: Change JSValue* to TiFile* once TiFile is migrated
- (NSString *)directoryForSuite:(NSString *)suiteName;
// Note that this accepts varargs, which we handle special in impl
- (TiBlob *)getAsset;
// TODO: Change JSValue* to TiFile* once TiFile is migrated
// Note that this accepts varargs, which we handle special in impl
- (JSValue *)getFile;
- (BOOL)isExternalStoragePresent;
// TODO: Change JSValue* to TiFile* once TiFile is migrated
// Note that this accepts varargs, which we handle special in impl
- (JSValue *)openStream:(TiStreamMode)mode;

@end

@interface FilesystemModule : ObjcProxy <FilesystemExports>

@end

#endif
