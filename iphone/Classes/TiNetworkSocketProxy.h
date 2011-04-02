/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORK
#import <Foundation/Foundation.h>
#import "TiProxy.h"
#import "AsyncSocket.h"
#import "NetworkModule.h"

@interface TiNetworkSocketProxy : TiProxy<AsyncSocketDelegate> {
    AsyncSocket* socket;
    NSCondition* acceptCondition;
    SocketState internalState;
    NSMutableData* readBuffer;
    
    NSThread* socketThread;
    
    KrollCallback* connected;
    KrollCallback* accepted;
    KrollCallback* closed;
    KrollCallback* read;
    KrollCallback* error;
    KrollCallback* wrotedata;
}
// Properties:
// -- Stored on TiProxy dynprops --
// String hostName // TODO: Have to change spec to reflect new name
// int port
// int type
// KrollCallback connected // TODO: Enforce type safety for KrollCallbacks
// KrollCallback error
// KrollCallback closed
// KrollCallback accepted
// KrollCallback read
// KrollCallback wrotedata
// ----
@property (nonatomic, readonly) NSNumber* state; // Req's local processing
@property (nonatomic, readwrite, assign) NSNumber* readBufferSize; // TODO: replace w/a Buffer object?
@property (nonatomic, readwrite, retain) KrollCallback* connected;
@property (nonatomic, readwrite, retain) KrollCallback* accepted;
@property (nonatomic, readwrite, retain) KrollCallback* closed;
@property (nonatomic, readwrite, retain) KrollCallback* read;
@property (nonatomic, readwrite, retain) KrollCallback* error;
@property (nonatomic, readwrite, retain) KrollCallback* wrotedata;

// Public API
-(void)connect:(id)_void;
-(void)listen:(id)arg; // arg[0]: int maxAcceptQueueSize : queue size
-(void)accept:(id)arg; // arg[0]: Object params : callbacks for created socket
-(void)close:(id)_void;
-(void)write:(id)arg; // arg[0]: Ti.Blob blob : blob to write




@end
#endif