/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2010-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiFilesystemFileStreamProxy.h"
#import "TiFilesystemFileProxy.h"
#import "TiStreamProxy.h"
#import "TiUtils.h"

@interface TiFilesystemFileStreamProxy (Private)

- (unsigned long long)currentFileSize;

@end

@implementation TiFilesystemFileStreamProxy

#pragma mark Internal

- (id)_initWithPageContext:(id<TiEvaluator>)context args:(NSArray *)args
{
  if (self = [super _initWithPageContext:context args:args]) {
    if ([args count] > 0) {
      NSString *filePath = [args objectAtIndex:0];
      NSFileHandle *handle = nil;

      mode = TI_READ;
      if ([args count] == 2) {
        mode = [[args objectAtIndex:1] intValue];
      }

      @try {
        //If the mode is *not* TI_WRITE and the file path is non-existent, throw exception
        //Otherwise, create a blank file at the specified path

        NSFileManager *fileManager = [NSFileManager defaultManager];
        if (![fileManager fileExistsAtPath:filePath]) {
          if (mode != TI_WRITE) {
            [NSException raise:NSInternalInconsistencyException format:@"File does not exist at path %@", filePath, nil];
          }
          BOOL created = [fileManager createFileAtPath:filePath contents:[NSData data] attributes:nil];
          if (!created) {
            [NSException raise:NSInternalInconsistencyException format:@"An error occurred while trying to create the file."];
          }
        } else {
          //If the file exists and the mode is TI_WRITE, truncate the file.
          if (mode == TI_WRITE) {
            NSError *error = nil;
            [[NSData data] writeToFile:filePath options:NSDataWritingFileProtectionComplete | NSDataWritingAtomic error:&error];
            if (error != nil) {
              [NSException raise:NSInternalInconsistencyException format:@"%@", error, nil];
            }
          }
        }

        if (mode == TI_WRITE || mode == TI_APPEND) {
          handle = [NSFileHandle fileHandleForUpdatingAtPath:filePath];
        } else {
          handle = [NSFileHandle fileHandleForReadingAtPath:filePath];
        }

        if (handle == nil) {
          //something went wrong with creating the file handle
          [NSException raise:NSInternalInconsistencyException format:@""];
        }
      }
      @catch (NSException *e) {
        [self throwException:TiExceptionOSError
                   subreason:[NSString stringWithFormat:@"Could not open file stream for file at path: %@\n%@", filePath, [e reason], nil]
                    location:CODELOCATION];
      }

      //we made it, retain the file handle.

      fileHandle = [handle retain];

    } else {
      NSString *reason = [NSString stringWithFormat:@"Invalid arguments passed to -[TiFilesystemFileStreamProxy _initWithPageContext:args:] (%@)", args];
      [self throwException:TiExceptionNotEnoughArguments
                 subreason:reason
                  location:CODELOCATION];
    }
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(fileHandle);
  [super dealloc];
}

- (NSString *)apiName
{
  return @"Ti.Filesystem.FileStream";
}

#define THROW_IF_HANDLE_NIL(loc)                                                                                           \
  if (fileHandle == nil) {                                                                                                 \
    [self throwException:TiExceptionInternalInconsistency subreason:@"File handle has already been closed." location:loc]; \
  }

#pragma mark Private methods

- (unsigned long long)currentFileSize
{
  unsigned long long offset = [fileHandle offsetInFile];
  unsigned long long size = [fileHandle seekToEndOfFile];
  [fileHandle seekToFileOffset:offset]; //revert to previous position
  return size;
}

#pragma mark TiStreamInternal methods

- (NSInteger)readToBuffer:(TiBuffer *)buffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback
{
  THROW_IF_HANDLE_NIL(CODELOCATION);

  if ([[buffer data] length] == 0 && length != 0) {
    NSString *errorMessage = @"Buffer length is zero";
    if (callback != nil) {
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:errorMessage];
      [event setObject:NUMINT(0) forKey:@"bytesProcessed"];
      [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
    return 0;
  }

  NSData *fileData = nil;

  if ([buffer data] == nil) {
    [buffer setData:[NSMutableData data]];
  }

  if ([fileHandle offsetInFile] >= [self currentFileSize]) {
    //out of bounds
    if (callback != nil) {
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:nil];
      [event setObject:NUMINT(-1) forKey:@"bytesProcessed"];
      [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
    return -1;
  }

  if (length == 0) {
    [buffer setData:[NSMutableData dataWithData:[fileHandle availableData]]];
    if (callback != nil) {
      NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
      [event setObject:[buffer length] forKey:@"bytesProcessed"];
      [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
    }
    return [[buffer length] integerValue];
  }

  fileData = [fileHandle readDataOfLength:length];

  if ([fileData length] > 0) {
    VerboseLog(@"fileData is %@", [NSString stringWithCString:[fileData bytes] encoding:NSUTF8StringEncoding]);

    void *bufferBytes = [[buffer data] mutableBytes];
    const void *streamBytes = [fileData bytes];
    VerboseLog(@"bufferBytes is NULL? %@", bufferBytes == NULL ? @"YES" : @"NO");
    VerboseLog(@"streamBytes is NULL? %@", streamBytes == NULL ? @"YES" : @"NO");

    if (bufferBytes != NULL && streamBytes != NULL) {
      VerboseLog(@"bufferBytes: %@", [NSString stringWithCString:bufferBytes encoding:NSUTF8StringEncoding]);
      VerboseLog(@"streamBytes: %@", [NSString stringWithCString:streamBytes encoding:NSUTF8StringEncoding]);

      memcpy(bufferBytes + offset, streamBytes, MIN([fileData length], length));
    }
  }
  if (callback != nil) {
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:NUMUINTEGER([fileData length]) forKey:@"bytesProcessed"];
    [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
  }
  return [fileData length];
}

- (NSInteger)writeFromBuffer:(TiBuffer *)buffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback
{
  THROW_IF_HANDLE_NIL(CODELOCATION);

  if (length == 0) {
    return 0; // NO-OP
  }

  NSData *slicedData = [[buffer data] subdataWithRange:NSMakeRange(offset, MIN([[buffer data] length] - offset, length))];

  if (mode == TI_APPEND) {
    [fileHandle seekToEndOfFile];
  }

  if (slicedData != nil) {
    @try {
      [fileHandle writeData:slicedData];
      [fileHandle synchronizeFile]; //force immediate save to disk

      if (callback != nil) {
        NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
        [event setObject:self forKey:@"source"];
        [event setObject:NUMUINTEGER([slicedData length]) forKey:@"bytesProcessed"];
        [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
      }
    }
    @catch (NSException *e) {
      if (callback != nil) {
        NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:[e reason]];
        [event setObject:self forKey:@"source"];
        [event setObject:NUMINT(0) forKey:@"bytesProcessed"];
        [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
      } else {
        @throw e;
      }
    }
    return [slicedData length];
  }
  return -1;
}

- (NSInteger)writeToStream:(id<TiStreamInternal>)output chunkSize:(NSInteger)size callback:(KrollCallback *)callback
{
  THROW_IF_HANDLE_NIL(CODELOCATION);

  NSUInteger totalBytes = 0;
  unsigned long long position = [fileHandle offsetInFile];
  unsigned long long remaining = [self currentFileSize] - position;

  while (position < [self currentFileSize]) {
    VerboseLog(@"position is %d, size is %d", position, [self currentFileSize]);

    TiBuffer *tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
    unsigned long long readLengthMax = MIN(size, [self currentFileSize] - position);
    if (readLengthMax > INT_MAX) {
      readLengthMax = INT_MAX;
    }
    NSUInteger readLength = (NSUInteger)readLengthMax;

    NSUInteger bytesWritten = 0;
    @try {
      NSData *data = [fileHandle readDataOfLength:readLength];
      if ([data length] > 0) {
        void *bytes = malloc(readLength);
        if (bytes == NULL) {
          [self throwException:TiExceptionMemoryFailure subreason:@"Failed to allocate for stream" location:CODELOCATION];
        }

        [data getBytes:bytes length:readLength];
        [tempBuffer setData:[NSMutableData dataWithBytesNoCopy:bytes length:readLength freeWhenDone:YES]];
        bytesWritten = [output writeFromBuffer:tempBuffer offset:0 length:readLength callback:nil];

        //call callback
        if (callback != nil) {
          NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
          [event setObject:self forKey:@"fromStream"];
          [event setObject:output forKey:@"toStream"];
          [event setObject:NUMUINTEGER(bytesWritten) forKey:@"bytesProcessed"];
          [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
        }
      } else {
        //EOF
        return totalBytes;
      }
    }
    @catch (NSException *e) {
      if (callback != nil) {
        NSMutableDictionary *event = [TiUtils dictionaryWithCode:-1 message:[e reason]];
        [event setObject:self forKey:@"fromStream"];
        [event setObject:output forKey:@"toStream"];
        [event setObject:NUMINT(0) forKey:@"bytesProcessed"];
        [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
      } else {
        @throw e;
      }
    }
    if (bytesWritten == 0) {
      break;
    }

    totalBytes += bytesWritten;
    remaining = [self currentFileSize] - [fileHandle offsetInFile];
    if (remaining < size) {
      remaining = size;
    }
  }

  if (callback != nil) {
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:self forKey:@"fromStream"];
    [event setObject:output forKey:@"toStream"];
    [event setObject:NUMUINTEGER(totalBytes) forKey:@"bytesProcessed"];
    [self _fireEventToListener:@"writeToStream" withObject:event listener:callback thisObject:nil];
  }

  return totalBytes;
}

- (void)pumpToCallback:(KrollCallback *)callback chunkSize:(NSInteger)maxSize asynch:(BOOL)asynch
{
  THROW_IF_HANDLE_NIL(CODELOCATION);

  if (callback == nil) {
    [self throwException:TiExceptionNotEnoughArguments
               subreason:@"No callback provided to Ti.Stream.pump"
                location:CODELOCATION];
  }
  unsigned long long remaining = [self currentFileSize] - [fileHandle offsetInFile];
  unsigned long long totalBytes = 0;

  if (maxSize > remaining) {
    //truncate to avoid buffer overruns
    maxSize = (int)remaining;
  }

  while ([fileHandle offsetInFile] < [self currentFileSize]) {
    //create temporary buffer
    unsigned long long readLengthMax = MIN(maxSize, [self currentFileSize] - [fileHandle offsetInFile]);
    if (readLengthMax > INT_MAX) {
      readLengthMax = INT_MAX;
    }
    NSUInteger readLength = (NSUInteger)readLengthMax;
    NSData *chunkedData = [fileHandle readDataOfLength:readLength];
    TiBuffer *buffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];

    [buffer setData:[NSMutableData dataWithData:chunkedData]];

    totalBytes += [chunkedData length];

    VerboseLog(@"pumping data: %@", buffer);

    //invoke callback, passing the chunked data
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:self forKey:@"source"];
    [event setObject:buffer forKey:@"buffer"];
    [event setObject:NUMUINTEGER([chunkedData length]) forKey:@"bytesProcessed"];
    [event setObject:[NSNumber numberWithUnsignedLongLong:totalBytes] forKey:@"totalBytesProcessed"];
    [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];

    remaining = [self currentFileSize] - [fileHandle offsetInFile];
    if (maxSize > remaining) {
      maxSize = (int)remaining;
    }

    //are we going to hit EOF? if so, invoke the callback with a -1 bytesProcessed event dict
    if (remaining == 0) {
      [event setObject:NUMINT(-1) forKey:@"bytesProcessed"];
      [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
      break;
    }
  }
}

- (void)close:(id)args
{
  @try {
    [fileHandle closeFile];
  } @finally {
    RELEASE_TO_NIL(fileHandle);
  }
}

- (NSNumber *)isReadable:(id)_void
{
  return NUMBOOL(mode == TI_READ);
}

- (NSNumber *)isWritable:(id)_void
{
  return NUMBOOL(mode == TI_WRITE || mode == TI_APPEND);
}

@end
