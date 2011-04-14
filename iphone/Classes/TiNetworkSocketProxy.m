/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiNetworkSocketProxy.h"
#import "TiNetworkSocketTCPProxy.h"
#ifdef USE_TI_NETWORKSOCKET
@implementation TiNetworkSocketProxy

-(id)createTCP:(id)args
{
    return [[[TiNetworkSocketTCPProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

MAKE_SYSTEM_PROP(INITIALIZED,SOCKET_INITIALIZED);
MAKE_SYSTEM_PROP(CONNECTED,SOCKET_CONNECTED);
MAKE_SYSTEM_PROP(LISTENING,SOCKET_LISTENING);
MAKE_SYSTEM_PROP(CLOSED,SOCKET_CLOSED);
MAKE_SYSTEM_PROP(ERROR,SOCKET_ERROR);

@end
#endif