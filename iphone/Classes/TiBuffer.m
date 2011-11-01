/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiBuffer.h"
#import "TiUtils.h"

NSArray* bufferKeySequence = nil;

@implementation TiBuffer
@synthesize data, byteOrder;

#pragma mark Internals

-(id)init
{
    if (self = [super init]) {
        byteOrder = [[NSNumber numberWithInt:CFByteOrderGetCurrent()] retain];
    }
    return self;
}

-(void)dealloc
{
    RELEASE_TO_NIL(data);
    RELEASE_TO_NIL(byteOrder);
    [super dealloc];
}

-(NSArray *)keySequence
{
	if (bufferKeySequence == nil)
	{
		bufferKeySequence = [[NSArray arrayWithObjects:@"length",nil] retain];
	}
	return bufferKeySequence;
}

#pragma mark Public API : Functions

// NOTE: Translating to 32-bit values is OK here... NSData is a 32-bit length max on iOS!  It's unsigned, as well.
// However, SIGNED ints allow access to up to 1GB of data as far as addressing... but it might still be worthwhile to coerce.
// Although we can always just place this limit in documentation, because it makes life easier on us (one conversion to int vs.
// two conversions, to int and uint - one for typechecking, the other for indexing.)
-(NSNumber*)append:(id)args
{
    TiBuffer* source = nil;
    int sourceOffset;
    BOOL hasSourceOffset;
    int sourceLength;
    BOOL hasSourceLength;
    
    ENSURE_ARG_AT_INDEX(source, args, 0, TiBuffer);
    ENSURE_INT_OR_NIL_AT_INDEX(sourceOffset, args, 1, hasSourceOffset);
    ENSURE_INT_OR_NIL_AT_INDEX(sourceLength, args, 2, hasSourceLength);
    
    sourceOffset = (hasSourceOffset) ? sourceOffset : 0;
    sourceLength = (hasSourceLength) ? sourceLength : [[source data] length];
    
    if (sourceOffset >= [[source data] length]) {
        [self throwException:@"TiBoundsException"
                   subreason:[NSString stringWithFormat:@"Source offset %d is past source bounds (length %d)",sourceOffset,[[source data] length]]
                    location:CODELOCATION];
    }
    
    int length = MIN(sourceLength, [[source data] length] - sourceOffset);
    const void* bytes = [[source data] bytes];
	if(data == nil) {
		data = [[NSMutableData alloc] initWithBytes:bytes+sourceOffset length:length];
	} else {
		[data appendBytes:(bytes+sourceOffset) length:length];
	}
    
    return NUMINT(length);
}

