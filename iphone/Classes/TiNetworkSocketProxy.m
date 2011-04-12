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
#import "TiBuffer.h"

static NSString* SOCK_KEY = @"socket";
static NSString* ARG_KEY = @"arg";

@interface TiNetworkSocketProxy (Private)
-(void)cleanupSocket;
-(void)_setConnectedSocket:(AsyncSocket*)sock;
-(void)startConnectingSocket;
-(void)startListeningSocket;
-(void)startAcceptedSocket:(NSDictionary*)info;
-(void)socketRunLoop;
@end

@implementation TiNetworkSocketProxy
@synthesize host, connected, accepted, closed, error;

#pragma mark Internals

-(id)init
{
    if (self = [super init]) {
        listening = [[NSCondition alloc] init];
        ioCondition = [[NSCondition alloc] init];
        internalState = SOCKET_INITIALIZED;
        socketThread = nil;
        acceptArgs = [[NSMutableDictionary alloc] init];
        acceptCondition = [[NSCondition alloc] init];
        asynchTagCount = 0;
        asynchCallbacks = [[NSMutableDictionary alloc] init];
    }
    return self;
}

-(void)dealloc
{
    // Calls _destroy
    [super dealloc];
}

// TODO: Need to release our conditions safely
-(void)_destroy
{
    [listening lock];
    [listening signal];
    [listening unlock];
    RELEASE_TO_NIL(listening);
    
    [ioCondition lock];
    [ioCondition signal];
    [ioCondition unlock];
    RELEASE_TO_NIL(ioCondition);
 
    // Can't call 'cleanupSocket' because these operations have to be performed in a specific order,
    // AND we have to guarantee that the disconnect is called on the socket thread while the run loop
    // is still active
    [socket setDelegate:nil];
    if ([socketThread isExecuting]) {
        [socket performSelector:@selector(disconnect) onThread:socketThread withObject:nil waitUntilDone:YES];
    }
    internalState = SOCKET_CLOSED;
    RELEASE_TO_NIL(socket);
    RELEASE_TO_NIL(socketThread);

    RELEASE_TO_NIL(asynchCallbacks);
    
    RELEASE_TO_NIL(acceptArgs);
    RELEASE_TO_NIL(acceptCondition);
    
    RELEASE_TO_NIL(connected);
    RELEASE_TO_NIL(accepted);
    RELEASE_TO_NIL(closed);
    RELEASE_TO_NIL(error);
    
    RELEASE_TO_NIL(host);
    
    [super _destroy];
}

-(void)cleanupSocket
{
    [socket disconnect];
    [socket setDelegate:nil];
    RELEASE_TO_NIL(socket);
}

// _ prefix keeps setX: private
// TODO: Or does it?  KVC seems to like to "automatically" interpret _ prefixes sometimes.
-(void)_setConnectedSocket:(AsyncSocket*)sock
{
    [self cleanupSocket];
    internalState = SOCKET_CONNECTED;
    socket = [sock retain];
    [socket setDelegate:self];
    socketThread = [[NSThread currentThread] retain];
}

// TODO: Build a better run loop
#define AUTORELEASE_LOOP 5
-(void)socketRunLoop
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    // Begin the run loop for the socket
    int counter=0;
    while (!(internalState & (SOCKET_CLOSED | SOCKET_ERROR)) &&
           [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]]) 
    {
        if (++counter == AUTORELEASE_LOOP) {
            [pool release];
            pool = [[NSAutoreleasePool alloc] init];
            counter = 0;
        }
    }

    [pool release];
}

-(void)startConnectingSocket
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    id port = [self valueForUndefinedKey:@"port"]; // Can be string or int
    ENSURE_INT_COERCION(port);
    NSNumber* timeout = [self valueForUndefinedKey:@"timeout"];
    
    if (host == nil || [host isEqual:@""]) {
        // TODO: MASSIVE: FIX OUR BROKEN EXCEPTION HANDLING
        /*
        [self throwException:@"Attempt to connect with bad host: nil or empty"
                   subreason:nil
                    location:CODELOCATION];
         */
        NSLog(@"[ERROR] Attempt to connect with bad host: nil or empty");
        [pool release];
        return;
    }
    
    socket = [[AsyncSocket alloc] initWithDelegate:self];
    socketThread = [[NSThread currentThread] retain];
    
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
        
        /*
        [self throwException:[NSString stringWithFormat:@"Connection attempt error: %@",(err ? err : @"UNKNOWN ERROR")]
                   subreason:nil
                    location:CODELOCATION];
         */
        NSLog(@"[ERROR] Connection attempt error: %@", (err ? err : @"UNKNOWN ERROR"));
        [pool release];
        return;
    }
    
    [self socketRunLoop];
    
    [pool release];
}

