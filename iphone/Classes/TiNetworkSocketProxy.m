/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiNetworkSocketProxy.h"
#import "TiNetworkSocketTCPProxy.h"

@implementation TiNetworkSocketProxy

-(id)createTCP:(id)args
{
    return [[[TiNetworkSocketTCPProxy alloc] _initWithPageContext:[self executionContext] args:args] autorelease];
}

@end