-(NSNumber*)insert:(id)args
{
    TiBuffer* source = nil;
    int offset;
    int sourceOffset;
    BOOL hasSourceOffset;
    int sourceLength;
    BOOL hasSourceLength;
    
    ENSURE_ARG_AT_INDEX(source, args, 0, TiBuffer);
    ENSURE_INT_AT_INDEX(offset, args, 1);
    ENSURE_INT_OR_NIL_AT_INDEX(sourceOffset, args, 2, hasSourceOffset);
    ENSURE_INT_OR_NIL_AT_INDEX(sourceLength, args, 3, hasSourceLength);
    
    sourceOffset = (hasSourceOffset) ? sourceOffset : 0;
    sourceLength = (hasSourceLength) ? sourceLength : [[source data] length];
    
    if (offset >= [data length]) {
        [self throwException:@"TiBoundsException"
                   subreason:[NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",offset,[data length]]
                    location:CODELOCATION];
    }
    if (sourceOffset >= [[source data] length]) {
        [self throwException:@"TiBoundsException"
                   subreason:[NSString stringWithFormat:@"Source offset %d is past source bounds (length %d)",sourceOffset,[[source data] length]]
                    location:CODELOCATION];
    }
    
    // There is no natural 'insert' operation on NSData, so we perform it as so:
    // 1. Extend the data the amount of 'length'
    // 2. "shift" the existing data from 'offset' over 'length'
    // 3. Copy the bytes into the data starting at 'offset'.
    
    // Here we have 2 possible lengths: sourceLength, or the data from sourceOffset to the end of the source buffer.
    // We're extending the buffer, so the end of our current data is IRRELEVANT.
    int length = MIN(sourceLength, [[source data] length]-sourceOffset);
    
    // 1.
    [data increaseLengthBy:length];
    
    // 2.
    const void* currentBytes = [data bytes];
    [data replaceBytesInRange:NSMakeRange(offset+length,[data length]-(offset+length)) withBytes:(currentBytes+offset)];
    
    // 3.
    const void* newBytes = [[source data] bytes];
    [data replaceBytesInRange:NSMakeRange(offset,length) withBytes:(newBytes+sourceOffset)];
    
    return NUMINT(length);  
}

-(NSNumber*)copy:(id)args
{
    TiBuffer* sourceBuffer = nil;
    int offset;
    int sourceOffset;
    BOOL hasSourceOffset;
    int sourceLength;
    BOOL hasSourceLength;
    
    ENSURE_ARG_AT_INDEX(sourceBuffer, args, 0, TiBuffer);
    ENSURE_INT_AT_INDEX(offset, args, 1);
    ENSURE_INT_OR_NIL_AT_INDEX(sourceOffset, args, 2, hasSourceOffset);
    ENSURE_INT_OR_NIL_AT_INDEX(sourceLength, args, 3, hasSourceLength);
    
    sourceOffset = (hasSourceOffset) ? sourceOffset : 0;
    sourceLength = (hasSourceLength) ? sourceLength : [[sourceBuffer data] length];
    
    if (offset >= [data length]) {
        [self throwException:@"TiBoundsException"
                   subreason:[NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",offset,[data length]]
                    location:CODELOCATION];
    }
    if (sourceOffset >= [[sourceBuffer data] length]) {
        [self throwException:@"TiBoundsException"
                   subreason:[NSString stringWithFormat:@"Source offset %d is past source bounds (length %d)",sourceOffset,[[sourceBuffer data] length]]
                    location:CODELOCATION];
    }
    
    // Assume that "sourceLength" is a hint; don't throw an exception if it extends past the end of the source
    const void* source = [[sourceBuffer data] bytes];
    
    // We have three possible lengths: sourceLength, the remaining length in our destination buffer, the remaining length in the source buffer.
    // We pick the smallest one!
    NSRange replacement = NSMakeRange(offset, MIN(MIN(sourceLength, [data length]-offset), [[sourceBuffer data] length]-sourceOffset));
    [data replaceBytesInRange:replacement withBytes:(source+sourceOffset)];
    
    return NUMINT(replacement.length);
}

-(TiBuffer*)clone:(id)args
{
    id offset = nil;
    id length = nil;
    
    ENSURE_ARG_OR_NIL_AT_INDEX(offset, args, 0, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(length, args, 1, NSObject);
    
    if (offset != nil && length == nil) {
        [self throwException:@"TiArgsException"
                   subreason:@"Bad args to clone(): Expected (int offset, int length), found (int length)"
                    location:CODELOCATION];
    }

    int offsetVal = [TiUtils intValue:offset];
    int lengthVal = [TiUtils intValue:length def:[data length]];
    
    // TODO: What do we do if offset goes past the end of the buffer?
    // For now, do the sensible thing... throw an exception.
    if (offsetVal > [data length]) {
        [self throwException:@"TiBoundsException"
                   subreason:[NSString stringWithFormat:@"Offset %d extends past data length %u", offsetVal, [data length]]
                    location:CODELOCATION];
    }
    
    // TODO: What do we do if offset+length goes past the end of the buffer?
    // For now, do the sensible thing... only go up to the end.
    if (offsetVal + lengthVal > [data length]) {
        lengthVal = [data length] - offsetVal;
    }
    
    NSMutableData* cloneData = [[[NSMutableData alloc] initWithData:[data subdataWithRange:NSMakeRange(offsetVal, lengthVal)]] autorelease];
    
    TiBuffer* newBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
    [newBuffer setData:cloneData];
    return newBuffer;
}

-(void)fill:(id)args
{
    id fillByte = nil;
    id offset = nil;
    id length = nil;
    
    ENSURE_ARG_AT_INDEX(fillByte, args, 0, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(offset, args, 1, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(length, args, 2, NSObject);
    
    if (offset != nil && length == nil) {
        [self throwException:@"TiArgsException"
                   subreason:@"Bad args to fill(): Expected (int offset, int length), found (int length)"
                    location:CODELOCATION];
    }
    
    char byte = [TiUtils intValue:fillByte];
    int offsetVal = [TiUtils intValue:offset];
    int lengthVal = [TiUtils intValue:length def:[data length]];
    
    // TODO: What do we do if offset goes past the end of the buffer?
    // For now, do the sensible thing... throw an exception.
    if (offsetVal > [data length]) {
        [self throwException:@"TiBoundsException"
                   subreason:[NSString stringWithFormat:@"Offset %d extends past data length %u", offsetVal, [data length]]
                    location:CODELOCATION];
    }
    
    // TODO: What do we do if offset+length goes past the end of the buffer?
    // For now, do the sensible thing... only go up to the end.
    if (offsetVal + lengthVal > [data length]) {
        lengthVal = [data length] - offsetVal;
    } 
    
    void* bytes = [data mutableBytes];
    for (int i=offsetVal; i < offsetVal+lengthVal; i++) {
        *(char*)(bytes+i) = byte;
    }
}


-(void)clear:(id)_void
{
    [data resetBytesInRange:NSMakeRange(0, [data length])];
}

-(void)release:(id)_void
{
    RELEASE_TO_NIL(data);
}

-(TiBlob*)toBlob:(id)_void
{
	//TODO: Static analysis finds we're leaking the [data copy]. We should have an autorelease here, but for later.
    return [[[TiBlob alloc] initWithData:[data copy] mimetype:@"application/octet-stream"] autorelease];
}

-(NSString*)toString:(id)_void 
{
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
}

#pragma mark Public API : Properties

-(void)setLength:(NSNumber*)length
{
    int len = [TiUtils intValue:length];
    if (len == 0) {
        RELEASE_TO_NIL(data);
        return;
    }
    
    if (data == nil) {
        data = [[NSMutableData alloc] initWithLength:len];
    }
    else {
        [data setLength:len];
    }
}

-(NSNumber*)length
{
    return NUMINT([data length]);
}

#pragma mark "operator[] overload" (Array behavior)

-(void)setValue:(id)value forUndefinedKey:(NSString *)key
{
    int index = [key intValue];
    // -[NSString intValue] returns 0 for unparsables; so check to for isEqual:@"0" on that value
    if (index != 0 || [key isEqualToString:@"0"]) {
        if (index < 0 || index >= [data length]) {
            [self throwException:@"TiBoundsException"
                       subreason:[NSString stringWithFormat:@"Index %d out of bounds on buffer (length %u)", index, [data length]]
                        location:CODELOCATION];
        }
        if (![value respondsToSelector:@selector(charValue)]) {
            [self throwException:@"TiTypeException"
                       subreason:[NSString stringWithFormat:@"Object %@ cannot be converted to a byte",value]
                        location:CODELOCATION];
            return;
        }
        
        void* bytes = [data mutableBytes];
        *(unsigned char*)(bytes+index) = (unsigned char)[value charValue];
    }
    else {
        [super setValue:value forUndefinedKey:key];
    }
}

-(id)valueForUndefinedKey:(NSString *)key
{
    int index = [key intValue];
    if (index != 0 || [key isEqualToString:@"0"]) {
        if (index < 0 || index >= [data length]) {
            [self throwException:@"TiBoundsException"
                       subreason:[NSString stringWithFormat:@"Index %d out of bounds on buffer (length %u)", index, [data length]]
                        location:CODELOCATION];
        }
        
        const void* bytes = [data bytes];
        // NOTE: We have to do this internal type conversion because in the id->TiValue process, a byte
        // is autotranslated to a boolean.  So we get the value as a char, then coerce to int.
        return [NSNumber numberWithInt:*(unsigned char*)(bytes+index)];
    }
    else {
        return [super valueForUndefinedKey:key];
    }
}

@end
