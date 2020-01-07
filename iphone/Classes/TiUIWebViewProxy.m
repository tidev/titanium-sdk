/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2019 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

@import TitaniumKit.TiBlob;
@import TitaniumKit.TiHost;
@import TitaniumKit.TiUtils;

#import "TiUIWebViewProxy.h"
#import "TiNetworkCookieProxy.h"
#import "TiUIWebView.h"

@implementation TiUIWebViewProxy

- (id)_initWithPageContext:(id<TiEvaluator>)context
{
  if (self = [super _initWithPageContext:context]) {
  }

  return self;
}

- (TiUIWebView *)webView
{
  return (TiUIWebView *)self.view;
}

- (void)dealloc
{
  RELEASE_TO_NIL(_allowedURLSchemes);
  RELEASE_TO_NIL(_genericProperties);
  [super dealloc];
}

- (void)fireEvent:(id)listener withObject:(id)obj remove:(BOOL)yn thisObject:(id)thisObject_
{
  TiThreadPerformOnMainThread(
      ^{
        [[self webView] fireEvent:listener withObject:obj remove:yn thisObject:thisObject_];
      },
      NO);
}

- (void)setPageToken:(NSString *)pageToken
{
  if (_pageToken != nil) {
    [[self host] unregisterContext:(id<TiEvaluator>)self forToken:_pageToken];
    _pageToken = nil;
  }
  _pageToken = pageToken;
  [[self host] registerContext:self forToken:_pageToken];
}

- (void)refreshHTMLContent
{
  NSString *code = @"document.documentElement.outerHTML.toString()";

  // Refresh the "html" property async to be able to use the remote HTML content.
  // This should be deprecated asap, since it is an overhead that should be done using
  // webView.evalJS() within the app if required.
  [[[self webView] webView] evaluateJavaScript:code
                             completionHandler:^(id result, NSError *error) {
                               if (error != nil) {
                                 return;
                               }
                               [self replaceValue:result forKey:@"html" notification:NO];
                             }];
}

- (void)windowWillClose
{
}

- (void)windowDidClose
{
  if (_pageToken != nil) {
    [[self host] unregisterContext:(id<TiEvaluator>)self forToken:_pageToken];
    _pageToken = nil;
  }

  [(TiUIWebView *)[self view] viewDidClose];

  NSNotification *notification = [NSNotification notificationWithName:kTiContextShutdownNotification object:self];
  WARN_IF_BACKGROUND_THREAD_OBJ;
  [[NSNotificationCenter defaultCenter] postNotification:notification];
  [super windowDidClose];
}

- (void)_destroy
{
  if (_pageToken != nil) {
    [[self host] unregisterContext:(id<TiEvaluator>)self forToken:_pageToken];
    _pageToken = nil;
  }
  [super _destroy];
}

#pragma mark - TiEvaluator Protocol

- (TiHost *)host
{
  return [self _host];
}

- (NSString *)basename
{
  return nil;
}

- (NSURL *)currentURL
{
  return nil;
}

- (void)setCurrentURL:(NSURL *)unused
{
}

- (void)evalFile:(NSString *)path
{
  NSURL *url_ = [path hasPrefix:@"file:"] ? [NSURL URLWithString:path] : [NSURL fileURLWithPath:path];

  if (![path hasPrefix:@"/"] && ![path hasPrefix:@"file:"]) {
    NSURL *root = [[self _host] baseURL];
    url_ = [NSURL fileURLWithPath:[NSString stringWithFormat:@"%@/%@", root, path]];
  }

  NSString *code = [NSString stringWithContentsOfURL:url_ encoding:NSUTF8StringEncoding error:nil];
  [[[self webView] webView] evaluateJavaScript:code
                             completionHandler:^(id _Nullablecresult, NSError *_Nullable error){
                             }];
}

- (NSString *)evalJSAndWait:(NSString *)code
{
  return [self evalJSSync:code];
}

- (void)evalJSWithoutResult:(NSString *)code
{
  [self evalJS:code];
}

- (BOOL)evaluationError
{
  return NO;
}

- (KrollContext *)krollContext
{
  return nil;
}

