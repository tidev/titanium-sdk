/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "StreamModule.h"
#import "TiStreamProxy.h"
#import "TiBuffer.h"
#import "TiDataStream.h"

#ifdef USE_TI_STREAM
@interface StreamModule(Private)
-(void)performInvocation:(NSInvocation*)invocation; // TODO: Move this somewhere common?
-(void)invokeRWOperation:(SEL)operation withArgs:(id)args;
@end

@implementation StreamModule

#pragma mark Internal

// Need this wrapper method to avoid leaking some autorelease objects
-(void)performInvocation:(NSInvocation*)invocation
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    [invocation invoke];
    [pool release];
}

// TODO: Call read/write directly, NOT internal impls
-(void)invokeRWOperation:(SEL)operation withArgs:(id)args
{
    TiStreamProxy<TiStreamInternal>* stream = nil; // Conform to proxy because we're gonna ship that mother some internal messages
    TiBuffer* buffer = nil;
    id offset = nil; // Spec specifies 'int' but we may do our own type coercion
    id length = nil;
    KrollCallback* callback = nil;
    
    // TODO: Do we throw an exception based on arg typing here?  For now, assume we throw an exception on arg type...
    ENSURE_ARG_AT_INDEX(stream, args, 0, TiStreamProxy); // Conform to class because that's good practice
    ENSURE_ARG_AT_INDEX(buffer, args, 1, TiBuffer);
    
    if ([args count] > 3) {
        ENSURE_ARG_AT_INDEX(offset, args, 2, NSObject);
        ENSURE_ARG_AT_INDEX(length, args, 3, NSObject);
        ENSURE_ARG_AT_INDEX(callback, args, 4, KrollCallback);
    }
    else {
        ENSURE_ARG_AT_INDEX(callback, args, 2, KrollCallback);
    }
    
    int offsetValue = [TiUtils intValue:offset];
    int lengthValue = [TiUtils intValue:length def:[[buffer data] length]];
    
    if (offsetValue >= [[buffer data] length]) {
        NSString* errorStr = [NSString stringWithFormat:@"Offset %d is past buffer bounds (length %d)",offsetValue,[[buffer data] length]];
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:stream,@"source",NUMINT(-1),@"bytesProcessed",errorStr,@"errorDescription", nil];
        [self _fireEventToListener:@"io" withObject:event listener:callback thisObject:nil];
        return;
    }
    
    NSInvocation* invoke = [NSInvocation invocationWithMethodSignature:[stream methodSignatureForSelector:operation]];
    [invoke setTarget:stream];
    [invoke setSelector:operation];
    [invoke setArgument:&buffer atIndex:2];
    [invoke setArgument:&offsetValue atIndex:3];
    [invoke setArgument:&lengthValue atIndex:4];
    [invoke setArgument:&callback atIndex:5];
    [invoke retainArguments];
    
    [self performSelectorInBackground:@selector(performInvocation:) withObject:invoke];
}

#pragma mark Public API : Functions

// TODO: Methods need to check isReadable() isWritable()
// TODO: Need to determine if there's a 'default' mode
// Note that this is kind of a stub; we may need to expand it later.
-(TiStreamProxy*)createStream:(id)args
{
    ENSURE_SINGLE_ARG(args,NSDictionary);
    
    id obj = nil;
    TiStreamMode mode;
    
    ENSURE_ARG_FOR_KEY(obj, args, @"source", NSObject);
    ENSURE_INT_FOR_KEY(mode, args, @"mode");
    
    if (mode != TI_READ && mode != TI_WRITE && mode != TI_APPEND) {
        [self throwException:@"TypeError"
                   subreason:[NSString stringWithFormat:@"Invalid mode value %d", mode]
                    location:CODELOCATION];
    }
    
    if ([obj respondsToSelector:@selector(data)]) {
        if (![[obj data] isKindOfClass:[NSMutableData class]] && (mode & (TI_WRITE | TI_APPEND))) {
            [self throwException:@"TypeError"
                       subreason:[NSString stringWithFormat:@"Invalid mode value %d for BlobStream can be MODE_READ only", mode]
                        location:CODELOCATION];            
        }
        
        TiDataStream* stream = [[[TiDataStream alloc] _initWithPageContext:[self executionContext]] autorelease];
        [stream setData:[obj data]];
        [stream setMode:mode];
        
        return stream;
    }
    else {
        [self throwException:[NSString stringWithFormat:@"Cannot create stream from object %@",obj]
                   subreason:nil
                    location:CODELOCATION];
    }
}

-(void)read:(id)args
{
    TiStreamProxy<TiStreamInternal>* stream = nil;
    ENSURE_ARG_AT_INDEX(stream, args, 0, TiStreamProxy);
    
    // TODO: Throw exception, or call callback?
    if (![stream isReadable:nil]) {
        [self throwException:@"StreamException"
                   subreason:@"read() operation on stream that is not readable"
                    location:CODELOCATION];        
    }
    [self invokeRWOperation:@selector(readToBuffer:offset:length:callback:) withArgs:args];
}

-(void)write:(id)args
{
    TiStreamProxy<TiStreamInternal>* stream = nil;
    ENSURE_ARG_AT_INDEX(stream, args, 0, TiStreamProxy);
    
    // TODO: Throw exception, or call callback?
    if (![stream isWritable:nil]) {
        [self throwException:@"StreamException"
                   subreason:@"write() operation on stream that is not writable"
                    location:CODELOCATION];        
    }
    
    [self invokeRWOperation:@selector(writeFromBuffer:offset:length:callback:) withArgs:args];
}

