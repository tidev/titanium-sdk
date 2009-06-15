/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>


@interface TitaniumJSCode : NSObject {
	NSString * preludeCode;
	NSString * epilogueCode;
	NSString * valueCode;
	NSString * context;
}

+ (TitaniumJSCode *) functionReturning: (id) returnedValue;
+ (TitaniumJSCode *) codeWithString: (NSString *) newValue;

@property(nonatomic,readwrite,copy)	NSString * valueCode;
@property(nonatomic,readwrite,copy)	NSString * preludeCode;
@property(nonatomic,readwrite,copy)	NSString * epilogueCode;
@property(nonatomic,readwrite,copy)	NSString * context;

- (void) invoke;

@end
