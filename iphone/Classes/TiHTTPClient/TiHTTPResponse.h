/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

typedef enum {
    TiHTTPResponseStateUnsent = 0,
    TiHTTPResponseStateOpened = 1,
    TiHTTPResponseStateHeaders = 2,
    TiHTTPResponseStateLoading = 3,
    TiHTTPResponseStateDone = 4
} TiHTTPResponseState;

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
@property(nonatomic, retain) NSString *filePath;
@property(nonatomic) float downloadProgress;
@property(nonatomic) float uploadProgress;

@property(nonatomic, readonly) NSData* responseData;
@property(nonatomic, readonly) NSInteger responseLength;
@property(nonatomic, readonly) NSString*responseString;
@property(nonatomic, readonly) NSDictionary*responseDictionary;
@property(nonatomic, readonly) NSArray* responseArray;

@property(nonatomic) BOOL saveToFile;
@property(nonatomic) BOOL connected;
@property(nonatomic) TiHTTPResponseState readyState;

-(void)appendData:(NSData*)data;
-(void)setResponse:(NSURLResponse*) response;
-(void)setRequest:(NSURLRequest*) request;
@end
