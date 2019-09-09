/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import <WebKit/WebKit.h>

#import <TitaniumKit/TiDimension.h>
#import <TitaniumKit/TiUIView.h>

@interface TiUIWebView : TiUIView <WKUIDelegate, WKNavigationDelegate, WKScriptMessageHandler> {
  @private
  WKWebView *_webView;
  NSString *_pageToken;

  TiDimension width;
  TiDimension height;
  CGFloat autoHeight;
  CGFloat autoWidth;

  BOOL _willHandleTouches;
  NSArray<NSString *> *_blacklistedURLs;
  NSURL *_currentURL;
  UIActivityIndicatorView *_loadingIndicator;
  BOOL _isViewDetached;
  BOOL _tiCookieHandlerAdded;
}

// Used from the proxy
- (void)setHtml_:(id)args;
- (void)viewDidClose;

- (WKWebView *)webView;

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_;

@end

#if IS_SDK_IOS_11
@interface WebAppProtocolHandler : NSObject <WKURLSchemeHandler> {
}

+ (NSString *)specialProtocolScheme;

@end
#endif

#endif
