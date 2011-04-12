/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "TiProxy.h"
#import "Tibuffer.h"
#import "KrollCallback.h"

// This is meant to be a largely "virtual" class which defines the following behaviors:
// 1. Interprets read()/write() calls to the appropriate interal function
// 2. Provide protocol defining necessary internal functions; read/write, asynch read/write, readAll, 
@protocol TiStreamInternal
@required
// DEFINED BEHAVIOR: callback != nil indicates an asynch operation.  These methods MAY be called by classes other than
// the TiStreamProxy ducktype (i.e. Ti.Stream module methods)
-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback*)callback;
-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback*)callback;

// Public API : No defined behavior
-(NSNumber*)isReadable:(id)_void; // PUBLIC API FUNCTION
-(NSNumber*)isWritable:(id)_void; // PUBLIC API FUNCTION
@end

@interface TiStreamProxy : TiProxy {
    
}

// Public API
-(NSNumber*)read:(id)args;
-(NSNumber*)write:(id)write;

@end
