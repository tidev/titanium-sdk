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
// 2. Returns isReadable()/isWritable() as NO by default
// 3. Enforces conduct that all read()/write() internal methods must be implemented
// So... part protocol, part subclass.  Almost makes you wish we had pure virtual.

@interface TiStreamProxy : TiProxy {
    
}

// Internal API
// All of these methods are intended to be overloaded in subclasses!  They represent
// the internal implementation of the stream.

// These should probably never be called directly, but they are part of the internal declared API.
-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length;
-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length;

// ASYNCH CALLBACKS MUST HAVE KEYS AS DEFINED BY SPEC.
-(int)asynchRead:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback*)callback;
-(int)asynchWrite:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback*)callback;

// Public API
-(NSNumber*)read:(id)args;
-(NSNumber*)write:(id)write;

-(NSNumber*)isReadable:(id)_void;
-(NSNumber*)isWritable:(id)_void;

@end
