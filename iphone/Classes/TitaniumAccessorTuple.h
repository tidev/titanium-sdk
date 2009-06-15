/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>


@interface TitaniumAccessorTuple : NSObject {
	id	getterTarget;
	SEL	getterSelector;
	id	setterTarget;
	SEL setterSelector;
}

@property(nonatomic,readwrite,assign)	id	getterTarget;
@property(nonatomic,readwrite,assign)	SEL	getterSelector;
@property(nonatomic,readwrite,assign)	id	setterTarget;
@property(nonatomic,readwrite,assign)	SEL setterSelector;

+ (TitaniumAccessorTuple *) tupleForObject: (id) object Key: (NSString *) key;
- (id) runFunctionNamed: (NSString *) functionName withObject: (id) objectValue error: (NSError **) error;

@end
