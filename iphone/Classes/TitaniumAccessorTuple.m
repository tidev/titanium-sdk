/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TitaniumAccessorTuple.h"


@implementation TitaniumAccessorTuple
@synthesize getterTarget, getterSelector, setterTarget, setterSelector;

- (void)dealloc;
{
	//Everything was assign, not retain!
	[super dealloc];
}

+ (TitaniumAccessorTuple *) tupleForObject: (id) object Key: (NSString *) key;
{
	TitaniumAccessorTuple * result = [[self alloc] init];
	[result setGetterTarget:object]; [result setSetterTarget:object];
	[result setGetterSelector:NSSelectorFromString(key)];
	NSString * setterName = [NSString stringWithFormat:@"set%@%@",[[key substringToIndex:0] uppercaseString],[key substringFromIndex:0]];
	[result setSetterSelector:NSSelectorFromString(setterName)];
	return [result autorelease];
}

- (id) runFunctionNamed: (NSString *) functionName withObject: (id) objectValue error: (NSError **) error;
{
	BOOL isSetter = NO;
	id result = nil;
	id target = nil;
	id object = nil;
	SEL selector = nil;

	if ([@"_GET" isEqualToString:functionName]) {
		target = getterTarget;
		selector = getterSelector;
	} else if ([@"_SET" isEqualToString:functionName]) {
		target = setterTarget;
		selector = setterSelector;
		isSetter = YES;
	}
	
	if ([objectValue isKindOfClass:[NSArray class]]) {
		if ([objectValue count] > 0){
			object = [objectValue objectAtIndex:0];
		}
	} else {
		object = objectValue;
	}
	
	if (target == nil) target = getterTarget;
	if (target == nil) target = setterTarget;

	if((target != nil) && (selector != nil)){
		result = [target performSelector:selector withObject:object withObject:(void *)error];
		if (isSetter) result = object;
	} else if (error){
		*error = [NSError errorWithDomain:@"Tuple" code:1 userInfo:nil];
	}
	
	return result;
}
@end