-(void)startListeningSocket
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    id port = [self valueForKey:@"port"]; // Can be string or int
    
    if (host == nil || [host isEqual:@""]) {
        /*
        [self throwException:@"Attempt to listen with bad host: nil or empty"
                   subreason:nil
                    location:CODELOCATION];
         */
        NSLog(@"[ERROR] Attempt to listen with bad host: nil or empty");
        [pool release];
        return;       
    }
    
    socket = [[AsyncSocket alloc] initWithDelegate:self];
        
    NSError* err = nil;
    BOOL success = [socket acceptOnInterface:host port:[port intValue] autoaccept:NO error:&err];
    
    if (err || !success) {
        [self cleanupSocket];
        internalState = SOCKET_ERROR;
        
        [listening lock];
        [listening signal];
        [listening unlock];
        
        /*
        [self throwException:[NSString stringWithFormat:@"Listening attempt error: %@",(err ? err : @"<UNKNOWN ERROR>")]
                   subreason:nil
                    location:CODELOCATION];
         */
        NSLog(@"[ERROR] Listening attempt error: %@", (err ? err : @"UNKNOWN ERROR"));
        [pool release];
        return;
    }
    // Make sure that we 'accept' only when explicitly requested
    CFSocketRef cfSocket = [socket getCFSocket];
    CFOptionFlags options = CFSocketGetSocketFlags(cfSocket);
    CFSocketSetSocketFlags(cfSocket, options & ~kCFSocketAutomaticallyReenableAcceptCallBack);
  
    socketThread = [[NSThread currentThread] retain];
    
    [listening lock];
    internalState = SOCKET_LISTENING;
    [listening signal];
    [listening unlock];
    
    [self socketRunLoop];
    
    [pool release];
}

-(void)startAcceptedSocket:(NSDictionary*)info
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];

    [acceptCondition lock];
    acceptRunLoop = [NSRunLoop currentRunLoop];
    [acceptCondition signal];
    [acceptCondition wait];
    [acceptCondition unlock];
    
    NSArray* arg = [info objectForKey:ARG_KEY];
    AsyncSocket* newSocket = [info objectForKey:SOCK_KEY];
    
    TiNetworkSocketProxy* proxy = [[[TiNetworkSocketProxy alloc] _initWithPageContext:[self pageContext] args:arg] autorelease];
    [proxy _setConnectedSocket:newSocket];
    
    // TODO: remoteHost/remotePort & host/port?
    [proxy setValue:[newSocket connectedHost] forKey:@"host"];
    [proxy setValue:NUMINT([newSocket connectedPort]) forKey:@"port"];
    
    if (accepted != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",proxy,@"inbound",nil];
        [self _fireEventToListener:@"accepted" withObject:event listener:accepted thisObject:self];
    }

    [proxy socketRunLoop];

    [newSocket release];
    [pool release];
}

#pragma mark Public API : Functions

#define ENSURE_SOCKET_THREAD(f,x) \
if ([NSThread currentThread] != socketThread) { \
[self performSelector:@selector(f:) onThread:socketThread withObject:x waitUntilDone:YES]; \
return; \
} \

-(void)connect:(id)_void
{
    if (!(internalState & SOCKET_INITIALIZED)) {
        /*
        [self throwException:[NSString stringWithFormat:@"Attempt to connect with bad state: %d",internalState]
                   subreason:nil 
                    location:CODELOCATION];
         */
        NSLog(@"[ERROR] Attempt to connect with bad state: %d", internalState);
        return;
    }
    
    [self performSelectorInBackground:@selector(startConnectingSocket) withObject:nil];
}

