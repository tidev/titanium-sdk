/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiUIiOSWebViewDecisionHandlerProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSWebViewDecisionHandlerProxy

- (id)_initWithPageContext:(id<TiEvaluator>)context andDecisionHandler:(nonnull void (^)(WKNavigationActionPolicy))decisionHandler
{
  if (self = [super _initWithPageContext:pageContext]) {
    _decisionHandler = [decisionHandler retain];
  }

  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(_decisionHandler);
  [super dealloc];
}

- (void)invoke:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  TiThreadPerformOnMainThread(
      ^{
        _decisionHandler([TiUtils intValue:value]);
      },
      NO);
}

@end

#endif
