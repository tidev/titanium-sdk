/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ImageLoader.h"
#import "OperationQueue.h"
#import "TiUtils.h"
#import "ASIHTTPRequest.h"
#import "TitaniumApp.h"

ImageLoader *sharedLoader = nil;

@implementation ImageLoaderRequest

@synthesize completed, delegate;

DEFINE_EXCEPTIONS

-(void)dealloc
{
	RELEASE_TO_NIL(request);
	RELEASE_TO_NIL(delegate);
	RELEASE_TO_NIL(userInfo);
	RELEASE_TO_NIL(url);
	[super dealloc];
}

-(id)initWithCallback:(NSObject<ImageLoaderDelegate>*)target_ userInfo:(id)userInfo_ url:(NSURL*)url_
{
	if (self = [super init])
	{
		delegate = [target_ retain];
		userInfo = [userInfo_ retain];
		url = [url_ retain];
	}
	return self;
}

-(void)setRequest:(ASIHTTPRequest*)request_
{
	request = [request_ retain];
}

-(void)cancel
{
	cancelled = YES;
	[request cancel];
	RELEASE_TO_NIL(request);
}

-(BOOL)cancelled
{
	return cancelled;
}

-(id)userInfo
{
	return userInfo;
}

-(NSURL*)url
{
	return url;
}

@end


@implementation ImageLoader

-(id)init
{
	if (self = [super init])
	{
		[[NSNotificationCenter defaultCenter] addObserver:self
												 selector:@selector(didReceiveMemoryWarning:)
													 name:UIApplicationDidReceiveMemoryWarningNotification  
												   object:nil]; 
		lock = [[NSRecursiveLock alloc] init];
	}
	return self;
}

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self
													name:UIApplicationDidReceiveMemoryWarningNotification  
												  object:nil];  
	RELEASE_TO_NIL(cache);
	RELEASE_TO_NIL(queue);
	RELEASE_TO_NIL(timeout);
	RELEASE_TO_NIL(lock);
	[super dealloc];
}

-(void)didReceiveMemoryWarning:(id)sender
{
	if (cache!=nil)
	{
		NSLog(@"[DEBUG] low memory, removing %d cached image objects",[cache count]);
		[cache autorelease];
		cache = nil;
	}
}

+(ImageLoader*)sharedLoader
{
	if (sharedLoader==nil)
	{
		sharedLoader = [[ImageLoader alloc] init];
	}
	return sharedLoader;
}

-(id)cache:(UIImage*)image forURL:(NSURL*)url
{
	if (image==nil) 
	{
		return nil;
	}
	if (cache==nil)
	{
		cache = [[NSMutableDictionary alloc] init];
	}
	[cache setObject:image forKey:[url absoluteString]];
	return image;
}

-(id)loadRemote:(NSURL*)url
{
	if (url==nil) return nil;
	UIImage *image = [cache objectForKey:[url absoluteString]];
	if (image!=nil)
	{
		return image;
	}
	
	ASIHTTPRequest *req = [ASIHTTPRequest requestWithURL:url];
	[req addRequestHeader:@"User-Agent" value:[[TitaniumApp app] userAgent]];
	[[TitaniumApp app] startNetwork];
	[req start];
	[[TitaniumApp app] stopNetwork];
	
	if (req!=nil && [req error]==nil)
	{
		return [self cache:[[[UIImage alloc] initWithData:[req responseData]] autorelease] forURL:url];
	}
	
	return nil;
}

-(UIImage *)loadImmediateImage:(NSURL *)url
{
	if (url==nil) return nil;
	UIImage *image = [cache objectForKey:[url absoluteString]];
	if (image!=nil)
	{
		return image;
	}
	if ([url isFileURL])
	{
		return [self cache:[UIImage imageWithContentsOfFile:[url path]] forURL:url];
	}
	return nil;
}

-(UIImage *)loadImmediateStretchableImage:(NSURL *)url
{
	UIImage * result = [self loadImmediateImage:url];
	if (result != nil){
		CGSize imageSize = [result size];
		return [result stretchableImageWithLeftCapWidth:imageSize.width/2 topCapHeight:imageSize.height/2];
	}
	return nil;
}

-(void)notifyImageCompleted:(NSArray*)args
{
	if ([args count]==2)
	{
		ImageLoaderRequest *request = [args objectAtIndex:0];
		UIImage *image = [args objectAtIndex:1];
		[[request delegate] imageLoadSuccess:request image:image];
	}
}

