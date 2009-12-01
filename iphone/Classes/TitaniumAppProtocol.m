/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TitaniumAppProtocol.h"
#import "TitaniumHost.h"
#import "NSData+Additions.h"
#import "TitaniumBlobWrapper.h"

#import "Logging.h"

const NSString * htmlMimeType = @"text/html";
const NSString * textMimeType = @"text/plain";
const NSString * jpegMimeType = @"image/jpeg";

NSDictionary * mimeTypeFromExtensionDict = nil;
id<TitaniumAppAssetResolver> resolver = nil;

@implementation TitaniumAppProtocol

+ (NSString*) specialProtocolScheme 
{
	return @"app";
}

+ (void) registerSpecialProtocol 
{
	static BOOL inited = NO;
	if ( ! inited ) 
	{
		[NSURLProtocol registerClass:[TitaniumAppProtocol class]];
		inited = YES;
	}
}

+ (BOOL)canInitWithRequest:(NSURLRequest *)theRequest 
{
	NSString *theScheme = [[theRequest URL] scheme];
	return [theScheme isEqual:@"app"];
}

+ (BOOL)requestIsCacheEquivalent:(NSURLRequest *)a toRequest:(NSURLRequest *)b;
{
	BOOL result = [super requestIsCacheEquivalent:a toRequest:b];
	VERBOSE_LOG(@"[DEBUG] We're returning %d for if %@ == %@",result,a,b);
	return result;
}

+ (NSString*)getPath:(NSURL*)url
{
	NSString *s = [url path];
	
	// this happens when the app uses a resource like app://foo.html
	// in which we need to assume that the hostname is the actual 
	// path we need to use
	if (!s || [s isEqual:@""])
	{
		s = [NSString stringWithFormat:@"/%@",[url host]];
	}
	else
	{
		if (![[url host] isEqual:[[TitaniumHost sharedHost] appID]])
		{
			// this means we have multiple paths and the first part of the path
			// is sitting in the host field
			s = [NSString stringWithFormat:@"%@/%@",[url host],[url path]];
		}
		else
		{
			if (![s hasPrefix:@"/"])
			{
				s = [NSString stringWithFormat:@"/%@",s];
			}
		}
	}
	return s;
}
+(NSURL*)normalizeURL:(NSURL*)url
{
	NSString * resourceSpecifier = [url resourceSpecifier];
	if ([resourceSpecifier hasPrefix:@"//"]){
		resourceSpecifier = [resourceSpecifier substringFromIndex:2];
	}
	NSString * theAppID = [[TitaniumHost sharedHost] appID];

	if (![resourceSpecifier hasPrefix:theAppID]){
		resourceSpecifier = [theAppID stringByAppendingPathComponent:resourceSpecifier];
	}
	NSString * resultingPath = [NSString stringWithFormat:@"%@://%@",[url scheme],resourceSpecifier];
	
	return [NSURL URLWithString:resultingPath];
}

+(NSURLRequest *)canonicalRequestForRequest:(NSURLRequest *)request 
{
    return request;
}

+ (NSString *)mimeTypeFromExtension:(NSString *)ext
{
	if (mimeTypeFromExtensionDict == nil){
		mimeTypeFromExtensionDict = [[NSDictionary alloc] initWithObjectsAndKeys:
				@"image/png",@"png",@"image/gif",@"gif",
				jpegMimeType,@"jpeg",jpegMimeType,@"jpg",
				@"image/x-icon",@"ico",
				htmlMimeType,@"html",htmlMimeType,@"htm",
				textMimeType,@"text",textMimeType,@"txt",
				@"text/json",@"json",					 
				@"text/javascript",@"js",
				@"text/css",@"css",
				@"text/xml",@"xml",nil];
	}
	
	NSString *result=[mimeTypeFromExtensionDict objectForKey:[ext pathExtension]];
	if (result == nil){
		result = @"application/octet-stream";
	}
	return result;
}

