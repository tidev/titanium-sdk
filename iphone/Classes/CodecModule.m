/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "CodecModule.h"
#import "TiBuffer.h"

#ifdef USE_TI_CODEC

@interface CodecModule(Private)
-(NSStringEncoding)constantToEncodingType:(NSString*)type;
-(TiDataType)constantToType:(NSString*)type;
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

-(NSNumber*)encodeNumber:(id)args
{
    ENSURE_SINGLE_ARG(args, NSDictionary);
    
    TiBuffer* dest = nil;
    int position;
    BOOL hasPosition;
    NSNumber* data;
    NSString* type;
    CFByteOrder byteOrder;
    BOOL hasByteOrder;
    
    ENSURE_ARG_FOR_KEY(dest, args, @"dest", TiBuffer);
    ENSURE_INT_OR_NIL_FOR_KEY(position, args, @"position", hasPosition);
    ENSURE_ARG_FOR_KEY(data, args, @"source", NSNumber);
    ENSURE_ARG_FOR_KEY(type, args, @"type", NSString);
    ENSURE_INT_OR_NIL_FOR_KEY(byteOrder, args, @"byteOrder", hasByteOrder);
    
    position = (hasPosition) ? position : 0;
    byteOrder = (hasByteOrder) ? byteOrder : CFByteOrderGetCurrent();
    
    int result = [TiUtils encodeNumber:data toBuffer:dest offset:position type:type endianness:byteOrder];
    
    switch (result) {
        case BAD_ENDIAN: {
            [self throwException:[NSString stringWithFormat:@"Invalid endianness: %d", byteOrder]
                       subreason:nil
                        location:CODELOCATION];
            break;
        }
        case BAD_DEST_OFFSET: {
            NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",position,[[dest data] length]];
            [self throwException:errorStr
                       subreason:nil
                        location:CODELOCATION];
            break;
        }
        case BAD_TYPE: {
            [self throwException:[NSString stringWithFormat:@"Invalid type identifier '%@'",type]
                       subreason:nil
                        location:CODELOCATION];
            break;
        }
        case TOO_SMALL: {
            [self throwException:[NSString stringWithFormat:@"Buffer of length %d too small to hold type %@",[[dest data] length], type]
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

-(NSNumber*)decodeNumber:(id)args
{
    ENSURE_SINGLE_ARG(args, NSDictionary);
    
    TiBuffer* src = nil;
    NSString* type;
    int position;
    BOOL hasPosition;
    CFByteOrder byteOrder;
    BOOL hasByteOrder;
    
    ENSURE_ARG_FOR_KEY(src,args,@"source",TiBuffer);
    ENSURE_ARG_FOR_KEY(type, args, @"type", NSString);
    ENSURE_INT_OR_NIL_FOR_KEY(position, args, @"position", hasPosition);
    ENSURE_INT_OR_NIL_FOR_KEY(byteOrder, args, @"byteOrder", hasByteOrder);
    
    position = (hasPosition) ? position : 0;
    byteOrder = (hasByteOrder) ? byteOrder : CFByteOrderGetCurrent();
    
    switch (byteOrder) {
        case CFByteOrderBigEndian:
        case CFByteOrderLittleEndian:
            break;
        default:
            [self throwException:[NSString stringWithFormat:@"Invalid endianness: %d", byteOrder]
                       subreason:nil
                        location:CODELOCATION];
    }
    
    if (position >= [[src data] length]) {
        NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",position,[[src data] length]];
        [self throwException:errorStr
                   subreason:nil
                    location:CODELOCATION];
    }
    
    const void* data = [[src data] bytes];
    switch ([TiUtils constantToType:type]) {
        case TI_BYTE: {
            // We don't need to worry about endianness for single-byte information
            char byte;
            memcpy((void*)data+position, &byte, sizeof(byte));
            // Note that returning 'char' forces a conversion to boolean value by the Ti system, so we coerce to int
            return [NSNumber numberWithInt:byte];
            break;
        }
        case TI_SHORT: {
            uint16_t shortVal;
            memcpy((void*)data+position, &shortVal, sizeof(shortVal));
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
            memcpy((void*)data+position, &intVal, sizeof(intVal));
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
            memcpy((void*)data+position, &longVal, sizeof(longVal));
            switch (byteOrder) {
                case CFByteOrderLittleEndian:
                    return [NSNumber numberWithLongLong:CFSwapInt64LittleToHost(longVal)];
                case CFByteOrderBigEndian:
                    return [NSNumber numberWithLongLong:CFSwapInt64BigToHost(longVal)];
            }
            break;
        }
        case TI_FLOAT: {
            CFSwappedFloat32 floatVal;
            memcpy((void*)data+position, &(floatVal.v), sizeof(floatVal.v));
            switch (byteOrder) {
                case CFByteOrderLittleEndian: {
                    floatVal.v = CFSwapInt32LittleToHost(floatVal.v);
                    break;
                }
                case CFByteOrderBigEndian: {
                    floatVal.v = CFSwapInt32BigToHost(floatVal.v);
                    break;
                }
            }
            return [NSNumber numberWithFloat:CFConvertFloat32SwappedToHost(floatVal)];
            break;
        }
        case TI_DOUBLE: {
            CFSwappedFloat64 doubleVal;
            memcpy((void*)data+position, &(doubleVal.v), sizeof(doubleVal.v));
            switch (byteOrder) {
                case CFByteOrderLittleEndian: {
                    doubleVal.v = CFSwapInt64LittleToHost(doubleVal.v);
                    break;
                }
                case CFByteOrderBigEndian: {
                    doubleVal.v = CFSwapInt64BigToHost(doubleVal.v);
                    break;
                }
            }
            return [NSNumber numberWithDouble:CFConvertFloat64SwappedToHost(doubleVal)];
            break;
        }
        default:
            [self throwException:[NSString stringWithFormat:@"Invalid type identifier '%@'",type]
                       subreason:nil
                        location:CODELOCATION];
    }
    
    return NUMINT(-1);
}

-(NSNumber*)encodeString:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    TiBuffer* dest = nil;
    int destPosition;
    BOOL hasDestPosition;
    NSString* string = nil;
    int srcPosition;
    BOOL hasSrcPosition;
    int srcLength;
    BOOL hasSrcLength;
    NSString* charset;
    
    ENSURE_ARG_FOR_KEY(dest, args, @"dest", TiBuffer);
    ENSURE_INT_OR_NIL_FOR_KEY(destPosition, args, @"destPosition", hasDestPosition);
    ENSURE_ARG_FOR_KEY(string, args, @"source", NSString);
    ENSURE_INT_OR_NIL_FOR_KEY(srcPosition, args, @"sourcePosition", hasSrcPosition);
    ENSURE_INT_OR_NIL_FOR_KEY(srcLength, args, @"sourceLength", hasSrcLength);
    ENSURE_ARG_OR_NIL_FOR_KEY(charset, args, @"charset", NSString);
    
    destPosition = (hasDestPosition) ? destPosition : 0;
    srcPosition = (hasSrcPosition) ? srcPosition : 0;
    srcLength = (hasSrcLength) ? srcLength : [string length];
    charset = (charset) ? charset : [self CHARSET_UTF8];
    
    int result = [TiUtils encodeString:string toBuffer:dest charset:charset offset:destPosition sourceOffset:srcPosition length:srcLength];
    
    switch (result) {
        case BAD_SRC_OFFSET: {
            [self throwException:[NSString stringWithFormat:@"Offset %d is past string bounds (length %d)",srcPosition,[string length]]
                       subreason:nil
                        location:CODELOCATION];
            break;
        }
        case BAD_DEST_OFFSET: {
            NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",destPosition,[[dest data] length]];
            [self throwException:errorStr
                       subreason:nil
                        location:CODELOCATION];
            break;
        }
        case BAD_ENCODING: {
            [self throwException:[NSString stringWithFormat:@"Invalid string encoding type '%@'",charset]
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

-(NSString*)decodeString:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    TiBuffer* src = nil;
    int position;
    int length;
    NSString* charset = nil;
    
    ENSURE_ARG_FOR_KEY(src, args, @"source", TiBuffer);
    ENSURE_INT_FOR_KEY(position, args, @"position");
    ENSURE_INT_FOR_KEY(length, args, @"length");
    ENSURE_ARG_OR_NIL_FOR_KEY(charset, args, @"charset", NSString);
    
    charset = (charset) ? charset : [self CHARSET_UTF8];
    NSStringEncoding encoding = [TiUtils charsetToEncoding:charset];
    if (encoding == 0) {
        [self throwException:[NSString stringWithFormat:@"Invalid string encoding type '%@'",charset]
                   subreason:nil 
                    location:CODELOCATION];        
    }
    
    if (position >= [[src data] length]) {
        NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",position,[[src data] length]];
        [self throwException:errorStr
                   subreason:nil
                    location:CODELOCATION];        
    }
    if (length > [[src data] length]) {
        NSString* errorStr = [NSString stringWithFormat:@"Length %d is past buffer bounds (length %d)",length,[[src data] length]];
        [self throwException:errorStr
                   subreason:nil
                    location:CODELOCATION];        
    }
    if (length+position > [[src data] length]) {
        NSString* errorStr = [NSString stringWithFormat:@"total length %d is past buffer bounds (length %d)",position+length,[[src data] length]];
        [self throwException:errorStr
                   subreason:nil
                    location:CODELOCATION];      
    }
    
    return [[[NSString alloc] initWithBytes:([[src data] bytes]+position) length:length encoding:encoding] autorelease];
}

-(NSNumber*)getNativeByteOrder:(id)_void
{
    return NUMINT(CFByteOrderGetCurrent());
}

// Public API : Properties

MAKE_SYSTEM_STR(CHARSET_ASCII,kTiASCIIEncoding);
MAKE_SYSTEM_STR(CHARSET_ISO_LATIN_1,kTiISOLatin1Encoding);
MAKE_SYSTEM_STR(CHARSET_UTF8,kTiUTF8Encoding);
MAKE_SYSTEM_STR(CHARSET_UTF16,kTiUTF16Encoding);
MAKE_SYSTEM_STR(CHARSET_UTF16LE,kTiUTF16LEEncoding);
MAKE_SYSTEM_STR(CHARSET_UTF16BE,kTiUTF16BEEncoding);
MAKE_SYSTEM_STR(TYPE_BYTE,kTiByteTypeName);
MAKE_SYSTEM_STR(TYPE_INT,kTiIntTypeName);
MAKE_SYSTEM_STR(TYPE_SHORT,kTiShortTypeName);
MAKE_SYSTEM_STR(TYPE_LONG,kTiLongTypeName);
MAKE_SYSTEM_STR(TYPE_FLOAT,kTiFloatTypeName);
MAKE_SYSTEM_STR(TYPE_DOUBLE,kTiDoubleTypeName);

// Because BIG_ENDIAN and LITTLE_ENDIAN are reserved macro names, we have to return them as "undefined keys"...
// Defining a method name for them conflicts with the macros.
-(id)valueForUndefinedKey:(NSString *)key
{
    if ([key isEqualToString:@"LITTLE_ENDIAN"]) {
        return NUMINT(CFByteOrderLittleEndian);
    }
    else if ([key isEqualToString:@"BIG_ENDIAN"]) {
        return NUMINT(CFByteOrderBigEndian);
    }
    return [super valueForUndefinedKey:key];
}

@end
#endif