- (id)krollObjectForProxy:(id)proxy
{
  return nil;
}

- (id)preloadForKey:(id)key name:(id)name
{
  return nil;
}

- (id)registerProxy:(id)proxy
{
  return nil;
}

- (void)unregisterProxy:(id)proxy
{
}

- (BOOL)usesProxy:(id)proxy
{
  return NO;
}

#pragma mark - Public APIs

#pragma mark Getters

- (NSNumber *)disableBounce
{
  return @(![[[[self webView] webView] scrollView] bounces]);
}

- (NSNumber *)scrollsToTop
{
  return @([[[[self webView] webView] scrollView] scrollsToTop]);
}

- (NSNumber *)allowsBackForwardNavigationGestures
{
  return @([[[self webView] webView] allowsBackForwardNavigationGestures]);
}

- (NSString *)userAgent
{
  return [[[self webView] webView] customUserAgent];
}

- (NSString *)url
{
  return [[[[self webView] webView] URL] absoluteString];
}

- (NSString *)title
{
  return [[[self webView] webView] title];
}

- (NSNumber *)progress
{
  return @([[[self webView] webView] estimatedProgress]);
}

- (NSNumber *)secure
{
  return @([[[self webView] webView] hasOnlySecureContent]);
}

- (NSDictionary *)backForwardList
{
  WKBackForwardList *list = [[[self webView] webView] backForwardList];

  NSMutableArray *backList = [NSMutableArray arrayWithCapacity:list.backList.count];
  NSMutableArray *forwardList = [NSMutableArray arrayWithCapacity:list.forwardList.count];

  for (WKBackForwardListItem *item in list.backList) {
    [backList addObject:[[self class] _dictionaryFromBackForwardItem:item]];
  }

  for (WKBackForwardListItem *item in list.forwardList) {
    [forwardList addObject:[[self class] _dictionaryFromBackForwardItem:item]];
  }

  return @{
    @"currentItem" : [[self class] _dictionaryFromBackForwardItem:[list currentItem]],
    @"backItem" : [[self class] _dictionaryFromBackForwardItem:[list backItem]],
    @"forwardItem" : [[self class] _dictionaryFromBackForwardItem:[list forwardItem]],
    @"backList" : backList,
    @"forwardList" : forwardList
  };
}

- (NSDictionary *)preferences
{
  return @{
    @"minimumFontSize" : NUMFLOAT([[[[[self webView] webView] configuration] preferences] minimumFontSize]),
    @"javaScriptEnabled" : NUMBOOL([[[[[self webView] webView] configuration] preferences] javaScriptEnabled]),
    @"javaScriptCanOpenWindowsAutomatically" : NUMBOOL([[[[[self webView] webView] configuration] preferences] javaScriptCanOpenWindowsAutomatically]),
  };
}

- (NSNumber *)selectionGranularity
{
  return @([[[[self webView] webView] configuration] selectionGranularity]);
}

- (NSNumber *)mediaTypesRequiringUserActionForPlayback
{
  return @([[[[self webView] webView] configuration] mediaTypesRequiringUserActionForPlayback]);
}

- (NSNumber *)suppressesIncrementalRendering
{
  return @([[[[self webView] webView] configuration] suppressesIncrementalRendering]);
}

- (NSNumber *)allowsInlineMediaPlayback
{
  return @([[[[self webView] webView] configuration] allowsInlineMediaPlayback]);
}

- (NSNumber *)allowsAirPlayMediaPlayback
{
  return @([[[[self webView] webView] configuration] allowsAirPlayForMediaPlayback]);
}

- (NSNumber *)allowsPictureInPictureMediaPlayback
{
  return @([[[[self webView] webView] configuration] allowsPictureInPictureMediaPlayback]);
}

- (NSArray<NSString *> *)allowedURLSchemes
{
  return _allowedURLSchemes;
}

- (NSNumber *)zoomLevel
{
  NSString *zoomLevel = [self evalJS:@[ @"document.body.style.zoom" ]];

  if (zoomLevel == nil || zoomLevel.length == 0) {
    return @(1.0);
  }

  return @([zoomLevel doubleValue]);
}

#pragma mark Setter

