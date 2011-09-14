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
#import "TiApp.h"
#import "UIImage+Resize.h"

#ifdef VERBOSE
#import <mach/mach.h>
#endif

@interface ImageCacheEntry : NSObject
{
	UIImage * fullImage;
	UIImage * stretchableImage;
	UIImage * recentlyResizedImage;
	NSString * fullPath;
	
    TiDimension leftCap;
    TiDimension topCap;
    BOOL recapStretchableImage;
	BOOL isLocalImage;
	BOOL hires;
}

@property (nonatomic,readonly,copy) NSString * fullPath;
@property(nonatomic,readwrite,retain) UIImage * fullImage;
@property(nonatomic,readwrite,retain) UIImage * recentlyResizedImage;
@property(nonatomic,readwrite) TiDimension leftCap;
@property(nonatomic,readwrite) TiDimension topCap;
@property(nonatomic,readwrite) BOOL isLocalImage;
@property(nonatomic,readwrite) BOOL hires;
-(UIImage *)imageForSize:(CGSize)imageSize;
-(UIImage *)stretchableImage;

-(BOOL)purgable;

@end

@implementation ImageCacheEntry

@synthesize fullImage, recentlyResizedImage, leftCap, topCap, isLocalImage, hires;
@synthesize fullPath;

- (UIImage *) fullImage {
	if(fullImage == nil) {
		if(fullPath == nil) {
			return nil;
		}
		VerboseLog(@"retrieving image from local file: %@", fullPath);
		fullImage = [[UIImage alloc] initWithContentsOfFile:fullPath];
	}
	return fullImage;
}

- (void) setFullURL:(NSURL *) url {
	VerboseLog(@"setting new URL for image cache entry: %@", [url absoluteString]);
	if([url isFileURL]) {
		fullPath = [[url absoluteString] retain];
	} else {
		fullPath = [[NSString alloc] initWithFormat:@"%@%x.%@", NSTemporaryDirectory(), self, [[url absoluteString] pathExtension]];
		NSFileManager *fm = [[NSFileManager alloc] init];
		NSError *error = nil;
		if([fm fileExistsAtPath:fullPath]) {
			[fm removeItemAtPath:fullPath error:&error];
			if(error != nil) {
				NSLog(@"[ERROR] problem deleting cache file %@: %@", fullPath, error);
			}
		}
		[fm release];
	}
}

- (void) setData:(NSData *) newData {	
	NSFileManager *fm = [[NSFileManager alloc] init];
	if(![fm fileExistsAtPath:fullPath]) {
		NSError *error = nil;
		VerboseLog(@"saving image data to file: %@", fullPath);
		
		[newData writeToFile:fullPath options:0 error:&error];

		if(error != nil) {
			NSLog(@"[ERROR] Problem saving image data to file: %@\n%@", fullPath, error);
		}
	}
	[fm release];
}

-(void)setLeftCap:(TiDimension)cap
{
    if (!TiDimensionEqual(leftCap, cap)) {
        leftCap = cap;
        recapStretchableImage = YES;
    } 
}

-(void)setTopCap:(TiDimension)cap
{
    if (!TiDimensionEqual(topCap, cap)) {
        topCap = cap;
        recapStretchableImage = YES;
    }
}

-(UIImage *)stretchableImage
{
    if (stretchableImage == nil || recapStretchableImage) {
        [stretchableImage release];
        
        CGSize imageSize = [[self fullImage] size];
		
        NSInteger left = (TiDimensionIsAuto(leftCap) || TiDimensionIsUndefined(leftCap) || leftCap.value == 0) ?
                                imageSize.width/2  : 
                                TiDimensionCalculateValue(leftCap, imageSize.width);
        NSInteger top = (TiDimensionIsAuto(topCap) || TiDimensionIsUndefined(topCap) || topCap.value == 0) ? 
                                imageSize.height/2  : 
                                TiDimensionCalculateValue(topCap, imageSize.height);
        
        stretchableImage = [[[self fullImage] stretchableImageWithLeftCapWidth:left
                                                           topCapHeight:top] retain];
        recapStretchableImage = NO;
    }
	return stretchableImage;
}

