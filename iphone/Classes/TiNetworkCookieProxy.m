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
#include "TiUtils.h"

@implementation TiNetworkCookieProxy

-(void)dealloc
{
    RELEASE_TO_NIL(_cookie);
    RELEASE_TO_NIL(_cookieDict);
    [super dealloc];
}
-(id)initWithCookie:(NSHTTPCookie*)cookie andPageContext:(id<TiEvaluator>)context
{
    if(self = [super _initWithPageContext:context])
    {
        _cookie = [cookie retain];
    }
    return self;
}

-(NSMutableDictionary *)cookieDictionary
{
    if(_cookieDict == nil) {
        _cookieDict = [[NSMutableDictionary alloc] init];
    }
    return _cookieDict;
}

-(NSDictionary*)mergeDictionaryWithCookie
{
    // Check if we have a real cookie, otherwise return the custom cookie
    if(_cookie == nil) {
        return [self cookieDictionary];
    }
    // Get the cookie's dictionary and replace whatever value we have set.
    NSMutableDictionary *dict = [[_cookie properties] mutableCopy];
    for(NSString* key in [self cookieDictionary])
    {
        [dict setValue:[[self cookieDictionary] valueForKey:key] forKey:key];
    }
    return [dict autorelease];
}

-(id)cookieValue:(NSString*)val
{
    // In case we are creating a new cookie, get the values from the custom cookie dictionary
    if(_cookieDict != nil && [_cookieDict valueForKey:val]) {
        return [_cookieDict valueForKey:val];
    }
    // If the above is not available, try to get the value of the real cookie
    if(_cookie != nil) {
        return [[_cookie properties] valueForKey:val];
    }
    // Meh... fail
    return nil;
}

-(NSHTTPCookie*)newCookie
{
    NSDictionary *dict = [self mergeDictionaryWithCookie];
    return [NSHTTPCookie cookieWithProperties:dict];
}

-(NSNumber*)isValid:(id)args
{
    return NUMBOOL([self newCookie] != nil);
}
-(NSString*)name
{
	return [self cookieValue: NSHTTPCookieName];
}
- (void)setName:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils stringValue:args] forKeyPath:NSHTTPCookieName];
}
- (NSString*)comment
{
	return [self cookieValue: NSHTTPCookieComment];
}
- (void)setComment:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils stringValue:args] forKeyPath:NSHTTPCookieComment];

}
- (NSString*)domain
{
	return [self cookieValue: NSHTTPCookieDomain];
}
- (void)setDomain:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils stringValue:args] forKeyPath:NSHTTPCookieDomain];

}
- (NSDate*)expiryDate
{
	return [self cookieValue: NSHTTPCookieExpires];
}
- (void)setExpiryDate:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils dateForUTCDate:args] forKeyPath:NSHTTPCookieExpires];

}
- (NSString*)path
{
	return [self cookieValue: NSHTTPCookiePath];
}
- (void)setPath:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils stringValue:args] forKeyPath:NSHTTPCookiePath];

}
- (NSString*)value
{
	return [self cookieValue: NSHTTPCookieValue];
}
- (void)setValue:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils stringValue:args] forKeyPath:NSHTTPCookieValue];
}
- (NSNumber*)httponly
{
    if(_cookie == nil) {
        return nil;
    }
	return NUMBOOL([_cookie isHTTPOnly]);
}
- (NSNumber*)secure
{
	return NUMBOOL([self cookieValue: NSHTTPCookieSecure]);
}
- (void)setSecure:(id)args
{
    BOOL v = [TiUtils boolValue:args def:NO];
    NSString* val = v ? @"1" : @"0";
    [[self cookieDictionary] setValue:val forKeyPath:NSHTTPCookieSecure];
}
- (NSNumber*)version
{
	return NUMINT([self cookieValue: NSHTTPCookieVersion]);
}
- (void)setVersion:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils stringValue:args] forKeyPath:NSHTTPCookieVersion];
}

- (void)setOriginalUrl:(id)args
{
    [[self cookieDictionary] setValue:[TiUtils stringValue:args] forKeyPath:NSHTTPCookieOriginURL];
}

- (NSString*)originalUrl
{
	return [self cookieValue: NSHTTPCookieOriginURL];
}

@end