- (void)setAllowedURLSchemes:(NSArray *)schemes
{
  RELEASE_TO_NIL(_allowedURLSchemes);
  for (id scheme in schemes) {
    ENSURE_TYPE(scheme, NSString);
  }

  _allowedURLSchemes = [[NSArray arrayWithArray:schemes] retain];
}

- (void)setBasicAuthentication:(id)value
{
  // This was a regression between 7.x and 8.0.0. It should be removed in later versions
  if ([value isKindOfClass:[NSDictionary class]]) {
    NSLog(@"[WARN] Please pass the basicAuthentication parameters as function arguments, e.g. \"webView.setBasicAuthentication(username, password, persistence)\"");
    [self replaceValue:value forKey:@"basicAuthentication" notification:NO];
    return;
  }

  NSString *username = value[0];
  NSString *password = value[1];
  NSURLCredentialPersistence persistence = NSURLCredentialPersistenceNone;

  if ([value count] == 3) {
    persistence = [TiUtils intValue:value[2] def:NSURLCredentialPersistenceNone];
  }

  NSDictionary *params = @{ @"username" : username,
    @"password" : password,
    @"persistence" : @(persistence) };
  [self replaceValue:params forKey:@"basicAuthentication" notification:NO];
}

- (void)setHtml:(id)args
{
  [[self webView] setHtml_:args];
}

#pragma mark Methods

- (void)addUserScript:(id)args
{
  ENSURE_SINGLE_ARG(args, NSDictionary);

  NSString *source = [TiUtils stringValue:@"source" properties:args];
  WKUserScriptInjectionTime injectionTime = [TiUtils intValue:@"injectionTime" properties:args def:WKUserScriptInjectionTimeAtDocumentStart];
  BOOL mainFrameOnly = [TiUtils boolValue:@"mainFrameOnly" properties:args];

  WKUserScript *script = [[WKUserScript alloc] initWithSource:source injectionTime:injectionTime forMainFrameOnly:mainFrameOnly];
  WKUserContentController *controller = [[[[self webView] webView] configuration] userContentController];
  [controller addUserScript:script];
}

- (void)removeAllUserScripts:(id)unused
{
  WKUserContentController *controller = [[[[self webView] webView] configuration] userContentController];
  [controller removeAllUserScripts];
}

- (void)addScriptMessageHandler:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);

  WKUserContentController *controller = [[[[self webView] webView] configuration] userContentController];
  [controller addScriptMessageHandler:[self webView] name:value];
}

- (void)removeScriptMessageHandler:(id)value
{
  ENSURE_SINGLE_ARG(value, NSString);

  WKUserContentController *controller = [[[[self webView] webView] configuration] userContentController];
  [controller removeScriptMessageHandlerForName:value];
}

- (void)stopLoading:(id)unused
{
  [[[self webView] webView] stopLoading];
}

- (void)reload:(id)unused
{
  [[[self webView] webView] reload];
}

- (void)repaint:(id)unused
{
  [self contentsWillChange];
}

- (void)goBack:(id)unused
{
  [[[self webView] webView] goBack];
}

- (void)goForward:(id)unused
{
  [[[self webView] webView] goForward];
}

- (NSNumber *)canGoBack:(id)unused
{
  return NUMBOOL([[[self webView] webView] canGoBack]);
}

- (NSNumber *)canGoForward:(id)unused
{
  return NUMBOOL([[[self webView] webView] canGoForward]);
}

- (NSNumber *)loading
{
  return @([[[self webView] webView] isLoading]);
}

- (void)startListeningToProperties:(id)args
{
  ENSURE_SINGLE_ARG(args, NSArray);

  if (_genericProperties == nil) {
    _genericProperties = [[NSMutableArray alloc] init];
  }
  for (id property in args) {
    ENSURE_TYPE(property, NSString);
    [_genericProperties addObject:property];
    [[[self webView] webView] addObserver:self forKeyPath:property options:NSKeyValueObservingOptionNew context:NULL];
  }
}

- (void)stopListeningToProperties:(id)args
{
  ENSURE_SINGLE_ARG(args, NSArray);

  for (id property in args) {
    ENSURE_TYPE(property, NSString);

    [[[self webView] webView] removeObserver:self forKeyPath:property];
    [_genericProperties removeObject:property];
  }
}

