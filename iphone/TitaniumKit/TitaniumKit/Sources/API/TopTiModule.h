/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "ObjcProxy.h"
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

@interface TopTiModule : ObjcProxy <TiExports>
@end
