/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiBase.h"
#import "XHRBridge.h"
#import "TiHost.h"
#import "TiProxy.h"
#import "SBJSON.h"
#import "TiModule.h"
#import "Mimetypes.h"

static XHRBridge *xhrBridge = nil;

@implementation TiProtocolHandler

+ (NSString*) specialProtocolScheme 
{
	return @"ti";
}

+ (void) registerSpecialProtocol 
{
	static BOOL inited = NO;
	if ( ! inited ) 
	{
		[NSURLProtocol registerClass:[TiProtocolHandler class]];
		inited = YES;
	}
}

+ (BOOL)canInitWithRequest:(NSURLRequest *)theRequest 
{
	NSString *theScheme = [[theRequest URL] scheme];
	return [theScheme isEqual:[self specialProtocolScheme]];
}

+ (BOOL)requestIsCacheEquivalent:(NSURLRequest *)a toRequest:(NSURLRequest *)b;
{
	return [super requestIsCacheEquivalent:a toRequest:b];
}

+(NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request 
{
    return request;
}

- (void)startLoading
{
	id<NSURLProtocolClient> client = [self client];
    NSURLRequest *request = [self request];
	NSURL *url = [request URL];

	NSString *pageToken = [url host];
	NSArray *parts = [[[url path] substringFromIndex:1] componentsSeparatedByString:@"/"];
	NSString *module = [parts objectAtIndex:0];
	NSString *method = [parts objectAtIndex:1];
	NSString *prearg = [parts objectAtIndex:2];
	NSString *arguments = prearg==nil ? @"" : [prearg stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
	
	
	SBJSON *decoder = [[[SBJSON alloc] init] autorelease];
	NSError *error = nil;
	NSDictionary *event = [decoder fragmentWithString:arguments error:&error];
	
	TiModule *tiModule = (TiModule*)[[xhrBridge host] moduleNamed:module];
	[tiModule setExecutionContext:[[xhrBridge host] contextForToken:pageToken]];
	
	BOOL executed = YES;
	
	NSString *name = [event objectForKey:@"name"];
	if ([method isEqualToString:@"fireEvent"])
	{
		[tiModule fireEvent:name withObject:[event objectForKey:@"event"]];  
	}
	else if ([method isEqualToString:@"addEventListener"])
	{
		id listenerid = [event objectForKey:@"id"];
		[tiModule addEventListener:[NSArray arrayWithObjects:name,listenerid,nil]];
	}
	else if ([method isEqualToString:@"removeEventListener"])
	{
		id listenerid = [event objectForKey:@"id"];
		[tiModule removeEventListener:[NSArray arrayWithObjects:name,listenerid,nil]];
	}
	else if ([method isEqualToString:@"log"])
	{
		NSString *level = [event objectForKey:@"level"];
		NSString *message = [event objectForKey:@"message"];
		[tiModule performSelector:@selector(log:) withObject:[NSArray arrayWithObjects:level,message,nil]];
	}
	else
	{
		executed = NO;
	}
	
	NSData *data = executed ? [[NSString stringWithFormat:@"{'success':true}"] dataUsingEncoding:NSUTF8StringEncoding] : nil;
	
	if (data!=nil)
	{
		NSURLCacheStoragePolicy caching = NSURLCacheStorageNotAllowed;
		NSURLResponse *response = [[NSURLResponse alloc] initWithURL:url MIMEType:@"text/javascript" expectedContentLength:[data length] textEncodingName:@"utf-8"];
		[client URLProtocol:self didReceiveResponse:response cacheStoragePolicy:caching];
		[client URLProtocol:self didLoadData:data];
		[client URLProtocolDidFinishLoading:self];
		[response release];
	}
	else 
	{
		NSLog(@"[ERROR] Error loading %@",url);
		[client URLProtocol:self didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorResourceUnavailable userInfo:nil]];
		[client URLProtocolDidFinishLoading:self];
	}
}

- (void)stopLoading 
{
}

@end


@implementation AppProtocolHandler

+ (NSString*) specialProtocolScheme 
{
	return @"app";
}

+ (void) registerSpecialProtocol 
{
	static BOOL inited = NO;
	if ( ! inited ) 
	{
		[NSURLProtocol registerClass:[AppProtocolHandler class]];
		inited = YES;
	}
}

+ (BOOL)canInitWithRequest:(NSURLRequest *)theRequest 
{
	NSString *theScheme = [[theRequest URL] scheme];
	return [theScheme isEqual:[self specialProtocolScheme]];
}

+ (BOOL)requestIsCacheEquivalent:(NSURLRequest *)a toRequest:(NSURLRequest *)b;
{
	return [super requestIsCacheEquivalent:a toRequest:b];
}

+(NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request 
{
    return request;
}

- (void)startLoading
{
	id<NSURLProtocolClient> client = [self client];
    NSURLRequest *request = [self request];
	NSURL *url = [request URL];
	
#ifdef DEBUG	
	NSLog(@"[DEBUG] app protocol, loading: %@",url);
#endif
	
	// see if it's a compiled resource
	NSData *data = [TiUtils loadAppResource:url];
	if (data==nil)
	{
		// check to see if it's a local resource in the bundle, could be
		// a bundled image, etc. - or we could be running from XCode :)
		NSString *resourceurl = [[NSBundle mainBundle] resourcePath];
		NSString *path = [NSString stringWithFormat:@"%@%@",resourceurl,[url path]];
		data = [[[NSData alloc] initWithContentsOfFile:path] autorelease];
	}
	
	if (data!=nil)
	{
		NSURLCacheStoragePolicy caching = NSURLCacheStorageAllowedInMemoryOnly;
		NSString *mime = [Mimetypes mimeTypeForExtension:[url path]];
		NSURLResponse *response = [[NSURLResponse alloc] initWithURL:url MIMEType:mime expectedContentLength:[data length] textEncodingName:@"utf-8"];
		[client URLProtocol:self didReceiveResponse:response cacheStoragePolicy:caching];
		[client URLProtocol:self didLoadData:data];
		[client URLProtocolDidFinishLoading:self];
		[response release];
	}
	else 
	{
		NSLog(@"[ERROR] Error loading %@",url);
		[client URLProtocol:self didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorResourceUnavailable userInfo:nil]];
		[client URLProtocolDidFinishLoading:self];
	}
}

- (void)stopLoading 
{
}

@end

@implementation XHRBridge

-(id)init
{
	if (self = [super init])
	{
		xhrBridge = self;
	}
	return self;
}

-(void)boot:(id)callback url:(NSURL*)url preload:(NSDictionary*)preload
{
	[TiProtocolHandler registerSpecialProtocol];
	[AppProtocolHandler registerSpecialProtocol];
}

-(void)shutdown
{
}

-(void)gc
{
}

@end