- (id)evalJS:(id)args
{
  NSString *code = nil;
  KrollCallback *callback = nil;

  ENSURE_ARG_AT_INDEX(code, args, 0, NSString);
  ENSURE_ARG_OR_NIL_AT_INDEX(callback, args, 1, KrollCallback);

  if (code == nil) {
    [self throwException:@"Missing JavaScript code"
               subreason:@"The required first argument is missinf and should contain a valid JavaScript string."
                location:CODELOCATION];
    return nil;
  }

  // If no argument is passed, return in sync (NOT recommended)
  if (callback == nil) {
    __block id result = nil;
    TiThreadPerformOnMainThread(
        ^{
          result = [[self evalJSSync:@[ code ]] retain];
        },
        YES);
    return [result autorelease];
  }

  TiThreadPerformOnMainThread(
      ^{
        [[[self webView] webView] evaluateJavaScript:code
                                   completionHandler:^(id result, NSError *error) {
                                     if (!callback) {
                                       return;
                                     }
                                     result = result ?: [NSNull null];
                                     [callback call:@[ result ] thisObject:self];
                                   }];
      },
      NO);
  return nil;
}

- (NSString *)evalJSSync:(id)args
{
  NSString *code = nil;

  __block NSString *resultString = nil;
  __block BOOL finishedEvaluation = NO;

  ENSURE_ARG_AT_INDEX(code, args, 0, NSString);

  [[[self webView] webView] evaluateJavaScript:code
                             completionHandler:^(id result, NSError *error) {
                               resultString = [NULL_IF_NIL(result) retain];
                               finishedEvaluation = YES;
                             }];

  while (!finishedEvaluation) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
  }

  return [resultString autorelease];
}

- (void)takeSnapshot:(id)args
{
  KrollCallback *callback = (KrollCallback *)[args objectAtIndex:0];
  ENSURE_TYPE(callback, KrollCallback);

#if __IPHONE_11_0
  if ([TiUtils isIOSVersionOrGreater:@"11.0"]) {
    [[[self webView] webView] takeSnapshotWithConfiguration:nil
                                          completionHandler:^(UIImage *snapshotImage, NSError *error) {
                                            if (error != nil) {
                                              [callback call:@[ @{ @"success" : NUMBOOL(NO), @"error" : error.localizedDescription } ] thisObject:self];
                                              return;
                                            }

                                            [callback call:@[ @{ @"success" : NUMBOOL(YES), @"snapshot" : [[TiBlob alloc] initWithImage:snapshotImage] } ] thisObject:self];
                                          }];
  } else {
#endif
    [callback call:@[ @{ @"success" : NUMBOOL(YES), @"snapshot" : [self toImage:nil] } ]
        thisObject:self];
#if __IPHONE_11_0
  }
#endif
}

#pragma mark Utilities

+ (NSDictionary *)_dictionaryFromBackForwardItem:(WKBackForwardListItem *)item
{
  if (item == nil) {
    return @{};
  }
  return @{ @"url" : item.URL.absoluteString, @"initialUrl" : item.initialURL.absoluteString, @"title" : item.title };
}

#pragma mark Generic KVO

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  for (NSString *property in _genericProperties) {
    if ([self _hasListeners:property] && [keyPath isEqualToString:property] && object == [[self webView] webView]) {
      [self fireEvent:property withObject:@{ @"value" : NULL_IF_NIL([[[self webView] webView] valueForKey:property]) }];
      return;
    }
  }
}

#pragma mark Cookies

// This whole cookie code is not getting used. Reason is -
// 1. If we use this, parity can not be managed for cookies
// 2. WKHTTPCookieStore, which manages cookie in WKWebView, is supported in iOS 11+
// 3. We are using following to implement cookies-
//  https://stackoverflow.com/questions/26573137
//  https://github.com/haifengkao/YWebView
// TO DO: If we can make parity using WKHTTPCookieStore, we should start using WKHTTPCookieStore APIs

