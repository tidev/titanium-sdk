/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "TiStreamProxy.h"

// Generic stream for data; designed to encapsulate blobs and buffers.
@interface TiDataStream : TiStreamProxy<TiStreamInternal> {
    NSData* data;
    TiStreamMode mode;
    int position;
}
@property (nonatomic) TiStreamMode mode;
@property (nonatomic,readwrite,retain) NSData* data;

@end
