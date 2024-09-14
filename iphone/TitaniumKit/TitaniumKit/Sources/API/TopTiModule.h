/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcModule.h"
@import JavaScriptCore;

@protocol TiExports <JSExport>

// Properties (and accessors)
READONLY_PROPERTY(NSString *, buildDate, BuildDate);
READONLY_PROPERTY(NSString *, buildHash, BuildHash);
PROPERTY(NSString *, userAgent, UserAgent);
READONLY_PROPERTY(NSString *, version, Version);

// Methods
- (JSValue *)createBuffer:(NSDictionary *)arg;

@end

@interface TopTiModule : ObjcModule <TiExports>
@end
