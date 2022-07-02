/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>
#import <TitaniumKit/TiProxy.h>
#if defined(USE_TI_NETWORKSOCKET) || (defined(USE_TI_NETWORK))
typedef enum {
  SOCKET_INITIALIZED = 1 << 0,
  SOCKET_CONNECTED = 1 << 1,
  SOCKET_LISTENING = 1 << 2,
  SOCKET_CLOSED = 1 << 3,
  SOCKET_ERROR = 1 << 4
} SocketState;

@interface TiNetworkSocketProxy : TiProxy {
}
// Properties
@property (readonly, nonatomic) NSNumber *INITIALIZED;
@property (readonly, nonatomic) NSNumber *CONNECTED;
@property (readonly, nonatomic) NSNumber *LISTENING;
@property (readonly, nonatomic) NSNumber *CLOSED;
@property (readonly, nonatomic) NSNumber *ERROR;

// Public API
- (id)createTCP:(id)args;

@end
#endif
