/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2011 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_NETWORKSOCKET
#import "TiNetworkSocketTCPProxy.h"
#import "NetworkModule.h"
#import "TiBlob.h"
#import "TiBuffer.h"

static NSString* SOCK_KEY = @"socket";
static NSString* ARG_KEY = @"arg";

@interface TiNetworkSocketTCPProxy (Private)
-(void)cleanupSocket;
-(void)setConnectedSocket:(AsyncSocket*)sock;
-(void)startConnectingSocket;
-(void)startListeningSocket;
-(void)startAcceptedSocket:(NSDictionary*)info;
-(void)socketRunLoop;
@end

@implementation TiNetworkSocketTCPProxy
@synthesize host, connected, accepted, closed, error;

#pragma mark Internals

-(id)init
{
    if (self = [super init]) {
        listening = [[NSCondition alloc] init];
        ioCondition = [[NSCondition alloc] init];
        internalState = SOCKET_INITIALIZED;
        socketThread = nil;
        acceptRunLoop = nil;
        socketReady = NO;
        acceptArgs = [[NSMutableDictionary alloc] init];
        readyCondition = [[NSCondition alloc] init];
        operationInfo = [[NSMutableDictionary alloc] init];
        asynchTagCount = 0;
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
    // Socket cleanup, if necessary
    if ([socketThread isExecuting]) {
        [self performSelector:@selector(cleanupSocket) onThread:socketThread withObject:nil waitUntilDone:YES];
    }
    
    RELEASE_TO_NIL(operationInfo);
    RELEASE_TO_NIL(acceptArgs);
    RELEASE_TO_NIL(socketError);
    
    RELEASE_TO_NIL(connected);
    RELEASE_TO_NIL(accepted);
    RELEASE_TO_NIL(closed);
    RELEASE_TO_NIL(error);
    
    // Release the conditions... so long as each condition has been retained, this is safe.
    RELEASE_TO_NIL(listening);
    RELEASE_TO_NIL(ioCondition);
    RELEASE_TO_NIL(readyCondition);
    
    RELEASE_TO_NIL(host);
    
    [super _destroy];
}

-(void)cleanupSocket
{
    // Signal anything that's still waiting on the socket, just to be safe
    [listening lock];
    [listening broadcast];
    [listening unlock];
    
    [ioCondition lock];
    [ioCondition broadcast];
    [ioCondition unlock];
    
    [readyCondition lock];
    [readyCondition broadcast];
    [readyCondition unlock];
    
    [socket disconnect];
    [socket setDelegate:nil];
    
    RELEASE_TO_NIL(socket);
}

-(void)setConnectedSocket:(AsyncSocket*)sock
{
    [self cleanupSocket];
    internalState = SOCKET_CONNECTED;
    socket = [sock retain];
    [socket setDelegate:self];
    socketThread = [NSThread currentThread];
}

#define AUTORELEASE_LOOP 5
-(void)socketRunLoop
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    [socketThread setName:[NSString stringWithFormat:@"Ti.Network.Socket.TCP (%x)",self]];
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
    // No longer send messages to this thread!
    socketThread = nil;
    
    [pool release];
}

-(void)startConnectingSocket;
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    id port = [self valueForUndefinedKey:@"port"]; // Can be string or int
    NSNumber* timeout = [self valueForUndefinedKey:@"timeout"];
    
    // TODO: We're on a BG thread... need to make sure this gets caught somehow.
    
    socket = [[AsyncSocket alloc] initWithDelegate:self];
    socketThread = [NSThread currentThread];
    
    NSError* err = nil;
    BOOL success;
    if (timeout == nil) {
        success = [socket connectToHost:host onPort:[TiUtils intValue:port] error:&err];
    }
    else {
        success = [socket connectToHost:host onPort:[port intValue] withTimeout:[timeout doubleValue] error:&err];
    }
    
    if (err || !success) {
        internalState = SOCKET_ERROR;
        [self cleanupSocket];
        
        if (error != nil) {
            NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",[err localizedDescription],@"error",NUMINT([err code]),@"errorCode", nil];
            [self _fireEventToListener:@"error" withObject:event listener:error thisObject:self];
        }
        
        socketThread = nil;
        [pool release];
        return;
    }
    
    [self socketRunLoop];
    
    [pool release];
}