- (void)startLoading
{
	CLOCKSTAMP("Start loading (%@)",[self request]);
	TitaniumHost * theHost = [TitaniumHost sharedHost];

    id<NSURLProtocolClient> client = [self client];
    NSURLRequest *request = [self request];
	NSURL *url = [TitaniumAppProtocol normalizeURL:[request URL]];

	NSString * path;

	const NSString *mime = nil;
	NSError *error = nil;
	NSData *data = nil;
	NSString *dataString = nil;
	NSURLCacheStoragePolicy caching = NSURLCacheStorageAllowedInMemoryOnly;
	
	TitaniumAppResourceType ourType = [theHost appResourceTypeForUrl:url];
	NSString * resourcePath;

	VERBOSE_LOG(@"[DEBUG] loading request for url = %@, type = %d", url, ourType);

	if (ourType==TitaniumAppResourceFileType)
	{
		NSData *fileData = [resolver resolveAppAsset:url];
		if (fileData==nil && resolver==nil)
		{
			NSString *path=[[NSBundle mainBundle] bundlePath];
			NSString *urlpath = [url path];
			if ([urlpath hasPrefix:@"/"])
			{
				urlpath = [urlpath substringFromIndex:1];
			}
			NSString *fullpath = [NSString stringWithFormat:@"%@/%@",path,urlpath];
			fileData = [NSData dataWithContentsOfFile:fullpath options:NSMappedRead error:&error];
		}
		if (fileData!=nil)
		{
			mime = [TitaniumAppProtocol mimeTypeFromExtension:[url path]];
			if ([mime isEqualToString:(NSString*)htmlMimeType])
			{
				data = [NSMutableData dataWithCapacity:[fileData length] + 4000];
				// INJECT content type at the top of the document so that webkit will detect it correctly
				[(NSMutableData *)data appendData:[@"<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">" dataUsingEncoding:NSUTF8StringEncoding]];
				// we can just be lazy here and inject the titanium JS before the HTML...it works. thanks to forgiving HTML parser
				[(NSMutableData *)data appendData:[[theHost javaScriptForResource:url] dataUsingEncoding:NSUTF8StringEncoding]];
				// now just inject the real data
				[(NSMutableData *)data appendData:fileData];
			}
			else
			{
				data = fileData;
			}
		}
	}
	
	if (data==nil)
	{
		switch (ourType) {
			case TitaniumAppResourceNoType:
				data = [@"<html></html>" dataUsingEncoding:NSUTF8StringEncoding];
				mime = textMimeType;
				break;
			case TitaniumAppResourceFileType:
				path = [url path];
				mime = [TitaniumAppProtocol mimeTypeFromExtension:path];
				resourcePath = [[theHost appResourcesPath] stringByAppendingPathComponent:path];
				if ([mime isEqualToString:(NSString*)htmlMimeType])
				{
					NSData *fileData = [NSData dataWithContentsOfFile:resourcePath options:NSMappedRead error:&error];
					data = [NSMutableData dataWithCapacity:[fileData length] + 4000];
					// INJECT content type at the top of the document so that webkit will detect it correctly
					[(NSMutableData *)data appendData:[@"<META HTTP-EQUIV=\"Content-Type\" CONTENT=\"text/html; charset=UTF-8\">" dataUsingEncoding:NSUTF8StringEncoding]];
					// we can just be lazy here and inject the titanium JS before the HTML...it works. thanks to forgiving HTML parser
					[(NSMutableData *)data appendData:[[theHost javaScriptForResource:url] dataUsingEncoding:NSUTF8StringEncoding]];
					// now just inject the real data
					[(NSMutableData *)data appendData:fileData];
				} 
				else 
				{
					data = [NSData dataWithContentsOfFile:resourcePath options:NSMappedRead error:&error];
				}
				break;
			case TitaniumAppResourceRandomFileType:
				path = [[url path] substringFromIndex:8]; // To remove the '/_TIFILE'
				mime = [TitaniumAppProtocol mimeTypeFromExtension:path];
				data = [NSData dataWithContentsOfFile:path options:NSUncachedRead error:&error];
				VERBOSE_LOG(@"[DEBUG] Loading %X for %@",data,url);
				caching = NSURLCacheStorageNotAllowed;
				break;
			case TitaniumAppResourceWindowBindingType:
				path = [url path];
				NSArray * pathParts = [path componentsSeparatedByString:@"/"];
				if([pathParts count]>3){
					NSString * contextToken = [pathParts objectAtIndex:2];
					NSString * windowToken = [pathParts objectAtIndex:3];
					TitaniumWebViewController *ourWebView = (TitaniumWebViewController*)[[TitaniumHost sharedHost] titaniumContentViewControllerForToken:windowToken];
					[ourWebView acceptToken:contextToken forContext:@"window"];
//					NSLog(@"[DEBUG] Path parts,%@",pathParts);
					data = [NSData data];
				}
				break;
			case TitaniumAppResourceDoMethodType:{
				NSString * argumentString = [[request allHTTPHeaderFields] objectForKey:@"Arguments"];
//				NSString * argumentString = [NSString stringWithFormat:@"%@",[[url query] stringByReplacingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
				dataString = [theHost doTitaniumMethod:url withArgumentString:argumentString];
				if (dataString != nil) {
					data = [dataString dataUsingEncoding:NSUTF8StringEncoding];
				} else {
					data = [NSData data];
				}
				mime = textMimeType;
				caching = NSURLCacheStorageNotAllowed;
				break;
			}
			case TitaniumAppResourceCommandType:
			case TitaniumAppResourceContinueType:
				dataString = [theHost performFunction:url];
				if (dataString != nil) {
					data = [dataString dataUsingEncoding:NSUTF8StringEncoding];
				} else {
					data = [NSData data];
				}
				mime = textMimeType;
				caching = NSURLCacheStorageNotAllowed;
				break;
			case TitaniumAppResourceBlobType:
				path = [url path];
				TitaniumBlobWrapper * responseBlob = [theHost blobForToken:[path lastPathComponent]];
				data = [responseBlob dataBlob];
				mime = [responseBlob mimeType];
				caching = NSURLCacheStorageNotAllowed;
				break;
			default:
				NSLog(@"[ERROR] Url %@ was not understood? It had a resourceType of %x",url,ourType);
				break;
		}
	}
	
	if (data == nil)
	{
		if (ourType == TitaniumAppResourceFileType)
		{
			data = [[NSString stringWithFormat:@"<html><body bgcolor='white'><div style='margin-top:25px;'><h1>Page not found</h1>Error loading url: %@</div></body></html>",url] dataUsingEncoding:NSUTF8StringEncoding];
			mime = htmlMimeType;
		}
		else 
		{
			[client URLProtocol:self didFailWithError:[NSError errorWithDomain:NSURLErrorDomain code:NSURLErrorResourceUnavailable userInfo:nil]];
			[client URLProtocolDidFinishLoading:self];
			CLOCKSTAMP("Error loading %@",url);
			return;
		}
	}
	
	CLOCKSTAMP("Returning response for %@",url);
	NSURLResponse *response = [[NSURLResponse alloc] initWithURL:url MIMEType:(NSString*)mime expectedContentLength:[data length] textEncodingName:nil];
	[client URLProtocol:self didReceiveResponse:response cacheStoragePolicy:caching];
	[client URLProtocol:self didLoadData:data];
	[client URLProtocolDidFinishLoading:self];
	[response release];
	CLOCKSTAMP("Returned response for %@",url);
}

- (void)stopLoading 
{
}

+ (void) registerAppAssetResolver:(id<TitaniumAppAssetResolver>)newResolver
{
	if (resolver!=nil)
	{
		[resolver release];
	}

	resolver = newResolver;
	if (newResolver!=nil)
	{
		[resolver retain];
	}
}

@end
