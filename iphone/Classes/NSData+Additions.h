/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

NSData * decode64 (NSData * thedata); 
NSData * dataWithHexString (NSString * hexString);
NSString *stringWithHexString (NSString * hexString);
NSData * decodeDataWithKey (NSData * thedata, NSString * key);