-(UIImage *)imageForSize:(CGSize)imageSize scalingStyle:(TiImageScalingStyle)scalingStyle
{
	
	if (scalingStyle == TiImageScalingStretch)
	{
	   return [self stretchableImage];
	}
	
	CGSize fullImageSize = [[self fullImage] size];
	
	if (scalingStyle != TiImageScalingNonProportional)
	 {
		BOOL validScale = NO;
		CGFloat scale = 1.0;
		
		if (imageSize.height > 1.0)
		 {
			scale = imageSize.height/fullImageSize.height;
			validScale = YES;
		 }
		if (imageSize.width > 1.0)
		 {
			CGFloat widthScale = imageSize.width/fullImageSize.width;
			if (!validScale || (widthScale<scale))
			 {
				scale = widthScale;
				validScale = YES;
			 }
		 }
		
		if (validScale && ((scalingStyle != TiImageScalingThumbnail) || (scale < 1.0)))
		 {
			imageSize = CGSizeMake(ceilf(scale*fullImageSize.width),
								   ceilf(scale*fullImageSize.height));
		 }
		else
		 {
			imageSize = fullImageSize;
		 }
	 }
	
	if (CGSizeEqualToSize(imageSize, fullImageSize))
	 {
		return fullImage;
	 }
	
	if (CGSizeEqualToSize(imageSize, [recentlyResizedImage size]))
	 {
		return recentlyResizedImage;
	 }
	
	//TODO: Tweak quality depending on how large the result will be.
	CGInterpolationQuality quality = kCGInterpolationDefault;
	
	[self setRecentlyResizedImage:[UIImageResize
								   resizedImage:imageSize
								   interpolationQuality:quality
								   image:fullImage
								   hires:hires]];
	return recentlyResizedImage;
}


-(UIImage *)imageForSize:(CGSize)imageSize
{
	return [self imageForSize:imageSize scalingStyle:TiImageScalingDefault];
}

-(BOOL)purgable
{
	BOOL canPurge = YES;
	if ([recentlyResizedImage retainCount]<2)
	{
		RELEASE_TO_NIL(recentlyResizedImage)
	}
	else
	{
		canPurge = NO;
	}

	if ([stretchableImage retainCount]<2)
	{
		RELEASE_TO_NIL(stretchableImage)
	}
	else
	{
		canPurge = NO;
	}
	
	if([fullImage retainCount]<2)
	{
		RELEASE_TO_NIL(fullImage);
	}
	return canPurge;
}

- (void) dealloc
{
	RELEASE_TO_NIL(fullPath);
	RELEASE_TO_NIL(recentlyResizedImage);
	RELEASE_TO_NIL(stretchableImage);
	RELEASE_TO_NIL(fullImage);
	[super dealloc];
}


@end



ImageLoader *sharedLoader = nil;

@implementation ImageLoaderRequest

@synthesize completed, delegate, imageSize, request;

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
		WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
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
	WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
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
	NSString * doomedKey;

	int cacheCount = [cache count];
#ifdef VERBOSE
	vm_statistics_data_t vmStats;
	mach_msg_type_number_t infoCount = HOST_VM_INFO_COUNT;
	kern_return_t kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);
	NSLog(@"[INFO] %d pages free before clearing image cache.",vmStats.free_count);
#endif

    // TODO: Replace this logic with some that doesn't remove the cache entry completely, just purges what it can
	do
	{
		doomedKey = nil;
		for (NSString * thisKey in cache)
		{
			ImageCacheEntry * thisValue = [cache objectForKey:thisKey];
			if ([thisValue purgable])
			{
				doomedKey = thisKey;
				break;
			}
		}
		if (doomedKey != nil)
		{
			VerboseLog(@"[INFO] Due to memory conditions, releasing cached image: %@",doomedKey);
			[cache removeObjectForKey:doomedKey];
		}
	} while (doomedKey != nil);
