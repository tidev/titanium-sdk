/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiUIWebViewDecisionHandlerProxy.h"
#import "TiUtils.h"

@implementation TiUIWebViewDecisionHandlerProxy

- (id)_initWithPageContext:(id<TiEvaluator>)context andDecisionHandler:(nonnull void (^)(WKNavigationActionPolicy))decisionHandler
{
  if (self = [super _initWithPageContext:pageContext]) {
    _decisionHandler = decisionHandler;
  }

  return self;
}

- (void)invoke:(id)value
{
  ENSURE_SINGLE_ARG(value, NSNumber);
  _decisionHandler([TiUtils intValue:value]);
}

@end

#endif