-(void)startListeningSocket;
{
    NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
    
    id port = [self valueForKey:@"port"]; // Can be string or int
    
    socket = [[AsyncSocket alloc] initWithDelegate:self];
        
    NSError* err = nil;
    BOOL success = [socket acceptOnInterface:host port:[port intValue] autoaccept:NO error:&err];
    
    if (err || !success) {
        internalState = SOCKET_ERROR;
        socketError = [err retain];
        [self cleanupSocket]; // Cleanup signals the condition
        
        [pool release];
        return;
    }
    // Make sure that we 'accept' only when explicitly requested
    CFSocketRef cfSocket = [socket getCFSocket];
    CFOptionFlags options = CFSocketGetSocketFlags(cfSocket);
    CFSocketSetSocketFlags(cfSocket, options & ~kCFSocketAutomaticallyReenableAcceptCallBack);
  
    socketThread = [NSThread currentThread];
    
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

    // Here's a goofy pattern in sockets; because we may _destroy on the Kroll thread while other threads (i.e. sockets, or newly created thread)
    // is blocking, we need to hold on to the conditions we wait on, and then release them once we're done with them. Introduces some extra
    // overhead, but it probably prevents DUMB CRASHES from happening.
    
    // 1. Provide the run loop to the new socket...
    NSCondition* tempConditionRef = [readyCondition retain];
    [tempConditionRef lock];
    acceptRunLoop = [NSRunLoop currentRunLoop];
    [tempConditionRef signal];
    [tempConditionRef unlock];
    [tempConditionRef release];
    
    // 2. ... And then wait for it to attach to the run loop.
    AsyncSocket* newSocket = [[[info objectForKey:SOCK_KEY] retain] autorelease];
    NSArray* arg = [info objectForKey:ARG_KEY];
    TiNetworkSocketTCPProxy* proxy = [[[TiNetworkSocketTCPProxy alloc] _initWithPageContext:[self executionContext] args:arg] autorelease];
    [proxy rememberSelf];
    [proxy setConnectedSocket:newSocket];
    
    // TODO: remoteHost/remotePort & host/port?
    [proxy setValue:[newSocket connectedHost] forKey:@"host"];
    [proxy setValue:NUMINT([newSocket connectedPort]) forKey:@"port"];
    
    if (accepted != nil) {
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",proxy,@"inbound",nil];
        [self _fireEventToListener:@"accepted" withObject:event listener:accepted thisObject:self];
    }
    
    tempConditionRef = [readyCondition retain];
    [tempConditionRef lock];
    if (!socketReady) {
        [tempConditionRef wait];
    }
    [tempConditionRef unlock];
    [tempConditionRef release];
    
    [proxy socketRunLoop];
    [proxy forgetSelf];
    
    [pool release];
}

#pragma mark Public API : Functions

// Used to bump API calls onto the socket thread if necessary
#define ENSURE_SOCKET_THREAD(f,x) \
if (socketThread == nil) { \
return; \
} \
if ([NSThread currentThread] != socketThread) { \
[self performSelector:@selector(f:) onThread:socketThread withObject:x waitUntilDone:YES]; \
return; \
} \

// Convenience for io waits
#define SAFE_WAIT(condition, invocation) \
{\
NSCondition* temp = [condition retain]; \
[temp lock]; \
[invocation performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO]; \
[temp wait]; \
[temp unlock]; \
[temp release]; \
}\


