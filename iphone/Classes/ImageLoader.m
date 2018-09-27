/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "ImageLoader.h"
#import "OperationQueue.h"
#import "TiApp.h"
#import "TiUtils.h"
#import "UIImage+Resize.h"
#import <CommonCrypto/CommonDigest.h>

//#define DEBUG_IMAGE_CACHE

#ifdef DEBUG_IMAGE_CACHE
#import <mach/mach.h>
#endif

@interface ImageCacheEntry : NSObject {
  UIImage *fullImage;
  UIImage *stretchableImage;
  UIImage *recentlyResizedImage;

  TiDimension leftCap;
  TiDimension topCap;

  BOOL recapStretchableImage;
  BOOL hires;

  NSString *localPath;
  NSURL *remoteURL;

  NSDate *lastModified;
  BOOL local;
}

@property (nonatomic, readonly) NSString *localPath;
@property (nonatomic, readwrite, retain) UIImage *fullImage;
@property (nonatomic, readwrite, retain) UIImage *recentlyResizedImage;
@property (nonatomic, readonly) UIImage *stretchableImage;

@property (nonatomic, readwrite) TiDimension leftCap;
@property (nonatomic, readwrite) TiDimension topCap;
@property (nonatomic, readwrite) BOOL hires;
@property (nonatomic, readonly) NSDate *lastModified;
@property (nonatomic, readonly) BOOL local;

- (ImageCacheEntry *)initWithURL:(NSURL *)url;

- (UIImage *)imageForSize:(CGSize)imageSize;
- (void)setData:(NSData *)data;
- (void)serialize:(NSData *)data;

+ (NSString *)cachePathForURL:(NSURL *)url;

@end

@implementation ImageCacheEntry

@synthesize fullImage, leftCap, topCap, hires, localPath, stretchableImage, recentlyResizedImage, lastModified, local;

- (UIImage *)fullImage
{
  if (fullImage == nil) {
    if (localPath == nil) {
      return nil;
    }
#ifdef DEBUG_IMAGE_CACHE
    NSLog(@"[CACHE DEBUG] Retrieving local image [lazy]: %@", localPath);
#endif
    RELEASE_TO_NIL(stretchableImage);
    RELEASE_TO_NIL(recentlyResizedImage);
    RELEASE_TO_NIL(lastModified);
    fullImage = [[UIImage alloc] initWithContentsOfFile:localPath];
    if (local) {
      lastModified = [[[[NSFileManager defaultManager] attributesOfItemAtPath:localPath error:nil] objectForKey:NSFileModificationDate] retain];
    }
  }
  return fullImage;
}

- (void)setData:(NSData *)data
{
  RELEASE_TO_NIL(fullImage);
  RELEASE_TO_NIL(stretchableImage);
  RELEASE_TO_NIL(recentlyResizedImage);
  RELEASE_TO_NIL(lastModified);
  fullImage = [[UIImage alloc] initWithData:data];
  [self serialize:data];
}

- (void)setLeftCap:(TiDimension)cap
{
  if (!TiDimensionEqual(leftCap, cap)) {
    leftCap = cap;
    recapStretchableImage = YES;
  }
}

- (void)setTopCap:(TiDimension)cap
{
  if (!TiDimensionEqual(topCap, cap)) {
    topCap = cap;
    recapStretchableImage = YES;
  }
}

- (UIImage *)stretchableImage
{
  if (stretchableImage == nil || recapStretchableImage) {
    [stretchableImage release];
    UIImage *theImage = [self fullImage];
    stretchableImage = [[UIImageResize resizedImageWithLeftCap:leftCap topCap:topCap image:theImage] retain];
    recapStretchableImage = NO;
  }
  return stretchableImage;
}

