/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>


@interface TitaniumJSEvent : NSObject {
	NSString * eventName;
	NSString * eventString;
	NSDictionary * eventDict;
}

@property(nonatomic,readwrite,copy)	NSString * eventName;
@property(nonatomic,readwrite,copy)	NSString * eventString;
@property(nonatomic,readwrite,copy)	NSDictionary * eventDict;

@end
