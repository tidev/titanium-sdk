/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "CodecModule.h"
#import "TiBuffer.h"

#ifdef USE_TI_CODEC

NSDictionary* encodingMap = nil;
NSDictionary* typeMap = nil;



@interface CodecModule(Private)
-(NSStringEncoding)constantToEncodingType:(NSString*)type;
-(TiDataType)constantToType:(NSString*)type;
@end
@implementation CodecModule

// Internals

-(NSStringEncoding)constantToEncodingType:(NSString*)type
{
    if (encodingMap == nil) {
        encodingMap = [NSDictionary dictionaryWithObjectsAndKeys:
                   NUMLONGLONG(NSASCIIStringEncoding), [self CHARSET_ASCII],
                   NUMLONGLONG(NSISOLatin1StringEncoding), [self CHARSET_ISO_LATIN_1],
                   NUMLONGLONG(NSUTF8StringEncoding), [self CHARSET_UTF8],
                   NUMLONGLONG(NSUTF16StringEncoding), [self CHARSET_UTF16],
                   NUMLONGLONG(NSUTF16BigEndianStringEncoding), [self CHARSET_UTF16BE],
                   NUMLONGLONG(NSUTF16LittleEndianStringEncoding), [self CHARSET_UTF16LE],
                   nil];
    }
    return [[encodingMap valueForKey:type] longLongValue];
}

-(TiDataType)constantToType:(NSString *)type
{
    if (typeMap == nil) {
        typeMap = [NSDictionary dictionaryWithObjectsAndKeys:
                   NUMINT(TI_BYTE), [self TYPE_BYTE],
                   NUMINT(TI_SHORT), [self TYPE_SHORT],
                   NUMINT(TI_INT), [self TYPE_INT],
                   NUMINT(TI_LONG), [self TYPE_LONG],
                   NUMINT(TI_FLOAT), [self TYPE_FLOAT],
                   NUMINT(TI_DOUBLE), [self TYPE_DOUBLE],
                   nil];
    }
    return [[typeMap valueForKey:type] intValue];
}

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
    ENSURE_ARG_FOR_KEY(data, args, @"data", NSNumber);
    ENSURE_ARG_FOR_KEY(type, args, @"type", NSString);
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
    
    if (position >= [[dest data] length]) {
        NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",position,[[dest data] length]];
        [self throwException:errorStr
                   subreason:nil
                    location:CODELOCATION];
    }
    
    void* bytes = [[dest data] mutableBytes];
    size_t size;
    
    // TODO: We should be checking for the edge case where position+sizeof(data) > [buffer length]
    switch ([self constantToType:type]) {
        case TI_BYTE: {
            char byte = [data charValue];
            size = sizeof(byte);
            memcpy(&byte, bytes+position, size);
            break;
        }
        case TI_SHORT: {
            uint16_t val = [data shortValue];
            size = sizeof(val);
            switch (byteOrder) {
                case CFByteOrderLittleEndian: {
                    val = CFSwapInt16HostToLittle(val);
                    break;
                }
                case CFByteOrderBigEndian: {
                    val = CFSwapInt16HostToBig(val);
                    break;
                }
            }
            memcpy(&val, bytes+position, size);
            break;
        }
        case TI_INT: {
            uint32_t val = [data intValue];
            size = sizeof(val);
            switch (byteOrder) {
                case CFByteOrderLittleEndian: {
                    val = CFSwapInt32HostToLittle(val);
                    break;
                }
                case CFByteOrderBigEndian: {
                    val = CFSwapInt32HostToBig(val);
                    break;
                }
            }
            memcpy(&val, bytes+position, size);
            break;
        }
        case TI_LONG: {
            uint64_t val = [data longLongValue];
            size = sizeof(val);
            switch (byteOrder) {
                case CFByteOrderLittleEndian: {
                    val = CFSwapInt64HostToLittle(val);
                    break;
                }
                case CFByteOrderBigEndian: {
                    val = CFSwapInt64HostToBig(val);
                    break;
                }
            }
            memcpy(&val, bytes+position, size);
            break;
        }
        case TI_FLOAT: {
            CFSwappedFloat32 val = CFConvertFloat32HostToSwapped([data floatValue]);
            size = sizeof(val.v);
            switch (byteOrder) {
                case CFByteOrderLittleEndian: {
                    val.v = CFSwapInt32HostToLittle(val.v);
                    break;
                }
                case CFByteOrderBigEndian: {
                    val.v = CFSwapInt32HostToBig(val.v);
                    break;
                }
            }
            memcpy(&(val.v), bytes+position, size);
            break;
        }
        case TI_DOUBLE: {
            CFSwappedFloat64 val = CFConvertFloat64HostToSwapped([data doubleValue]);
            size = sizeof(val.v);
            switch (byteOrder) {
                case CFByteOrderLittleEndian: {
                    val.v = CFSwapInt64HostToLittle(val.v);
                    break;
                }
                case CFByteOrderBigEndian: {
                    val.v = CFSwapInt64HostToBig(val.v);
                    break;
                }
            }
            memcpy(&(val.v), bytes+position, size);
            break;
        }
        default:
            [self throwException:[NSString stringWithFormat:@"Invalid type identifier '%@'",type]
                       subreason:nil
                        location:CODELOCATION];
    }
    
    return [NSNumber numberWithInt:(position+size)];
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
    
    ENSURE_ARG_FOR_KEY(src,args,@"src",TiBuffer);
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
    switch ([self constantToType:type]) {
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
    ENSURE_ARG_FOR_KEY(string, args, @"string", NSString);
    ENSURE_INT_OR_NIL_FOR_KEY(srcPosition, args, @"srcPosition", hasSrcPosition);
    ENSURE_INT_OR_NIL_FOR_KEY(srcLength, args, @"srcLength", hasSrcLength);
    ENSURE_ARG_FOR_KEY(charset, args, @"charset", NSString);
    
    destPosition = (hasDestPosition) ? destPosition : 0;
    srcPosition = (hasSrcPosition) ? srcPosition : 0;
    srcLength = (hasSrcLength) ? srcLength : [string length];
    
    // TODO: Define standardized behavior.. but for now:
    // 1. Throw exception if destPosition extends past [dest length]
    // 2. Throw exception if srcPosition > [string length]
    // 3. Use srcLength as a HINT (as in all other buffer ops)
    
    if (destPosition >= [[dest data] length]) {
        NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",destPosition,[[dest data] length]];
        [self throwException:errorStr
                   subreason:nil
                    location:CODELOCATION];
    }
    if (srcPosition >= [string length]) {
        [self throwException:[NSString stringWithFormat:@"Offset %d is past string bounds (length %d)",srcPosition,[string length]]
                   subreason:nil
                    location:CODELOCATION];
    }
    
    NSStringEncoding encoding = [self constantToEncodingType:charset];
    if (encoding == 0) { // Invalid encoding
        [self throwException:[NSString stringWithFormat:@"Invalid string encoding type '%@'",charset]
                   subreason:nil 
                    location:CODELOCATION];
    }
    
    // TODO: This does not encode the null terminator... do we want it?
    int length = MIN(srcLength, [string length] - srcPosition);
    [string getBytes:([[dest data] mutableBytes]+destPosition)
           maxLength:length
          usedLength:NULL 
            encoding:encoding
             options:NSStringEncodingConversionAllowLossy // TODO: Is this always right? 
               range:NSMakeRange(srcPosition,length) 
      remainingRange:NULL];
    
    return NUMINT(destPosition+length);
}