- (UIImage *)imageForSize:(CGSize)imageSize scalingStyle:(TiImageScalingStyle)scalingStyle
{

  if (scalingStyle == TiImageScalingStretch) {
    return [self stretchableImage];
  }

  CGSize fullImageSize = [[self fullImage] size];

  if (scalingStyle != TiImageScalingNonProportional) {
    BOOL validScale = NO;
    CGFloat scale = 1.0;

    if (imageSize.height > 1.0) {
      scale = imageSize.height / fullImageSize.height;
      validScale = YES;
    }
    if (imageSize.width > 1.0) {
      CGFloat widthScale = imageSize.width / fullImageSize.width;
      if (!validScale || (widthScale < scale)) {
        scale = widthScale;
        validScale = YES;
      }
    }

    if (validScale && ((scalingStyle != TiImageScalingThumbnail) || (scale < 1.0))) {
      imageSize = CGSizeMake(ceilf(scale * fullImageSize.width),
          ceilf(scale * fullImageSize.height));
    } else {
      imageSize = fullImageSize;
    }
  }

  if (CGSizeEqualToSize(imageSize, fullImageSize)) {
    return fullImage;
  }

  if (CGSizeEqualToSize(imageSize, [recentlyResizedImage size])) {
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

- (UIImage *)imageForSize:(CGSize)imageSize
{
  return [self imageForSize:imageSize scalingStyle:TiImageScalingDefault];
}

- (ImageCacheEntry *)initWithURL:(NSURL *)url
{
  if (self = [super init]) {
    remoteURL = [url retain];
    local = NO;

    if ([remoteURL isFileURL]) {
      localPath = [[remoteURL path] retain];
      local = YES;
      lastModified = [[[[NSFileManager defaultManager] attributesOfItemAtPath:localPath error:nil] objectForKey:NSFileModificationDate] retain];
    } else {
      localPath = [[ImageCacheEntry cachePathForURL:url] retain];
    }
  }
  return self;
}

- (void)dealloc
{
  RELEASE_TO_NIL(localPath);
  RELEASE_TO_NIL(recentlyResizedImage);
  RELEASE_TO_NIL(stretchableImage);
  RELEASE_TO_NIL(fullImage);
  RELEASE_TO_NIL(remoteURL);
  RELEASE_TO_NIL(lastModified);
  [super dealloc];
}

- (void)serialize:(NSData *)imageData
{
  if (!local && imageData != nil) {
    NSFileManager *fm = [NSFileManager defaultManager];
    NSString *path = localPath;
    if (hires) {
      if ([TiUtils is3xRetina]) { // Save as @3x w/retina-hd
        path = [NSString stringWithFormat:@"%@@3x.%@", [localPath stringByDeletingPathExtension], [localPath pathExtension]];
      } else if ([TiUtils is2xRetina]) { // Save as @2x w/retina
        path = [NSString stringWithFormat:@"%@@2x.%@", [localPath stringByDeletingPathExtension], [localPath pathExtension]];
      }
    }

    if ([fm isDeletableFileAtPath:path]) {
      [fm removeItemAtPath:path error:nil];
    }
    if (![fm createFileAtPath:path contents:imageData attributes:nil]) {
      NSLog(@"[ERROR] Unknown error serializing image %@ to path %@", remoteURL, path);
    }
  }
}

- (NSString *)description
{
  return [NSString stringWithFormat:@"<ImageCache:%@> %@[%@]", self, remoteURL, localPath];
}

+ (NSString *)cachePathForURL:(NSURL *)url
{
  if ([url isFileURL]) {
    return [url path];
  }

  NSFileManager *fm = [NSFileManager defaultManager];
  NSError *error = nil;

  NSURL *cacheFile = [fm URLForDirectory:NSCachesDirectory
                                inDomain:(NSUserDomainMask | NSLocalDomainMask)
                       appropriateForURL:nil
                                  create:YES
                                   error:&error];
  if (error != nil) {
    NSLog(@"[ERROR] Error finding cache directory: %@", [error localizedDescription]);
    return nil;
  }

  NSString *urlStr = [url absoluteString];
  const char *data = [urlStr UTF8String];
  NSString *md5key = [TiUtils md5:[NSData dataWithBytes:data length:strlen(data)]];

  cacheFile = [cacheFile URLByAppendingPathComponent:[NSString stringWithFormat:@"%@.%@", md5key, [url pathExtension]]];
  return [cacheFile path];
}

@end

ImageLoader *sharedLoader = nil;

@implementation ImageLoaderRequest

@synthesize completed, delegate, imageSize, request;

DEFINE_EXCEPTIONS

- (void)dealloc
{
  RELEASE_TO_NIL(request);
  RELEASE_TO_NIL(delegate);
  RELEASE_TO_NIL(userInfo);
  RELEASE_TO_NIL(url);
  [super dealloc];
}

- (id)initWithCallback:(NSObject<ImageLoaderDelegate> *)target_ userInfo:(id)userInfo_ url:(NSURL *)url_
{
  if (self = [super init]) {
    delegate = [target_ retain];
    userInfo = [userInfo_ retain];
    url = [url_ retain];
  }
  return self;
}

- (void)cancel
{
  cancelled = YES;
  [request abort];
  RELEASE_TO_NIL(request);
}

- (BOOL)cancelled
{
  return cancelled;
}

- (id)userInfo
{
  return userInfo;
}

- (NSURL *)url
{
  return url;
}

@end

@implementation ImageLoader

- (id)init
{
  if (self = [super init]) {
    WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(didReceiveMemoryWarning:)
                                                 name:UIApplicationDidReceiveMemoryWarningNotification
                                               object:nil];
    lock = [[NSRecursiveLock alloc] init];
  }
  return self;
}

- (void)dealloc
{
  WARN_IF_BACKGROUND_THREAD_OBJ; //NSNotificationCenter is not threadsafe!
  [[NSNotificationCenter defaultCenter] removeObserver:self
                                                  name:UIApplicationDidReceiveMemoryWarningNotification
                                                object:nil];
  RELEASE_TO_NIL(cache);
  RELEASE_TO_NIL(queue);
  RELEASE_TO_NIL(timeout);
  RELEASE_TO_NIL(lock);
  [super dealloc];
}

- (void)didReceiveMemoryWarning:(id)sender
{
#ifdef DEBUG_IMAGE_CACHE
  vm_statistics_data_t vmStats;
  mach_msg_type_number_t infoCount = HOST_VM_INFO_COUNT;
  kern_return_t kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);
  NSLog(@"[CACHE DEBUG] %d pages free before clearing image cache.", vmStats.free_count);
#endif

  [cache removeAllObjects];

#ifdef DEBUG_IMAGE_CACHE
  kernReturn = host_statistics(mach_host_self(), HOST_VM_INFO, (host_info_t)&vmStats, &infoCount);
  NSLog(@"[CACHE DEBUG] %d pages free after clearing image cache.", vmStats.free_count);
#endif
}

