/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import "TiBase.h"
#import "XHRBridge.h"
#import "TiHost.h"
#import "TiProxy.h"
#import "SBJSON.h"
#import "TiModule.h"
#import "Mimetypes.h"

static XHRBridge *xhrBridge = nil;

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

-(void)handleAppToTiRequest
{
	id<NSURLProtocolClient> client = [self client];
    NSURLRequest *request = [self request];
	NSURL *url = [request URL];

	NSArray *parts = [[[url path] substringFromIndex:1] componentsSeparatedByString:@"/"];
	NSString *pageToken = [[parts objectAtIndex:0] stringByReplacingOccurrencesOfString:@"_TiA0_" withString:@""];
	NSString *module = [parts objectAtIndex:1];
	NSString *method = [parts objectAtIndex:2];
	NSString *prearg = [url query];
	NSString *arguments = prearg==nil ? @"" : [prearg stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
	
	
	SBJSON *decoder = [[[SBJSON alloc] init] autorelease];
	NSError *error = nil;
	NSDictionary *event = [decoder fragmentWithString:arguments error:&error];
	
	id<TiEvaluator> context = [[xhrBridge host] contextForToken:pageToken];
	TiModule *tiModule = (TiModule*)[[xhrBridge host] moduleNamed:module context:context];
	[tiModule setExecutionContext:context];
	
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
	
	NSData *data = executed ? [NSData data] : nil;
	
	if (data!=nil)
	{
		NSURLCacheStoragePolicy caching = NSURLCacheStorageNotAllowed;
		NSHTTPURLResponse *response = [[NSHTTPURLResponse alloc] initWithURL:url MIMEType:@"text/plain" expectedContentLength:[data length] textEncodingName:@"utf-8"];
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

- (void)startLoading
{
	id<NSURLProtocolClient> client = [self client];
    NSURLRequest *request = [self request];
	NSURL *url = [request URL];
	
	// check to see if this is a bridge request through a webview
	if ([[url path] hasPrefix:@"/_TiA0_"])
	{
		[self handleAppToTiRequest];
		return;
	}

#ifdef DEBUG	
	NSLog(@"[DEBUG] app protocol, loading: %@",url);
#endif
		
	// see if it's a compiled resource
	NSData *data = [TiUtils loadAppResource:url];
	if (data==nil)
	{
		// check to see if it's a local resource in the bundle, could be
		// a bundled image, etc. - or we could be running from XCode :)
		NSString *urlpath = [url path];
		if ([urlpath characterAtIndex:0]=='/')
		{
			if ([[NSFileManager defaultManager] fileExistsAtPath:urlpath])
			{
				data = [[[NSData alloc] initWithContentsOfFile:urlpath] autorelease];
			}
		}
		if (data==nil)
		{
			NSString *resourceurl = [[NSBundle mainBundle] resourcePath];
			NSString *path = [NSString stringWithFormat:@"%@%@",resourceurl,urlpath];
			data = [[[NSData alloc] initWithContentsOfFile:path] autorelease];
		}
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
	[AppProtocolHandler registerSpecialProtocol];
}

-(void)shutdown
{
}

-(void)gc
{
}

@end

#endif