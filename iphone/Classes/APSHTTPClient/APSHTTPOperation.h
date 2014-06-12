/**
 * Appcelerator APSHTTPClient Library
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import "APSHTTPRequest.h"

@interface APSHTTPOperation : NSOperation

@property(nonatomic, readonly) APSHTTPRequest *request;
@property(nonatomic) BOOL cancelled;
@property(nonatomic) BOOL executing;
@property(nonatomic) BOOL ready;
@property(nonatomic) BOOL finished;
@property(nonatomic) NSInteger index;

-(id)initWithConnection:(APSHTTPRequest*)request;
@end