-(void)doImageLoader:(ImageLoaderRequest*)request
{
	NSURL *url = [request url];
	
	UIImage *image = [cache objectForKey:[url absoluteString]];
	if (image!=nil)
	{
		[self performSelectorOnMainThread:@selector(notifyImageCompleted:) withObject:[NSArray arrayWithObjects:request,image,nil] waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
		return;
	}
	if ([url isFileURL])
	{
		UIImage *image = [self loadImmediateImage:url];
		if (image!=nil)
		{
			[self performSelectorOnMainThread:@selector(notifyImageCompleted:) withObject:[NSArray arrayWithObjects:request,image,nil] waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
			return;
		}
	}
	
	// we don't have it local or in the cache so we need to fetch it remotely
	if (queue == nil)
	{
		queue = [[ASINetworkQueue alloc] init];
		[queue setMaxConcurrentOperationCount:4];
		[queue setShouldCancelAllRequestsOnFailure:NO];
		[queue setDelegate:self];
		[queue setRequestDidFailSelector:@selector(queueRequestDidFail:)];
		[queue setRequestDidFinishSelector:@selector(queueRequestDidFinish:)];
		[queue go];
	}
	
	NSDictionary *dict = [NSDictionary dictionaryWithObject:request forKey:@"request"];
	ASIHTTPRequest *req = [ASIHTTPRequest requestWithURL:url];
	[req setUserInfo:dict];
	[req setRequestMethod:@"GET"];
	[req addRequestHeader:@"User-Agent" value:[[TitaniumApp app] userAgent]];
	[req setTimeOutSeconds:20];
	[request setRequest:req];
	
	[[TitaniumApp app] startNetwork];
	
	[queue addOperation:req];
}

-(ImageLoaderRequest*)loadImage:(NSURL*)url delegate:(NSObject<ImageLoaderDelegate>*)delegate userInfo:(NSDictionary*)userInfo
{
	ImageLoaderRequest *request = [[[ImageLoaderRequest alloc] initWithCallback:delegate userInfo:userInfo url:url] autorelease];
	
	// if have a queue and it's suspend, just throw our request
	// in the timeout queue until we're resumed
	if (queue!=nil && [queue isSuspended])
	{
		[lock lock];
		if (timeout==nil)
		{
			timeout = [[NSMutableArray alloc] initWithCapacity:4];
		}
		[timeout addObject:request];
		[lock unlock];
		return request;
	}
	
	[self doImageLoader:request];
	
	return request;
}

-(void)suspend
{
	[lock lock];
	if (queue!=nil)
	{
		[queue setSuspended:YES];
	}
	[lock unlock];
}

-(void)resume
{
	[lock lock];
	
	if (queue!=nil)
	{
		[queue setSuspended:NO];
	}
	
	if (timeout!=nil)
	{
		for (ImageLoaderRequest *request in timeout)
		{
			if ([request cancelled])
			{
				if ([[request delegate] respondsToSelector:@selector(imageLoadCancelled:)])
				{
					[[request delegate] performSelector:@selector(imageLoadCancelled:) withObject:request];
				}
			}
			else
			{
				[self doImageLoader:request];
			}
		}
		[timeout removeAllObjects];
	}
	[lock unlock];
}


#pragma mark Delegates


-(void)queueRequestDidFinish:(ASIHTTPRequest*)request
{
	// hold while we're working with it (release below)
	[request retain];
	
	[[TitaniumApp app] stopNetwork];
	ImageLoaderRequest *req = [[request userInfo] objectForKey:@"request"];
	if ([req cancelled]==NO)
	{
		NSData *data = [request responseData];
		if (data == nil || [data length]==0)
		{
			NSMutableDictionary *errorDetail = [NSMutableDictionary dictionary];
			[errorDetail setValue:@"Response returned nil" forKey:NSLocalizedDescriptionKey];
			NSError *error = [NSError errorWithDomain:@"com.appcelerator.titanium.imageloader" code:1 userInfo:errorDetail];
			[[req delegate] imageLoadFailed:req error:error];
			[request release];
			return;
		}
		
		// we want to be able to cache remote images so we need to
		// honor cache control parameters - however, we're only caching
		// for this session and not on disk so we ignore (potentially at a determinent?)
		// the actual max-age setting for now.
		NSString *cacheControl = [[request responseHeaders] objectForKey:@"Cache-Control"];
		BOOL cacheable = YES;
		if (cacheControl!=nil)
		{
			// check to see if we're cacheable or not
			NSRange range = [cacheControl rangeOfString:@"max-age=0"];
			if (range.location!=NSNotFound)
			{
				cacheable = NO;
			}
			else 
			{
				range = [cacheControl rangeOfString:@"no-cache"];
				if (range.location!=NSNotFound)
				{
					cacheable = NO;
				}
			}
		}
		
		UIImage *image = [UIImage imageWithData:data];
		
		if (cacheable)
		{
			[self cache:image forURL:[request url]];
		}
		
		[self notifyImageCompleted:[NSArray arrayWithObjects:req,image,nil]];
	}
	else
	{
		if ([[req delegate] respondsToSelector:@selector(imageLoadCancelled:)])
		{
			[[req delegate] performSelector:@selector(imageLoadCancelled:) withObject:req];
		}
	}
	[request release];
}

-(void)queueRequestDidFail:(ASIHTTPRequest*)request
{
	[[TitaniumApp app] stopNetwork];
	ImageLoaderRequest *req = [[request userInfo] objectForKey:@"request"];
	NSError *error = [request error];
	if ([error code] == ASIRequestCancelledErrorType && [error domain] == NetworkRequestErrorDomain)
	{
		if ([[req delegate] respondsToSelector:@selector(imageLoadCancelled:)])
		{
			[[req delegate] performSelector:@selector(imageLoadCancelled:) withObject:req];
		}
	}
	else 
	{
		[[req delegate] imageLoadFailed:req error:[request error]];
	}
}

@end
