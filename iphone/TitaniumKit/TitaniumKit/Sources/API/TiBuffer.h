/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"
#import <Foundation/Foundation.h>

@class TiBlob; // forward declare

// TODO: Support array-style access of bytes
/**
 The class represents a buffer of bytes.
 */
@interface TiBuffer : TiProxy {
  NSMutableData *data;
  NSNumber *byteOrder;
}
/**
 Provides access to raw data.
 */
@property (nonatomic, retain) NSMutableData *data;

// Public API
- (NSNumber *)append:(id)args;
- (NSNumber *)insert:(id)args;

//This API is meant for the Javascript, and because of ARC conflating this with
//copy from NSObject(UIResponderStandardEditActions), we can't declare it here.
//Note that this does not affect calling from JS.
#if !__has_feature(objc_arc)
- (NSNumber *)copy:(id)args;
#endif

- (TiBuffer *)clone:(id)args;
- (void)fill:(id)args;

- (void)clear:(id)_void;
- (void)release:(id)_void;

- (TiBlob *)toBlob:(id)_void;
- (NSString *)toString:(id)_void;

/**
 Provides access to the buffer length.
 */
@property (nonatomic, assign) NSNumber *length;

/**
 Provides access to the data byte order.

 The byte order values are: 1 - little-endian, 2 - big-endian.
 */
@property (nonatomic, retain) NSNumber *byteOrder;

// SPECIAL NOTES:
// Ti.Buffer objects have an 'overloaded' Ti.Buffer[x] operation for x==int (making them behave like arrays).
// See the code for how this works.

@end
