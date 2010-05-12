/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_YAHOO

#import "YahooModule.h"
#import "ASIHTTPRequest.h"
#include <CommonCrypto/CommonHMAC.h>
#include "Base64Transcoder.h"
#import "SBJSON.h"
#import "TiApp.h"

#ifdef YQL_OAUTH
const NSString *apiEndpoint = @"http://query.yahooapis.com/v1/yql?format=json";
#else
const NSString *apiEndpoint = @"http://query.yahooapis.com/v1/public/yql?format=json&env=http%3A%2F%2Fdatatables.org%2Falltables.env";
#endif

@implementation YQLCallback

-(id)initWithCallback:(KrollCallback*)callback_ module:(YahooModule*)module_
{
	if (self = [super init])
	{
		callback = [callback_ retain];
		module = [module_ retain];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(callback);
	RELEASE_TO_NIL(module);
	[super dealloc];
}

#pragma mark Delegates

- (void)requestFinished:(ASIHTTPRequest *)request
{
	[[TiApp app] stopNetwork];
	
	NSString *responseString = [request responseString];
	SBJSON *json = [[[SBJSON alloc] init] autorelease];
	NSError *error = nil;
	id result = [json objectWithString:responseString error:&error];
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	if (error==nil)
	{
		[event setObject:NUMBOOL(YES) forKey:@"success"];
		[event setObject:[[result objectForKey:@"query"] objectForKey:@"results"] forKey:@"data"];
	}
	else
	{
		[event setObject:NUMBOOL(NO) forKey:@"success"];
		[event setObject:[error description] forKey:@"message"];
	}
	[module _fireEventToListener:@"yql" withObject:event listener:callback thisObject:nil];
	[self autorelease];
}

- (void)requestFailed:(ASIHTTPRequest *)request
{
	[[TiApp app] stopNetwork];
	
	NSError *error = [request error];
	NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO),@"success",[error description],@"message",nil];
	[module _fireEventToListener:@"yql" withObject:event listener:callback thisObject:nil];
	[self autorelease];
}

@end


@implementation YahooModule

-(void)dealloc
{
	[super dealloc];
}

-(NSString*)encode:(NSString*)str
{
	NSString *result = (NSString *)CFURLCreateStringByAddingPercentEscapes(kCFAllocatorDefault,
                                                                           (CFStringRef)str,
                                                                           NULL, CFSTR("!*'();:@&=+$,/?%#[]"),
                                                                           kCFStringEncodingUTF8);
    [result autorelease];
	return result;
}

#ifdef YQL_OAUTH	
-(NSString *)nonce
{	
	NSString *nonce = nil;
	CFUUIDRef generatedUUID = CFUUIDCreate(kCFAllocatorDefault);
	nonce = (NSString*)CFUUIDCreateString(kCFAllocatorDefault, generatedUUID);
	CFRelease(generatedUUID);
	
	return [nonce autorelease];
}

-(NSString *)timestamp
{
	return [NSString stringWithFormat:@"%d", time(NULL)];
}

-(NSString*)hmac:(NSString*)key_ data:(NSString*)data_
{
	NSData *secretData = [key_ dataUsingEncoding:NSUTF8StringEncoding];
    NSData *clearTextData = [data_ dataUsingEncoding:NSUTF8StringEncoding];
	
    uint8_t digest[CC_SHA1_DIGEST_LENGTH] = {0};
	
	CCHmacContext hmacContext;
    CCHmacInit(&hmacContext, kCCHmacAlgSHA1, secretData.bytes, secretData.length);
    CCHmacUpdate(&hmacContext, clearTextData.bytes, clearTextData.length);
    CCHmacFinal(&hmacContext, digest);
    
    //Base64 Encoding
    char base64Result[32];
    size_t theResultLength = 32;
    Base64EncodeData(digest, CC_SHA1_DIGEST_LENGTH, base64Result, &theResultLength);
    NSData *theData = [NSData dataWithBytes:base64Result length:theResultLength];
    
	return [[[NSString alloc] initWithData:theData encoding:NSUTF8StringEncoding] autorelease];
}
#endif

-(void)setOAuthParameters:(id)args
{
#ifdef YQL_OAUTH	
	RELEASE_TO_NIL(key);
	RELEASE_TO_NIL(secret);
	key = [[TiUtils stringValue:[args objectAtIndex:0]] retain];
	secret = [[TiUtils stringValue:[args objectAtIndex:1]] retain];
#endif
}

-(void)yql:(id)args
{
	ENSURE_ARG_COUNT(args,2);

	NSString *apiQuery = [args objectAtIndex:0];
	KrollCallback *callback = [args objectAtIndex:1];
	
	ENSURE_TYPE(callback,KrollCallback);

#ifdef YQL_OAUTH	
	int location = [apiEndpoint rangeOfString:@"?"].location;
	NSString *url = [apiEndpoint substringToIndex:location];
	NSString *theHeader = [apiEndpoint substringFromIndex:location+1];
	
	NSMutableString *theBody = [[NSMutableString alloc] init];
	[theBody appendFormat:@"&oauth_consumer_key=%@",key];
	[theBody appendFormat:@"&oauth_nonce=%@",[self nonce]];
	[theBody appendString:@"&oauth_signature_method=HMAC-SHA1"];
	[theBody appendFormat:@"&oauth_timestamp=%@",[self timestamp]];
	[theBody appendString:@"&oauth_version=1.0"];
	[theBody appendFormat:@"&q=%@",[self encode:apiQuery]];
	
	NSString *theData = [NSString stringWithFormat:@"GET&%@&%@%@",[self encode:url],[self encode:theHeader],[self encode:theBody]];
	NSString *theSig = [self hmac:[NSString stringWithFormat:@"%@&",secret] data:theData];
	NSString *theurl = [NSString stringWithFormat:@"%@%@&oauth_signature=%@",apiEndpoint,theBody,[self encode:theSig]];
	
	[theBody release];
#else
	NSString *theurl = [NSString stringWithFormat:@"%@&q=%@",apiEndpoint,[self encode:apiQuery]];
#endif
	
	YQLCallback *job = [[YQLCallback alloc] initWithCallback:callback module:self];
	ASIHTTPRequest *req = [ASIHTTPRequest requestWithURL:[NSURL URLWithString:theurl]];
	[req addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
	[[TiApp app] startNetwork];
	[req setDelegate:job];
	[req startAsynchronous];
}

@end

#endif