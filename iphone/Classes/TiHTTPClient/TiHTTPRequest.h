/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

typedef enum {
	TiRequestAuthNone = 0,
	TiRequestAuthBasic = 1,
	TiRequestAuthDigest = 2,
    TiRequestAuthChallange = 3
} TiRequestAuth;

typedef enum {
	TiRequestErrorCancel = 0
} TiRequestError;


@class TiHTTPResponse;
@class TiHTTPRequest;
@class TiHTTPPostForm;
@class TiHTTPOperation;

@protocol TiHTTPRequestDelegate <NSObject>
@optional
-(void)tiRequest:(TiHTTPRequest*)request onLoad:(TiHTTPResponse*)tiResponse;
-(void)tiRequest:(TiHTTPRequest*)request onError:(TiHTTPResponse*)tiResponse;
-(void)tiRequest:(TiHTTPRequest*)request onDataStream:(TiHTTPResponse*)tiResponse;
-(void)tiRequest:(TiHTTPRequest*)request onSendStream:(TiHTTPResponse*)tiResponse;
-(void)tiRequest:(TiHTTPRequest*)request onReadyStateChage:(TiHTTPResponse*)tiResponse;
-(void)tiRequest:(TiHTTPRequest*)request onRedirect:(TiHTTPResponse*)tiResponse;

@end

@interface TiHTTPRequest : NSObject<NSURLConnectionDelegate, NSURLConnectionDataDelegate>
{
    long long _expectedDownloadResponseLength;
    NSURLConnection *_connection;
    NSMutableDictionary *_headers;
}

@property(nonatomic, readonly) NSMutableURLRequest *request;
@property(nonatomic, retain) NSURL *url;
@property(nonatomic, retain) NSString *method;
@property(nonatomic, retain) NSString *filePath;
@property(nonatomic, retain) NSString *requestUsername;
@property(nonatomic, retain) NSString *requestPassword;
@property(nonatomic, retain) TiHTTPPostForm *postForm;
@property(nonatomic, retain) TiHTTPOperation* operation;
@property(nonatomic, readonly) TiHTTPResponse* response;
@property(nonatomic, assign) NSObject<TiHTTPRequestDelegate>* delegate;
@property(nonatomic) NSTimeInterval timeout;
@property(nonatomic) BOOL sendDefaultCookies;
@property(nonatomic) BOOL redirects;
@property(nonatomic) BOOL synchronous;
@property(nonatomic) BOOL validatesSecureCertificate;
@property(nonatomic) BOOL cancelled;
@property(nonatomic) TiRequestAuth authType;
@property(nonatomic, retain) NSOperationQueue *theQueue;
@property(nonatomic, retain) NSDictionary *userInfo;
-(void)send;
-(void)abort;
-(void)addRequestHeader:(NSString*)key value:(NSString*)value;
-(void)setCachePolicy:(NSURLRequestCachePolicy*)cache;
-(void)connection:(NSURLConnection*)connection didFailWithError:(NSError*)error;
-(NSURLConnection*)connection;
@end
