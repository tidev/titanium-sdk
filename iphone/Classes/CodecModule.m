/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_CODEC

#import "CodecModule.h"
@import TitaniumKit.TiBuffer;
@import TitaniumKit.TiBase;
@import TitaniumKit.TiUtils;

@interface CodecModule (Private)
- (NSStringEncoding)constantToEncodingType:(NSString *)type;
- (TiDataType)constantToType:(NSString *)type;
@end
@implementation CodecModule

// iOS is 32-bit, so we need to make sure that we convert NSNumbers to the right end type based on the number of bytes.
// Note that simulator runs in 32-bit mode so we don't have to worry about 64-bit... yet.
// In particular:
// Float32 == float
// Float64 == double
// Int64 == long long (NOT long)
// Other types match up as you'd expect.

// Public API : Functions

- (NSString *)apiName
{
  return @"Ti.Codec";
}

- (NSNumber *)encodeNumber:(JSValue *)dict
{
  TiBuffer *dest = [self JSValueToNative:dict[@"dest"]];

  BOOL hasPosition = [dict hasProperty:@"position"];
  int position = hasPosition ? [dict[@"position"] toUInt32] : 0;

  BOOL hasByteOrder = [dict hasProperty:@"byteOrder"];
  CFByteOrder byteOrder = (hasByteOrder) ? [dict[@"byteOrder"] toUInt32] : CFByteOrderGetCurrent();

  NSNumber *data = [dict[@"source"] toNumber];
  NSString *type = [dict[@"type"] toString];

  int result = [TiUtils encodeNumber:data toBuffer:dest offset:position type:type endianness:byteOrder];

  switch (result) {
  case BAD_ENDIAN: {
    [self throwException:[NSString stringWithFormat:@"Invalid endianness: %ld", byteOrder]
               subreason:nil
                location:CODELOCATION];
    break;
  }
  case BAD_DEST_OFFSET: {
    NSString *errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %lu)", position, (unsigned long)[[dest data] length]];
    [self throwException:errorStr
               subreason:nil
                location:CODELOCATION];
    break;
  }
  case BAD_TYPE: {
    [self throwException:[NSString stringWithFormat:@"Invalid type identifier '%@'", type]
               subreason:nil
                location:CODELOCATION];
    break;
  }
  case TOO_SMALL: {
    [self throwException:[NSString stringWithFormat:@"Buffer of length %lu too small to hold type %@", (unsigned long)[[dest data] length], type]
               subreason:nil
                location:CODELOCATION];
    break;
  }
  default: {
    return NUMINT(result);
    break;
  }
  }
}

