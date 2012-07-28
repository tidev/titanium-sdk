/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ASIHTTPRequest.h"
#import "ASINetworkQueue.h"
#import "TiDimension.h"

typedef enum {
	TiImageScalingDefault,
	TiImageScalingThumbnail,
	TiImageScalingNonProportional,
	TiImageScalingStretch,
}	TiImageScalingStyle;


@class ImageLoaderRequest;

/**
 Protocol for image loader delegate.
 */
@protocol ImageLoaderDelegate
@required

/**
 Tells the delegate that the image load request succeeded.
 @param request The load request.
 @param image The loaded image.
 */
-(void)imageLoadSuccess:(ImageLoaderRequest*)request image:(UIImage*)image;

/**
 Tells the delegate that the image load request failed.
 @param request The load request.
 @param error The error.
 */
-(void)imageLoadFailed:(ImageLoaderRequest*)request error:(NSError*)error;

@optional

/**
 Tells the delegate that the image load request has been cancelled.
 @param request The load request.
 */
-(void)imageLoadCancelled:(ImageLoaderRequest*)request;

@end

/**
 Image loader request class.
 */
@interface ImageLoaderRequest : NSObject {
@private
	ASIHTTPRequest *request;
	NSObject<ImageLoaderDelegate>* delegate;
	NSDictionary* userInfo;
	NSURL *url;
	CGSize imageSize;
	BOOL completed;
	BOOL cancelled;
}

@property(nonatomic,readwrite,retain) ASIHTTPRequest* request;

/**
 Whether or not the request has completed.
 @return _YES_ if the request has completed, _NO_ otherwise.
 */
@property(nonatomic,readwrite,assign) BOOL completed;

/**
 Returns loaded image size.
 @return The loaded image size 
 */
@property(nonatomic,readwrite,assign) CGSize imageSize;

/**
 Returns the request delegate.
 @return The request delegate.
 */
@property(nonatomic,readonly) NSObject<ImageLoaderDelegate>* delegate;

/**
 Cancels the request.
 */
-(void)cancel;

/**
 Whether or not the image load request was cancelled.
 @return _YES_ if request was cancelled, _NO_ otherwise.
 */
@property(nonatomic,readonly) BOOL cancelled;

/**
 Returns request additional properties.
 @return The dictionary of properties.
 */
@property(nonatomic,readonly) NSDictionary *userInfo;

/**
 Returns the request URL.
 @return The image URL.
 */
@property(nonatomic,readonly) NSURL *url;

@end

/**
 The ImageLoader class provides a centralized point for loading images in Titanium.
 Using ImageLoader is the preferred way for getting images from remote sources.
 
 The class is singleton and not supposed to be subclassed.
 The instance should not be instantiated directly, but lazily created with <sharedLoader>.
 */
@interface ImageLoader : NSObject<NSCacheDelegate> {
@private
	NSCache *cache;
	ASINetworkQueue* queue;
	NSMutableArray* timeout;
	NSRecursiveLock* lock;
}

/**
 Returns the shared instance of image loader.
 @return The shared instance.
 */
+(ImageLoader*)sharedLoader;

/**
 Tells the loader to load remote image from URL.
 @param url The image URL
 @return The loaded image.
 @see loadImage:delegate:userInfo:
*/
-(UIImage *)loadRemote:(NSURL*)url;

/**
 Tells the loader to return previously loaded image with URL.
 @param url The image URL
 @return The loaded image or _nil_ if the image is not available from the cache.
 @see loadRemote:
 */
-(UIImage *)loadImmediateImage:(NSURL *)url;

/**
 Tells the loader to return previously loaded image with URL and size.
 @param url The image URL
 @param imageSize The required image size.
 @return The loaded image or _nil_ if the image is not available from the cache.
 @see loadRemote:
 */
-(UIImage *)loadImmediateImage:(NSURL *)url withSize:(CGSize)imageSize;

/**
 Tells the loader to return previously loaded stretchable image with URL.
 @param url The image URL
 @return The loaded image or _nil_ if the image is not available from the cache.
 @see loadRemote:
 */
-(UIImage *)loadImmediateStretchableImage:(NSURL *)url;

/**
 Tells the loader to return previously loaded stretchable image with URL and specified cap values.
 @param url The image URL
 @param left The value to use for the left cap width. Specify 0 if you want the entire image to be horizontally stretchable.
 @param top The value to use for the top cap width. Specify 0 if you want the entire image to be vertically stretchable.
 @return The loaded image or _nil_ if the image is not available from cache.
 @see loadRemote:
 */
-(UIImage *)loadImmediateStretchableImage:(NSURL *)url withLeftCap:(TiDimension)left topCap:(TiDimension)top;

/**
 Returns the full image size.
 @param url The image URL
 @return The image size.
 */
-(CGSize)fullImageSize:(NSURL *)url;

/**
 Tells the loader to load image from URL with delegate.
 @param url The image URL.
 @param delegate The loader delegate.
 @param userInfo The additional properties to be assigned to the request.
 @return The image load request.
 @see loadRemote:
 */
-(ImageLoaderRequest*)loadImage:(NSURL*)url 
					   delegate:(NSObject<ImageLoaderDelegate>*)delegate 
					   userInfo:(NSDictionary*)userInfo;

/*
 Tells the image loader to suspend its activities.
 */
-(void)suspend;

/*
 Tells the image loader to resume its activities.
 */
-(void)resume;

/**
 Tells the image loader to cancel all activities.
 */
-(void)cancel;

@end
