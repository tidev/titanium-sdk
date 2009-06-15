/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>


@interface TitaniumInvocationGenerator : NSObject {
	id target;
	NSInvocation * invocation;
}
@property(readwrite,retain)	id target;
@property(readwrite,retain)	NSInvocation * invocation;

+ (id) generatorWithTarget: (id) target;
+ (NSInvocation *) invocationWithTarget: (id) target selector:(SEL) selector object:(id) object;
@end