- (NSNumber *)decodeNumber:(JSValue *)dict
{
  TiBuffer *src = [self JSValueToNative:dict[@"source"]];

  BOOL hasPosition = [dict hasProperty:@"position"];
  int position = hasPosition ? [dict[@"position"] toUInt32] : 0;

  BOOL hasByteOrder = [dict hasProperty:@"byteOrder"];
  CFByteOrder byteOrder = (hasByteOrder) ? [dict[@"byteOrder"] toUInt32] : CFByteOrderGetCurrent();

  NSString *type = [dict[@"type"] toString];

  switch (byteOrder) {
  case CFByteOrderBigEndian:
  case CFByteOrderLittleEndian:
    break;
  default:
    [self throwException:[NSString stringWithFormat:@"Invalid endianness: %ld", byteOrder]
               subreason:nil
                location:CODELOCATION];
  }

  if (position >= [[src data] length]) {
    NSString *errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %lu)", position, (unsigned long)[[src data] length]];
    [self throwException:errorStr
               subreason:nil
                location:CODELOCATION];
  }

  const void *data = [[src data] bytes];
  switch ([TiUtils constantToType:type]) {
  case TI_BYTE: {
    // We don't need to worry about endianness for single-byte information
    char byte;
    memcpy(&byte, (void *)data + position, sizeof(byte));
    // Note that returning 'char' forces a conversion to boolean value by the Ti system, so we coerce to int
    return [NSNumber numberWithInt:byte];
    break;
  }
  case TI_SHORT: {
    uint16_t shortVal;
    memcpy(&shortVal, (void *)data + position, sizeof(shortVal));
    switch (byteOrder) {
    case CFByteOrderLittleEndian:
      return [NSNumber numberWithShort:CFSwapInt16LittleToHost(shortVal)];
    case CFByteOrderBigEndian:
      return [NSNumber numberWithShort:CFSwapInt16BigToHost(shortVal)];
    }
    break;
  }
  case TI_INT: {
    uint32_t intVal;
    memcpy(&intVal, (void *)data + position, sizeof(intVal));
    switch (byteOrder) {
    case CFByteOrderLittleEndian:
      return [NSNumber numberWithInt:CFSwapInt32LittleToHost(intVal)];
    case CFByteOrderBigEndian:
      return [NSNumber numberWithInt:CFSwapInt32BigToHost(intVal)];
    }
    break;
  }
  case TI_LONG: {
    uint64_t longVal;
    memcpy(&longVal, (void *)data + position, sizeof(longVal));
    switch (byteOrder) {
    case CFByteOrderLittleEndian:
      return [NSNumber numberWithLongLong:CFSwapInt64LittleToHost(longVal)];
    case CFByteOrderBigEndian:
      return [NSNumber numberWithLongLong:CFSwapInt64BigToHost(longVal)];
    }
    break;
  }
  case TI_FLOAT: {
    // As per encoding, we need to use a union to translate float bytes into an int structure.
    union {
      Float32 f;
      CFSwappedFloat32 sf;
    } val;
    memcpy(&(val.sf.v), (void *)data + position, sizeof(val.sf.v));
    switch (byteOrder) {
    case CFByteOrderLittleEndian: {
      val.sf.v = CFSwapInt32LittleToHost(val.sf.v);
      break;
    }
    case CFByteOrderBigEndian: {
      val.sf.v = CFSwapInt32BigToHost(val.sf.v);
      break;
    }
    }
    return [NSNumber numberWithFloat:val.f];
    break;
  }
  case TI_DOUBLE: {
    union {
      Float64 f;
      CFSwappedFloat64 sf;
    } val;
    memcpy(&(val.sf.v), (void *)data + position, sizeof(val.sf.v));
    switch (byteOrder) {
    case CFByteOrderLittleEndian: {
      val.sf.v = CFSwapInt64LittleToHost(val.sf.v);
      break;
    }
    case CFByteOrderBigEndian: {
      val.sf.v = CFSwapInt64BigToHost(val.sf.v);
      break;
    }
    }
    return [NSNumber numberWithDouble:val.f];
    break;
  }
  default:
    [self throwException:[NSString stringWithFormat:@"Invalid type identifier '%@'", type]
               subreason:nil
                location:CODELOCATION];
  }

  return NUMINT(-1);
}

- (NSNumber *)encodeString:(JSValue *)dict
{
  TiBuffer *dest = [self JSValueToNative:dict[@"dest"]];

  NSString *string = [dict[@"source"] toString];

  BOOL hasPosition = [dict hasProperty:@"position"];
  int position = hasPosition ? [dict[@"position"] toUInt32] : 0;

  BOOL hasDestPosition = [dict hasProperty:@"destPosition"];
  NSUInteger destPosition = (hasDestPosition) ? [dict[@"destPosition"] toUInt32] : 0;

  BOOL hasSrcPosition = [dict hasProperty:@"sourcePosition"];
  NSUInteger srcPosition = (hasSrcPosition) ? [dict[@"sourcePosition"] toUInt32] : 0;

  BOOL hasSrcLength = [dict hasProperty:@"sourceLength"];
  NSUInteger srcLength = (hasSrcLength) ? [dict[@"sourceLength"] toUInt32] : [string length];

  NSString *charset = [self CHARSET_UTF8];
  if ([dict hasProperty:@"charset"]) {
    charset = [dict[@"charset"] toString];
  }

  int result = [TiUtils encodeString:string toBuffer:dest charset:charset offset:destPosition sourceOffset:srcPosition length:srcLength];

  switch (result) {
  case BAD_SRC_OFFSET: {
    [self throwException:[NSString stringWithFormat:@"Offset %lu is past string bounds (length %lu)", (unsigned long)srcPosition, (unsigned long)[string length]]
               subreason:nil
                location:CODELOCATION];
    break;
  }
  case BAD_DEST_OFFSET: {
    NSString *errorStr = [NSString stringWithFormat:@"Offset %lu is past buffer bounds (length %lu)", (unsigned long)destPosition, (unsigned long)[[dest data] length]];
    [self throwException:errorStr
               subreason:nil
                location:CODELOCATION];
    break;
  }
  case BAD_ENCODING: {
    [self throwException:[NSString stringWithFormat:@"Invalid string encoding type '%@'", charset]
               subreason:nil
                location:CODELOCATION];
    break;
  }
  default: {
    return NUMINT(result);
    break;
  }
  }
}