+ (ImageLoader *)sharedLoader
{
  // GCD allows single-dispatch predicates, specifically for situations like singleton initialization.
  // We should be switching to this pattern EVERYWHERE.

  static dispatch_once_t pred;
  dispatch_once(&pred, ^{
    sharedLoader = [[ImageLoader alloc] init];
  });
  return sharedLoader;
}

- (ImageCacheEntry *)setImage:(id)image forKey:(NSURL *)url hires:(BOOL)hires;
{
  NSString *urlString = [url absoluteString];
  if (image == nil) {
    return nil;
  }
  if (cache == nil) {
    cache = [[NSCache alloc] init];
    [cache setName:@"TiImageCache"];
#ifdef DEBUG_IMAGE_CACHE
    [cache setDelegate:self];
    NSLog(@"[CACHE DEBUG] Count limit: %d", [cache countLimit]);
    NSLog(@"[CACHE DEBUG] Cost limit: %d", [cache totalCostLimit]);
#endif
  }
  ImageCacheEntry *newEntry = [[[ImageCacheEntry alloc] initWithURL:url] autorelease];
  [newEntry setHires:hires];

  if ([image isKindOfClass:[UIImage class]]) {
    [newEntry setFullImage:image];
  } else if ([image isKindOfClass:[NSData class]]) {
    [newEntry setData:image];
  } else {
    DebugLog(@"[DEBUG] Unexpected image data type %@; not caching", [image class]);
    return nil;
  }

#ifdef DEBUG_IMAGE_CACHE
  NSLog(@"[CACHE DEBUG] Caching: %@", newEntry);
#endif

  [cache setObject:newEntry
            forKey:urlString];

  return newEntry;
}

- (void)purge:(NSURL *)url
{
  NSString *urlStr = [url absoluteString];
  [cache removeObjectForKey:urlStr];
}

- (CGFloat)imageScale:(UIImage *)image
{
  if ([image respondsToSelector:@selector(scale)]) {
    return [image scale];
  }
  return 1.0;
}

