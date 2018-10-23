/**
 * Appcelerator APSHTTPClient Library
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

typedef NS_ENUM(NSInteger, APSHTTPResponseState) {
  APSHTTPResponseStateUnsent = 0,
  APSHTTPResponseStateOpened = 1,
  APSHTTPResponseStateHeaders = 2,
  APSHTTPResponseStateLoading = 3,
  APSHTTPResponseStateDone = 4
};

@interface APSHTTPResponse : NSObject

//@property(nonatomic, strong, readonly ) NSURL                *url;
@property (nonatomic, strong, readonly) NSDictionary *headers; // used by TiNetworkHTTPClientProxy, ImageLoader
@property (nonatomic, strong, readonly) NSString *connectionType; // used by TiNetworkHTTPClientProxy
//@property(nonatomic, assign, readonly ) NSStringEncoding     encoding;

@property (nonatomic, strong, readonly) NSData *responseData; // used by TiNetworkHTTPClientProxy, ImageLoader
@property (nonatomic, strong, readonly) NSString *responseString; // used by TiNetworkHTTPClientProxy, YahooModule and GeolocationModule
@property (nonatomic, strong, readonly) NSDictionary *responseDictionary; // used by TiNetworkHTTPClientProxy
@property (nonatomic, strong, readonly) NSArray *responseArray; // used by TiNetworkHTTPClientProxy
@property (nonatomic, assign, readonly) BOOL saveToFile; // used by TiNetworkHTTPClientProxy

@property (nonatomic, assign, readonly) NSInteger status; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, strong, readonly) NSString *location; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, assign, readonly) NSInteger responseLength; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, strong, readwrite) NSError *error; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, strong, readwrite) NSString *filePath; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, assign, readwrite) float downloadProgress; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, assign, readwrite) float uploadProgress; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, assign, readwrite) BOOL connected; // should be protocol (used by APSHTTPRequest)
@property (nonatomic, assign, readwrite) APSHTTPResponseState readyState; // should be protocol (used by APSHTTPRequest)

- (void)updateRequestParamaters:(NSURLRequest *)request;
- (void)updateResponseParamaters:(NSURLResponse *)response;

- (void)appendData:(NSData *)data;
@end
