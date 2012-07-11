/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

// TODO: Migrate to GCD sockets (GCDAsyncSocket). This will resolve a number of really ugly issues:
// * Lower thread counts
// * Explicit synchronization (no more conditions, flags, or race conditons!)
// * Maybe even synchronize with the context itself (when TIMOB-6990 complete)

#ifdef USE_TI_NETWORKSOCKET
#import <Foundation/Foundation.h>
#import "TiStreamProxy.h"
#import "AsyncSocket.h"
#import "TiNetworkSocketProxy.h"

// Used to determine the type of processing 
typedef enum {
    TO_BUFFER = 1,
    TO_STREAM,
    TO_CALLBACK,
} ReadDestination;

@interface TiNetworkSocketTCPProxy : TiStreamProxy<TI_AsyncSocketDelegate, TiStreamInternal> {
    AsyncSocket* socket;
    SocketState internalState;
    NSCondition* listening;
    
    NSThread* socketThread;
    // We have to have an explicit "host" property because of some 'fun' undocumented KVO
    // behavior - it turns out that KVO 'getters' also look for '-(type)_key' signature
    // selectors.  TiProxy has a '_host' function.
    NSString* host;
    
    // We offer synchronous I/O.  The underlying socket implementation is asynchronous.
    // So we need to ensure our own synchronicity by signaling a condition when operations
    // complete.
    NSCondition* ioCondition;
    NSUInteger readDataLength;
    NSError* socketError;
    
    // In order to put the accepted socket on the right run loop, and make sure it's constructed
    // properly, we need THESE as well...
    NSMutableDictionary* acceptArgs;
    NSRunLoop* acceptRunLoop;
    BOOL accepting;

    // And, last but not least, in order to make sure that socket run loops are configured AND ACTIVE before performing any work on them,
    // we need to be able to signal that they're 
    NSCondition* readyCondition;
    BOOL socketReady;
    
    // Information used to hash callbacks and asynch ops to tags.
    int asynchTagCount;
    NSMutableDictionary* operationInfo;
    
    KrollCallback* connected;
    KrollCallback* accepted;
    KrollCallback* closed;
    KrollCallback* error;
}
// Properties:
// -- Stored on TiProxy dynprops --
// int port
// ----
@property (nonatomic, readwrite, retain) NSString* host;
@property (nonatomic, readonly) NSNumber* state; // Req's local processing
@property (nonatomic, readwrite, retain) KrollCallback* connected;
@property (nonatomic, readwrite, retain) KrollCallback* accepted;
@property (nonatomic, readwrite, retain) KrollCallback* closed;
@property (nonatomic, readwrite, retain) KrollCallback* error;

// Public API
-(void)connect:(id)_void;
-(void)listen:(id)arg; // arg[0]: int maxAcceptQueueSize : queue size
-(void)accept:(id)arg; // arg[0]: Object params : callbacks for created socket
-(void)close:(id)_void;

@end
#endif