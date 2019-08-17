/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#if !TARGET_OS_MACCATALYST
#ifdef USE_TI_NETWORK

#import "TiNetworkHTTPClientProxy.h"
#import "NetworkModule.h"
#import <TitaniumKit/Mimetypes.h>
#import <TitaniumKit/TiApp.h>
#import <TitaniumKit/TiBase.h>
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiFile.h>
#import <TitaniumKit/TiUtils.h>

#define TI_HTTP_REQUEST_PROGRESS_INTERVAL 0.03f

extern NSString *const TI_APPLICATION_GUID;

@implementation TiNetworkHTTPClientProxy

- (void)dealloc
{
  RELEASE_TO_NIL(httpRequest);
  RELEASE_TO_NIL(apsConnectionManager);
  RELEASE_TO_NIL(apsConnectionDelegate);
  [super dealloc];
}

- (void)_initWithProperties:(NSDictionary *)properties
{
  id arg = [properties valueForKey:@"securityManager"];

  if (IS_NULL_OR_NIL(arg) || [arg conformsToProtocol:@protocol(SecurityManagerProtocol)]) {
    if (arg != [NSNull null]) {
      apsConnectionManager = [arg retain];
    }
  } else {
    [self throwException:@"Invalid argument passed to securityManager property" subreason:@"Does not conform to SecurityManagerProtocol" location:CODELOCATION];
  }
  [super _initWithProperties:properties];
}

- (void)ensureClient
{

}

- (id)response
{
  [self ensureClient];
  return nil;
}

#pragma mark - Public methods

- (void)open:(id)args
{
  
}

- (void)abort:(id)args
{
  [httpRequest abort];
}

- (void)clearCookies:(id)args
{
  ENSURE_ARG_COUNT(args, 1);

  NSString *host = [TiUtils stringValue:[args objectAtIndex:0]];

  NSHTTPCookie *cookie;
  NSHTTPCookieStorage *storage = [NSHTTPCookieStorage sharedHTTPCookieStorage];
  NSArray *targetCookies = [storage cookiesForURL:[NSURL URLWithString:host]];
  if ([targetCookies count] > 0) {
    for (cookie in targetCookies) {
      [storage deleteCookie:cookie];
    }
  }
}

- (NSString *)getResponseHeader:(id)args
{
  ENSURE_SINGLE_ARG(args, NSString)
  return [[[self response] headers] valueForKey:args];
}

#pragma mark - Callback functions

- (void)request:(id)request onDataStream:(id)response
{
  if (hasOndatastream) {
    NSTimeInterval currentTime = [[NSDate date] timeIntervalSince1970];
    NSTimeInterval diff = currentTime - _downloadTime;
    if (_downloadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [response readyState] == APSHTTPResponseStateDone) {
      _downloadTime = 0;
      NSDictionary *eventDict = [NSMutableDictionary dictionary];
      float downloadProgress = [response downloadProgress];
      // return progress as -1 if it is outside the valid range
      if (downloadProgress > 1 || downloadProgress < 0) {
        downloadProgress = -1.0f;
      }
      [eventDict setValue:[NSNumber numberWithFloat:downloadProgress] forKey:@"progress"];
      [self fireCallback:@"ondatastream" withArg:eventDict withSource:self];
    }
    if (_downloadTime == 0) {
      _downloadTime = currentTime;
    }
  }
}

- (void)request:(id)request onSendStream:(id)response
{
  if (hasOnsendstream) {
    NSTimeInterval currentTime = [[NSDate date] timeIntervalSince1970];
    NSTimeInterval diff = currentTime - _uploadTime;
    if (_uploadTime == 0 || diff > TI_HTTP_REQUEST_PROGRESS_INTERVAL || [response readyState] == APSHTTPResponseStateDone) {
      _uploadTime = 0;
      NSDictionary *eventDict = [NSMutableDictionary dictionary];
      [eventDict setValue:[NSNumber numberWithFloat:[response uploadProgress]] forKey:@"progress"];
      [self fireCallback:@"onsendstream" withArg:eventDict withSource:self];
    }
    if (_uploadTime == 0) {
      _uploadTime = currentTime;
    }
  }
}

