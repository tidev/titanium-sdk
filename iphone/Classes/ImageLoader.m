/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ImageLoader.h"
#import "OperationQueue.h"
#import "TiUtils.h"

ImageLoader *sharedLoader = nil;

@implementation ImageLoader

-(id)init
{
	if (self = [super init])
	{
	}
	return self;
}

+(ImageLoader*)sharedLoader
{
	if (sharedLoader==nil)
	{
		sharedLoader = [[ImageLoader alloc] init];
	}
	return sharedLoader;
}

-(id)loadRemote:(NSURL*)url
{
	NSData* imageData = [[[NSData alloc]initWithContentsOfURL:url] autorelease];	
	return [[[UIImage alloc] initWithData:imageData] autorelease];
}

-(UIImage *)loadImmediateImage:(NSURL *)url;
{
	if ([url isFileURL])
	{
		return [UIImage imageWithContentsOfFile:[url path]];
	}
	return nil;
}

-(UIImage *)loadImmediateStretchableImage:(NSURL *)url;
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
	if ([url isFileURL])
	{
		UIImage *image = [UIImage imageWithContentsOfFile:[url path]];
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
