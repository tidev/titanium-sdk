/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORK
#import "TiNetworkSocketProxy.h"
#import "NetworkModule.h"
#import "TiBlob.h"

@interface TiNetworkSocketProxy (Private)
-(void)cleanupSocket;
@end

@implementation TiNetworkSocketProxy
@synthesize connected, accepted, closed, read, error, wrotedata;

#pragma mark Internals

-(id)init
{
    if (self = [super init]) {
        acceptCondition = [[NSCondition alloc] init];
        readBuffer = [[NSMutableData alloc] initWithLength:1024]; // Read buffer size is 1pg
        internalState = SOCKET_INITIALIZED;
        socketThread = nil;
    }
    return self;
}

-(void)dealloc
{
    // Calls _destroy
    [super dealloc];
}

-(void)_destroy
{
    // TODO: Make sure that we block on the kroll thread, not the socket's thread or main thread
    // Signal, just in case we're blocking on an accept
    [acceptCondition lock];
    [acceptCondition signal];
    [acceptCondition unlock];
    RELEASE_TO_NIL(acceptCondition);
    
    internalState = SOCKET_CLOSED;
    [self cleanupSocket];
    
    RELEASE_TO_NIL(readBuffer);
    
    RELEASE_TO_NIL(connected);
    RELEASE_TO_NIL(accepted);
    RELEASE_TO_NIL(closed);
    RELEASE_TO_NIL(read);
    RELEASE_TO_NIL(error);
    RELEASE_TO_NIL(wrotedata);
    
    [super _destroy];
}

-(void)cleanupSocket
{
    [socket disconnect];
    [socket setDelegate:nil];
    RELEASE_TO_NIL(socket);
}

-(void)startSocket
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    NSString* host = [self valueForUndefinedKey:@"hostName"];
    NSNumber* port = [self valueForUndefinedKey:@"port"];
    NSNumber* type = [self valueForUndefinedKey:@"type"];
    NSNumber* timeout = [self valueForUndefinedKey:@"timeout"];  // TODO: SPEC: Add to spec
    
    if ([type intValue] != TCP) {
        [self throwException:[NSString stringWithFormat:@"Attempt to connect with unrecognized protocol: %d",[type intValue]]
                   subreason:nil
                    location:CODELOCATION];
    }
    
    if (host == nil || [host isEqual:@""]) {
        [self throwException:@"Attempt to connect with bad host: nil or empty"
                   subreason:nil
                    location:CODELOCATION];
    }
    
    socket = [[AsyncSocket alloc] initWithDelegate:self];
    NSError* err = nil;
    BOOL success;
    if (timeout == nil) {
        success = [socket connectToHost:host onPort:[port intValue] error:&err];
    }
    else {
        success = [socket connectToHost:host onPort:[port intValue] withTimeout:[timeout doubleValue] error:&err];
    }
    
    if (err || !success) {
        [self cleanupSocket];
        internalState = SOCKET_ERROR;
        
        [self throwException:[NSString stringWithFormat:@"Connection attempt error: %@",(error ? error : @"UNKNOWN ERROR")]
                   subreason:nil
                    location:CODELOCATION];
    }
        
    // Begin the read process
    [socket readDataWithTimeout:-1 
                         buffer:readBuffer
                   bufferOffset:0
                      maxLength:[readBuffer length]
                            tag:0];
    
    socketThread = [NSThread currentThread];
    
    // Begin the run loop for the socket
    while (!(internalState & (SOCKET_CLOSED | SOCKET_ERROR)) &&
           [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]])
        ; // Keep on truckin'
    
    [pool release];
}

#pragma mark Public API : Functions

#define ENSURE_SOCKET_THREAD(f,x) \
if ([NSThread currentThread] != socketThread) { \
[self performSelector:@selector(f:) onThread:socketThread withObject:x waitUntilDone:NO]; \
return; \
} \

-(void)connect:(id)_void
{
    if (!(internalState & SOCKET_INITIALIZED)) {
        [self throwException:[NSString stringWithFormat:@"Attempt to connect with bad state: %d",internalState]
                   subreason:nil 
                    location:CODELOCATION];
    }
    
    [self performSelectorInBackground:@selector(startSocket) withObject:nil];
}

-(void)listen:(id)arg
{
    // TODO: Implement
}

-(void)accept:(id)arg
{
    // TODO: Implement
}

-(void)close:(id)_void
{
    ENSURE_SOCKET_THREAD(close,_void);
    
    if (!(internalState & (SOCKET_CONNECTED | SOCKET_LISTENING | SOCKET_INITIALIZED))) {
        [self throwException:[NSString stringWithFormat:@"Attempt to close in invalid state: %d",internalState]
                   subreason:nil
                    location:CODELOCATION];
    }
    
    internalState = SOCKET_CLOSED;
    [self cleanupSocket];
}

