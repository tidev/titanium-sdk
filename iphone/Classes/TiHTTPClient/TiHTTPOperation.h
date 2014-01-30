/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Pedro Enrique for implementing this.
 */

#import <Foundation/Foundation.h>


@class TiHTTPRequest;

@interface TiHTTPOperation : NSOperation

@property(nonatomic, readonly) NSURLConnection *connection;
@property(nonatomic) BOOL cancelled;
@property(nonatomic) BOOL executing;
@property(nonatomic) BOOL ready;
@property(nonatomic) BOOL finished;
@property(nonatomic) NSInteger index;

-(id)initWithConnection:(NSURLConnection*)connection;
@end
