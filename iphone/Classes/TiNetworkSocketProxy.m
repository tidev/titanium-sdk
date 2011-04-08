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

static NSString* FD_KEY = @"fd";
static NSString* ARG_KEY = @"arg";

@interface TiNetworkSocketProxy (Private)
-(void)cleanupSocket;
-(void)_setConnectedSocket:(AsyncSocket*)sock;
-(void)startConnectingSocket;
-(void)startListeningSocket;
-(void)startAcceptedSocket:(NSDictionary*)info;
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
    internalState = SOCKET_CLOSED;
    [self cleanupSocket];
    
    [listening lock];
    [listening signal];
    [listening unlock];
    RELEASE_TO_NIL(listening);
    
    [ioCondition lock];
    [ioCondition signal];
    [ioCondition unlock];
    RELEASE_TO_NIL(ioCondition);
    
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
-(void)_setConnectedSocket:(AsyncSocket*)sock
{
    [self cleanupSocket];
    internalState = SOCKET_CONNECTED;
    socket = [sock retain];
    [socket setDelegate:self];
    [socket moveToRunLoop:[NSRunLoop currentRunLoop]];
    socketThread = [NSThread currentThread];
}

-(void)startConnectingSocket
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    id port = [self valueForUndefinedKey:@"port"]; // Can be string or int
    ENSURE_INT_COERCION(port);
    NSNumber* timeout = [self valueForUndefinedKey:@"timeout"];
    
    if (host == nil || [host isEqual:@""]) {
        [self throwException:@"Attempt to connect with bad host: nil or empty"
                   subreason:nil
                    location:CODELOCATION];
    }
    
    socket = [[AsyncSocket alloc] initWithDelegate:self];
    socketThread = [NSThread currentThread];
    
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
    
    // Begin the run loop for the socket
    while (!(internalState & (SOCKET_CLOSED | SOCKET_ERROR)) &&
           [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]])
        ; // Keep on truckin'
    
    [pool release];
}

-(void)startListeningSocket
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    id port = [self valueForKey:@"port"]; // Can be string or int
    NSNumber* type = [self valueForKey:@"type"];
    
    if ([type intValue] != TCP) {
        [self throwException:[NSString stringWithFormat:@"Attempt to listen with unrecognized protocol: %d",[type intValue]]
                   subreason:nil
                    location:CODELOCATION];
    }
    
    if (host == nil || [host isEqual:@""]) {
        [self throwException:@"Attempt to listen with bad host: nil or empty"
                   subreason:nil
                    location:CODELOCATION];
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
        
        [self throwException:[NSString stringWithFormat:@"Listening attempt error: %@",(error ? error : @"<UNKNOWN ERROR>")]
                   subreason:nil
                    location:CODELOCATION];
    }
  
    socketThread = [NSThread currentThread];
    
    [listening lock];
    internalState = SOCKET_LISTENING;
    [listening signal];
    [listening unlock];
    
    // Begin the run loop for the socket
    while (!(internalState & (SOCKET_CLOSED | SOCKET_ERROR)) &&
           [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]])
        ; // Keep on truckin'
    
    [pool release];
}

-(void)startAcceptedSocket:(NSDictionary*)info
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    CFSocketNativeHandle fd = [[info objectForKey:FD_KEY] intValue];
    NSArray* arg = [info objectForKey:ARG_KEY];
    CFSocketRef sock = [socket getCFSocket];
    
    // TODO: Need to construct newly accepted socket on new thread
    AsyncSocket* newSocket = [socket doAcceptFromSocket:sock withNewNativeSocket:fd];
    TiNetworkSocketProxy* proxy = [[[TiNetworkSocketProxy alloc] _initWithPageContext:[self pageContext] args:arg] autorelease];
    [proxy _setConnectedSocket:newSocket];
    
    // TODO: remoteHost/remotePort & host/port?
    [proxy setValue:[newSocket connectedHost] forKey:@"host"];
    [proxy setValue:NUMINT([newSocket connectedPort]) forKey:@"port"];
    
    if (accepted != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",proxy,@"inbound",nil];
        [self _fireEventToListener:@"accepted" withObject:event listener:accepted thisObject:self];
    }

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
    
    [self performSelectorInBackground:@selector(startConnectingSocket) withObject:nil];
}

-(void)listen:(id)arg
{
    if (!(internalState & SOCKET_INITIALIZED)) {
        [self throwException:[NSString stringWithFormat:@"Attempt to listen with bad state: %d", internalState]
                   subreason:nil
                    location:CODELOCATION];
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
    ENSURE_SOCKET_THREAD(accept,arg);
    NSDictionary* args = nil;
    ENSURE_ARG_OR_NIL_AT_INDEX(args, arg, 0, NSDictionary);
    
    CFSocketRef sock = [socket getCFSocket];
    CFSocketNativeHandle fd = CFSocketGetNative(sock);
    
    CFSocketNativeHandle newSockFd = accept(fd, NULL, NULL);
    if (newSockFd == -1) {
        // There was an error!
        internalState = SOCKET_ERROR;
        NSError* err = [socket getErrnoError];
        [self onSocket:socket willDisconnectWithError:err];
        [socket disconnect];
        return;
    }
    
    NSMutableDictionary* info = [NSMutableDictionary dictionary];
    [info setObject:NUMINT(newSockFd) forKey:FD_KEY];
    if (args != nil) {
        // Set 'arg' because _initWithPageContext:args: expects NSArray*
        [info setObject:arg forKey:ARG_KEY];
    }
    [self performSelectorInBackground:@selector(startAcceptedSocket:) withObject:info];
}

-(void)close:(id)_void
{
    ENSURE_SOCKET_THREAD(close,_void);
    
    if (!(internalState & (SOCKET_CONNECTED | SOCKET_LISTENING | SOCKET_INITIALIZED))) {
        [self throwException:[NSString stringWithFormat:@"Attempt to close in invalid state: %d",internalState]
                   subreason:nil
                    location:CODELOCATION];
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

-(int)readToBuffer:(TiBuffer*)buffer
{
    [socket readDataWithTimeout:-1
                         buffer:[buffer data]
                   bufferOffset:0
                      maxLength:[[buffer data] length]
                            tag:0];
    
    return readDataLength;
}

-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    [socket readDataWithTimeout:-1
                         buffer:[buffer data]
                   bufferOffset:offset
                      maxLength:length
                            tag:0];
    
    return 0;
}

-(int)writeFromBuffer:(TiBuffer*)buffer
{
    [socket writeData:[buffer data] withTimeout:-1 tag:0];
    
    return [[buffer data] length];
}

-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length
{
    NSData* subdata = [[buffer data] subdataWithRange:NSMakeRange(offset, length)];
    [socket writeData:subdata withTimeout:-1 tag:0];
    
    return [subdata length];
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
    [ioCondition lock];
    [ioCondition signal];
    [ioCondition unlock];
}

// TODO: Implement partial data read callback?
-(void)onSocket:(AsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
    // The amount of data read is available only off of this 'data' object... not off the initial buffer we passed.
    [ioCondition lock];
    readDataLength = [data length];
    [ioCondition signal];
    [ioCondition unlock];
}

@end
#endif