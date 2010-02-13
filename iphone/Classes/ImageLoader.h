/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@interface ImageLoader : NSObject {
@private
	NSMutableDictionary *cache;
}

+(ImageLoader*)sharedLoader;

-(UIImage *)loadRemote:(NSURL*)url;
-(UIImage *)loadImmediateImage:(NSURL *)url;
-(UIImage *)loadImmediateStretchableImage:(NSURL *)url;

-(void)loadImage:(NSURL*)url callback:(id)callback selector:(SEL)selector;

@end
