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
#import "TiFile.h"
#import "TiBlob.h"

#define DEBUG_IMAGEVIEW
#define DEFAULT_IMAGEVIEW_INTERVAL 200

@implementation TiUIImageViewProxy
@synthesize imageURL;

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

-(void)propagateLoadEvent:(NSString *)stateString
{
    //Send out a content change message if we are auto sizing
    if (TiDimensionIsAuto(layoutProperties.width) || TiDimensionIsAutoSize(layoutProperties.width) || TiDimensionIsUndefined(layoutProperties.width) ||
        TiDimensionIsAuto(layoutProperties.height) || TiDimensionIsAutoSize(layoutProperties.height) || TiDimensionIsUndefined(layoutProperties.height)) {
        [self refreshSize];
        [self willChangeSize];
    }
    
    if ([self _hasListeners:@"load"]) {
        NSDictionary *event = [NSDictionary dictionaryWithObject:stateString forKey:@"state"];
        [self fireEvent:@"load" withObject:event];
    }
}

-(void)_configure
{
	[self replaceValue:NUMBOOL(NO) forKey:@"animating" notification:NO];
	[self replaceValue:NUMBOOL(NO) forKey:@"paused" notification:NO];
	[self replaceValue:NUMBOOL(NO) forKey:@"reverse" notification:NO];
    [self replaceValue:NUMBOOL(YES) forKey:@"stopped" notification:YES];
    [self replaceValue:NUMFLOAT(DEFAULT_IMAGEVIEW_INTERVAL) forKey:@"duration" notification:NO];
}

-(void)start:(id)args
{
    TiThreadPerformOnMainThread(^{
        TiUIImageView *iv = (TiUIImageView*)[self view];
        [iv start];
    }, NO);
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
    TiThreadPerformOnMainThread(^{
        TiUIImageView *iv = (TiUIImageView*)[self view];
        [iv pause];
    }, NO);
}

-(void)resume:(id)args
{
    TiThreadPerformOnMainThread(^{
        TiUIImageView *iv = (TiUIImageView*)[self view];
        [iv resume];
    }, NO);
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
    [self replaceValue:nil forKey:@"image" notification:NO];
    
    RELEASE_TO_NIL(imageURL);
	[super dealloc];
}

-(id)toBlob:(id)args
{
	id imageValue = [self valueForKey:@"image"];

	if ([imageValue isKindOfClass:[TiBlob class]])
	{
		//We already have it right here already!
		return imageValue;
	}

	if ([imageValue isKindOfClass:[TiFile class]])
	{
		return [(TiFile *)imageValue toBlob:nil];
	}

	if (imageValue!=nil)
	{
		NSURL *url_ = [TiUtils toURL:[TiUtils stringValue:imageValue] proxy:self];
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

-(void)addLoadDelegate:(id <ImageLoaderDelegate>)delegate
{
	
}

USE_VIEW_FOR_CONTENT_WIDTH

USE_VIEW_FOR_CONTENT_HEIGHT

#pragma mark Handling ImageLoader

-(void)setImage:(id)newImage
{
    id image = newImage;
    if ([image isEqual:@""])
    {
        image = nil;
    }
    [self replaceValue:image forKey:@"image" notification:YES];
}

-(void)startImageLoad:(NSURL *)url;
{
	[self cancelPendingImageLoads]; //Just in case we have a crusty old urlRequest.
	NSDictionary* info = nil;
	NSNumber* hires = [self valueForKey:@"hires"];
	if (hires) {
		info = [NSDictionary dictionaryWithObject:hires forKey:@"hires"];
	}
	urlRequest = [[[ImageLoader sharedLoader] loadImage:url delegate:self userInfo:info] retain];
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
	
	if (view != nil)
	{
		[(TiUIImageView *)[self view] imageLoadSuccess:request image:image];
	}
    [self setImageURL:[urlRequest url]];
	RELEASE_TO_NIL(urlRequest);
}

-(void)imageLoadFailed:(ImageLoaderRequest*)request error:(NSError*)error
{
	if (request == urlRequest)
	{
		if ([self _hasListeners:@"error"])
		{
			[self fireEvent:@"error" withObject:[NSDictionary dictionaryWithObjectsAndKeys:[request url], @"image", nil]];
		}
		RELEASE_TO_NIL(urlRequest);
	}
}

-(void)imageLoadCancelled:(ImageLoaderRequest *)request
{
}

-(TiDimension)defaultAutoWidthBehavior:(id)unused
{
    return TiDimensionAutoSize;
}
-(TiDimension)defaultAutoHeightBehavior:(id)unused
{
    return TiDimensionAutoSize;
}

@end

#endif