-(void)connect:(id)_void
{
    if (!(internalState & SOCKET_INITIALIZED)) {
        [self throwException:[NSString stringWithFormat:@"Attempt to connect with bad state: %d",internalState]
                   subreason:nil 
                    location:CODELOCATION];
        return;
    }
    
    if (host == nil || [host isEqual:@""]) {
        // Use the loopback
        [self setHost:@"127.0.0.1"];
    }
    
    [self performSelectorInBackground:@selector(startConnectingSocket) withObject:nil];
}

-(void)listen:(id)arg
{
    if (!(internalState & SOCKET_INITIALIZED)) {
        [self throwException:[NSString stringWithFormat:@"Attempt to listen with bad state: %d", internalState]
                   subreason:nil
                    location:CODELOCATION];
        return;
    }
    if (host == nil || [host isEqual:@""]) {
        // Use the loopback
        [self setHost:@"127.0.0.1"];
    }
    
    [self performSelectorInBackground:@selector(startListeningSocket) withObject:nil];
    
    // Call should block until we're listening or have an error
    NSCondition* tempConditionRef = [listening retain];
    [tempConditionRef lock];
    if (!(internalState & (SOCKET_LISTENING | SOCKET_ERROR))) {
        [tempConditionRef wait];
    }
    [tempConditionRef unlock];
    [tempConditionRef release];
    
    if (internalState & SOCKET_ERROR) {
        if (socketError != nil) {
            // Have to autorelease because we need to hold onto it for throwing the exception
            RELEASE_TO_NIL_AUTORELEASE(socketError);
            [self throwException:@"TiSocketError"
                       subreason:[socketError localizedDescription]
                        location:CODELOCATION];
        }        
    }
}

-(void)accept:(id)arg
{
    // Only change the accept args if we have an accept in progress
    // TODO: Probably want a lock for this...
    if (accepting) {
        [acceptArgs setValue:arg forKey:ARG_KEY];
        return;
    }

    NSDictionary* args = nil;
    ENSURE_ARG_OR_NIL_AT_INDEX(args, arg, 0, NSDictionary);
    ENSURE_SOCKET_THREAD(accept,arg);
    [acceptArgs setValue:arg forKey:ARG_KEY];
    
    CFSocketRef sock = [socket getCFSocket];
    CFSocketEnableCallBacks(sock, kCFSocketAcceptCallBack);
    accepting = YES;
}

// TODO: Bump into 'closed' state if socketThread==nil
-(void)close:(id)_void
{
    // Don't switch threads until after the state check; this allows us to throw the exception on the right thread
    if (!(internalState & (SOCKET_CONNECTED | SOCKET_LISTENING | SOCKET_INITIALIZED))) {
        [self throwException:[NSString stringWithFormat:@"Attempt to close in invalid state: %d",internalState]
                   subreason:nil
                    location:CODELOCATION];
        return;
    }
    
    ENSURE_SOCKET_THREAD(close,_void);
    
    [self cleanupSocket];
    internalState = SOCKET_CLOSED;
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

#pragma mark TiStreamInternal implementations

-(NSNumber*)isReadable:(id)_void
{
    return NUMBOOL(internalState & SOCKET_CONNECTED);
}

-(NSNumber*)isWritable:(id)_void
{
    return NUMBOOL(internalState & SOCKET_CONNECTED);
}

-(int)readToBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback
{
    // TODO: Put this in the write()/read() wrappers when they're being called consistently, blah blah blah
    if ([[buffer data] length] == 0 && length != 0) {
        if (callback != nil) {
            NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",NUMINT(0),@"bytesProcessed", nil];
            [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:nil];
        }
        return 0;
    }

    // As always, ensure that operations take place on the socket thread...
    if ([NSThread currentThread] != socketThread) {
        NSInvocation* invocation = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(readToBuffer:offset:length:callback:)]];
        [invocation setTarget:self];
        [invocation setSelector:@selector(readToBuffer:offset:length:callback:)];
        [invocation setArgument:&buffer atIndex:2];
        [invocation setArgument:&offset atIndex:3];
        [invocation setArgument:&length atIndex:4];
        [invocation setArgument:&callback atIndex:5];
        [invocation retainArguments];
        
        if (callback == nil) {
            SAFE_WAIT(ioCondition, invocation);
            if (socketError != nil) {
                // Have to autorelease because we need to hold onto it for throwing the exception
                RELEASE_TO_NIL_AUTORELEASE(socketError);
                [self throwException:@"TiSocketError"
                           subreason:[socketError localizedDescription]
                            location:CODELOCATION];
            }
        }
        else { // Queue up that invocation and go home
            [invocation performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO];
        }
        
        return readDataLength;
    }
    else {
        int tag = -1;
        if (callback != nil) {
            tag = asynchTagCount;
            NSDictionary* asynchInfo = [NSDictionary dictionaryWithObjectsAndKeys:buffer,@"buffer",callback,@"callback",NUMINT(TO_BUFFER),@"type",NUMINT(0),@"errorState",@"",@"errorDescription",nil];
            [operationInfo setObject:asynchInfo forKey:NUMINT(tag)];
            asynchTagCount = (asynchTagCount + 1) % INT_MAX;
        }
        
        [socket readDataWithTimeout:-1
                             buffer:[buffer data]
                       bufferOffset:offset
                          maxLength:length
                                tag:tag];
    }
    
    return 0; // Bogus return value; the real value is returned when we finish the read
}

