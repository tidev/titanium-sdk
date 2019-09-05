/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_NETWORK

#import "TiDOMDocumentProxy.h"
#import <TitaniumKit/APSHTTPClient.h>
#import <TitaniumKit/TiProxy.h>

@class TiBlob;

@protocol SecurityManagerProtocol <NSObject>
@required
- (BOOL)willHandleURL:(NSURL *)url;
- (id<APSConnectionDelegate>)connectionDelegateForUrl:(NSURL *)url;
@end

@interface TiNetworkHTTPClientProxy : TiProxy <APSHTTPRequestDelegate> {
  APSHTTPRequest *httpRequest;
  NSTimeInterval _uploadTime;
  NSTimeInterval _downloadTime;
  id<APSConnectionDelegate> apsConnectionDelegate;
  id<SecurityManagerProtocol> apsConnectionManager;

  BOOL hasOnload;
  BOOL hasOnerror;
  BOOL hasOnreadystatechange;
  BOOL hasOndatastream;
  BOOL hasOnsendstream;
  BOOL hasOnredirect;
}

@property (nonatomic, readonly) APSHTTPResponse *response;

// state information
@property (nonatomic, readonly) NSNumber *status;
@property (nonatomic, readonly) NSString *statusText;
@property (nonatomic, readonly) NSNumber *readyState;
@property (nonatomic, readonly) NSString *responseText;
@property (nonatomic, readonly) TiBlob *responseData;
@property (nonatomic, readonly) NSArray *responseArray;
@property (nonatomic, readonly) NSDictionary *responseHeaders;
@property (nonatomic, readonly) NSDictionary *responseDictionary;
@property (nonatomic, readonly) TiDOMDocumentProxy *responseXML;
@property (nonatomic, readonly) NSString *connectionType;
@property (nonatomic, readonly) NSString *location;

// constants
@property (nonatomic, readonly) NSNumber *UNSENT;
@property (nonatomic, readonly) NSNumber *OPENED;
@property (nonatomic, readonly) NSNumber *HEADERS_RECEIVED;
@property (nonatomic, readonly) NSNumber *LOADING;
@property (nonatomic, readonly) NSNumber *DONE;

- (void)setOnload:(id)callback;
- (void)setOnerror:(id)callback;
- (void)setOnreadystatechange:(id)callback;
- (void)setOndatastream:(id)callback;
- (void)setOnsendstream:(id)callback;
- (void)setOnredirect:(id)callback;

// public methods
- (void)abort:(id)args;
- (void)open:(id)args;
- (void)setRequestHeader:(id)args;
- (void)send:(id)args;
- (void)clearCookies:(id)args;
- (NSString *)getResponseHeader:(id)args;
- (NSString *)allResponseHeaders;
- (NSString *)apiName;
- (NSNumber *)connected;
@end

#endif