- (void)request:(id)request onLoad:(id)response
{
  [[TiApp app] stopNetwork];
  if ([request cancelled]) {
    [self forgetSelf];
    return;
  }
  NSInteger responseCode = [response status];
  /**
     *    Per customer request, successful communications that resulted in an
     *    4xx or 5xx response is treated as an error instead of an onload.
     *    For backwards compatibility, if no error handler is provided, even
     *    an 4xx or 5xx response will fall back onto an onload.
     */
  if (hasOnerror && (responseCode >= 400) && (responseCode <= 599)) {
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:responseCode message:@"HTTP error"];
    [event setObject:@"error" forKey:@"type"];
    [self fireCallback:@"onerror"
               withArg:event
            withSource:self
           withHandler:^(id result) {
             [self forgetSelf];
           }];
  } else if (hasOnload) {
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:0 message:nil];
    [event setObject:@"load" forKey:@"type"];
    [self fireCallback:@"onload"
               withArg:event
            withSource:self
           withHandler:^(id result) {
             [self forgetSelf];
           }];
  } else {
    [self forgetSelf];
  }
}

- (void)request:(id)request onError:(id)response
{
  [[TiApp app] stopNetwork];
  if ([request cancelled]) {
    [self forgetSelf];
    return;
  }
  if (hasOnerror) {
    NSError *error = [response error];
    NSMutableDictionary *event = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
    [event setObject:@"error" forKey:@"type"];
    [self fireCallback:@"onerror"
               withArg:event
            withSource:self
           withHandler:^(id result) {
             [self forgetSelf];
           }];
  } else {
    [self forgetSelf];
  }
}

- (void)request:(id)request onReadyStateChange:(id)response
{
  if (hasOnreadystatechange) {
    [self fireCallback:@"onreadystatechange" withArg:[NSDictionary dictionaryWithObjectsAndKeys:NUMINT(response.readyState), @"readyState", nil] withSource:self];
  }
}

- (void)request:(id)request onRedirect:(id)response
{
  if (hasOnredirect) {
    [self fireCallback:@"onredirect" withArg:nil withSource:self];
  }
}

#pragma mark - Public setters

- (void)setOnload:(id)callback
{
  ENSURE_SINGLE_ARG_OR_NIL(callback, KrollCallback)
      [self replaceValue:callback
                  forKey:@"onload"
            notification:NO];
  hasOnload = (callback == nil) ? NO : YES;
}
- (void)setOnerror:(id)callback
{
  ENSURE_SINGLE_ARG_OR_NIL(callback, KrollCallback)
      [self replaceValue:callback
                  forKey:@"onerror"
            notification:NO];
  hasOnerror = (callback == nil) ? NO : YES;
  ;
}
- (void)setOnreadystatechange:(id)callback
{
  ENSURE_SINGLE_ARG_OR_NIL(callback, KrollCallback)
      [self replaceValue:callback
                  forKey:@"onreadystatechange"
            notification:NO];
  hasOnreadystatechange = (callback == nil) ? NO : YES;
  ;
}
- (void)setOndatastream:(id)callback
{
  ENSURE_SINGLE_ARG_OR_NIL(callback, KrollCallback)
      [self replaceValue:callback
                  forKey:@"ondatastream"
            notification:NO];
  hasOndatastream = (callback == nil) ? NO : YES;
  ;
}
- (void)setOnsendstream:(id)callback
{
  ENSURE_SINGLE_ARG_OR_NIL(callback, KrollCallback)
      [self replaceValue:callback
                  forKey:@"onsendstream"
            notification:NO];
  hasOnsendstream = (callback == nil) ? NO : YES;
  ;
}
- (void)setOnredirect:(id)callback
{
  ENSURE_SINGLE_ARG_OR_NIL(callback, KrollCallback)
      [self replaceValue:callback
                  forKey:@"onredirect"
            notification:NO];
  hasOnredirect = (callback == nil) ? NO : YES;
  ;
}

