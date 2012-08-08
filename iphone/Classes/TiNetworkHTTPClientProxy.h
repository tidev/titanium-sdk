/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORK

#import "TiProxy.h"
#import "TiBlob.h"
#import "TiBase.h"
#import "ASIFormDataRequest.h"
#import "ASIProgressDelegate.h"

typedef enum {
	NetworkClientStateUnsent = 0,
	NetworkClientStateOpened = 1,
	NetworkClientStateHeaders = 2,
	NetworkClientStateLoading = 3,
	NetworkClientStateDone = 4,	
} NetworkClientState;


@interface TiNetworkHTTPClientProxy : TiProxy<TI_ASIHTTPRequestDelegate,TI_ASIProgressDelegate> 
{
@private
	ASIFormDataRequest *request;
	NetworkClientState readyState;
	BOOL connected;
	BOOL async;
	NSURL *url;
	long long uploadProgress;
	long long downloadProgress;
	long long downloadLength;
	long long uploadLength;
	NSNumber* validatesSecureCertificate;
    NSNumber* timeout;
    NSNumber* autoRedirect;
	
	// callbacks are now in the JS object
	BOOL hasOnload;
	BOOL hasOnerror;
	BOOL hasOnreadystatechange;
	BOOL hasOndatastream;
	BOOL hasOnsendprogress;
	BOOL hasOndownloadgrogress;
}
// Internal
-(NSDictionary*)responseHeaders;

// event callbacks
-(void)setOnload:(KrollCallback *)callback;
-(void)setOnerror:(KrollCallback *)callback;
-(void)setOnreadystatechange:(KrollCallback *)callback;
-(void)setOndowloadprogress:(KrollCallback *)callback;
-(void)setOnsendprogress:(KrollCallback *)callback;
-(void)setOndatastream:(KrollCallback *)callback;

// state information
@property(nonatomic,readonly) NSInteger status;
@property(nonatomic,readonly) BOOL connected;
@property(nonatomic,readonly) NSInteger readyState;
@property(nonatomic,readonly) NSString* responseText;
@property(nonatomic,readonly) TiProxy* responseXML;	
@property(nonatomic,readonly) TiBlob* responseData;	
@property(nonatomic,readonly) NSString* connectionType;
@property(nonatomic,readonly) NSString* location;
@property(nonatomic,retain,readwrite) NSNumber* validatesSecureCertificate;
@property(nonatomic,retain,readwrite) NSNumber* timeout;
@property(nonatomic,retain,readwrite) NSNumber* autoRedirect;

// constants
@property(nonatomic,readonly) NSInteger UNSENT;
@property(nonatomic,readonly) NSInteger OPENED;
@property(nonatomic,readonly) NSInteger HEADERS_RECEIVED;
@property(nonatomic,readonly) NSInteger LOADING;
@property(nonatomic,readonly) NSInteger DONE;

// public methods
-(void)abort:(id)args;
-(void)open:(id)args;
-(void)setRequestHeader:(id)args;
-(void)send:(id)args;
-(void)clearCookies:(id)args;
-(id)getResponseHeader:(id)args;

@end

#endif
