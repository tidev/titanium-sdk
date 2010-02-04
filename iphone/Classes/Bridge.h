/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"

@class TiHost;

@interface Bridge : NSObject {
@private
	id callback;
@protected
	NSURL *url;
	TiHost *host;
}

-(id)initWithHost:(TiHost*)host;

-(void)boot:(id)callback url:(NSURL*)url preload:(NSDictionary*)preload;

-(void)booted;

-(void)shutdown;

-(void)gc;

//TODO: refactor this into XHRBridge since the other bridge no longer uses it
-(NSData*)invoke:(NSString*)pageToken operation:(NSString*)operation module:(NSString*)module property:(NSString*)property arguments:(NSString*)arguments exception:(NSString**)exception;

@end