- (void)setRequestHeader:(id)args
{
  ENSURE_ARG_COUNT(args, 2);
  if (httpRequest == nil) {
    NSLog(@"[ERROR] No request object found. Did you call open?");
    return;
  }
  NSString *key = [TiUtils stringValue:[args objectAtIndex:0]];
  NSString *value = [TiUtils stringValue:[args objectAtIndex:1]];

  if ([key isEqualToString:@"User-Agent"] && ![[[TiApp app] userAgent] isEqualToString:[[TiApp app] systemUserAgent]]) {
    NSLog(@"[WARN] You already specified a custom 'User-Agent' using Ti.userAgent. The user-agents will be concatenated.");
  }

  [httpRequest addRequestHeader:key value:value];
}

#pragma mark - Public getter properties

- (NSString *)allResponseHeaders
{
  NSDictionary *headers = [[self response] headers];
  NSMutableArray *array = [NSMutableArray array];
  for (NSString *key in headers) {
    [array addObject:[NSString stringWithFormat:@"%@:%@", key, [headers objectForKey:key]]];
  }
  return [array componentsJoinedByString:@"\n"];
}

- (NSString *)apiName
{
  return @"Ti.Network.HTTPClient";
}

- (NSNumber *)connected
{
  if ([self response] == nil) {
    return NUMBOOL(NO);
  }
  APSHTTPResponseState state = [[self response] readyState];
  return NUMBOOL(
      state == APSHTTPResponseStateHeaders || state == APSHTTPResponseStateLoading || state == APSHTTPResponseStateOpened);
}

- (NSNumber *)status
{
  return NUMINTEGER([[self response] status]);
}

- (NSString *)statusText
{
  if (([self response] != nil) && ([[self response] readyState] >= APSHTTPResponseStateHeaders)) {
    NSInteger status = [[self response] status];
    return [NSHTTPURLResponse localizedStringForStatusCode:status];
  }
  return nil;
}

- (NSString *)location
{
  if ([self response] == nil) {
    return [self valueForUndefinedKey:@"url"];
  }
  return [[self response] location];
}
- (NSString *)connectionType
{
  if ([self response] == nil) {
    return [self valueForUndefinedKey:@"method"];
  }
  return [[self response] connectionType];
}
- (NSString *)responseText
{
  return [[self response] responseString];
}
- (TiBlob *)responseData
{
  TiBlob *blob;
  if ([[self response] saveToFile]) {
    blob = [[TiBlob alloc] initWithFile:[[self response] filePath]];
  } else {
    NSString *contentType = [TiUtils stringValue:[[self responseHeaders] valueForKey:@"Content-Type"]];
    blob = [[TiBlob alloc] initWithData:[[self response] responseData] mimetype:contentType];
  }
  return [blob autorelease];
}
- (TiDOMDocumentProxy *)responseXML
{
  if ([self responseText] != nil && (![[self responseText] isEqual:(id)[NSNull null]])) {
    TiDOMDocumentProxy *responseXML = [[[TiDOMDocumentProxy alloc] _initWithPageContext:[self executionContext]] autorelease];
    [responseXML parseString:[self responseText]];
    return responseXML;
  }
  return nil;
}
- (NSDictionary *)responseDictionary
{
  return [[self response] responseDictionary];
}
- (NSArray *)responseArray
{
  return [[self response] responseArray];
}
- (NSNumber *)readyState
{
  return NUMINT([[self response] readyState]);
}
- (NSDictionary *)responseHeaders
{
  return [[self response] headers];
}

MAKE_SYSTEM_NUMBER(UNSENT, NUMINT(APSHTTPResponseStateUnsent))
MAKE_SYSTEM_NUMBER(OPENED, NUMINT(APSHTTPResponseStateOpened))
MAKE_SYSTEM_NUMBER(HEADERS_RECEIVED, NUMINT(APSHTTPResponseStateHeaders))
MAKE_SYSTEM_NUMBER(LOADING, NUMINT(APSHTTPResponseStateLoading))
MAKE_SYSTEM_NUMBER(DONE, NUMINT(APSHTTPResponseStateDone))

@end

#endif
#endif
