/**
 * Appcelerator Titanium License
 * This source code and all modifications done by Appcelerator
 * are licensed under the Apache Public License (version 2) and
 * are Copyright (c) 2009-2014 by Appcelerator, Inc.
 */

#import <Foundation/Foundation.h>

@interface TiHyperloopHelper : NSObject

/**
 Takes a `void*` from a Hyperloop JS Object and returns an `id` if posible
 otherwise returns `nil`
 */
+(id)GetObjectFromHyperloopPointer:(void*)pointer;

@end