// TODO: Can we actually implement the max queue size...?
-(void)listen:(id)arg
{
    if (!(internalState & SOCKET_INITIALIZED)) {
        /*
        [self throwException:[NSString stringWithFormat:@"Attempt to listen with bad state: %d", internalState]
                   subreason:nil
                    location:CODELOCATION];
         */
        NSLog(@"[ERROR] Attempt to listen with bad state: %d", internalState);
        return;
    }
    
    [self performSelectorInBackground:@selector(startListeningSocket) withObject:nil];
    
    // Call should block until we're listening or have an error
    [listening lock];
    if (!(internalState & (SOCKET_LISTENING | SOCKET_ERROR))) {
        [listening wait];
    }
    [listening unlock];
}

-(void)accept:(id)arg
{
    // No-op if we have an accept in progress
    if (accepting) {
        return;
    }
    
    ENSURE_SOCKET_THREAD(accept,arg);
    NSDictionary* args = nil;
    ENSURE_ARG_OR_NIL_AT_INDEX(args, arg, 0, NSDictionary);
    [acceptArgs setValue:arg forKey:ARG_KEY];
    
    CFSocketRef sock = [socket getCFSocket];
    CFSocketEnableCallBacks(sock, kCFSocketAcceptCallBack);
    accepting = YES;
}

-(void)close:(id)_void
{
    // TODO: Signal everything under the sun & close
    ENSURE_SOCKET_THREAD(close,_void);
    
    if (!(internalState & (SOCKET_CONNECTED | SOCKET_LISTENING | SOCKET_INITIALIZED))) {
        /*
        [self throwException:[NSString stringWithFormat:@"Attempt to close in invalid state: %d",internalState]
                   subreason:nil
                    location:CODELOCATION];
         */
        NSLog(@"Attempt to close in invalid state: %d", internalState);
        return;
    }
    
    [self cleanupSocket];
}

#pragma mark Public API : Properties

-(NSNumber*)state
{
    return NUMINT(internalState);
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

TYPESAFE_SETTER(setHost, host, NSString)

TYPESAFE_SETTER(setConnected, connected, KrollCallback)
TYPESAFE_SETTER(setAccepted, accepted, KrollCallback)
TYPESAFE_SETTER(setClosed, closed, KrollCallback)
TYPESAFE_SETTER(setError, error, KrollCallback)

#pragma mark TiStreamProxy overrides

// Have to overload 'read' and 'write' behavior as well, because they need to be performed on the socket thread!
// Note the retain/release magic.
-(NSNumber*)read:(id)args
{
    if ([NSThread currentThread] != socketThread) {
        NSInvocation* readInvoke = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(read:)]];
        [readInvoke setTarget:self];
        [readInvoke setSelector:@selector(read:)];
        [readInvoke setArgument:&args atIndex:2];
        [readInvoke performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO];
        
        [ioCondition lock];
        [ioCondition wait];
        [ioCondition unlock];
        
        // Because of the things we have to do to enforce blocking, we don't know what the number of bytes read
        // when the invoke actually returns IS.  We have to wait until the condition is unlocked and use the
        // length of the read data... unless we're returning -1.
        
        NSNumber* readResult = nil;
        [readInvoke getReturnValue:&readResult];
        [readResult autorelease];
        
        if ([readResult intValue] == -1) {
            return readResult;
        }
        else {
            return NUMINT(readDataLength);
        }
    }
    else {
        return [[super read:args] retain];
    }
}

-(NSNumber*)write:(id)args
{
    if ([NSThread currentThread] != socketThread) {
        NSInvocation* writeInvoke = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(write:)]];
        [writeInvoke setTarget:self];
        [writeInvoke setSelector:@selector(write:)];
        [writeInvoke setArgument:&args atIndex:2];
        [writeInvoke performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO];
        
        [ioCondition lock];
        [ioCondition wait];
        [ioCondition unlock];
        
        NSNumber* result = nil;
        [writeInvoke getReturnValue:&result];
        return [result autorelease];
    }
    else {
        return [[super write:args] retain];
    }
}

-(NSNumber*)isReadable:(id)_void
{
    return NUMBOOL(internalState & SOCKET_CONNECTED);
}

-(NSNumber*)isWritable:(id)_void
{
    return NUMBOOL(internalState & SOCKET_CONNECTED);
}

-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    [socket readDataWithTimeout:-1
                         buffer:[buffer data]
                   bufferOffset:offset
                      maxLength:length
                            tag:-1];
    
    return 0;
}