- (ImageCacheEntry *)entryForKey:(NSURL *)url
{
  if (url == nil) {
    return nil;
  }

  NSString *urlString = [url absoluteString];
  ImageCacheEntry *result = [cache objectForKey:urlString];

#ifdef DEBUG_IMAGE_CACHE
  NSLog(@"[CACHE DEBUG] cache[%@] : %@", urlString, result);
#endif
  if (result != nil) {
    if ([result local]) {
      NSError *error = nil;
      NSDate *currentTimeStamp = [[[NSFileManager defaultManager] attributesOfItemAtPath:result.localPath error:&error] objectForKey:NSFileModificationDate];

      if (![currentTimeStamp isEqualToDate:result.lastModified]) {
        //We should remove the cached image as the local file backing cached image has changed.
        [self purge:url];
        result = nil;
      }
    }
  }

  if (result == nil) {
    if ([url isFileURL]) // Load up straight from disk
    {
      NSString *path = [url path];
#ifdef DEBUG_IMAGE_CACHE
      NSLog(@"[CACHE DEBUG] Loading locally from path %@", path);
#endif
      BOOL scaleUp = NO;
      if (([TiUtils is2xRetina] && [path rangeOfString:@"@2x"].location != NSNotFound) || ([TiUtils is3xRetina] && [path rangeOfString:@"@3x"].location != NSNotFound)) {
        scaleUp = YES;
      }
      UIImage *resultImage = nil;
      NSRange range = [path rangeOfString:@".app"];
      NSString *imageArg = nil;
      if (range.location != NSNotFound) {
        imageArg = [path substringFromIndex:range.location + 5];
      }
      //remove suffixes.
      imageArg = [imageArg stringByReplacingOccurrencesOfString:@"@3x" withString:@""];
      imageArg = [imageArg stringByReplacingOccurrencesOfString:@"@2x" withString:@""];
      imageArg = [imageArg stringByReplacingOccurrencesOfString:@"~iphone" withString:@""];
      imageArg = [imageArg stringByReplacingOccurrencesOfString:@"~ipad" withString:@""];
      if (imageArg != nil) {
        unsigned char digest[CC_SHA1_DIGEST_LENGTH];
        NSData *stringBytes = [imageArg dataUsingEncoding:NSUTF8StringEncoding];
        if (CC_SHA1([stringBytes bytes], (CC_LONG)[stringBytes length], digest)) {
          // SHA-1 hash has been calculated and stored in 'digest'.
          NSMutableString *sha = [[NSMutableString alloc] init];
          for (int i = 0; i < CC_SHA1_DIGEST_LENGTH; i++) {
            [sha appendFormat:@"%02x", digest[i]];
          }
          [sha appendString:@"."];
          [sha appendString:[url pathExtension]];
          resultImage = [UIImage imageNamed:sha];
          RELEASE_TO_NIL(sha)
        }
      }
      if (resultImage == nil) {
        resultImage = [UIImage imageWithContentsOfFile:path];
      }
      if (scaleUp && [self imageScale:resultImage] == 1.0) {
        // on the ipad running iphone app in emulation mode, this won't exist when
        // do click 2x to scale it up so we have to check for this method
        if ([UIImage instancesRespondToSelector:@selector(imageWithCGImage:scale:orientation:)]) {
          // if we specified a 2x, we need to upscale it
          resultImage = [UIImage imageWithCGImage:[resultImage CGImage] scale:([TiUtils is3xRetina] ? 3.0 : 2.0)orientation:[resultImage imageOrientation]];
        }
      }
      result = [self setImage:resultImage forKey:url hires:NO];
    } else // Check and see if we cached a file to disk
    {
      NSString *diskCache = [ImageCacheEntry cachePathForURL:url];
      if ([[NSFileManager defaultManager] fileExistsAtPath:diskCache]) {
#ifdef DEBUG_IMAGE_CACHE
        NSLog(@"[CACHE DEBUG] Retrieving local image [prefetch]: %@", diskCache);
#endif
        UIImage *resultImage = [UIImage imageWithContentsOfFile:diskCache];
        result = [self setImage:resultImage forKey:url hires:NO];
      }
    }
  }

  return result;
}

- (id)cache:(id)image forURL:(NSURL *)url size:(CGSize)imageSize hires:(BOOL)hires
{
  return [[self setImage:image forKey:url hires:hires] imageForSize:imageSize];
}

- (id)cache:(id)image forURL:(NSURL *)url
{
  return [self cache:image forURL:url size:CGSizeZero hires:NO];
}

