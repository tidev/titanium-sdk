/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiDataStream.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiDataStream
@synthesize data, mode;

#pragma mark Internals

- (id)init
{
  if (self = [super init]) {
    data = nil;
    mode = TI_READ;
    position = 0;
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(data);
  [super dealloc];
}

#pragma mark I/O Stream implementation

- (NSInteger)readToBuffer:(TiBuffer *)toBuffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback
{
  if (data == nil) {
    [self throwException:@"TiStreamException"
               subreason:@"Attempt to read off of closed/nil data stream"
                location:CODELOCATION];
  }

  // TODO: Codify in read() and write() when we have every method calling the wrappers... like it should.
  if ([[toBuffer data] length] == 0 && length != 0) {
    NSString *errorMessage = @"Buffer length is zero";
    if (callback != nil) {
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:errorMessage];
      [event setObject:NUMINT(0) forKey:@"bytesProcessed"];
      [event setObject:NUMINT(-1) forKey:@"errorState"];
      [event setObject:errorMessage forKey:@"errorDescription"];
      [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
    return 0;
  }

  // TODO: Throw exception, or no-op?  For now, assume NO-OP
  if (position >= [data length]) {
    if (callback != nil) {
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:nil];
      [event setObject:NUMINT(-1) forKey:@"bytesProcessed"];
      [event setObject:NUMINT(-1) forKey:@"errorState"];
      [event setObject:@"" forKey:@"errorDescription"];
      [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
    return -1;
  }

  // TODO: This is a dumb convention. Go back and fix it.
  if (length == 0) {
    length = [data length];
    [toBuffer setLength:NUMUINTEGER(length)];
  }
  const void *bytes = [data bytes];
  void *toBytes = [[toBuffer data] mutableBytes];

  NSUInteger bytesToWrite = MIN([data length] - position, length);
  memcpy(toBytes + offset, bytes + position, bytesToWrite);

  position += bytesToWrite;

  if (callback != nil) {
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:self forKey:@"source"];
    [event setObject:NUMUINTEGER(bytesToWrite) forKey:@"bytesProcessed"];
    [event setObject:NUMINT(0) forKey:@"errorState"];
    [event setObject:@"" forKey:@"errorDescription"];
    [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
  }

  return bytesToWrite;
}

// TODO: Need to extend the data if we're writing past its current bounds
- (NSInteger)writeFromBuffer:(TiBuffer *)fromBuffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback
{
  if (data == nil) {
    [self throwException:@"TiStreamException"
               subreason:@"Attempt to write from closed/nil data stream"
                location:CODELOCATION];
  }

  // Sanity check for mutable data (just in case...)
  if (![data isKindOfClass:[NSMutableData class]]) {
    NSString *errorStr = [NSString stringWithFormat:@"[ERROR] Attempt to write to unwritable stream"];
    DebugLog(errorStr);
    if (callback != nil) {
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:errorStr];
      [event setObject:self forKey:@"source"];
      [event setObject:NUMINT(-1) forKey:@"bytesProcessed"];
      [event setObject:errorStr forKey:@"errorDescription"];
      [event setObject:NUMINT(-1) forKey:@"errorState"];
      [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
    }
    return -1;
  }

  // TODO: Codify in read() and write() when we have every method calling the wrappers... like it should.
  if ([[fromBuffer data] length] == 0) {
    if (callback != nil) {
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
      [event setObject:self forKey:@"source"];
      [event setObject:NUMINT(0) forKey:@"bytesProcessed"];
      [event setObject:NUMINT(0) forKey:@"errorState"];
      [event setObject:@"" forKey:@"errorDescription"];
      [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
    }
    return 0;
  }

  // OK, even if we're working with NSData (and not NSMutableData) we have to cast away const here; we're going to assume that
  // even with immutable data (i.e. blob) if the user has specified WRITE or APPEND, they're OK with digging their own grave.
  NSMutableData *mutableData = (NSMutableData *)data;
  if (mode & TI_WRITE) {
    NSUInteger overflow = length - ([data length] - position);
    if (overflow > 0) {
      [mutableData increaseLengthBy:overflow];
    }

    void *bytes = [mutableData mutableBytes];
    const void *fromBytes = [[fromBuffer data] bytes];

    memcpy(bytes + position, fromBytes + offset, length);
    position += length;
  } else if (mode & TI_APPEND) {
    [mutableData appendData:[[fromBuffer data] subdataWithRange:NSMakeRange(offset, length)]];
    position = [data length];
  }

  if (callback != nil) {
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:self forKey:@"source"];
    [event setObject:NUMUINTEGER(length) forKey:@"bytesProcessed"];
    [event setObject:NUMINT(0) forKey:@"errorState"];
    [event setObject:@"" forKey:@"errorDescription"];
    [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
  }

  return length;
}

- (NSInteger)writeToStream:(id<TiStreamInternal>)output chunkSize:(NSInteger)size callback:(KrollCallback *)callback
{
  if (data == nil) {
    [self throwException:@"TiStreamException"
               subreason:@"Attempt to write from closed/nil data stream"
                location:CODELOCATION];
  }

  NSUInteger length = [data length];
  NSUInteger totalBytes = 0;
  while (position < length) {
    TiBuffer *tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
    NSRange subdataRange = NSMakeRange(position, MIN(size, length - position));

    NSUInteger bytesWritten = 0;
    @try {
      void *bytes = malloc(subdataRange.length);
      if (bytes == NULL) {
        [self throwException:TiExceptionMemoryFailure subreason:@"Failed to allocate for stream" location:CODELOCATION];
      }

      [data getBytes:bytes range:subdataRange];
      [tempBuffer setData:[NSMutableData dataWithBytesNoCopy:bytes length:subdataRange.length freeWhenDone:YES]];

      bytesWritten = [output writeFromBuffer:tempBuffer offset:0 length:subdataRange.length callback:nil];
    }
    @catch (NSException *e) {
      // TODO: We'll need some kind of information about:
      // 1. Error Code
      // 2. # bytes produced as part of the write
      // In the exception.
      if (callback != nil) {
        NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:[e reason]];
        [event setObject:self forKey:@"fromStream"];
        [event setObject:output forKey:@"toStream"];
        [event setObject:NUMUINTEGER(totalBytes) forKey:@"bytesWritten"];
        [event setObject:[e reason] forKey:@"errorDescription"];
        [event setObject:NUMINT(-1) forKey:@"errorState"];
        [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
      } else {
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
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:self forKey:@"fromStream"];
    [event setObject:output forKey:@"toStream"];
    [event setObject:NUMUINTEGER(totalBytes) forKey:@"bytesProcessed"];
    [event setObject:NUMINT(0) forKey:@"errorState"];
    [event setObject:@"" forKey:@"errorDescription"];
    [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
  }

  return totalBytes;
}

// We don't need the asynch hint
- (void)pumpToCallback:(KrollCallback *)callback chunkSize:(NSInteger)size asynch:(BOOL)asynch
{
  if (data == nil) {
    [self throwException:@"TiStreamException"
               subreason:@"Attempt to write from closed/nil data stream"
                location:CODELOCATION];
  }

  NSUInteger totalBytes = 0;
  NSUInteger length = [data length];

  const void *source = [data bytes];
  while (position < length) {
    TiBuffer *tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];

    NSUInteger bytesToWrite = MIN(size, length - position);
    void *destination = malloc(bytesToWrite);
    if (destination == NULL) {
      NSString *message = @"Memory allocation failure";
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:message];
      [event setObject:self forKey:@"source"];
      [event setObject:[NSNull null] forKey:@"buffer"];
      [event setObject:NUMINT(-1) forKey:@"bytesProcessed"];
      [event setObject:NUMUINTEGER(totalBytes) forKey:@"totalBytesProcessed"];
      [event setObject:NUMINT(1) forKey:@"errorState"];
      [event setObject:message forKey:@"errorDescription"];
      [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
      break;
    }
    memcpy(destination, source + position, bytesToWrite);
    [tempBuffer setData:[NSMutableData dataWithBytesNoCopy:destination length:bytesToWrite freeWhenDone:YES]];

    totalBytes += bytesToWrite;
    position += bytesToWrite;

    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:self forKey:@"source"];
    [event setObject:tempBuffer forKey:@"buffer"];
    [event setObject:NUMUINTEGER(bytesToWrite) forKey:@"bytesProcessed"];
    [event setObject:NUMUINTEGER(totalBytes) forKey:@"totalBytesProcessed"];
    [event setObject:NUMINT(0) forKey:@"errorState"];
    [event setObject:@"" forKey:@"errorDescription"];
    [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
  }

  // We've reached the end of the stream - so we need to pump the -1 EOF
  NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
  [event setObject:self forKey:@"source"];
  [event setObject:[NSNull null] forKey:@"buffer"];
  [event setObject:NUMINT(-1) forKey:@"bytesProcessed"];
  [event setObject:NUMUINTEGER(totalBytes) forKey:@"totalBytesProcessed"];
  [event setObject:NUMINT(0) forKey:@"errorState"];
  [event setObject:@"" forKey:@"errorDescription"];
  [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
}

- (NSNumber *)isReadable:(id)_void
{
  return NUMBOOL(mode & TI_READ);
}

- (NSNumber *)isWritable:(id)_void
{
  return NUMBOOL(mode & (TI_WRITE | TI_APPEND));
}

- (void)close:(id)_void
{
  RELEASE_TO_NIL(data);
  position = 0;
}

@end
