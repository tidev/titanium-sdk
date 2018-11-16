/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiStreamProxy.h"
#import "TiUtils.h"

@implementation TiStreamProxy

#pragma mark Public API : Functions

- (NSString *)apiName
{
  return @"Ti.IOStream";
}

- (NSNumber *)read:(id)args
{
  if (![[self isReadable:nil] boolValue]) {
    // TODO: Codify exception name
    [self throwException:@"StreamException"
               subreason:@"Stream is not readable"
                location:CODELOCATION];
  }

  TiBuffer *buffer = nil;
  id offset = nil;
  id length = nil;
  KrollCallback *callback = nil;

  ENSURE_ARG_AT_INDEX(buffer, args, 0, TiBuffer);
  switch ([args count]) {
  case 1:
    // do nothing, just buffer
    break;

  case 2:
    ENSURE_ARG_AT_INDEX(callback, args, 1, KrollCallback);
    break;

  case 3:
    ENSURE_ARG_AT_INDEX(offset, args, 1, NSObject);
    ENSURE_ARG_AT_INDEX(length, args, 2, NSObject);
    break;

  case 4:
    ENSURE_ARG_AT_INDEX(offset, args, 1, NSObject);
    ENSURE_ARG_AT_INDEX(length, args, 2, NSObject);
    ENSURE_ARG_AT_INDEX(callback, args, 3, KrollCallback);
    break;

  default:
    [self throwException:TiExceptionNotEnoughArguments subreason:[NSString stringWithFormat:@"expected %d-%d arguments, received: %lu", 1, 4, (unsigned long)[args count]] location:CODELOCATION];
    break;
  }

  if (offset == nil && length == nil) {
    return NUMINTEGER([self readToBuffer:buffer offset:0 length:[[buffer data] length] callback:callback]);
  } else {
    if (offset == nil || length == nil) {
      // TODO: Codify behavior
      [self throwException:@"StreamException"
                 subreason:@"Requires OFFSET or LENGTH value"
                  location:CODELOCATION];
    }

    NSInteger offsetValue = [TiUtils intValue:offset];
    BOOL valid = NO;
    NSUInteger lengthValue = [TiUtils intValue:length def:0 valid:&valid];
    if (!valid) {
      lengthValue = [[buffer data] length];
    }

    // TODO: Throw exception
    if (offsetValue >= [[buffer data] length]) {
      NSString *errorStr = [NSString stringWithFormat:@"[ERROR] Offset %ld is past buffer bounds (length %lu)", (long)offsetValue, (unsigned long)[[buffer data] length]];
      NSLog(errorStr);
      return NUMINT(-1);
    }

    return NUMINTEGER([self readToBuffer:buffer offset:offsetValue length:lengthValue callback:callback]);
  }

  return NUMINT(-1);
}

- (NSNumber *)write:(id)args
{
  if (![[self isWritable:nil] boolValue]) {
    // TODO: Codify exception name
    [self throwException:@"StreamException"
               subreason:@"Stream is not writable"
                location:CODELOCATION];
  }

  TiBuffer *buffer = nil;
  id offset = nil; // May need to perform type coercion from string->int
  id length = nil;
  KrollCallback *callback = nil;

  ENSURE_ARG_AT_INDEX(buffer, args, 0, TiBuffer);
  switch ([args count]) {
  case 1:
    // do nothing, just buffer
    break;

  case 2:
    ENSURE_ARG_AT_INDEX(callback, args, 1, KrollCallback);
    break;

  case 3:
    ENSURE_ARG_AT_INDEX(offset, args, 1, NSObject);
    ENSURE_ARG_AT_INDEX(length, args, 2, NSObject);
    break;

  case 4:
    ENSURE_ARG_AT_INDEX(offset, args, 1, NSObject);
    ENSURE_ARG_AT_INDEX(length, args, 2, NSObject);
    ENSURE_ARG_AT_INDEX(callback, args, 3, KrollCallback);
    break;

  default:
    [self throwException:TiExceptionNotEnoughArguments subreason:[NSString stringWithFormat:@"expected %d-%d arguments, received: %lu", 1, 4, (unsigned long)[args count]] location:CODELOCATION];
    break;
  }

  if (offset == nil && length == nil) {
    return NUMINTEGER([self writeFromBuffer:buffer offset:0 length:[[buffer data] length] callback:callback]);
  } else {
    if (offset == nil || length == nil) {
      // TODO: Codify behavior
      [self throwException:@"StreamException"
                 subreason:@"Invalid OFFSET or LENGTH value"
                  location:CODELOCATION];
    }

    NSInteger offsetValue = [TiUtils intValue:offset];
    BOOL valid = NO;
    NSUInteger lengthValue = [TiUtils intValue:length def:0 valid:&valid];
    if (!valid) {
      lengthValue = [[buffer data] length];
    }

    // TODO: Throw exception
    if (offsetValue >= [[buffer data] length]) {
      NSString *errorStr = [NSString stringWithFormat:@"[ERROR] Offset %ld is past buffer bounds (length %lu)", (long)offsetValue, (unsigned long)[[buffer data] length]];
      NSLog(errorStr);
      return NUMINT(-1);
    }

    return NUMINTEGER([self writeFromBuffer:buffer offset:offsetValue length:lengthValue callback:callback]);
  }

  return NUMINT(-1);
}

#pragma mark Protocol stubs

- (NSInteger)readToBuffer:(TiBuffer *)buffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback
{
  [self throwException:@"Incomplete stream implementation" subreason:[NSString stringWithFormat:@"Missing %@", NSStringFromSelector(_cmd)] location:CODELOCATION];
  return -1;
}
- (NSInteger)writeFromBuffer:(TiBuffer *)buffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback
{
  [self throwException:@"Incomplete stream implementation" subreason:[NSString stringWithFormat:@"Missing %@", NSStringFromSelector(_cmd)] location:CODELOCATION];
  return -1;
}

- (NSInteger)writeToStream:(id<TiStreamInternal>)output chunkSize:(NSInteger)size callback:(KrollCallback *)callback
{
  [self throwException:@"Incomplete stream implementation" subreason:[NSString stringWithFormat:@"Missing %@", NSStringFromSelector(_cmd)] location:CODELOCATION];
  return -1;
}

- (void)pumpToCallback:(KrollCallback *)callback chunkSize:(NSInteger)size asynch:(BOOL)asynch
{
  [self throwException:@"Incomplete stream implementation" subreason:[NSString stringWithFormat:@"Missing %@", NSStringFromSelector(_cmd)] location:CODELOCATION];
}

- (NSNumber *)isReadable:(id)_void
{
  [self throwException:@"Incomplete stream implementation" subreason:[NSString stringWithFormat:@"Missing %@", NSStringFromSelector(_cmd)] location:CODELOCATION];
  return @(-1);
}

- (NSNumber *)isWritable:(id)_void
{
  [self throwException:@"Incomplete stream implementation" subreason:[NSString stringWithFormat:@"Missing %@", NSStringFromSelector(_cmd)] location:CODELOCATION];
  return @(-1);
}

- (void)close:(id)_void
{
  [self throwException:@"Incomplete stream implementation" subreason:[NSString stringWithFormat:@"Missing %@", NSStringFromSelector(_cmd)] location:CODELOCATION];
}

@end