#ifdef VERBOSE
	kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);
	NSLog(@"[INFO] %d of %d images remain in cache, %d pages now free.",[cache count],cacheCount,vmStats.free_count);
#else
	int newCacheCount = [cache count];
	NSLog(@"[INFO] Due to memory conditions, %d of %d image cache entries were unloaded from cache.",cacheCount - newCacheCount,cacheCount);
#endif


}

+(ImageLoader*)sharedLoader
{
	if (sharedLoader==nil)
	{
		sharedLoader = [[ImageLoader alloc] init];
	}
	return sharedLoader;
}

-(ImageCacheEntry *)setImage:(UIImage *)image forKey:(NSURL *)url cache:(BOOL)doCache
{
	NSString *urlString = [url absoluteString];
	if (image==nil)
	{
		return nil;
	}
	if (cache==nil)
	{
		cache = [[NSMutableDictionary alloc] init];
	}
	ImageCacheEntry * newEntry = [[[ImageCacheEntry alloc] init] autorelease];
	[newEntry setFullImage:image];
	[newEntry setFullURL:url];
	
	if (doCache)
	{
		VerboseLog(@"Caching image %@: %@",urlString,image);
		[cache setObject:newEntry forKey:urlString];
	}
	return newEntry;
}

-(ImageCacheEntry *)setImage:(UIImage *)image forKey:(NSURL *)url
{
	return [self setImage:image forKey:url cache:YES];
}

-(CGFloat)imageScale:(UIImage*)image
{
	// we have to check both what's being compiled as 
	// well as if we're running on device that supports it.
	// i.e. a 4.0 built iphone app running in emulation mode
	// on an iPad will not have scale
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
	if ([image respondsToSelector:@selector(scale)])
	{
		return [image scale];
	}
#endif
	return 1.0;
}

-(ImageCacheEntry *)entryForKey:(NSURL *)url
{
	if (url == nil)
	{
		return nil;
	}

	NSString * urlString = [url absoluteString];
	ImageCacheEntry * result = [cache objectForKey:urlString];
	
	if ([url isFileURL])
	{
		if (result == nil)
		{
			//Well, let's make it for them!
			NSString * path = [url path];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
			BOOL scaleUp = NO;
			if ([TiUtils isRetinaDisplay] && [path rangeOfString:@"@2x"].location!=NSNotFound)
			{
				scaleUp = YES;
			}
#endif
			UIImage * resultImage = [UIImage imageWithContentsOfFile:path];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0
			if (scaleUp && [self imageScale:resultImage]==1.0)
			{
				// on the ipad running iphone app in emulation mode, this won't exist when
				// do click 2x to scale it up so we have to check for this method
				if ([UIImage instancesRespondToSelector:@selector(imageWithCGImage:scale:orientation:)])
				{
					// if we specified a 2x, we need to upscale it
					resultImage = [UIImage imageWithCGImage:[resultImage CGImage] scale:2.0 orientation:[resultImage imageOrientation]];
				}
			}
#endif
		    result = [self setImage:resultImage forKey:url cache:NO];
			[result setIsLocalImage:YES];
		}
	}
	
	return result;
}



-(id)cache:(UIImage*)image forURL:(NSURL*)url size:(CGSize)imageSize
{
	return [[self setImage:image forKey:url] imageForSize:imageSize];
}

-(id)cache:(UIImage*)image forURL:(NSURL*)url
{
	return [self cache:image forURL:url size:CGSizeZero];
}


