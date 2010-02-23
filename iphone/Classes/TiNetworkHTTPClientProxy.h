/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"
#import "TiBlob.h"
#import "ASIFormDataRequest.h"

typedef enum {
	NetworkClientStateUnsent = 0,
	NetworkClientStateOpened = 1,
	NetworkClientStateHeaders = 2,
	NetworkClientStateLoading = 3,
	NetworkClientStateDone = 4,	
} NetworkClientState;


@interface TiNetworkHTTPClientProxy : TiProxy 
{
@private
	ASIFormDataRequest *request;
	NetworkClientState readyState;
	BOOL connected;
	BOOL async;
	NSURL *url;
	CGFloat uploadProgress;
	CGFloat downloadProgress;
	
	// callbacks
	KrollCallback *onload;
	KrollCallback *onerror;
	KrollCallback *onreadystatechange;
	KrollCallback *ondatastream;
	KrollCallback *onsendstream;
}

// event callbacks
@property(nonatomic,retain) KrollCallback* onload;
@property(nonatomic,retain) KrollCallback* onerror;
@property(nonatomic,retain) KrollCallback* onreadystatechange;
@property(nonatomic,retain) KrollCallback* ondatastream;
@property(nonatomic,retain) KrollCallback* onsendstream;

// state information
@property(nonatomic,readonly) NSNumber* status;
@property(nonatomic,readonly) NSNumber* connected;
@property(nonatomic,readonly) NSNumber* readyState;
@property(nonatomic,readonly) NSString* responseText;
@property(nonatomic,readonly) TiProxy* responseXML;	
@property(nonatomic,readonly) TiBlob* responseData;	
@property(nonatomic,readonly) NSString* connectionType;
@property(nonatomic,readonly) NSString* location;

// constants
@property(nonatomic,readonly) NSNumber* UNSENT;
@property(nonatomic,readonly) NSNumber* OPENED;
@property(nonatomic,readonly) NSNumber* HEADERS_RECEIVED;
@property(nonatomic,readonly) NSNumber* LOADING;
@property(nonatomic,readonly) NSNumber* DONE;

// public methods
-(void)abort:(id)args;
-(void)open:(id)args;
-(void)setRequestHeader:(id)args;
-(void)setTimeout:(id)args;
-(void)send:(id)args;
-(id)getResponseHeader:(id)args;

@end
