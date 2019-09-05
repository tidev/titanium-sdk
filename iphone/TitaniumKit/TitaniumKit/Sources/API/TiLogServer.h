/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
@import Foundation;

/**
 * Important: Do NOT call NSLog() from this file. The app will go into an
 * infinite loop of death. Use forcedNSLog() instead.
 *
 * iOS platform hackers: when you manually run this project from Xcode, it may
 * be handy, but not necessary, to connect to the log server and here's some
 * Node.js code to help:
 *
 *   require('net').connect(10571)
 *       .on('data', data => process.stdout.write(data.toString()))
 *       .on('error', err => console.log('Error:', err))
 *       .on('end', () => console.log('Disconnected from server'));
 */

@interface TiLogServer : NSObject

@property (nonatomic, assign) NSUInteger port;

/**
 * The default shared log server instance.
 *
 * @return id An initialized instance of this class
 */
+ (TiLogServer *)defaultLogServer;

/**
 * Writes the log message to all active connections. If there are no active
 * connections, then the message is added to the log queue.
 * @param message The message to log to the console
 */
- (void)log:(NSString *)message;

/**
 * Starts the log server. It only listens on the local loopback. This function
 * is re-entrant.
 */
- (void)start;

/**
 * Stops the log server. This function is re-entrant.
 */
- (void)stop;

@end

/**
 * Encapsulates connection state.
 */
@interface TiLogServerConnection : NSObject {
  int socket;
  dispatch_source_t readSource;
}

/**
 * Create a new socket by a given socket descriptor.
 *
 * @param _socket The non-negative file descriptor of the accepted socket
 */
- (id)initWithSocket:(int)_socket;

/**
 * Sends a raw data to the socket connection.
 *
 * @param buffer The socket buffer to send
 */
- (void)send:(dispatch_data_t *)buffer;

@end
