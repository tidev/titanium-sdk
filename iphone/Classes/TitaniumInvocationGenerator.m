/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumInvocationGenerator.h"


@implementation TitaniumInvocationGenerator
@synthesize target, invocation;

+ (id) generatorWithTarget: (id) target;
{
	TitaniumInvocationGenerator * result = [[self alloc] init];
	[result setTarget:target];
	return [result autorelease];
}

+ (NSInvocation *) invocationWithTarget: (id) target selector:(SEL) selector object:(id) object;
{
	NSMethodSignature * methodSignature = [target methodSignatureForSelector:selector];
	NSInvocation * result = [NSInvocation invocationWithMethodSignature:methodSignature];
	[result setSelector:selector]; [result setTarget:target];
	if ([methodSignature numberOfArguments] > 2) [result setArgument:&object atIndex:2];
	return result;
}

- (void) dealloc;
{
	[target release];
	[invocation release];
	[super dealloc];
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector;
{
	if ([target respondsToSelector:aSelector]){
		return [target methodSignatureForSelector:aSelector];
	}
	return [super methodSignatureForSelector:aSelector];
}

- (void) forwardInvocation:(NSInvocation *)newInvocation;
{
	[newInvocation setTarget:target];
	[self setInvocation:newInvocation];
}

@end
