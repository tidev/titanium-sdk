/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiLogServer.h"
#import "TiBase.h"
#import "TiSharedConfig.h"
#import "TiUtils.h"
#include <netinet/in.h>
#include <sys/socket.h>

/**
 * These constants are available to allow xcodebuild to override them.
 */

#ifndef TI_LOG_SERVER_BACKLOG
#define TI_LOG_SERVER_BACKLOG 4 // max simulataneous connections
#endif

#ifndef TI_LOG_SERVER_QUEUE_SIZE
#define TI_LOG_SERVER_QUEUE_SIZE 100
#endif

/**
 * All log server state is global mainly because there should only be one log
 * server.
 */
static dispatch_queue_t logDispatchQueue = nil;
static dispatch_source_t logDispatchSource = nil;
static int logServerSocket = -1;
static NSMutableArray<TiLogServerConnection *> *connections = nil;
static NSMutableArray<NSString *> *logQueue = nil;
static NSData *headers = nil;

/**
 * Helper function to force logging with NSLog() since we override it. Used only
 * for reporting log server errors.
 */
static void forcedNSLog(NSString *str, ...)
{
  va_list args;
  va_start(args, str);
  NSString *msg = [[NSString alloc] initWithFormat:str arguments:args];
#pragma push
#undef NSLog
  NSLog(@"%@", msg);
#pragma pop
  [msg release];
}

/**
 * Tries to set the socket as non-blocking. Because we're using GCD, this
 * doesn't appear to be necessary, so if it fails, we can continue.
 */
static void trySetNonBlocking(int socket, const char *type)
{
  int flags = fcntl(socket, F_GETFL, 0);
  int result = fcntl(socket, F_SETFL, flags | O_NONBLOCK);
  if (result == -1) {
    forcedNSLog(@"[WARN] Couldn\'t set %s socket to be non-blocking (%d)", type, result);
  }
}

/**
 * A simple queue for storing log messages when there are no active connections.
 */
@interface NSMutableArray (TiLogMessageQueue)
- (void)pop;
- (void)push:(id)obj;
@end

@implementation NSMutableArray (TiLogMessageQueue)

- (void)pop
{
  if ([self count]) {
    id head = [self objectAtIndex:0];
    if (head != nil) {
      [self removeObjectAtIndex:0];
    }
  }
}

- (void)push:(id)message
{
  // ensure we don't put too many messages in the queue
  if ([self count] + 1 > TI_LOG_SERVER_QUEUE_SIZE) {
    [self pop];
  }
  [self addObject:message];
}
@end

@implementation TiLogServerConnection

/**
 * Initializes a connection with a raw socket file descriptor. This function
 * will create a read stream on the socket to detect when the client has
 * disconnected.
 */
- (id)initWithSocket:(int)_socket
{
  socket = _socket;
  readSource = nil;

  // disable SIGPIPE signal
  setsockopt(socket, SOL_SOCKET, SO_NOSIGPIPE, &(int){ 1 }, sizeof(int));

  trySetNonBlocking(socket, "connection\'s");

  // the only way to know if the remote peer has disconnected is to read from
  // from the socket
  readSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_READ,
      socket,
      0, // mask not used
      logDispatchQueue);
  dispatch_source_set_event_handler(readSource, ^{
    // remote peer disconnected
    forcedNSLog(@"[INFO] Remote peer disconnected");
    [self disconnect];
  });
  dispatch_resume(readSource);

  return self;
}

/**
 * Asynchronously sends the buffer to this connection's socket.
 */
- (void)send:(dispatch_data_t *)buffer
{
  dispatch_write(socket, *buffer, logDispatchQueue, ^(dispatch_data_t buffer, int error) {
    if (error != 0) {
      [self disconnect];
    }
  });
}

/**
 * Disconnects the client, releases the read dispatch source, and removes itself
 * from the list of connections which should trigger this connection instance
 * to be deallocated.
 */
- (void)disconnect
{
  if (socket != -1) {
    close(socket);
    socket = -1;
  }

  if (readSource != nil) {
    dispatch_release(readSource);
    readSource = nil;
  }

  [connections removeObject:self];
  forcedNSLog(@"[INFO] Log server connections: %d", [connections count]);
}

@end // end Connection

@implementation TiLogServer

__unused static int counter = 0;

+ (TiLogServer *)defaultLogServer
{
  static TiLogServer *defaultLogServer = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    defaultLogServer = [[self alloc] init];
  });
  return defaultLogServer;
}

- (void)log:(NSString *)message
{
  NSString *msg = [message stringByAppendingString:@"\r\n"];

  if ([connections count] > 0) {
    NSData *data = [msg dataUsingEncoding:NSUTF8StringEncoding];
    dispatch_data_t buffer = dispatch_data_create(data.bytes,
        data.length,
        logDispatchQueue,
        DISPATCH_DATA_DESTRUCTOR_DEFAULT);
    for (TiLogServerConnection *conn in connections) {
      [conn send:&buffer];
    }
  } else {
    if (logQueue == nil) {
      logQueue = [[NSMutableArray alloc] init];
    }
    [logQueue push:msg];
  }
}

