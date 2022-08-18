/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import <TitaniumKit/TiStreamProxy.h>

// Generic stream for data; designed to encapsulate blobs and buffers.
@interface TiDataStream : TiStreamProxy <TiStreamInternal> {
  NSData *data;
  TiStreamMode mode;
  NSUInteger position;
}
@property (nonatomic) TiStreamMode mode;
@property (nonatomic, readwrite, retain) NSData *data;

@end
