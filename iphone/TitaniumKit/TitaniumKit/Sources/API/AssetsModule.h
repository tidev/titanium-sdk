/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcModule.h"
@import JavaScriptCore;

@protocol AssetsExports <JSExport>

- (NSString *)readAsset:(NSString *)path;

@end

@interface AssetsModule : ObjcModule <AssetsExports>

+ (NSData *)loadURL:(NSURL *)url;
+ (NSString *)readURL:(NSURL *)url;

@end