-(int)writeFromBuffer:(TiBuffer*)buffer offset:(int)offset length:(int)length callback:(KrollCallback *)callback
{
    // TODO: Put this in the write()/read() wrappers when they're being called consistently, blah blah blah
    if ([[buffer data] length] == 0) {
        if (callback != nil) {
            NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",NUMINT(0),@"bytesProcessed",NUMINT(0),@"errorState",@"",@"errorDescription", nil];
            [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:nil];
        }
        return 0;
    }
    
    // As always, ensure that operations take place on the socket thread...
    if ([NSThread currentThread] != socketThread) {
        NSInvocation* invocation = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(writeFromBuffer:offset:length:callback:)]];
        [invocation setTarget:self];
        [invocation setSelector:@selector(writeFromBuffer:offset:length:callback:)];
        [invocation setArgument:&buffer atIndex:2];
        [invocation setArgument:&offset atIndex:3];
        [invocation setArgument:&length atIndex:4];
        [invocation setArgument:&callback atIndex:5];
        [invocation retainArguments];
        
        if (callback == nil) {
            SAFE_WAIT(ioCondition, invocation);
            if (socketError != nil) {
                // Have to autorelease because we need to hold onto it for throwing the exception
                RELEASE_TO_NIL_AUTORELEASE(socketError);
                [self throwException:@"TiSocketError"
                           subreason:[socketError localizedDescription]
                            location:CODELOCATION];
            }
        }
        else {
            [invocation performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO];
        }
        
        int result = 0;
        [invocation getReturnValue:&result];
        
        return result;
    }
    else {
        NSData* subdata = [[buffer data] subdataWithRange:NSMakeRange(offset, length)];
        int tag = -1;
        if (callback != nil) {
            tag = asynchTagCount;
            NSDictionary* asynchInfo = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT([subdata length]),@"bytesProcessed",callback,@"callback", nil];
            [operationInfo setObject:asynchInfo forKey:NUMINT(tag)];
            asynchTagCount = (asynchTagCount + 1) % INT_MAX;
        }
        NSLog(@"Queuing up my write!");
        [socket writeData:subdata withTimeout:-1 tag:tag];
        
        // TODO: Actually need the amount of data written - similar to readDataLength, for writes
        return [subdata length];
    }
}

