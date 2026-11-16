/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 *
 * WARNING: This is generated code. Do not modify. Your changes *will* be lost.
 */

#import <Foundation/Foundation.h>
#import "ApplicationRouting.h"

extern NSData* filterDataInRange(NSData* thedata, NSRange range);

@implementation ApplicationRouting

+ (NSData*) resolveAppAsset:(NSString*)path;
{
	<%- bytes %>

	NSNumber *index = [map objectForKey:path];
	if (index == nil) { return nil; }
	return filterDataInRange([NSData dataWithBytesNoCopy:data length:sizeof(data) freeWhenDone:NO], ranges[index.integerValue]);
}

@end