- (id<TiEvaluator>)evaluationContext
{
  id<TiEvaluator> context = [self executionContext];
  if (context == nil) {
    context = [self pageContext];
  }
  return context;
}

- (NSArray *)getHTTPCookiesForDomain:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString);
  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    NSMutableArray *allCookies = [NSMutableArray array];
    for (NSHTTPCookie *cookie in [storage cookies]) {
      if ([[cookie domain] isEqualToString:args]) {
        [allCookies addObject:cookie];
      }
    }
    NSMutableArray *returnArray = [NSMutableArray array];
    for (NSHTTPCookie *cookie in allCookies) {
      [returnArray addObject:[[[TiNetworkCookieProxy alloc] initWithCookie:cookie andPageContext:[self evaluationContext]] autorelease]];
    }
    return returnArray;
  }
  __block NSMutableArray *returnArray = [NSMutableArray array];
  __block BOOL finishedEvaluation = NO;
  WKHTTPCookieStore *storage = [[[[(TiUIWebView *)[self view] webView] configuration] websiteDataStore] httpCookieStore];
  [storage getAllCookies:^(NSArray<NSHTTPCookie *> *cookies) {
    NSMutableArray *allCookies = [NSMutableArray array];
    for (NSHTTPCookie *cookie in cookies) {
      if ([[cookie domain] isEqualToString:args]) {
        [allCookies addObject:cookie];
      }
    }
    for (NSHTTPCookie *cookie in allCookies) {
      [returnArray addObject:[[[TiNetworkCookieProxy alloc] initWithCookie:cookie andPageContext:[self evaluationContext]] autorelease]];
    }
    finishedEvaluation = YES;
  }];
  while (!finishedEvaluation) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
  }
  return returnArray;
}

- (void)addHTTPCookie:(id)args
{
  ENSURE_SINGLE_ARG(args, TiNetworkCookieProxy);
  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    NSHTTPCookie *cookie = [args newCookie];
    if (cookie != nil) {
      [storage setCookie:cookie];
    }
    RELEASE_TO_NIL(cookie);
    return;
  }
  WKHTTPCookieStore *storage = [[[[(TiUIWebView *)[self view] webView] configuration] websiteDataStore] httpCookieStore];

  NSHTTPCookie *cookie = [args newCookie];
  if (cookie != nil) {
    [storage setCookie:cookie completionHandler:nil];
  }
  RELEASE_TO_NIL(cookie);
}

- (NSArray *)getHTTPCookies:(id)args
{
  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {
    NSString *domain = [TiUtils stringValue:[args objectAtIndex:0]];
    NSString *path = [TiUtils stringValue:[args objectAtIndex:1]];
    NSString *name = [TiUtils stringValue:[args objectAtIndex:2]];
    if (path == nil || [path isEqual:@""]) {
      path = @"/";
    }
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];

    NSArray *allCookies = [storage cookies];
    NSMutableArray *returnArray = [NSMutableArray array];
    for (NSHTTPCookie *cookie in allCookies) {
      if ([[cookie domain] isEqualToString:domain] &&
          [[cookie path] isEqualToString:path] && ([[cookie name] isEqualToString:name] || name == nil)) {
        TiNetworkCookieProxy *tempCookieProxy = [[TiNetworkCookieProxy alloc] initWithCookie:cookie andPageContext:[self evaluationContext]];
        [returnArray addObject:tempCookieProxy];
        RELEASE_TO_NIL(tempCookieProxy);
      }
    }
    return returnArray;
  }
  NSString *domain = [TiUtils stringValue:[args objectAtIndex:0]];
  NSString *path = [TiUtils stringValue:[args objectAtIndex:1]];
  NSString *name = [TiUtils stringValue:[args objectAtIndex:2]];
  if (path == nil || [path isEqual:@""]) {
    path = @"/";
  }

  __block NSMutableArray *returnArray = [NSMutableArray array];
  __block BOOL finishedEvaluation = NO;

  WKHTTPCookieStore *storage = [[[[(TiUIWebView *)[self view] webView] configuration] websiteDataStore] httpCookieStore];

  [storage getAllCookies:^(NSArray<NSHTTPCookie *> *cookies) {
    for (NSHTTPCookie *cookie in cookies) {
      if ([[cookie domain] isEqualToString:domain] &&
          [[cookie path] isEqualToString:path] && ([[cookie name] isEqualToString:name] || name == nil)) {
        TiNetworkCookieProxy *tempCookieProxy = [[TiNetworkCookieProxy alloc] initWithCookie:cookie andPageContext:[self evaluationContext]];
        [returnArray addObject:tempCookieProxy];
        RELEASE_TO_NIL(tempCookieProxy);
      }
    }
    finishedEvaluation = YES;
  }];
  while (!finishedEvaluation) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
  }
  return returnArray;
}

