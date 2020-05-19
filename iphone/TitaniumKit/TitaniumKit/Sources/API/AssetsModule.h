/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2020-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcModule.h"
@import JavaScriptCore;

@protocol AssetsExports <JSExport>

- (NSString *)readAsset:(NSString *)path;

@end

@interface AssetsModule : ObjcModule <AssetsExports>
@end
