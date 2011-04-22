/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import "TiModule.h"

#ifdef USE_TI_CODEC

@interface CodecModule : TiModule {
    
}
// Public constants
@property (nonatomic, readonly) NSString* CHARSET_ASCII;
@property (nonatomic, readonly) NSString* CHARSET_ISO_LATIN_1;
@property (nonatomic, readonly) NSString* CHARSET_UTF8;
@property (nonatomic, readonly) NSString* CHARSET_UTF16;
@property (nonatomic, readonly) NSString* CHARSET_UTF16BE;
@property (nonatomic, readonly) NSString* CHARSET_UTF16LE;
@property (nonatomic, readonly) NSString* TYPE_BYTE;
@property (nonatomic, readonly) NSString* TYPE_SHORT;
@property (nonatomic, readonly) NSString* TYPE_INT;
@property (nonatomic, readonly) NSString* TYPE_LONG;
@property (nonatomic, readonly) NSString* TYPE_FLOAT;
@property (nonatomic, readonly) NSString* TYPE_DOUBLE;
// These conflict with reserved names, so we can't declare them as properties
// BIG_ENDIAN
// LITTLE_ENDIAN

// Public API
-(NSNumber*)encodeNumber:(id)args;
-(NSNumber*)decodeNumber:(id)args;
-(NSNumber*)encodeString:(id)args;
-(NSString*)decodeString:(id)args;
-(NSNumber*)getNativeByteOrder:(id)_void;

@end
#endif