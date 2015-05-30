/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2013 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

@interface TiResourceUtils : NSObject

+(BOOL)useCustomResourceDirectory;

+(NSString*) getBaseDir;

+(NSString*) getBasePath;

+(NSString*) getPath:(NSString*) path;

@end
