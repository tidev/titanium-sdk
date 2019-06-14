/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

/*
 // http://stackoverflow.com/a/1072659/795295
 var cookie = Ti.Network.createCookie({
    domain : 'example.com',
    name   : 'test_cookie',
    value  : '12',
    path   : '/'
 });

 // check!
 alert(cookie.isValid());
 */

#include "TiNetworkCookieProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiNetworkCookieProxy

- (void)dealloc
{
  RELEASE_TO_NIL(_cookieDict);
  [super dealloc];
}
- (id)initWithCookie:(NSHTTPCookie *)cookie andPageContext:(id<TiEvaluator>)context
{
  if (self = [super _initWithPageContext:context]) {
    [self setIsHTTPOnly:[cookie isHTTPOnly]];
    _cookieDict = [[NSMutableDictionary dictionaryWithDictionary:[cookie properties]] retain];
  }
  return self;
}
- (NSMutableDictionary *)cookieDict
{
  if (_cookieDict == nil) {
    _cookieDict = [[NSMutableDictionary alloc] init];
  }
  return _cookieDict;
}
- (void)setCookieValue:(id)value forKey:(NSString *)key
{
  if (value == nil || [value isEqual:[NSNull null]]) {
    [[self cookieDict] removeObjectForKey:key];
  } else {
    [[self cookieDict] setObject:value forKey:key];
  }
}

- (id)cookieValue:(NSString *)val
{
  return [[self cookieDict] valueForKey:val];
}
- (NSHTTPCookie *)newCookie
{
  return [[NSHTTPCookie cookieWithProperties:[self cookieDict]] retain];
}
- (NSString *)apiName
{
  return @"Ti.Network.Cookie";
}
- (NSNumber *)isValid:(id)args
{
  return NUMBOOL([[self newCookie] autorelease] != nil);
}
- (NSString *)name
{
  return [self cookieValue:NSHTTPCookieName];
}
- (void)setName:(id)args
{
  [self setCookieValue:[TiUtils stringValue:args] forKey:NSHTTPCookieName];
}
- (NSString *)comment
{
  return [self cookieValue:NSHTTPCookieComment];
}
- (void)setComment:(id)args
{
  [self setCookieValue:[TiUtils stringValue:args] forKey:NSHTTPCookieComment];
}
- (NSString *)domain
{
  return [self cookieValue:NSHTTPCookieDomain];
}
- (void)setDomain:(id)args
{
  [self setCookieValue:[TiUtils stringValue:args] forKey:NSHTTPCookieDomain];
}
- (NSDate *)expiryDate
{
  return [self cookieValue:NSHTTPCookieExpires];
}
- (void)setExpiryDate:(id)args
{
  NSDate *date;
  if ([args isKindOfClass:[NSDate class]]) {
    date = (NSDate *)args;
  } else {
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    [dateFormat setDateFormat:@"yyyy-MM-dd'T'HH:mm:ss'.'SSS+0000"];
    date = [dateFormat dateFromString:[TiUtils stringValue:args]];
    RELEASE_TO_NIL(dateFormat);
  }
  [self setCookieValue:date forKey:NSHTTPCookieExpires];
}
- (NSString *)path
{
  return [self cookieValue:NSHTTPCookiePath];
}
- (void)setPath:(id)args
{
  [self setCookieValue:[TiUtils stringValue:args] forKey:NSHTTPCookiePath];
}
- (NSString *)value
{
  return [self cookieValue:NSHTTPCookieValue];
}
- (void)setValue:(id)args
{
  [self setCookieValue:[TiUtils stringValue:args] forKey:NSHTTPCookieValue];
}
- (NSNumber *)httponly
{
  return NUMBOOL([self isHTTPOnly]);
}
- (void)setHttponly:(id)args
{
  // not used
}
- (NSNumber *)secure
{
  return NUMBOOL([self cookieValue:NSHTTPCookieSecure] != nil);
}
- (void)setSecure:(id)args
{
  BOOL v = [TiUtils boolValue:args def:NO];
  NSString *val = v ? @"TRUE" : nil;
  [self setCookieValue:val forKey:NSHTTPCookieSecure];
}
- (NSString *)version
{
  return [self cookieValue:NSHTTPCookieVersion];
}
- (void)setVersion:(id)args
{
  [self setCookieValue:[TiUtils stringValue:args] forKey:NSHTTPCookieVersion];
}
- (NSString *)originalUrl
{
  return [self cookieValue:NSHTTPCookieOriginURL];
}
- (void)setOriginalUrl:(id)args
{
  [self setCookieValue:[TiUtils stringValue:args] forKey:NSHTTPCookieOriginURL];
}

@end
