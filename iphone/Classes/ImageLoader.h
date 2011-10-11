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

@protocol ImageLoaderDelegate
@required
-(void)imageLoadSuccess:(ImageLoaderRequest*)request image:(UIImage*)image;
-(void)imageLoadFailed:(ImageLoaderRequest*)request error:(NSError*)error;
@optional
-(void)imageLoadCancelled:(ImageLoaderRequest*)request;
@end

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

@property(nonatomic,readwrite,assign) BOOL completed;
@property(nonatomic,readwrite,assign) CGSize imageSize;
@property(nonatomic,readonly) NSObject<ImageLoaderDelegate>* delegate;

-(void)cancel;
-(BOOL)cancelled;
-(NSDictionary*)userInfo;
-(NSURL*)url;


@end

@interface ImageLoader : NSObject<NSCacheDelegate> {
@private
	NSCache *cache;
	ASINetworkQueue* queue;
	NSMutableArray* timeout;
	NSRecursiveLock* lock;
}

+(ImageLoader*)sharedLoader;

-(UIImage *)loadRemote:(NSURL*)url;
-(UIImage *)loadImmediateImage:(NSURL *)url;
-(UIImage *)loadImmediateImage:(NSURL *)url withSize:(CGSize)imageSize;
-(UIImage *)loadImmediateStretchableImage:(NSURL *)url;
-(UIImage *)loadImmediateStretchableImage:(NSURL *)url withLeftCap:(TiDimension)left topCap:(TiDimension)top;

-(CGSize)fullImageSize:(NSURL *)url;

-(ImageLoaderRequest*)loadImage:(NSURL*)url 
					   delegate:(NSObject<ImageLoaderDelegate>*)delegate 
					   userInfo:(NSDictionary*)userInfo;

-(void)suspend;
-(void)resume;
-(void)cancel;

@end