-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    NSData* subdata = [[buffer data] subdataWithRange:NSMakeRange(offset, length)];
    [socket writeData:subdata withTimeout:-1 tag:-1];
    
    return [subdata length];
}

-(int)asynchRead:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback*)callback
{
    // As always, ensure that operations take place on the socket thread...
    if ([NSThread currentThread] != socketThread) {
        NSInvocation* asynchInvoke = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(asynchRead:offset:length:callback:)]];
        [asynchInvoke setTarget:self];
        [asynchInvoke setSelector:@selector(asynchRead:offset:length:callback:)];
        [asynchInvoke setArgument:&buffer atIndex:2];
        [asynchInvoke setArgument:&offset atIndex:3];
        [asynchInvoke setArgument:&length atIndex:4];
        [asynchInvoke setArgument:&callback atIndex:5];
        [asynchInvoke performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:YES];
    }
    else {
        asynchTagCount = asynchTagCount % INT_MAX;
        NSDictionary* asynchInfo = [NSDictionary dictionaryWithObjectsAndKeys:buffer,@"buffer",callback,@"callback",nil];
        [asynchCallbacks setObject:asynchInfo forKey:NUMINT(asynchTagCount)];
        [socket readDataWithTimeout:-1
                             buffer:[buffer data]
                       bufferOffset:offset
                          maxLength:length
                                tag:asynchTagCount];
        asynchTagCount++;
    }
}

-(int)asynchWrite:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback*)callback
{
}

#pragma mark AsyncSocketDelegate methods

-(void)onSocket:(AsyncSocket *)sock didConnectToHost:(NSString *)host port:(UInt16)port
{
    // This gets called for sockets created via accepting, so return if the connected socket is NOT us
    if (sock != socket) {
        return;
    }

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
    
    // Signal any waiting I/O
    // TODO: Be sure to handle any signal on closing
    [ioCondition lock];
    [ioCondition signal];
    [ioCondition unlock];
}

-(NSRunLoop*)onSocket:(AsyncSocket *)sock wantsRunLoopForNewSocket:(AsyncSocket *)newSocket
{
    // We start up the accepted socket thread, and wait for the run loop to be cached, and return it...
    [acceptCondition lock];
    if (acceptRunLoop == nil) {
        [acceptCondition wait];
    }
    [acceptCondition signal];
    [acceptCondition unlock];
    return acceptRunLoop;
}

- (void)onSocket:(AsyncSocket *)sock didAcceptNewSocket:(AsyncSocket *)newSocket
{
    // ... And then over here, we signal the same condition, which gets waited on in the new socket thread.
    [acceptArgs setValue:newSocket forKey:SOCK_KEY];
    [self performSelectorInBackground:@selector(startAcceptedSocket:) withObject:acceptArgs];
    accepting = NO;
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

// TODO: Implement partial write callback?
-(void)onSocket:(AsyncSocket *)sock didWriteDataWithTag:(long)tag 
{
    // Result of asynch write
    if (tag > -1) {
        NSDictionary* info = [asynchCallbacks objectForKey:NUMINT(tag)];
        KrollCallback* callback = [info valueForKey:@"callback"];
        TiBuffer* buffer = [info valueForKey:@"buffer"];
        
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:buffer,@"buffer",[[buffer data] length],@"bytesProcessed",nil];
        [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:self];
        [asynchCallbacks removeObjectForKey:NUMINT(tag)];
        return;
    }    
    
    [ioCondition lock];
    [ioCondition signal];
    [ioCondition unlock];
}

// TODO: Implement partial data read callback?
-(void)onSocket:(AsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
    // Result of asynch read
    if (tag > -1) {
        NSDictionary* info = [asynchCallbacks objectForKey:NUMINT(tag)];
        KrollCallback* callback = [info valueForKey:@"callback"];
        TiBuffer* buffer = [info valueForKey:@"buffer"];
        
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:buffer,@"buffer",NUMINT([data length]),@"bytesProcessed", nil];
        [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:self];
        [asynchCallbacks removeObjectForKey:NUMINT(tag)];
        return;
    }
    
    // The amount of data read is available only off of this 'data' object... not off the initial buffer we passed.
    [ioCondition lock];
    readDataLength = [data length];
    [ioCondition signal];
    [ioCondition unlock];
}

@end
#endif