-(NSString*)decodeString:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    TiBuffer* src = nil;
    int position;
    int length;
    NSString* charset = nil;
    
    ENSURE_ARG_FOR_KEY(src, args, @"src", TiBuffer);
    ENSURE_INT_FOR_KEY(position, args, @"position");
    ENSURE_INT_FOR_KEY(length, args, @"length");
    ENSURE_ARG_OR_NIL_FOR_KEY(charset, args, @"charset", NSString);
    
    charset = (charset) ? charset : [self CHARSET_UTF8];
    NSStringEncoding encoding = [self constantToEncodingType:charset];
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

MAKE_SYSTEM_STR(CHARSET_ASCII,@"ascii");
MAKE_SYSTEM_STR(CHARSET_ISO_LATIN_1,@"iso-latin-1");
MAKE_SYSTEM_STR(CHARSET_UTF8,@"utf8");
MAKE_SYSTEM_STR(CHARSET_UTF16,@"utf16");
MAKE_SYSTEM_STR(CHARSET_UTF16LE,@"utf16le");
MAKE_SYSTEM_STR(CHARSET_UTF16BE,@"utf16be");
MAKE_SYSTEM_STR(TYPE_BYTE,@"byte");
MAKE_SYSTEM_STR(TYPE_INT,@"int");
MAKE_SYSTEM_STR(TYPE_SHORT,@"short");
MAKE_SYSTEM_STR(TYPE_LONG,@"long");
MAKE_SYSTEM_STR(TYPE_FLOAT, @"float");
MAKE_SYSTEM_STR(TYPE_DOUBLE, @"double");

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