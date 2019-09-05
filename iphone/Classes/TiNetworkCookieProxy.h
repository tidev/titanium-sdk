/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <TitaniumKit/TiProxy.h>

@interface TiNetworkCookieProxy : TiProxy {
  NSMutableDictionary *_cookieDict;
}

@property (nonatomic) BOOL isHTTPOnly;
- (id)initWithCookie:(NSHTTPCookie *)cookie andPageContext:(id<TiEvaluator>)context;
- (NSHTTPCookie *)newCookie;
@end
