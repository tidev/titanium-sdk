/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"


// main interface for File-based proxies -- this is in the API
// since Filesystem implements it but we want to be able to have other
// modules be able to cast to it transparently (such as database)
// but without causing a compile-time dependency on Filesystem module

@interface TiFile : TiProxy {
@protected 
	NSString *path;
}

@property(nonatomic,readonly) NSString *path;

@end