- (void)start
{
  // check if we're already running
  if (logServerSocket != -1) {
    return;
  }

  // initialize our connections array
  if (connections == nil) {
    connections = [[NSMutableArray alloc] init];
  }

  if (headers == nil) {
    NSDictionary *map = [[NSDictionary alloc] initWithObjectsAndKeys:
                                                  [[TiSharedConfig defaultConfig] applicationName], @"name",
                                              [[TiSharedConfig defaultConfig] applicationID], @"appId",
                                              [[TiSharedConfig defaultConfig] applicationVersion], @"version",
                                              [[TiSharedConfig defaultConfig] applicationDeployType], @"deployType",
                                              [[TiSharedConfig defaultConfig] applicationGUID], @"guid",
                                              [[TiSharedConfig defaultConfig] sdkVersion], @"tiSDKVersion",
                                              [[TiSharedConfig defaultConfig] buildHash], @"githash",
                                              nil];

    headers = [[[[TiUtils jsonStringify:map] stringByAppendingString:@"\r\n"] dataUsingEncoding:NSUTF8StringEncoding] retain];

    [map release];
  }

  // create the listening socket
  logServerSocket = socket(PF_INET, SOCK_STREAM, IPPROTO_TCP);
  if (logServerSocket == -1) {
    forcedNSLog(@"[ERROR] Failed to create log server TCP socket");
    return;
  }

  // enable address reuse and disable SIGPIPE
  setsockopt(logServerSocket, SOL_SOCKET, SO_REUSEADDR, &(int){ 1 }, sizeof(int));
  setsockopt(logServerSocket, SOL_SOCKET, SO_NOSIGPIPE, &(int){ 1 }, sizeof(int));

  trySetNonBlocking(logServerSocket, "log server\'s listening");

  struct sockaddr_in addr;
  memset(&addr, 0, sizeof(addr));
  addr.sin_len = sizeof(addr);
  addr.sin_family = AF_INET;
  addr.sin_port = htons(_port);
  addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);

  // bind the socket to the listening port
  if (bind(logServerSocket, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
    forcedNSLog(@"[ERROR] Failed to bind listening socket on port %d", _port);
    close(logServerSocket);
    return;
  }

  // start listening!
  if (listen(logServerSocket, TI_LOG_SERVER_BACKLOG) != 0) {
    close(logServerSocket);
    forcedNSLog(@"[ERROR] Failed to start listening on port %d", _port);
    return;
  }

  // create a dispatch queue for our listening socket events
  logDispatchQueue = dispatch_queue_create("logDispatchQueue", DISPATCH_QUEUE_SERIAL);

  // create the dispatch source for our listening socket
  logDispatchSource = dispatch_source_create(DISPATCH_SOURCE_TYPE_READ,
      logServerSocket,
      0, // mask not used
      logDispatchQueue);

  // define the handler for when an incoming connection occurs
  dispatch_source_set_event_handler(logDispatchSource, ^{
    // accept the connection
    int socket = accept(logServerSocket, NULL, NULL);
    if (socket <= 0) {
      return;
    }

    // create our connection object with the socket for the incoming connection
    TiLogServerConnection *conn = [[[TiLogServerConnection alloc] initWithSocket:socket] autorelease];
    if (!conn) {
      return;
    }

    [connections addObject:conn];
    forcedNSLog(@"[INFO] Log server connections: %d", [connections count]);

    // send the header
    dispatch_data_t buffer = dispatch_data_create(headers.bytes,
        headers.length,
        logDispatchQueue,
        DISPATCH_DATA_DESTRUCTOR_DEFAULT);
    [conn send:&buffer];

    // if log queue exists, flush the whole thing and nuke it
    if (logQueue != nil) {
      for (NSString *message in logQueue) {
        NSData *data = [message dataUsingEncoding:NSUTF8StringEncoding];
        dispatch_data_t buffer = dispatch_data_create(data.bytes,
            data.length,
            logDispatchQueue,
            DISPATCH_DATA_DESTRUCTOR_DEFAULT);
        [conn send:&buffer];
      }
      RELEASE_TO_NIL(logQueue);
    }
  });

  // set up a cancel handler, though I don't think this is ever called
  dispatch_source_set_cancel_handler(logDispatchSource, ^{
    [[TiLogServer defaultLogServer] stop];
  });

  // start listening for events on our listening socket
  dispatch_resume(logDispatchSource);
}

- (void)stop
{
  // stop listening, active connections will still receive new log messages
  if (logServerSocket != -1) {
    close(logServerSocket);
    logServerSocket = -1;
  }

  // hang up on all connections
  if (connections != nil) {
    for (id conn in connections) {
      [conn disconnect];
    }
    RELEASE_TO_NIL(connections);
  }

  // release the headers buffer
  RELEASE_TO_NIL(headers);

  // release the dispatch source
  if (logDispatchSource != nil) {
    dispatch_source_cancel(logDispatchSource);
    logDispatchSource = nil;
  }

  // release the dispatch queue
  if (logDispatchQueue != nil) {
    dispatch_release(logDispatchQueue);
    logDispatchQueue = nil;
  }

  // release any retained messages in the log queue
  RELEASE_TO_NIL(logQueue);
}

@end // end TiLogServer
