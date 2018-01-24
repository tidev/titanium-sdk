/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiProxy.h"

@interface TiAppWorkerSelfProxy : TiProxy {
  TiProxy *_parent;
  NSString *_url;
  KrollCallback *_onMessageCallback;
}

#pragma mark Private APIs

- (id)initWithParent:(TiProxy *)parent url:(NSString *)url pageContext:(id<TiEvaluator>)_pageContext;

- (NSString *)url;

- (KrollCallback *)onMessageCallback;

#pragma mark Public APIs

- (void)postMessage:(id)message;

- (void)terminate:(__unused id)unused;

- (void)setOnmessage:(id)onMessageCallback;

@end
