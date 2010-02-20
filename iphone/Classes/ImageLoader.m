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

@implementation ImageLoader

-(id)init
{
	if (self = [super init])
	{
		[[NSNotificationCenter defaultCenter] addObserver:self
												 selector:@selector(didReceiveMemoryWarning:)
													 name:UIApplicationDidReceiveMemoryWarningNotification  
												   object:nil]; 
	}
	return self;
}

-(void)dealloc
{
	[[NSNotificationCenter defaultCenter] removeObserver:self
													name:UIApplicationDidReceiveMemoryWarningNotification  
												  object:nil];  
	RELEASE_TO_NIL(cache);
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

-(void)loadImage:(NSURL*)url callback:(id)callback selector:(SEL)selector
{
	UIImage *image = [cache objectForKey:[url absoluteString]];
	if (image!=nil)
	{
		[callback performSelectorOnMainThread:selector withObject:image waitUntilDone:NO];
	}
	if ([url isFileURL])
	{
		UIImage *image = [UIImage imageWithContentsOfFile:[url path]];
		[self cache:image forURL:url];
		[callback performSelectorOnMainThread:selector withObject:image waitUntilDone:NO];
		//This ensures that it always happens after the method returns. Otherwise we run a risk of some
		//callbacks happening before returning, and some happening afterwards.
	}
	else 
	{
		[[OperationQueue sharedQueue] queue:@selector(loadRemote:) target:self arg:url after:selector on:callback ui:YES];
	}
}

@end
