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
@synthesize data;

#pragma mark Internals

-(void)dealloc
{
    RELEASE_TO_NIL(data);
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

-(TiBuffer*)clone:(id)args
{
    id offset = nil;
    id length = nil;
    
    ENSURE_ARG_OR_NIL_AT_INDEX(offset, args, 0, NSObject);
    ENSURE_ARG_OR_NIL_AT_INDEX(length, args, 1, NSObject);
    
    if (offset != nil && length == nil) {
        // TODO: Throw exception
        NSLog(@"[ERROR] Bad args to clone(): Expected (int offset, int length), found (int length)");
        return nil;
    }

    int offsetVal = [TiUtils intValue:offset];
    int lengthVal = [TiUtils intValue:length def:[data length]];
    
    // TODO: What do we do if offset goes past the end of the buffer?
    // For now, do the sensible thing... throw an exception.
    if (offsetVal > [data length]) {
        // TODO: Actually throw an exception when we have the mechanisms for this in place...
        NSLog(@"[ERROR] Offset %d extends past data length %ul", offsetVal, [data length]);
        return nil;
    }
    
    // TODO: What do we do if offset+length goes past the end of the buffer?
    // For now, do the sensible thing... only go up to the end.
    if (offsetVal + lengthVal > [data length]) {
        lengthVal = [data length] - offsetVal;
    }
    
    NSMutableData* cloneData = [[NSMutableData alloc] initWithData:[data subdataWithRange:NSMakeRange(offsetVal, lengthVal)]];
    
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
        // TODO: Throw exception
        NSLog(@"[ERROR] Bad args to fill(): Expected (int offset, int length), found (int length)");
        return nil;
    }
    
    char byte = [TiUtils intValue:fillByte];
    int offsetVal = [TiUtils intValue:offset];
    int lengthVal = [TiUtils intValue:length def:[data length]];
    
    // TODO: What do we do if offset goes past the end of the buffer?
    // For now, do the sensible thing... throw an exception.
    if (offsetVal > [data length]) {
        // TODO: Actually throw an exception when we have the mechanisms for this in place...
        NSLog(@"[ERROR] Offset %d extends past data length %ul", offsetVal, [data length]);
        return nil;
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


-(NSNumber*)clear:(id)_void
{
    [data resetBytesInRange:NSMakeRange(0, [data length])];
    return NUMBOOL(YES); // TODO: What the hell does this return value mean...?
}

-(NSNumber*)release:(id)_void
{
    RELEASE_TO_NIL(data);
    return NUMBOOL(YES);
}

-(TiBlob*)toBlob:(id)_void
{
    return [[[TiBlob alloc] initWithData:[data copy] mimetype:@"application/octet-stream"] autorelease];
}

-(NSString*)toString:(id)_void 
{
    return [[[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding] autorelease];
}

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

@end
