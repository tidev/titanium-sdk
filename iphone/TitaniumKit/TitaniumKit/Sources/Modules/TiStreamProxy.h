/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollCallback.h"
#import "TiBase.h"
#import "TiBuffer.h"
#import "TiProxy.h"
#import <Foundation/Foundation.h>

// This is meant to be a largely "virtual" class which defines the following behaviors:
// 1. Interprets read()/write() calls to the appropriate interal function
// 2. Provide protocol defining necessary internal functions; read/write, asynch read/write, readAll,
@protocol TiStreamInternal <NSObject>
@required
// DEFINED BEHAVIOR: callback != nil indicates an asynch operation.  length==0 indicates to read all available data into
// the buffer (and grow it if necessary).  These methods MAY be called by classes other than the TiStreamProxy ducktype (i.e. Ti.Stream module methods)
- (NSInteger)readToBuffer:(TiBuffer *)buffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback;
- (NSInteger)writeFromBuffer:(TiBuffer *)buffer offset:(NSInteger)offset length:(NSInteger)length callback:(KrollCallback *)callback;

// Used for writeStream/pumping
- (NSInteger)writeToStream:(id<TiStreamInternal>)output chunkSize:(NSInteger)size callback:(KrollCallback *)callback;
- (void)pumpToCallback:(KrollCallback *)callback chunkSize:(NSInteger)size asynch:(BOOL)asynch;

// Public API : No defined behavior
- (NSNumber *)isReadable:(id)_void; // PUBLIC API FUNCTION
- (NSNumber *)isWritable:(id)_void; // PUBLIC API FUNCTION

- (void)close:(id)_void; // PUBLIC API FUNCTION
@end

// TODO: We absolutely MUST discuss public/private API separation and how it interacts with ducktypes.
@interface TiStreamProxy : TiProxy <TiStreamInternal> {
}

// Public API
- (NSNumber *)read:(id)args;
- (NSNumber *)write:(id)write;

@end
