/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStreamProxy.h"
#import "TiBuffer.h"

@interface TiStreamProxy (Private)
-(int)readToBuffer:(TiBuffer*)buffer;
-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length;
-(int)writeFromBuffer:(TiBuffer*)buffer;
-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length;
@end

@implementation TiStreamProxy

#pragma mark Internals

// Backend implementations - these correspond to the available args from read/write
-(int)readToBuffer:(TiBuffer*)buffer
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"readIntoBuffer:"
                location:CODELOCATION];
}

-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"readIntoBuffer:offset:length:"
                location:CODELOCATION];
}

-(int)writeFromBuffer:(TiBuffer*)buffer
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"writeFromBuffer:"
                location:CODELOCATION];
}

-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    [self throwException:@"UNIMPLEMENTED STREAM METHOD"
               subreason:@"writeFromBuffer:offset:length:"
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
        return NUMINT([self readToBuffer:buffer]);
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
        return NUMINT([self writeFromBuffer:buffer]);
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