- (void)removeAllHTTPCookies:(id)args
{
  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {

    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    while ([[storage cookies] count] > 0) {
      [storage deleteCookie:[[storage cookies] objectAtIndex:0]];
    }
    return;
  }
  WKHTTPCookieStore *storage = [[[[(TiUIWebView *)[self view] webView] configuration] websiteDataStore] httpCookieStore];
  [storage getAllCookies:^(NSArray<NSHTTPCookie *> *cookies) {
    for (NSHTTPCookie *cookie in cookies) {
      [storage deleteCookie:cookie completionHandler:nil];
    }
  }];
}

- (void)removeHTTPCookie:(id)args
{
  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {
    NSArray *cookies = [self getHTTPCookies:args];
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    for (TiNetworkCookieProxy *cookie in cookies) {
      NSHTTPCookie *tempCookie = [cookie newCookie];
      [storage deleteCookie:tempCookie];
      RELEASE_TO_NIL(tempCookie);
    }
    return;
  }
  NSArray *cookies = [self getHTTPCookies:args];
  WKHTTPCookieStore *storage = [[[[(TiUIWebView *)[self view] webView] configuration] websiteDataStore] httpCookieStore];
  for (TiNetworkCookieProxy *cookie in cookies) {
    NSHTTPCookie *tempCookie = [cookie newCookie];
    [storage deleteCookie:tempCookie completionHandler:nil];
    RELEASE_TO_NIL(tempCookie);
  }
}

- (void)removeHTTPCookiesForDomain:(id)args
{
  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {
    NSArray *cookies = [self getHTTPCookiesForDomain:args];
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    for (TiNetworkCookieProxy *cookie in cookies) {
      NSHTTPCookie *tempCookie = [cookie newCookie];
      [storage deleteCookie:tempCookie];
      RELEASE_TO_NIL(tempCookie);
    }
    return;
  }

  NSArray *cookies = [self getHTTPCookiesForDomain:args];
  WKHTTPCookieStore *storage = [[[[(TiUIWebView *)[self view] webView] configuration] websiteDataStore] httpCookieStore];
  for (TiNetworkCookieProxy *cookie in cookies) {
    NSHTTPCookie *tempCookie = [cookie newCookie];
    [storage deleteCookie:tempCookie completionHandler:nil];
    RELEASE_TO_NIL(tempCookie);
  }
}

- (NSArray *)allHTTPCookies
{
  if (![TiUtils isIOSVersionOrGreater:@"11.0"]) {
    NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
    NSMutableArray *array = [NSMutableArray array];
    for (NSHTTPCookie *cookie in [storage cookies]) {
      [array addObject:[[[TiNetworkCookieProxy alloc] initWithCookie:cookie andPageContext:[self evaluationContext]] autorelease]];
    }
    return array;
  }
  __block NSMutableArray *returnArray = [NSMutableArray array];
  __block BOOL finishedEvaluation = NO;

  WKHTTPCookieStore *storage = [[[[(TiUIWebView *)[self view] webView] configuration] websiteDataStore] httpCookieStore];
  [storage getAllCookies:^(NSArray<NSHTTPCookie *> *cookies) {
    for (NSHTTPCookie *cookie in cookies) {
      [returnArray addObject:[[[TiNetworkCookieProxy alloc] initWithCookie:cookie andPageContext:[self evaluationContext]] autorelease]];
    }
    finishedEvaluation = YES;
  }];
  while (!finishedEvaluation) {
    [[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode beforeDate:[NSDate distantFuture]];
  }
  return returnArray;
}

@end
#endif