-(int)writeToStream:(id<TiStreamInternal>)output chunkSize:(int)size callback:(KrollCallback *)callback
{
    if ([NSThread currentThread] != socketThread) {
        NSInvocation* invocation = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(writeToStream:chunkSize:callback:)]];
        [invocation setTarget:self];
        [invocation setSelector:@selector(writeToStream:chunkSize:callback:)];
        [invocation setArgument:&output atIndex:2];
        [invocation setArgument:&size atIndex:3];
        [invocation setArgument:&callback atIndex:4];
        [invocation performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO];
        [invocation retainArguments];
        
        if (callback == nil) {
            SAFE_WAIT(ioCondition, invocation);
            if (socketError != nil) {
                // Have to autorelease because we need to hold onto it for throwing the exception
                RELEASE_TO_NIL_AUTORELEASE(socketError);
                [self throwException:@"TiSocketError"
                           subreason:[socketError localizedDescription]
                            location:CODELOCATION];
            }
        }
        else {
            [invocation performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO];
        }
        
        return readDataLength;
    }
    else {
        int tag = asynchTagCount;
        NSDictionary* info = [NSDictionary dictionaryWithObjectsAndKeys:output,@"destination",NUMINT(size),@"chunkSize",callback,@"callback",NUMINT(TO_STREAM),@"type", nil];
        [operationInfo setObject:info forKey:NUMINT(tag)];
        asynchTagCount = (asynchTagCount + 1) % INT_MAX;
        
        [socket readDataWithTimeout:-1
                             buffer:nil
                       bufferOffset:0
                          maxLength:size
                                tag:tag];
        
        return readDataLength;
    }
}

-(void)pumpToCallback:(KrollCallback *)callback chunkSize:(int)size asynch:(BOOL)asynch
{
    if ([NSThread currentThread] != socketThread) {
        NSInvocation* invocation = [NSInvocation invocationWithMethodSignature:[self methodSignatureForSelector:@selector(pumpToCallback:chunkSize:asynch:)]];
        [invocation setTarget:self];
        [invocation setSelector:@selector(pumpToCallback:chunkSize:asynch:)];
        [invocation setArgument:&callback atIndex:2];
        [invocation setArgument:&size atIndex:3];
        [invocation setArgument:&asynch atIndex:4];
        [invocation retainArguments];
        
        if (!asynch) {
            SAFE_WAIT(ioCondition, invocation);
            if (socketError != nil) {
                // Have to autorelease because we need to hold onto it for throwing the exception
                RELEASE_TO_NIL_AUTORELEASE(socketError);
                [self throwException:@"TiSocketError"
                           subreason:[socketError localizedDescription]
                            location:CODELOCATION];
            }
        }
        else {
            [invocation performSelector:@selector(invoke) onThread:socketThread withObject:nil waitUntilDone:NO];
        }
        
    }
    else {
        int tag = asynchTagCount;
        NSDictionary* info = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(size),@"chunkSize",callback,@"callback",NUMINT(TO_CALLBACK),@"type", nil];
        [operationInfo setObject:info forKey:NUMINT(tag)];
        asynchTagCount = (asynchTagCount + 1) % INT_MAX;
        
        [socket readDataWithTimeout:-1
                             buffer:nil
                       bufferOffset:0
                          maxLength:size
                                tag:tag];
    }    
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

// Prevent that goofy race conditon where a socket isn't attached to a run loop before beginning the accepted socket run loop.
-(void)onSocketReadyInRunLoop:(AsyncSocket *)sock
{
    NSCondition* tempConditionRef = [readyCondition retain];
    [tempConditionRef lock];
    socketReady = YES;
    [tempConditionRef signal];
    [tempConditionRef unlock];
    [tempConditionRef release];
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
    [ioCondition broadcast];
    [ioCondition unlock];
}


