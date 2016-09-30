/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiLogServer.h"
#import "TiBase.h"
#include <sys/socket.h>
#include <netinet/in.h>

#ifndef TI_LOG_SERVER_PORT
#	define TI_LOG_SERVER_PORT 10571
#endif

static int maxQueueSize = 25; // lines
static NSMutableArray* queue = nil;
static CFSocketRef logSocket = nil;
static CFRunLoopSourceRef logSource = nil;
static CFWriteStreamRef logStream = nil;

@interface NSMutableArray (TiLogMessageQueue)
- (id)pop;
- (void)push:(id)obj;
@end

@implementation NSMutableArray (TiLogMessageQueue)

-(id)pop
{
	if ([self count] == 0) {
		return nil;
	}
	id head = [self objectAtIndex:0];
	if (head != nil) {
		[self removeObjectAtIndex:0];
	}
}

-(void)push:(id)message
{
	if ([self count] + 1 > maxQueueSize) {
		[self pop];
	}
	[self addObject:message];
}

@end

static bool connected = false;

static void SocketAcceptCallback(CFSocketRef socket, CFSocketCallBackType type, CFDataRef address, const void *data, void *info)
{
	if (type != kCFSocketAcceptCallBack) {
		return;
	}
	
	CFSocketNativeHandle fd = (CFSocketNativeHandle)data;
	CFStreamCreatePairWithSocket(NULL, fd, NULL, &logStream);
	CFWriteStreamSetProperty(logStream, kCFStreamPropertyShouldCloseNativeSocket, kCFBooleanFalse);
	CFWriteStreamOpen(logStream);
	
	
//	NSOutputStream *outs = (NSOutputStream *)logStream;
//	[outs scheduleInRunLoop:[NSRunLoop currentRunLoop] forMode:NSDefaultRunLoopMode];
//	[outs open];
//
//	char helloworld[] = "HELLO!";
//	const uint8_t* s = (const uint8_t*)helloworld;
//	[outs write:s maxLength:strlen(helloworld)];

//
//	CFDataRef _data = CFDataCreate(NULL, (const UInt8 *)helloworld, sizeof(helloworld));
//
//	CFSocketError e = CFSocketSendData(socket, address, _data, 0);
//	if (e == kCFSocketSuccess) {
//		connected = false;
//	} else if (e == kCFSocketError) {
//		connected = false;
//	} else if (e == kCFSocketTimeout) {
//		connected = false;
//	}
	
	connected = true;
}

@implementation TiLogServer

/**
 * Writes the log message to active connection or to a queue if there are no connections.
 *
 * Important: Do NOT call NSLog() from within this function!
 */
+(void)log:(NSString*)message
{
	if (connected && logSocket != nil && CFSocketIsValid(logSocket)) {
//		NSData *data;

		if (queue != nil) {
			// flush the queue
//			for (id msg in queue) {
//				data = [msg dataUsingEncoding:NSUTF8StringEncoding];
//				CFSocketSendData(logSocket, NULL, (CFDataRef)data, 10);
//			}
			RELEASE_TO_NIL(queue);
			queue = nil;
		}

		// write message to socket
//		data = [[message dataUsingEncoding:NSUTF8StringEncoding] retain];
		
//		CFStreamStatus status = CFWriteStreamGetStatus(logStream);
//		Boolean worked = false;
//		if (status == kCFStreamStatusNotOpen) {
//			worked = CFWriteStreamOpen(logStream);
//		}
		
		UInt8* buffer =  (UInt8*)[message UTF8String];
		CFIndex len = [message lengthOfBytesUsingEncoding:NSUTF8StringEncoding];
		Boolean done = false;
		
		while (1) {
			CFIndex bytesWritten = CFWriteStreamWrite(logStream, buffer, len);
			if (bytesWritten < 0) {
				// error
				CFErrorRef err = CFWriteStreamCopyError(logStream);
				break;
			} else if (bytesWritten == 0) {
				// success
				break;
			} else if (bytesWritten != len) {
				len -= bytesWritten;
				memmove(buffer, buffer + bytesWritten, len);
				CFErrorRef err = CFWriteStreamCopyError(logStream);
				continue;
			} else {
				break;
			}
		}
		
//		char helloworld[] = "HELLO!";
//		CFDataRef data = CFDataCreate(NULL, (const UInt8 *)helloworld, strlen(helloworld) + 1);
//
//		CFSocketError e = CFSocketSendData(logSocket, NULL, (CFDataRef)data, 0);
//		if (e == kCFSocketSuccess) {
//			connected = false;
//		} else if (e == kCFSocketError) {
//			connected = false;
//		} else if (e == kCFSocketTimeout) {
//			connected = false;
//		}
//		CFRelease(data);
		//[data release];
	} else if (queue != nil) {
		[queue push:message];
	}
}

+(void)startServer
{
	if (queue == nil) {
		queue = [[NSMutableArray alloc] init];
	}
	
	logSocket = CFSocketCreate(kCFAllocatorDefault,
							   PF_INET,
							   SOCK_STREAM,
							   IPPROTO_TCP,
							   kCFSocketAcceptCallBack,
							   SocketAcceptCallback,
							   NULL);

	if (!logSocket) {
		return;
	}

	setsockopt(CFSocketGetNative(logSocket), SOL_SOCKET, SO_REUSEADDR, &(int){ 1 }, sizeof(int));
	
	struct sockaddr_in sin;
 	memset(&sin, 0, sizeof(sin));
	sin.sin_len = sizeof(sin);
	sin.sin_family = AF_INET;
	sin.sin_port = htons(TI_LOG_SERVER_PORT);
	sin.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
	NSData *addr = [[NSData dataWithBytes:&sin length:sizeof(sin)] retain];
	
	if (CFSocketSetAddress(logSocket, (CFDataRef)addr) != kCFSocketSuccess) {
		[addr release];
		CFRelease(logSocket);
		return;
	}

	[addr release];

	logSource = CFSocketCreateRunLoopSource(kCFAllocatorDefault, logSocket, 0);
	CFRunLoopAddSource(CFRunLoopGetCurrent(), logSource, kCFRunLoopCommonModes);
}

+(void)stopServer
{
	CFRunLoopRemoveSource(CFRunLoopGetCurrent(), logSource, kCFRunLoopCommonModes);
	CFRelease(logSource);

	CFSocketInvalidate(logSocket);
	CFRelease(logSocket);
	logSocket = nil;

	if (queue != nil) {
		RELEASE_TO_NIL(queue);
		queue = nil;
	}
}

@end
