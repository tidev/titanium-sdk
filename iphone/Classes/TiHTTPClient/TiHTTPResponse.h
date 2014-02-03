/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Pedro Enrique for implementing this.
 */

#import <Foundation/Foundation.h>

typedef enum {
	TiResponseStateUnsent = 0,
	TiResponseStateOpened = 1,
    TiResponseStateHeaders = 2,
    TiResponseStateLoading = 3,
    TiResponseStateDone = 4
} TiResponseState;

@interface TiHTTPResponse : NSObject
{
    NSMutableData *_data;
}
@property(nonatomic, readonly) NSURL *url;
@property(nonatomic, readonly) NSInteger status;
@property(nonatomic, readonly) NSDictionary *headers;
@property(nonatomic, readonly) NSString *connectionType;
@property(nonatomic, readonly) NSString *location;
@property(nonatomic) NSStringEncoding encoding;
@property(nonatomic, retain) NSError *error;
@property(nonatomic) float downloadProgress;
@property(nonatomic) float uploadProgress;


@property(nonatomic, readonly) NSData* responseData;
@property(nonatomic, readonly) NSString*responseString;
@property(nonatomic, readonly) NSDictionary*responseDictionary;
@property(nonatomic, readonly) NSArray* responseArray;

@property(nonatomic) BOOL connected;
@property(nonatomic) TiResponseState readyState;


-(void)appenData:(NSData*)data;
-(void)setResponse:(NSURLResponse*) response;
-(void)setRequest:(NSURLRequest*) request;
@end
