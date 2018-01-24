/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiAppWorkerSelfProxy.h"
#import "TiAppWorkerProxy.h"

@implementation TiAppWorkerSelfProxy

- (id)initWithParent:(TiProxy *)parent url:(NSString *)url pageContext:(id<TiEvaluator>)_pageContext
{
  if ((self = [super _initWithPageContext:_pageContext])) {
    _parent = parent;
    _url = url;
  }
  return self;
}

- (NSString *)url
{
  return _url;
}

- (KrollCallback *)onMessageCallback
{
  return _onMessageCallback;
}

- (void)postMessage:(id)message
{
  ENSURE_SINGLE_ARG(message, NSObject);

  // This is from the worker, posting back to the creator
  NSError *error = nil;
  NSString *serializedMessage = [TiUtils jsonStringify:@{ @"data" : message }];

  if (serializedMessage == nil) {
    error = [NSError errorWithDomain:NSCocoaErrorDomain code:1 userInfo:@{ NSLocalizedDescriptionKey : NSLocalizedString(@"Cannot serialize message", nil) }];
  }

  TiAppWorkerProxy *proxy = (TiAppWorkerProxy *)_parent;
  [proxy fireMessageCallback:@{ @"data" : message } error:error];
}

- (void)terminate:(id)unused
{
  // If we call terminate on ourselves, just go through the normal route
  [((TiAppWorkerProxy *)_parent) terminate:unused];
}

- (void)setOnmessage:(id)onMessageCallback
{
  // This is called from the worker thread
  _onMessageCallback = onMessageCallback;
}

@end
