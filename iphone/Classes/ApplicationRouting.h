/**
 * Appcelerator Titanium Mobile
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>

@interface ApplicationRouting : NSObject {
}
+ (NSData *)resolveAppAsset:(NSString *)path;
@end
