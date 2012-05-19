/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORK

#import <Foundation/Foundation.h>
#import "TiProxy.h"
#import "TiBlob.h"
#import "NetworkModule.h"


@interface TiNetworkTCPSocketProxy : TiProxy {
    CFSocketRef socket;
    NSString* hostName;
    int port;
    
    NSMutableDictionary* remoteSocketDictionary; // remoteSocket->{inputStream, outputStream, writeBuffer, writePos}
    
    NSCondition* configureCondition;
	
    BOOL stripTerminator;
	SocketMode mode;
	CFRunLoopSourceRef socketRunLoop;
}

-(void)listen:(id)unused;
-(void)connect:(id)unused;
-(void)close:(id)unused;

-(void)write:(id)arg;

@property(readonly, nonatomic) NSString* hostName;
@property(readonly, nonatomic) NSNumber* port;
@property(readonly, nonatomic) NSNumber* mode;
@property(readonly, nonatomic, getter=isValid) NSNumber* valid;

@property(nonatomic, assign) NSNumber* stripTerminator;

@end

#endif