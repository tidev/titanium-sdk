/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStreamProxy.h"

@implementation TiStreamProxy

#pragma mark Public API : Functions

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
        return NUMINT([self readToBuffer:buffer offset:0 length:[[buffer data] length] callback:nil]);
    }
    else {
        if (offset == nil || length == nil) {
            // TODO: Codify behavior
            [self throwException:@"StreamException"
                       subreason:@"Invalid OFFSET or LENGTH value"
                        location:CODELOCATION];
        }
        return NUMINT([self readToBuffer:buffer offset:[offset intValue] length:[length intValue] callback:nil]);
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