- (id)loadRemote:(NSURL *)url
{
  if (url == nil)
    return nil;
  UIImage *image = [[self entryForKey:url] imageForSize:CGSizeZero];
  if (image != nil) {
    return image;
  }

  APSHTTPRequest *req = [[[APSHTTPRequest alloc] init] autorelease];
  [req setUrl:url];
  [req setMethod:@"GET"];
  [req addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
  [req setSynchronous:YES];
  [[TiApp app] startNetwork];
  [req send];
  [[TiApp app] stopNetwork];

  if (req != nil && [[req response] error] == nil) {
    NSData *data = [[req response] responseData];
    UIImage *resultImage = [UIImage imageWithData:data];
    ImageCacheEntry *result = [self setImage:resultImage forKey:url hires:NO];
    [result setData:data];
    return [result imageForSize:CGSizeZero];
  }

  return nil;
}

- (UIImage *)loadImmediateImage:(NSURL *)url
{
  return [self loadImmediateImage:url withSize:CGSizeZero];
}

- (UIImage *)loadImmediateImage:(NSURL *)url withSize:(CGSize)imageSize
{
  return [[self entryForKey:url] imageForSize:imageSize];
}

- (UIImage *)loadImmediateStretchableImage:(NSURL *)url
{
  return [self loadImmediateStretchableImage:url withLeftCap:TiDimensionAuto topCap:TiDimensionAuto];
}

- (UIImage *)loadImmediateStretchableImage:(NSURL *)url withLeftCap:(TiDimension)left topCap:(TiDimension)top
{
  ImageCacheEntry *image = [self entryForKey:url];
  image.leftCap = left;
  image.topCap = top;
  return [image stretchableImage];
}

- (CGSize)fullImageSize:(NSURL *)url
{
  ImageCacheEntry *image = [self entryForKey:url];
  if (image != nil) {
    return [[image fullImage] size];
  } else {
    return CGSizeZero;
  }
}

- (void)notifyRequest:(ImageLoaderRequest *)request imageCompleted:(UIImage *)image
{
  [[request delegate] imageLoadSuccess:request image:image];
  [request setRequest:nil];
}

- (void)doImageLoader:(ImageLoaderRequest *)request
{
  NSURL *url = [request url];

  UIImage *image = [[self entryForKey:url] imageForSize:[request imageSize]];
  if (image != nil) {
    TiThreadPerformOnMainThread(^{
      [self notifyRequest:request imageCompleted:image];
    },
        NO);
    return;
  }

  // we don't have it local or in the cache so we need to fetch it remotely
  if (queue == nil) {
    queue = [[NSOperationQueue alloc] init];
    [queue setMaxConcurrentOperationCount:4];
  }

  NSDictionary *dict = [NSDictionary dictionaryWithObject:request forKey:@"request"];
  APSHTTPRequest *req = [[[APSHTTPRequest alloc] init] autorelease];
  [req setDelegate:self];
  [req setUrl:url];
  [req setUserInfo:dict];
  [req setMethod:@"GET"];
  [req addRequestHeader:@"User-Agent" value:[[TiApp app] userAgent]];
  [req setTimeout:20];
  [req setTheQueue:queue];
  [req send];
  [request setRequest:req];

  [[TiApp app] startNetwork];
}

- (ImageLoaderRequest *)loadImage:(NSURL *)url delegate:(NSObject<ImageLoaderDelegate> *)delegate userInfo:(NSDictionary *)userInfo
{
  ImageLoaderRequest *request = [[[ImageLoaderRequest alloc] initWithCallback:delegate userInfo:userInfo url:url] autorelease];

  // if have a queue and it's suspend, just throw our request
  // in the timeout queue until we're resumed
  if (queue != nil && [queue isSuspended]) {
    [lock lock];
    if (timeout == nil) {
      timeout = [[NSMutableArray alloc] initWithCapacity:4];
    }
    [timeout addObject:request];
    [lock unlock];
    return request;
  }

  [self doImageLoader:request];

  return request;
}

- (void)suspend
{
  [lock lock];
  if (queue != nil) {
    [queue setSuspended:YES];
  }
  [lock unlock];
}

- (void)cancel
{
  //NOTE: this should only be called on suspend
  //to cause the queue to be stopped
  [lock lock];
  if (queue != nil) {
    [queue cancelAllOperations];
  }
  [lock unlock];
}

- (void)resume
{
  [lock lock];

  if (queue != nil) {
    [queue setSuspended:NO];
  }

  if (timeout != nil) {
    for (ImageLoaderRequest *request in timeout) {
      if ([request cancelled]) {
        if ([[request delegate] respondsToSelector:@selector(imageLoadCancelled:)]) {
          [[request delegate] performSelector:@selector(imageLoadCancelled:) withObject:request];
        }
      } else {
        [self doImageLoader:request];
      }
    }
    [timeout removeAllObjects];
  }
  [lock unlock];
}

#pragma mark Delegates

- (void)request:(APSHTTPRequest *)request onLoad:(APSHTTPResponse *)response
{
  // hold while we're working with it (release below)
  [request retain];

  [[TiApp app] stopNetwork];
  ImageLoaderRequest *req = [[[request userInfo] objectForKey:@"request"] retain];
  if (![req cancelled]) {
    NSData *data = [response responseData];
    if (data == nil || [data length] == 0) {
      NSMutableDictionary *errorDetail = [NSMutableDictionary dictionary];
      [errorDetail setValue:@"Response returned nil" forKey:NSLocalizedDescriptionKey];
      NSError *error = [NSError errorWithDomain:@"com.appcelerator.titanium.imageloader" code:1 userInfo:errorDetail];
      [[req delegate] imageLoadFailed:req error:error];
      [request setUserInfo:nil];
      [request release];
      [req release];
      return;
    }

    // we want to be able to cache remote images so we need to
    // honor cache control parameters - however, we're only caching
    // for this session and not on disk so we ignore (potentially at a determinent?)
    // the actual max-age setting for now.
    BOOL cacheable = YES;
    NSString *cacheControl = [[response headers] objectForKey:@"Cache-Control"];
    if (cacheControl != nil) {
      // check to see if we're cacheable or not
      NSRange range = [cacheControl rangeOfString:@"max-age=0"];
      if (range.location != NSNotFound) {
        cacheable = NO;
      } else {
        range = [cacheControl rangeOfString:@"no-cache"];
        if (range.location != NSNotFound) {
          cacheable = NO;
        }
      }
    }

    // Previously, we were creating the image here, then caching the image, then setting the data.
    // This created TWO images in memory from the same binary data, which the system might not be
    // smart enough to avoid dual allocations of (and for big remote images: Obviously a problem).
    // So now, we cache (if we can) and then pull the created image, or just create the image if
    // we need to, and then dump the entry from the cache if there was a problem.

    UIImage *image = nil;

    if (cacheable) {
      BOOL hires = [TiUtils boolValue:[[req userInfo] valueForKey:@"hires"] def:NO];

      [self cache:data forURL:[req url] size:CGSizeZero hires:hires];
      ImageCacheEntry *entry = [self entryForKey:[req url]];

      image = [entry fullImage];
    } else {
      image = [UIImage imageWithData:data];
    }

    if (image == nil) {
      if (cacheable) {
        [self purge:[req url]];
      }

      NSMutableDictionary *errorDetail = [NSMutableDictionary dictionary];
      [errorDetail setValue:@"Returned invalid image data" forKey:NSLocalizedDescriptionKey];
      NSError *error = [NSError errorWithDomain:@"com.appcelerator.titanium.imageloader" code:1 userInfo:errorDetail];
      [[req delegate] imageLoadFailed:req error:error];
      [request setUserInfo:nil];
      [request release];
      [req release];
      return;
    }
    [self notifyRequest:req imageCompleted:image];
  }

  else {
    if ([[req delegate] respondsToSelector:@selector(imageLoadCancelled:)]) {
      [[req delegate] performSelector:@selector(imageLoadCancelled:) withObject:req];
    }
  }
  [request setUserInfo:nil];
  [request release];
  [req release];
}

- (void)request:(APSHTTPRequest *)request onError:(APSHTTPResponse *)response
{
  [[TiApp app] stopNetwork];
  ImageLoaderRequest *req = [[request userInfo] objectForKey:@"request"];

  if ([request cancelled]) {
    if ([[req delegate] respondsToSelector:@selector(imageLoadCancelled:)]) {
      [[req delegate] performSelector:@selector(imageLoadCancelled:) withObject:req];
    }
  } else {
    [[req delegate] imageLoadFailed:req error:[response error]];
  }
  [request setUserInfo:nil];
}

- (void)cache:(NSCache *)cache willEvictObject:(id)obj
{
#ifdef DEBUG_IMAGE_CACHE
  NSLog(@"[CACHE DEBUG] Purging image cache object %@", obj);
#endif
}

@end
