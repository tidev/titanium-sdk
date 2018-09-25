/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiUIView.h"

@interface TiUIWebView : TiUIView <UIWebViewDelegate, NSURLConnectionDelegate> {
  @private
  UIWebView *webview;
  UIActivityIndicatorView *spinner;
  NSURL *url;
  NSMutableDictionary *listeners;
  NSURLConnection *insecureConnection;
  NSString *pageToken;
  BOOL scalingOverride;
  NSString *basicCredentials;

  BOOL ignoreNextRequest;
  BOOL ignoreSslError;
  BOOL isAuthenticated;
  id reloadData;
  id reloadDataProperties;
  SEL reloadMethod;

  BOOL willHandleTouches;
  BOOL willHandleUrl;
  NSString *lastValidLoad;
  NSArray *blacklistedURLs;
}

@property (nonatomic, readonly) id url;
@property (nonatomic, readwrite, retain) id reloadData;
@property (nonatomic, readwrite, retain) id reloadDataProperties;

- (void)evalFile:(NSString *)path;
- (NSString *)stringByEvaluatingJavaScriptFromString:(NSString *)code;
- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_;

- (void)stopLoading;
- (void)goBack;
- (void)goForward;
- (BOOL)loading;
- (BOOL)canGoBack;
- (BOOL)canGoForward;
- (void)reload;
- (UIWebView *)webview;

- (void)setHtml_:(NSString *)content withObject:(id)property;
- (void)setAllowsLinkPreview_:(id)value;

@end

#endif
