/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStreamProxy.h"

@implementation TiStreamProxy

#pragma mark Internals

// Backend implementations - we have a few:
// 1. Read/write
// 2. Asynch read/write (may require different behavior than simple read/write)
// TODO: 3. readAll() ? / adjust buffer size / hasBytes() / etc.

-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"readIntoBuffer:offset:length:"
                location:CODELOCATION];
}

-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"writeFromBuffer:offset:length:"
                location:CODELOCATION];
}

-(int)asynchRead:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"asynchRead:offset:length:callback:"
                location:CODELOCATION];
}

-(int)asynchWrite:(TiBuffer *)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback 
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"asynchWrite:offset:length:callback:"
                location:CODELOCATION];
}


#pragma mark Public API : Functions

-(NSNumber*)isReadable:(id)_void
{
    return NUMBOOL(NO);
}

-(NSNumber*)isWritable:(id)_void
{
    return NUMBOOL(NO);
}

-(NSNumber*)read:(id)args
{
    if (![[self isReadable:nil] boolValue]) {
        // TODO: Codify exception name
        [self throwException:@"StreamException"
                   subreason:@"Stream is not readable"
                    location:CODELOCATION];
    }
    
    TiBuffer* buffer = nil;
    id offset = nil;
    id length = nil;
    
    ENSURE_ARG_AT_INDEX(buffer, args, 0, TiBuffer);
    ENSURE_ARG_OR_NIL_AT_INDEX(offset, args, 1, NSObject);
    ENSURE_INT_COERCION(offset);
    ENSURE_ARG_OR_NIL_AT_INDEX(length, args, 2, NSObject);
    ENSURE_INT_COERCION(length);
    
    if (offset == nil && length == nil) {
        return NUMINT([self readToBuffer:buffer offset:0 length:[[buffer data] length]]);
    }
    else {
        if (offset == nil || length == nil) {
            // TODO: Codify behavior
            [self throwException:@"StreamException"
                       subreason:@"Invalid OFFSET or LENGTH value"
                        location:CODELOCATION];
        }
        return NUMINT([self readToBuffer:buffer offset:[offset intValue] length:[length intValue]]);
    }
    
    return NUMINT(-1);
}

-(NSNumber*)write:(id)args
{
    if (![[self isWritable:nil] boolValue]) {
        // TODO: Codify exception name
        [self throwException:@"StreamException"
                   subreason:@"Stream is not writable"
                    location:CODELOCATION];
    }
    
    TiBuffer* buffer = nil;
    id offset = nil; // May need to perform type coercion from string->int
    id length = nil;
    
    ENSURE_ARG_AT_INDEX(buffer, args, 0, TiBuffer);
    ENSURE_ARG_OR_NIL_AT_INDEX(offset, args, 1, NSObject);
    ENSURE_INT_COERCION(offset);
    ENSURE_ARG_OR_NIL_AT_INDEX(length, args, 2, NSObject);
    ENSURE_INT_COERCION(offset);
    
    if (offset == nil && length == nil) {
        return NUMINT([self writeFromBuffer:buffer offset:0 length:[[buffer data] length]]);
    }
    else {
        if (offset == nil || length == nil) {
            // TODO: Codify behavior
            [self throwException:@"StreamException"
                       subreason:@"Invalid OFFSET or LENGTH value"
                        location:CODELOCATION];
        }
        return NUMINT([self writeFromBuffer:buffer offset:[offset intValue] length:[length intValue]]);
    }
    
    return NUMINT(-1);
}

@end
