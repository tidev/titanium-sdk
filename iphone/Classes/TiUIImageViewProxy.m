/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIIMAGEVIEW

#import "TiUIImageViewProxy.h"
#import "TiUIImageView.h"
#import "OperationQueue.h"
#import "ASIHTTPRequest.h"
#import "TiApp.h"
#import "TiBlob.h"

@implementation TiUIImageViewProxy

static NSArray* imageKeySequence;

#pragma mark Internal

-(NSArray *)keySequence
{
	if (imageKeySequence == nil)
	{
		imageKeySequence = [[NSArray arrayWithObjects:@"width",@"height",nil] retain];
	}
	return imageKeySequence;
}

-(void)_configure
{
	[self replaceValue:NUMBOOL(NO) forKey:@"animating" notification:NO];
	[self replaceValue:NUMBOOL(NO) forKey:@"paused" notification:NO];
	[self replaceValue:NUMBOOL(NO) forKey:@"reverse" notification:NO];
}

-(void)start:(id)args
{
	ENSURE_UI_THREAD(start,args);
	TiUIImageView *iv= (TiUIImageView*)[self view];
	[iv start];
}

-(void)stop:(id)args
{
//Don't put this in UIThread, because it doesn't need to go in UIThread.
//Furthermore, by the time this is run, if this stop was called by a destroy
//Bad things(tm) happen.
	
	[destroyLock lock];
	if ([self viewAttached])
	{
		TiUIImageView *iv= (TiUIImageView*)[self view];
		[iv stop];
	}
	[destroyLock unlock];
}

-(void)pause:(id)args
{
	ENSURE_UI_THREAD(pause,args);
	TiUIImageView *iv= (TiUIImageView*)[self view];
	[iv pause];
}

-(void)viewWillDetach
{
	[self stop:nil];
	[super viewWillDetach];
}

-(void)windowWillClose
{
	[self stop:nil];
	[super windowWillClose];
}

-(void)_destroy
{
	[self stop:nil];
	[super _destroy];
}

- (void) dealloc
{
	RELEASE_TO_NIL(urlRequest);
	[super dealloc];
}


-(id)toBlob:(id)args
{
	id url = [self valueForKey:@"url"];
	if (url!=nil)
	{
		NSURL *url_ = [TiUtils toURL:url proxy:self];
		UIImage *image = [[ImageLoader sharedLoader] loadImmediateImage:url_];
		
		if (image!=nil)
		{
			return [[[TiBlob alloc] initWithImage:image] autorelease];
		}

		// we're on the non-UI thread, we need to block to load

		image = [[ImageLoader sharedLoader] loadRemote:url_];
		return [[[TiBlob alloc] initWithImage:image] autorelease];
	}
	return nil;
}

USE_VIEW_FOR_AUTO_WIDTH

USE_VIEW_FOR_AUTO_HEIGHT

#pragma mark Handling ImageLoader
-(void)startImageLoad:(NSURL *)url;
{
	[self cancelPendingImageLoads]; //Just in case we have a crusty old urlRequest.
	urlRequest = [[[ImageLoader sharedLoader] loadImage:url delegate:self userInfo:nil] retain];
}

-(void)cancelPendingImageLoads
{
	// cancel a pending request if we have one pending
	if (urlRequest!=nil)
	{
		[urlRequest cancel];
		RELEASE_TO_NIL(urlRequest);
	}
}

-(void)imageLoadSuccess:(ImageLoaderRequest*)request image:(UIImage*)image
{
	if (request != urlRequest)
	{
		return;
	}
	
	if ([self viewAttached])
	{
		[(TiUIImageView *)[self view] imageLoadSuccess:request image:image];
	}
	RELEASE_TO_NIL(urlRequest);
}

-(void)imageLoadFailed:(ImageLoaderRequest*)request error:(NSError*)error
{
	if (request == urlRequest)
	{
		NSLog(@"[ERROR] Failed to load image: %@, Error: %@",[request url], error);
		RELEASE_TO_NIL(urlRequest);
	}
}

-(void)imageLoadCancelled:(ImageLoaderRequest *)request
{
}


@end

#endif
