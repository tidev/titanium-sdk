/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "KrollBridge.h"
#import "TiAppWorkerSelfProxy.h"
#import "TiProxy.h"

@interface TiAppWorkerProxy : TiProxy {
  KrollBridge *_bridge;
  TiAppWorkerSelfProxy *_selfProxy;
  BOOL _booted;
  dispatch_queue_t _serialQueue;
  NSString *_tempFile;
  KrollCallback *_onErrorCallback;
  KrollCallback *_onMessageCallback;
  KrollCallback *_onMessageErrorCallback;
}

#pragma mark Public APIs

- (void)postMessage:(id)message;

- (void)terminate:(__unused id)unused;

- (void)setOnerror:(id)onErrorCallback;

- (void)setOnmessage:(id)onMessageCallback;

- (void)setOnmessageerror:(id)onMessageErrorCallback;

#pragma mark Private APIs

- (id)initWithPath:(NSString *)path host:(id)host pageContext:(id<TiEvaluator>)pageContext;

- (void)fireMessageCallback:(NSDictionary *)messageEvent error:(NSError *)error;

- (KrollBridge *)_bridge;

@end
