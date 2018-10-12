/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UTILS

#import <JavaScriptCore/JavaScriptCore.h>
#import <TitaniumKit/ObjcProxy.h>

// uncomment once we start returning TiBlob*
// @class TiBlob; // forward declare

@protocol UtilsExports <JSExport>

// TODO: Change from JSValue * to id argument once TiFile/TiBlob have been migrated to obj-c proxies
// TODO: Change JSValue* return value to TiBlob* once TiBlob has been migrated to obj-c proxy
- (JSValue *)base64decode:(JSValue *)obj;
- (JSValue *)base64encode:(JSValue *)obj;
- (NSString *)md5HexDigest:(JSValue *)obj;
- (NSString *)sha1:(JSValue *)obj;
- (NSString *)sha256:(JSValue *)obj;

@end

@interface UtilsModule : ObjcProxy <UtilsExports>

@end

#endif
