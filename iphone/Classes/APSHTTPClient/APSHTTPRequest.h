/**
 * Appcelerator APSHTTPClient Library
 * Copyright (c) 2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

typedef enum {
	APSRequestAuthNone = 0,
	APSRequestAuthBasic = 1,
	APSRequestAuthDigest = 2,
    APSRequestAuthChallange = 3
} APSRequestAuth;

typedef enum {
	APSRequestErrorCancel = 0
} APSRequestError;


@class APSHTTPResponse;
@class APSHTTPRequest;
@class APSHTTPPostForm;
@class APSHTTPOperation;

@protocol APSHTTPRequestDelegate <NSObject>
@optional
-(void)request:(APSHTTPRequest*)request onLoad:(APSHTTPResponse*)response;
-(void)request:(APSHTTPRequest*)request onError:(APSHTTPResponse*)response;
-(void)request:(APSHTTPRequest*)request onDataStream:(APSHTTPResponse*)response;
-(void)request:(APSHTTPRequest*)request onSendStream:(APSHTTPResponse*)response;
-(void)request:(APSHTTPRequest*)request onReadyStateChage:(APSHTTPResponse*)response;
-(void)request:(APSHTTPRequest*)request onRedirect:(APSHTTPResponse*)response;

@end

@interface APSHTTPRequest : NSObject<NSURLConnectionDelegate, NSURLConnectionDataDelegate>
{
    long long _expectedDownloadResponseLength;
    NSURLConnection *_connection;
    NSMutableDictionary *_headers;
    APSHTTPOperation* _operation;
}

@property(nonatomic, readonly) NSMutableURLRequest *request;
@property(nonatomic, retain) NSURL *url;
@property(nonatomic, retain) NSString *method;
@property(nonatomic, retain) NSString *filePath;
@property(nonatomic, retain) NSString *requestUsername;
@property(nonatomic, retain) NSString *requestPassword;
@property(nonatomic, retain) APSHTTPPostForm *postForm;
@property(nonatomic, readonly) APSHTTPResponse* response;
@property(nonatomic, assign) NSObject<APSHTTPRequestDelegate>* delegate;
@property(nonatomic, assign) NSObject<NSURLConnectionDelegate>* connectionDelegate;
@property(nonatomic) NSTimeInterval timeout;
@property(nonatomic) BOOL sendDefaultCookies;
@property(nonatomic) BOOL redirects;
@property(nonatomic) BOOL synchronous;
@property(nonatomic) BOOL validatesSecureCertificate;
@property(nonatomic) BOOL cancelled;
@property(nonatomic) APSRequestAuth authType;
@property(nonatomic, retain) NSOperationQueue *theQueue;
@property(nonatomic, retain) NSDictionary *userInfo;
-(void)send;
-(void)abort;
-(void)addRequestHeader:(NSString*)key value:(NSString*)value;
-(void)setCachePolicy:(NSURLRequestCachePolicy)cache;
-(void)connection:(NSURLConnection*)connection didFailWithError:(NSError*)error;
-(NSURLConnection*)connection;
@end
