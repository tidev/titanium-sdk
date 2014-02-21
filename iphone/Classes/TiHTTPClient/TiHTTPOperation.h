/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "TiHTTPRequest.h"

@interface TiHTTPOperation : NSOperation

@property(nonatomic, readonly) TiHTTPRequest *request;
@property(nonatomic) BOOL cancelled;
@property(nonatomic) BOOL executing;
@property(nonatomic) BOOL ready;
@property(nonatomic) BOOL finished;
@property(nonatomic) NSInteger index;

-(id)initWithConnection:(TiHTTPRequest*)request;
@end
