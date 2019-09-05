/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "KrollContext.h"
#import <Foundation/Foundation.h>

@class TiHost;

@protocol TiEvaluator <NSObject>

- (TiHost *)host;

- (NSString *)basename;

@property (nonatomic, readwrite, retain) NSURL *currentURL;

- (void)evalJSWithoutResult:(NSString *)code;

- (void)evalFile:(NSString *)file;

- (BOOL)evaluationError;

// NOTE: this must only be called on a thread JS thread or an exception will occur
- (id)evalJSAndWait:(NSString *)code;

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_;

- (id)preloadForKey:(id)key name:(id)key;

- (KrollContext *)krollContext;

//Creates a kroll object to be used with the proxy.
- (id)registerProxy:(id)proxy;

//Removes the kroll object and the proxy.
- (void)unregisterProxy:(id)proxy;

//Returns YES if and only iff the proxy has been registered.
- (BOOL)usesProxy:(id)proxy;

//Returns the kroll object created iff the proxy has been registered. Otherwise, returns nil.
- (id)krollObjectForProxy:(id)proxy;

@end