- (NSString *)decodeString:(JSValue *)dict
{
  TiBuffer *src = [self JSValueToNative:dict[@"source"]];

  BOOL hasPosition = [dict hasProperty:@"position"];
  int position = hasPosition ? [dict[@"position"] toUInt32] : 0;

  BOOL hasLength = [dict hasProperty:@"length"];
  NSUInteger length = (hasLength) ? [dict[@"length"] toUInt32] : [[src length] intValue];

  NSString *charset = [self CHARSET_UTF8];
  if ([dict hasProperty:@"charset"]) {
    charset = [dict[@"charset"] toString];
  }

  NSStringEncoding encoding = [TiUtils charsetToEncoding:charset];
  if (encoding == 0) {
    [self throwException:[NSString stringWithFormat:@"Invalid string encoding type '%@'", charset]
               subreason:nil
                location:CODELOCATION];
  }

  if (position >= [[src data] length]) {
    NSString *errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %lu)", position, (unsigned long)[[src data] length]];
    [self throwException:errorStr
               subreason:nil
                location:CODELOCATION];
  }
  if (length > [[src data] length]) {
    NSString *errorStr = [NSString stringWithFormat:@"Length %lu is past buffer bounds (length %lu)", (unsigned long)length, (unsigned long)[[src data] length]];
    [self throwException:errorStr
               subreason:nil
                location:CODELOCATION];
  }
  if (length + position > [[src data] length]) {
    NSString *errorStr = [NSString stringWithFormat:@"total length %lu is past buffer bounds (length %lu)", position + length, (unsigned long)[[src data] length]];
    [self throwException:errorStr
               subreason:nil
                location:CODELOCATION];
  }

  return [[[NSString alloc] initWithBytes:([[src data] bytes] + position) length:length encoding:encoding] autorelease];
}

- (NSNumber *)getNativeByteOrder
{
  return NUMLONG(CFByteOrderGetCurrent());
}

// Public API : Properties

MAKE_SYSTEM_STR(CHARSET_ASCII, kTiASCIIEncoding);
MAKE_SYSTEM_STR(CHARSET_ISO_LATIN_1, kTiISOLatin1Encoding);
MAKE_SYSTEM_STR(CHARSET_UTF8, kTiUTF8Encoding);
MAKE_SYSTEM_STR(CHARSET_UTF16, kTiUTF16Encoding);
MAKE_SYSTEM_STR(CHARSET_UTF16LE, kTiUTF16LEEncoding);
MAKE_SYSTEM_STR(CHARSET_UTF16BE, kTiUTF16BEEncoding);
MAKE_SYSTEM_STR(TYPE_BYTE, kTiByteTypeName);
MAKE_SYSTEM_STR(TYPE_INT, kTiIntTypeName);
MAKE_SYSTEM_STR(TYPE_SHORT, kTiShortTypeName);
MAKE_SYSTEM_STR(TYPE_LONG, kTiLongTypeName);
MAKE_SYSTEM_STR(TYPE_FLOAT, kTiFloatTypeName);
MAKE_SYSTEM_STR(TYPE_DOUBLE, kTiDoubleTypeName);

// Because BIG_ENDIAN and LITTLE_ENDIAN are reserved macro names, we have to temporarily undefine them and then set them back after
#define OLD_LITTLE_ENDIAN LITTLE_ENDIAN
#undef LITTLE_ENDIAN
MAKE_SYSTEM_PROP(LITTLE_ENDIAN, CFByteOrderLittleEndian);
#define LITTLE_ENDIAN OLD_LITTLE_ENDIAN

#define OLD_BIG_ENDIAN BIG_ENDIAN
#undef BIG_ENDIAN
MAKE_SYSTEM_PROP(BIG_ENDIAN, CFByteOrderBigEndian);
#define BIG_ENDIAN OLD_BIG_ENDIAN

@end
#endif
