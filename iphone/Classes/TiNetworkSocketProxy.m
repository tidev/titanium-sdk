/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiNetworkSocketProxy.h"
#import "TiNetworkSocketTCPProxy.h"
#import <TitaniumKit/TiBase.h>

#if defined(USE_TI_NETWORKSOCKET) || (defined(USE_TI_NETWORK))
@implementation TiNetworkSocketProxy

- (id)createTCP:(id)args
{
  return [[[TiNetworkSocketTCPProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

- (NSString *)apiName
{
  return @"Ti.Network.Socket";
}

MAKE_SYSTEM_PROP(INITIALIZED, SOCKET_INITIALIZED);
MAKE_SYSTEM_PROP(CONNECTED, SOCKET_CONNECTED);
MAKE_SYSTEM_PROP(LISTENING, SOCKET_LISTENING);
MAKE_SYSTEM_PROP(CLOSED, SOCKET_CLOSED);
MAKE_SYSTEM_PROP(ERROR, SOCKET_ERROR);

@end
#endif