// ARGS
// arg[0] : Ti.Blob data - data to write
// arg[1][optional] : int tag - tag for write op
// arg[2][optional] : double timeout - timeout interval
-(void)write:(id)args
{
    ENSURE_SOCKET_THREAD(write,args);
    
    if (!(internalState & SOCKET_CONNECTED)) {
        [self throwException:[NSString stringWithFormat:@"Attempt to write in invalid state: %d",internalState]
                   subreason:nil
                    location:CODELOCATION];
    }
    
    TiBlob* blob;
    NSNumber* tag;
    NSNumber* timeout;
    
    ENSURE_ARG_AT_INDEX(blob, args, 0, TiBlob);
    ENSURE_ARG_OR_NIL_AT_INDEX(tag, args, 1, NSNumber);
    ENSURE_ARG_OR_NIL_AT_INDEX(timeout, args, 2, NSNumber);
    
    [socket writeData:[blob data] withTimeout:((timeout) ? [timeout doubleValue] : -1) tag:[tag longValue]];
}

#pragma mark Public API : Properties

-(NSNumber*)state
{
    return NUMINT(internalState);
}

// TODO: Add 'readBufferSize' to spec
-(void)setReadBufferSize:(NSNumber *)readBufferSize_
{
    // NOTE: Can't set this once CONNECTED; it's something that has to be
    // pre-configured since we can't fuck with the read buffer once reads are ongoing,
    // and this is the easiest way to handle that.
    if (!(internalState & SOCKET_INITIALIZED)) {
        [self throwException:[NSString stringWithFormat:@"Attempt to set buffer size in invalid state: %d",internalState]
                   subreason:nil 
                    location:CODELOCATION];
    }
    
    NSUInteger newSize = [readBufferSize_ unsignedIntegerValue];
    if (newSize <= 0) {
        NSLog(@"[WARN] Bad size %ud for read buffer; setting to 1024",newSize);
        newSize = 1024;
    }
    [readBuffer setLength:newSize];
}

-(NSNumber*)readBufferSize
{
    return [NSNumber numberWithUnsignedInteger:[readBuffer length]];
}

// TODO: Move to TiBase?
#define TYPESAFE_SETTER(funcname,prop,type) \
-(void)funcname:(type*)val \
{ \
ENSURE_TYPE_OR_NIL(val,type); \
if (prop != val) { \
[prop release]; \
prop = [val retain]; \
}\
}

TYPESAFE_SETTER(setConnected, connected, KrollCallback)
TYPESAFE_SETTER(setAccepted, accepted, KrollCallback)
TYPESAFE_SETTER(setClosed, closed, KrollCallback)
TYPESAFE_SETTER(setRead, read, KrollCallback)
TYPESAFE_SETTER(setError, error, KrollCallback)
TYPESAFE_SETTER(setWrotedata, wrotedata, KrollCallback)

#pragma mark AsyncSocketDelegate methods

-(void)onSocket:(AsyncSocket *)sock didConnectToHost:(NSString *)host port:(UInt16)port
{
    internalState = SOCKET_CONNECTED;
 
    if (connected != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",nil];
		[self _fireEventToListener:@"connected" withObject:event listener:connected thisObject:self];        
    }
 }

-(void)onSocketDidDisconnect:(AsyncSocket *)sock
{
    // Triggered when we error out, so don't fire in that situation
    if (!(internalState & SOCKET_ERROR)) {
        // May also be triggered when we're already "closed"
        if (!(internalState & SOCKET_CLOSED)) {
            internalState = SOCKET_CLOSED;
            if (closed != nil) {
                NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket", nil];
                [self _fireEventToListener:@"closed" withObject:event listener:closed thisObject:self];
            }
        }
    }
}

// TODO: As per AsyncSocket docs, may want to call "unreadData" and return that information, or at least allow access to it via some other method
-(void)onSocket:(AsyncSocket *)sock willDisconnectWithError:(NSError *)err
{
    internalState = SOCKET_ERROR;
    if (error != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",NUMINT([err code]),@"errorCode",[err localizedDescription],@"error",nil];
        [self _fireEventToListener:@"error" withObject:event listener:error thisObject:self];
    }
}

// TODO: Add 'finishedwrite' to spec?
-(void)onSocket:(AsyncSocket *)sock didWriteDataWithTag:(long)tag 
{
    if (wrotedata != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",NUMLONG(tag),@"tag",nil];
        [self _fireEventToListener:@"finishedwrite" withObject:event listener:wrotedata thisObject:self];
    }
}

// 'data' is the total amount of data read; maybe we should just postpone any data events until the read is complete?
-(void)onSocket:(AsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
    if (read != nil) {
        // The data points to the same bytes as our readbuffer, so we need to copy them
        TiBlob* blob = [[[TiBlob alloc] initWithData:[[data copy] autorelease] mimetype:@"application/octet-stream"] autorelease];
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",[NSNumber numberWithUnsignedInteger:[data length]],@"bytes",blob,@"data", nil];
        [self _fireEventToListener:@"read" withObject:event listener:read thisObject:self];
    }
    
    // Set up the next read
    [socket readDataWithTimeout:-1
                         buffer:readBuffer
                   bufferOffset:0
                      maxLength:[readBuffer length]
                            tag:0];
}

@end
#endif