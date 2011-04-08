/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "TiProxy.h"
#import "TiBlob.h"

// TODO: Finish implementation; this is just a skeleton for use w/TCP sockets
@interface TiBuffer : TiProxy {
    NSMutableData* data;
}
@property(readonly, nonatomic) NSMutableData* data;
-(id)initWithData:(NSData*)data;

// Public API
-(void)clear:(id)_void;
-(TiBlob*)toBlob:(id)_void;
-(NSString*)toString:(id)_void;

@end
