//
//  TiNetworkCookieProxy.h
//  Titanium
//
//  Created by Pedro Enrique on 3/11/14.
//
//


#import "TiProxy.h"

@interface TiNetworkCookieProxy : TiProxy
{
    NSHTTPCookie *_cookie;
    NSMutableDictionary *_cookieDict;
}

-(id)initWithCookie:(NSHTTPCookie*)cookie andPageContext:(id<TiEvaluator>)context;
-(NSHTTPCookie*)newCookie;
@end