// Called 1st in the accept process
- (void)onSocket:(AsyncSocket *)sock didAcceptNewSocket:(AsyncSocket *)newSocket
{
    [acceptArgs setValue:newSocket forKey:SOCK_KEY];
    [self performSelectorInBackground:@selector(startAcceptedSocket:) withObject:acceptArgs];
    accepting = NO;
}
     
// Called 2nd in the accept process
-(NSRunLoop*)onSocket:(AsyncSocket *)sock wantsRunLoopForNewSocket:(AsyncSocket *)newSocket
{
    // We start up the accepted socket thread, and wait for the run loop to be cached, and return it...
    NSCondition* tempConditionRef = [readyCondition retain];
    [tempConditionRef lock];
    if (acceptRunLoop == nil) {
        [tempConditionRef wait];
    }
    NSRunLoop* currentRunLoop = acceptRunLoop;
    acceptRunLoop = nil;
    [tempConditionRef unlock];
    [tempConditionRef release];
    
    return currentRunLoop;
}


// TODO: As per AsyncSocket docs, may want to call "unreadData" and return that information, or at least allow access to it via some other method
-(BOOL)onSocket:(AsyncSocket *)sock shouldDisconnectWithError:(NSError *)err
{
    if (err != nil) {
        internalState = SOCKET_ERROR;
        
        // TODO: We need the information about # bytes written, # bytes read before firing these...
        // That means inside asynchSocket, we're going to have to start tracking the read/write ops manually.  More mods.
        for (NSDictionary* info in [operationInfo objectEnumerator]) {
            KrollCallback* callback = [info valueForKey:@"callback"];
            NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT([err code]),@"errorState",[err localizedDescription],@"errorDescription", nil];
            [self _fireEventToListener:@"error" withObject:event listener:callback thisObject:nil];
        }
        
        if (error != nil) {
            NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"socket",NUMINT([err code]),@"errorCode",[err localizedDescription],@"error",nil];
            [self _fireEventToListener:@"error" withObject:event listener:error thisObject:self];
        }
        
        socketError = [err retain]; // Used for synchronous I/O error handling
        return YES;
    }
    else { // Remote hangup; we encountered EOF, and should not close (but should return -1 to asynch info, and as the # bytes read/written)
        // Trigger callbacks
        for (NSDictionary* info in [operationInfo objectEnumerator]) {
            KrollCallback* callback = [info valueForKey:@"callback"];
            ReadDestination type = [[info objectForKey:@"type"] intValue];
            NSDictionary* event = nil;
            NSString* name = nil;
            
            switch (type) {
                case TO_BUFFER: {
                    name = @"read";
                    
                    event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(0),@"errorState",@"",@"errorDescription",NUMINT(-1),@"bytesProcessed",self,@"source", nil];
                    break;
                }
                case TO_STREAM: {
                    name = @"writeStream";
                    id<TiStreamInternal> stream = [info valueForKey:@"destination"];
                    
                    event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(0),@"errorState",@"",@"errorDescription",NUMINT(-1),@"bytesProcessed",self,@"fromStream",stream,@"toStream", nil];
                }
                case TO_CALLBACK: {
                    name = @"pump";
                    
                    event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(0),@"errorState",@"",@"errorDescription",NUMINT(-1),@"bytesProcessed",self,@"source",NUMINT(readDataLength),@"totalBytesProcessed",[NSNull null],@"buffer",nil];
                }
                default: {
                    name = @"write";
                    event = [NSDictionary dictionaryWithObjectsAndKeys:NUMINT(0),@"errorState",@"",@"errorDescription",NUMINT(-1),@"bytesProcessed",self,@"source", nil];
                    break;
                }
            }

            [self _fireEventToListener:name withObject:event listener:callback thisObject:nil];
        }
        readDataLength = -1;
                             
        // Unlock any synch I/O
        [ioCondition lock];
        [ioCondition broadcast];
        [ioCondition unlock];
        
        return NO;
    }
}

