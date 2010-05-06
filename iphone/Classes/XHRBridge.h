/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import <Foundation/Foundation.h>
#import "Bridge.h"

@class XHRBridge;

@interface AppProtocolHandler : NSURLProtocol
{
}
+ (void) registerSpecialProtocol;
@end

@interface XHRBridge : Bridge
{

}

@end

#endif