// TODO: Call API read(), not internal read methods, if possible
-(TiBuffer*)readAll:(id)args
{
    TiStreamProxy<TiStreamInternal>* stream = nil; // Conform to proxy because we're gonna ship that mother some internal messages
    TiBuffer* buffer = nil;
    KrollCallback* callback = nil;
    
    ENSURE_ARG_AT_INDEX(stream, args, 0, TiStreamProxy);
    if (![stream isReadable:nil]) {
        [self throwException:@"StreamException"
                   subreason:@"read() operation on stream that is not readable"
                    location:CODELOCATION];        
    }
    
    if ([args count] > 1) {
        ENSURE_ARG_AT_INDEX(buffer, args, 1, TiBuffer);
        ENSURE_ARG_AT_INDEX(callback, args, 2, KrollCallback);
    }
    
    if (buffer == nil) {
        buffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
    }
    
    // Handle asynch
    if (callback != nil) {
        SEL operation = @selector(readToBuffer:offset:length:callback:);
        int offset = 0;
        int length = 0;
        
        NSInvocation* invoke = [NSInvocation invocationWithMethodSignature:[stream methodSignatureForSelector:operation]];
        [invoke setTarget:stream];
        [invoke setSelector:operation];
        [invoke setArgument:&buffer atIndex:2];
        [invoke setArgument:&offset atIndex:3];
        [invoke setArgument:&length atIndex:4];
        [invoke setArgument:&callback atIndex:5];
        [invoke retainArguments];
        [self performSelectorInBackground:@selector(performInvocation:) withObject:invoke];
        
        return nil;
    }
    
    [stream readToBuffer:buffer offset:0 length:0 callback:nil];
    return buffer;
}

// TODO: Use read()/write()
-(NSNumber*)writeStream:(id)args
{
    TiStreamProxy<TiStreamInternal>* inputStream = nil;
    TiStreamProxy<TiStreamInternal>* outputStream = nil;
    id chunkSize = nil;
    KrollCallback* callback = nil;
    
    ENSURE_ARG_AT_INDEX(inputStream, args, 0, TiStreamProxy);
    ENSURE_ARG_AT_INDEX(outputStream, args, 1, TiStreamProxy);
    ENSURE_ARG_AT_INDEX(chunkSize, args, 2, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(callback, args, 3, KrollCallback);

    if (![inputStream isReadable:nil]) {
        [self throwException:@"StreamException"
                   subreason:@"read() operation on stream that is not readable"
                    location:CODELOCATION];        
    }
    if (![outputStream isWritable:nil]) {
        [self throwException:@"StreamException"
                   subreason:@"write() operation on stream that is not readable"
                    location:CODELOCATION];        
    }   
    
    int size = [TiUtils intValue:chunkSize];
    if (callback != nil) {
        NSInvocation* invoke = [NSInvocation invocationWithMethodSignature:[inputStream methodSignatureForSelector:@selector(writeToStream:chunkSize:callback:)]];
        [invoke setTarget:inputStream];
        [invoke setSelector:@selector(writeToStream:chunkSize:callback:)];
        [invoke setArgument:&outputStream atIndex:2];
        [invoke setArgument:&size atIndex:3];
        [invoke setArgument:&callback atIndex:4];
        [invoke retainArguments];
        [self performSelectorInBackground:@selector(performInvocation:) withObject:invoke];
        
        return nil;
    }
    
    return NUMINT([inputStream writeToStream:outputStream chunkSize:size callback:nil]);
}

// TODO: Use read()
-(void)pump:(id)args
{
    TiStreamProxy<TiStreamInternal>* stream = nil;
    KrollCallback* callback = nil;
    id chunkSize = nil;
    id asynch = nil;
    
    ENSURE_ARG_AT_INDEX(stream, args, 0, TiStreamProxy);
    ENSURE_ARG_AT_INDEX(callback, args, 1, KrollCallback);
    ENSURE_ARG_AT_INDEX(chunkSize, args, 2, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(asynch, args, 3, NSObject);
  
    if (![stream isReadable:nil]) {
        [self throwException:@"StreamException"
                   subreason:@"read() operation on stream that is not readable"
                    location:CODELOCATION];        
    }
    
    int size = [TiUtils intValue:chunkSize];
    BOOL isAsynch = [TiUtils boolValue:asynch def:NO];
    if (isAsynch) {
        NSInvocation* invoke = [NSInvocation invocationWithMethodSignature:[stream methodSignatureForSelector:@selector(pumpToCallback:chunkSize:asynch:)]];
        [invoke setTarget:stream];
        [invoke setSelector:@selector(pumpToCallback:chunkSize:asynch:)];
        [invoke setArgument:&callback atIndex:2];
        [invoke setArgument:&size atIndex:3];
        [invoke setArgument:&isAsynch atIndex:4];
        [invoke retainArguments];
        
        [self performSelectorInBackground:@selector(performInvocation:) withObject:invoke];
        return;
    }
    
    [stream pumpToCallback:callback chunkSize:size asynch:isAsynch];
}

#pragma mark Public API : Properties

MAKE_SYSTEM_PROP(MODE_READ,TI_READ);
MAKE_SYSTEM_PROP(MODE_WRITE,TI_WRITE);
MAKE_SYSTEM_PROP(MODE_APPEND,TI_APPEND);


@end
#endif