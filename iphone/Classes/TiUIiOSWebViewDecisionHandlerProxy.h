/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import <TitaniumKit/TiProxy.h>
#import <WebKit/WebKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface TiUIiOSWebViewDecisionHandlerProxy : TiProxy {
  void (^_Nonnull _decisionHandler)(WKNavigationActionPolicy);
}

- (id)_initWithPageContext:(id<TiEvaluator>)context andDecisionHandler:(nonnull void (^)(WKNavigationActionPolicy))decisionHandler;

- (void)invoke:(id)value;

@end

NS_ASSUME_NONNULL_END

#endif
