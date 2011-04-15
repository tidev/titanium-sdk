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

// TODO: Throw bounds exceptions everywhere
// TODO: Fire messages for asynch
-(int)readToBuffer:(TiBuffer *)toBuffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback
{
    const void* bytes = [data bytes];
    void* toBytes = [[toBuffer data] mutableBytes];
    
    int bytesWritten;
    for (bytesWritten = 0; bytesWritten < length && position < [data length]; position++, bytesWritten++) {
        *(char*)(toBytes+offset+bytesWritten) = *(char*)(bytes+position);
    }
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",NUMINT(bytesWritten),@"bytesProcessed",nil];
        [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
    
    return bytesWritten;
}

// TODO: MAKE SURE isWritable() IS ALWAYS CALLED BEFORE writeFromBuffer
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
    
    void* bytes = [(NSMutableData*)data mutableBytes];
    const void* fromBytes = [[fromBuffer data] bytes];
    
    int bytesWritten = 0;
    for (bytesWritten = 0; bytesWritten < length && position < [data length]; position++, bytesWritten++) {
        *(char*)(bytes+position) = *(char*)(fromBytes+offset+bytesWritten);
    }
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",NUMINT(bytesWritten),@"bytesProcessed",nil];
        [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
    }
    
    return bytesWritten;
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
        
        [tempBuffer setData:[NSMutableData dataWithData:[data subdataWithRange:subdataRange]]];
        
        int bytesWritten = 0;
        @try {
            bytesWritten = [output writeFromBuffer:tempBuffer offset:totalBytes length:subdataRange.length callback:nil];
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
        
        totalBytes += bytesWritten;
        position += subdataRange.length;
    }
    
    if (callback != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"fromStream",output,@"toStream",NUMINT(totalBytes),@"bytesWritten",nil];
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
        [tempBuffer setLength:NUMINT(size)];
        
        void* destination = [[tempBuffer data] mutableBytes];
        for (bytesWritten=0; bytesWritten < size && position + bytesWritten < length; bytesWritten++) {
            *(char*)(destination+totalBytes+bytesWritten) = *(char*)(source+position+bytesWritten);
        }
        totalBytes += bytesWritten;
        position += bytesWritten;
        
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",tempBuffer,@"buffer",NUMINT(bytesWritten),@"bytesProcessed",NUMINT(totalBytes),@"totalBytesProcessed", nil];
        [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
    }
}

// TODO: Need to standardize readable/writable behavior... is this right?
-(NSNumber*)isReadable:(id)_void
{
    return NUMBOOL(position<[data length]);
}

-(NSNumber*)isWritable:(id)_void
{
    return NUMBOOL([data isKindOfClass:[NSMutableData class]] && position<[data length]);
}

@end