-(id)loadRemote:(NSURL*)url
{
	if (url==nil) return nil;
	UIImage *image = [[self entryForKey:url] imageForSize:CGSizeZero];
	if (image!=nil)
	{
		return image;
	}
	
	ASIHTTPRequest *req = [ASIHTTPRequest requestWithURL:url];
	[req addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
	[[TiApp app] startNetwork];
	[req start];
	[[TiApp app] stopNetwork];
	
	if (req!=nil && [req error]==nil)
	{
	   NSData *data = [req responseData];
	   UIImage *resultImage = [UIImage imageWithData:data];
	   ImageCacheEntry *result = [self setImage:resultImage forKey:url];
	   [result setData:data];
	   return [result imageForSize:CGSizeZero];
	}
	
	return nil;
}

-(UIImage *)loadImmediateImage:(NSURL *)url
{
	return [self loadImmediateImage:url withSize:CGSizeZero];
}


-(UIImage *)loadImmediateImage:(NSURL *)url withSize:(CGSize)imageSize;
{
	return [[self entryForKey:url] imageForSize:imageSize];
}

-(UIImage *)loadImmediateStretchableImage:(NSURL *)url
{
    return [self loadImmediateStretchableImage:url withLeftCap:TiDimensionAuto topCap:TiDimensionAuto];
}

-(UIImage *)loadImmediateStretchableImage:(NSURL *)url withLeftCap:(TiDimension)left topCap:(TiDimension)top
{
    ImageCacheEntry* image = [self entryForKey:url];
    image.leftCap = left;
    image.topCap = top;
	return [image stretchableImage];    
}

-(CGSize)fullImageSize:(NSURL *)url
{
	ImageCacheEntry* image = [self entryForKey:url];
	if (image!=nil) 
	{
		return [[image fullImage] size];
	}
	else
	{
		return CGSizeZero;
	}
}

-(void)notifyImageCompleted:(NSArray*)args
{
	if ([args count]==2)
	{
		ImageLoaderRequest *request = [args objectAtIndex:0];
		UIImage *image = [args objectAtIndex:1];
		[[request delegate] imageLoadSuccess:request image:image];
		[request setRequest:nil];
	}
}

-(void)doImageLoader:(ImageLoaderRequest*)request
{
	NSURL *url = [request url];
	
	UIImage *image = [[self entryForKey:url] imageForSize:[request imageSize]];
	if (image!=nil)
	{
		[self performSelectorOnMainThread:@selector(notifyImageCompleted:) withObject:[NSArray arrayWithObjects:request,image,nil] waitUntilDone:NO modes:[NSArray arrayWithObject:NSRunLoopCommonModes]];
		return;
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
	[req addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
	[req setTimeOutSeconds:20];
	[request setRequest:req];
	
	[[TiApp app] startNetwork];
	
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

-(BOOL)purgeEntry:(NSURL*)url
{
    NSString* key = [url absoluteString];
    return [[cache objectForKey:[url absoluteString]] purgable];
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

-(void)cancel
{
	//NOTE: this should only be called on suspend
	//to cause the queue to be stopped
	[lock lock];
	if (queue!=nil)
	{
		[queue reset];
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
	ENSURE_UI_THREAD_1_ARG(request);

	// hold while we're working with it (release below)
	[request retain];
	
	[[TiApp app] stopNetwork];
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
			[request setUserInfo:nil];
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
		
		if (image == nil) 
		{
			NSMutableDictionary* errorDetail = [NSMutableDictionary dictionary];
			[errorDetail setValue:@"Returned invalid image data" forKey:NSLocalizedDescriptionKey];
			NSError* error = [NSError errorWithDomain:@"com.appcelerator.titanium.imageloader" code:1 userInfo:errorDetail];
			[[req delegate] imageLoadFailed:req error:error];
			[request setUserInfo:nil];
			[request release];
			return;
		}
		
		if (cacheable)
		{
			BOOL hires = [TiUtils boolValue:[[req userInfo] valueForKey:@"hires"] def:NO];
		    [self cache:image forURL:[req url]];
			ImageCacheEntry *entry = [self entryForKey:[req url]];
		    [entry setData:data];
			[entry setHires:hires];
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
	[request setUserInfo:nil];
	[request release];
}

-(void)queueRequestDidFail:(ASIHTTPRequest*)request
{
	[[TiApp app] stopNetwork];
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
	[request setUserInfo:nil];
}

@end
