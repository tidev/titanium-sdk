/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CODEC
@import Foundation;
@import TitaniumKit.ObjcProxy;

@import JavaScriptCore;

@protocol CodecExports <JSExport>

// Constants
// These conflict with reserved names, so we need to temporarily undefine and then redefine them
#define OLD_BIG_ENDIAN BIG_ENDIAN
#undef BIG_ENDIAN
CONSTANT(NSNumber *, BIG_ENDIAN);
#define BIG_ENDIAN OLD_BIG_ENDIAN
#define OLD_LITTLE_ENDIAN LITTLE_ENDIAN
#undef LITTLE_ENDIAN
CONSTANT(NSNumber *, LITTLE_ENDIAN);
#define LITTLE_ENDIAN OLD_LITTLE_ENDIAN

CONSTANT(NSString *, CHARSET_ASCII);
CONSTANT(NSString *, CHARSET_ISO_LATIN_1);
CONSTANT(NSString *, CHARSET_UTF8);
CONSTANT(NSString *, CHARSET_UTF16);
CONSTANT(NSString *, CHARSET_UTF16BE);
CONSTANT(NSString *, CHARSET_UTF16LE);
CONSTANT(NSString *, TYPE_BYTE);
CONSTANT(NSString *, TYPE_SHORT);
CONSTANT(NSString *, TYPE_INT);
CONSTANT(NSString *, TYPE_LONG);
CONSTANT(NSString *, TYPE_FLOAT);
CONSTANT(NSString *, TYPE_DOUBLE);

// Methods
// FIXME: Convert JSValue * to NSDictionary * once TiBuffer is an ObjcProxy subclass?
- (NSNumber *)encodeNumber:(JSValue *)args;
- (NSNumber *)decodeNumber:(JSValue *)args;
- (NSNumber *)encodeString:(JSValue *)args;
- (NSString *)decodeString:(JSValue *)args;
- (NSNumber *)getNativeByteOrder;

@end

@interface CodecModule : ObjcProxy <CodecExports> {
}

@end
#endif