-(void)onSocket:(AsyncSocket *)sock didWriteDataWithTag:(long)tag 
{

    // Result of asynch write
    if (tag > -1) {
        NSDictionary* info = [operationInfo objectForKey:NUMINT(tag)];
        KrollCallback* callback = [info valueForKey:@"callback"];
        
        NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:[info valueForKey:@"bytesProcessed"],@"bytesProcessed",NUMINT(0),@"errorState",@"",@"errorDescription",nil];
        [self _fireEventToListener:@"write" withObject:event listener:callback thisObject:self];
        [operationInfo removeObjectForKey:NUMINT(tag)];
    } 
    else {
        // Signal the IO condition
        [ioCondition lock];
        [ioCondition signal];
        [ioCondition unlock];
    }
}

// 'Read' can also lead to a writeStream/pump operation
-(void)onSocket:(AsyncSocket *)sock didReadData:(NSData *)data withTag:(long)tag
{
    // We do NOT SIGNAL I/O if dealing with a tagged operation. The reason why? Because toStream/pump need to keep streaming and pumping...
    // until the socket is closed, which fires the I/O condition signal.
    
    // Specialized operation
    if (tag > -1) {
        NSDictionary* info = [operationInfo objectForKey:NUMINT(tag)];
        ReadDestination type = [[info objectForKey:@"type"] intValue];
        switch (type) {
            case TO_BUFFER: {
                KrollCallback* callback = [info valueForKey:@"callback"];
                TiBuffer* buffer = [info valueForKey:@"buffer"];
                
                NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:buffer,@"buffer",NUMINT([data length]),@"bytesProcessed",NUMINT(0),@"errorState",@"",@"errorDescription", nil];
                [self _fireEventToListener:@"read" withObject:event listener:callback thisObject:self];
                break;
            }
            case TO_STREAM: {
                // Perform the write to stream
                id<TiStreamInternal> stream = [info valueForKey:@"destination"];
                int size = [TiUtils intValue:[info valueForKey:@"chunkSize"]];
                KrollCallback* callback = [info valueForKey:@"callback"];
                
                TiBuffer* tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
                [tempBuffer setData:[NSMutableData dataWithData:data]];
                readDataLength += [data length];
                
                // TODO: We need to be able to monitor this stream for write errors, and then report back via an exception or the callback or whatever
                [stream writeFromBuffer:tempBuffer offset:0 length:[data length] callback:nil];
                
                // ... And then set up the next read to it.
                [self writeToStream:stream chunkSize:size callback:callback];
                break;
            }
            case TO_CALLBACK: {
                // Perform the pump to callback
                KrollCallback* callback = [info valueForKey:@"callback"];
                int size = [TiUtils intValue:[info valueForKey:@"chunkSize"]];
                
                TiBuffer* tempBuffer = [[[TiBuffer alloc] _initWithPageContext:[self executionContext]] autorelease];
                [tempBuffer setData:[NSMutableData dataWithData:data]];
                readDataLength += [data length];
                
                NSDictionary* event = [NSDictionary dictionaryWithObjectsAndKeys:self,@"source",tempBuffer,@"buffer",NUMINT([data length]),@"bytesProcessed",NUMINT(readDataLength),@"totalBytesProcessed", NUMINT(0),@"errorState",@"",@"errorDescription",nil];
                [self _fireEventToListener:@"pump" withObject:event listener:callback thisObject:nil];
                
                // ... And queue up the next pump.
                [self pumpToCallback:callback chunkSize:size asynch:YES]; // Only consider the 1st pump "synchronous", that's the one which blocks!
                break;
            }
        }
        [operationInfo removeObjectForKey:NUMINT(tag)];
    }
    else {
        // Only signal the condition for your standard blocking read
        // The amount of data read is available only off of this 'data' object... not off the initial buffer we passed.
        [ioCondition lock];
        readDataLength = [data length];
        [ioCondition signal];
        [ioCondition unlock];
    }
}

@end
#endif