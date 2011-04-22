/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDataStream.h"

@implementation TiDataStream
@synthesize data;

#pragma mark Internals

-(id)init
{
    if (self = [super init]) {
        data = nil;
        position = 0;
    }
    return self;
}

-(void)_destroy
{
    RELEASE_TO_NIL(data);
    [super _destroy];
}

#pragma mark I/O Stream implementation

-(int)readToBuffer:(TiBuffer *)toBuffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback
{    
    // TODO: This is a dumb convention. Go back and fix it.
    if (length == 0) {
        length = [data length];
        [toBuffer setLength:NUMINT(length)];
    }
    const void* bytes = [data bytes];
    void* toBytes = [[toBuffer data] mutableBytes];
   
    int bytesToWrite = MIN([data length] - position, length);
    memcpy(toBytes+offset, bytes+position, bytesToWrite);

    position += bytesToWrite;
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",NUMINT(bytesToWrite),@"bytesProcessed",nil];
        [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
    
    return bytesToWrite;
}

-(int)writeFromBuffer:(TiBuffer *)fromBuffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback
{    
    // Sanity check for mutable data (just in case...)
    if (![data isKindOfClass:[NSMutableData class]]) {
        NSString* errorStr = [NSString stringWithFormat:@"[ERROR] Attempt to write to unwritable stream"];
        NSLog(errorStr);
        if (callback != nil) {
            NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",NUMINT(-1),@"bytesProcessed",errorStr,@"errorDescription", nil];
            [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
        }
        return -1;   
    }
    
    // We've already thrown an exception if this is the result of a direct write; now we need treat it as a no-op, internally.
    if (offset > [data length]) {
        return 0;
    }
    
    void* bytes = [(NSMutableData*)data mutableBytes];
    const void* fromBytes = [[fromBuffer data] bytes];
    
    int bytesToWrite = MIN([data length] - position, length);
    memcpy(bytes+position, fromBytes+offset, bytesToWrite);

    position += bytesToWrite;
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",NUMINT(bytesToWrite),@"bytesProcessed",nil];
        [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
    }
    
    return bytesToWrite;
}

-(int)writeToStream:(id<TiStreamInternal>)output chunkSize:(int)size callback:(KrollCallback *)callback
{
    int length = [data length];
    int totalBytes = 0;
    while (position < length) {
        TiBuffer* tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
        NSRange subdataRange = NSMakeRange(position,size);
        if (position+size > length) {
            subdataRange.length = position+size-length;
        }
        
        void* bytes = malloc(subdataRange.length);
        [data getBytes:bytes range:subdataRange];
        [tempBuffer setData:[NSMutableData dataWithBytesNoCopy:bytes length:subdataRange.length freeWhenDone:YES]];
        
        int bytesWritten = 0;
        @try {
            bytesWritten = [output writeFromBuffer:tempBuffer offset:0 length:subdataRange.length callback:nil];
        }
        @catch (NSException* e) {
            // TODO: We'll need some kind of information about:
            // 1. Error Code
            // 2. # bytes produced as part of the write
            // In the exception.
            if (callback != nil) {
                NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"fromStream",output,@"toStream",NUMINT(totalBytes),@"bytesWritten",[e reason],@"errorDescription", nil];
                [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
            }
            else {
                @throw e;
            }
        }
        if (bytesWritten == 0) {
            break;
        }
        
        totalBytes += bytesWritten;
        position += subdataRange.length;
    }
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"fromStream",output,@"toStream",NUMINT(totalBytes),@"bytesProcessed",nil];
        [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
    }
    
    return totalBytes;
}

// We don't need the asynch hint
-(void)pumpToCallback:(KrollCallback *)callback chunkSize:(int)size asynch:(BOOL)asynch
{
    int totalBytes = 0;
    int bytesWritten = 0;
    int length = [data length];
    
    const void* source = [data bytes];
    while (position < length) {
        TiBuffer* tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];

        int bytesToWrite = MIN(size, length-position);
        void* destination = malloc(bytesToWrite);
        memcpy(destination, source+position, bytesToWrite);
        [tempBuffer setData:[NSMutableData dataWithBytesNoCopy:destination length:bytesToWrite freeWhenDone:YES]];

        totalBytes += bytesToWrite;
        position += bytesToWrite;
        
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",tempBuffer,@"buffer",NUMINT(bytesToWrite),@"bytesProcessed",NUMINT(totalBytes),@"totalBytesProcessed", nil];
        [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
    }
}

-(NSNumber*)isReadable:(id)_void
{
    return NUMBOOL(YES);
}

-(NSNumber*)isWritable:(id)_void
{
    return NUMBOOL([data isKindOfClass:[NSMutableData class]]);
}

@end
