/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * Special thanks to Pedro Enrique for implementing this.
 */

#import "TiHTTPClient.h"
#import "TiProxy.h"

@class TiDOMDocumentProxy;
@class TiBlob;

@interface HTTPClientProxy : TiProxy<TiHTTPRequestDelegate>
{
    TiHTTPRequest *httpRequest;
    TiHTTPResponse* response;
    NSTimeInterval _uploadTime;
    NSTimeInterval _downloadTime;
    
    BOOL hasOnload;
    BOOL hasOnerror;
    BOOL hasOnreadystatechange;
    BOOL hasOndatastream;
    BOOL hasOnsendstream;
    BOOL hasOnredirect;
}


@property(nonatomic, readonly)NSString* responseText;
@property(nonatomic, readonly)TiBlob* responseData;
@property(nonatomic, readonly)TiDOMDocumentProxy* responseXML;
@property(nonatomic, readonly)NSDictionary* responseDictionary;
@property(nonatomic, readonly)NSArray* responseArray;

@property(nonatomic, readonly)NSNumber* readyState;
@property(nonatomic, readonly)NSDictionary* responseHeaders;

-(void)setOnload:(id)callback;
-(void)setOnerror:(id)callback;
-(void)setOnreadystatechange:(id)callback;
-(void)setOndatastream:(id)callback;
-(void)setOnsendstream:(id)callback;
-(void)setOnredirect:(id)callback;


@end
