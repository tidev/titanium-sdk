/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "StreamModule.h"
#import "TiStreamProxy.h"
#import "TiBuffer.h"

#ifdef USE_TI_STREAM
@interface StreamModule(Private)
-(void)asynchRead:(TiStreamProxy*)stream args:(id)args callback:(KrollCallback*)callback;
-(void)performInvocation:(NSInvocation*)invocation; // TODO: Move this somewhere common?
@end

@implementation StreamModule

#pragma mark Internal

-(void)asynchRead:(TiStreamProxy*)stream args:(id)args callback:(KrollCallback *)callback
{
    NSMutableDictionary* event = [NSMutableDictionary dictionaryWithObjectsAndKeys:stream,@"source",[args objectAtIndex:0],@"buffer", nil];
    
    // TODO: Right now, ref to buffer is iOS-only; fix that
    @try {
        NSNumber* bytesRead = [stream read:args];
        [event setValue:bytesRead forKey:@"bytesProcessed"];
    }
    @catch (NSException* e) {
        [event setValue:[e reason] forKey:@"errorDescription"];
        [event setValue:[[e userInfo] valueForKey:@"errorCode"] forKey:@"errorState"]; // TODO: What exactly IS errorState?
    }
    @finally {
        [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
}

// Need this wrapper method to avoid leaking some autorelease objects
-(void)performInvocation:(NSInvocation*)invocation
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    [invocation invoke];
    [pool release];
}

#pragma mark Public API : Functions

-(void)read:(id)args
{
    TiStreamProxy* stream = nil;
    TiBuffer* buffer = nil;
    id offset = nil; // Spec specifies 'int' but we may do our own type coercion
    id length = nil;
    KrollCallback* callback = nil;
    NSArray* readArgs;

    // TODO: Do we throw an exception based on arg typing here?  For now, assume we throw an exception on arg type...
    ENSURE_ARG_AT_INDEX(stream, args, 0, TiStreamProxy);
    ENSURE_ARG_AT_INDEX(buffer, args, 1, TiBuffer);
    
    if ([args count] > 3) {
        ENSURE_ARG_AT_INDEX(offset, args, 2, NSObject);
        ENSURE_INT_COERCION(offset);
        ENSURE_ARG_AT_INDEX(length, args, 3, NSObject);
        ENSURE_INT_COERCION(length);
        ENSURE_ARG_AT_INDEX(callback, args, 4, KrollCallback);
        
        readArgs = [args subarrayWithRange:NSMakeRange(1, 3)];
    }
    else {
        ENSURE_ARG_AT_INDEX(callback, args, 2, KrollCallback);
        readArgs = [args subarrayWithRange:NSMakeRange(1, 1)];
    }
    
    NSInvocation* invoke = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(asynchRead:args:callback:)]];
    [invoke setTarget:self];
    [invoke setSelector:@selector(asynchRead:args:callback:)];
    [invoke setArgument:&stream atIndex:2];
    [invoke setArgument:&readArgs atIndex:3];
    [invoke setArgument:&callback atIndex:4];
    [invoke retainArguments];
    
    [self performSelectorInBackground:@selector(performInvocation:) withObject:invoke];
}

@end
#endif