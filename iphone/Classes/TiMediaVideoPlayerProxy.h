/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <MediaPlayer/MediaPlayer.h>
#import "TiProxy.h"
#import "TiColor.h"
#import "TiFile.h"

@interface TiMediaVideoPlayerProxy : TiProxy {
@private
	NSURL *url;
	MPMoviePlayerController *movie;
	TiColor *backgroundColor;
	MPMovieScalingMode scalingMode;
	MPMovieControlMode movieControlMode;
	NSTimeInterval initialPlaybackTime;
	BOOL playing;
	NSMutableArray *views;
	TiFile *tempFile;
}

@property(nonatomic,readwrite,assign) id url;
@property(nonatomic,readwrite,assign) TiColor* backgroundColor;
@property(nonatomic,readwrite,assign) NSNumber* scalingMode;
@property(nonatomic,readwrite,assign) NSNumber* movieControlMode;
@property(nonatomic,readwrite,assign) NSNumber* initialPlaybackTime;
@property(nonatomic,readonly) NSNumber* playing;

-(void)add:(id)proxy;
-(void)remove:(id)proxy;

@end
