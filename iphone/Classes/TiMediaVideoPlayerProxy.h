/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import <MediaPlayer/MediaPlayer.h>
#import "TiViewProxy.h"
#import "TiColor.h"
#import "TiFile.h"

@interface TiMediaVideoPlayerProxy : TiViewProxy {
@private
	NSURL *url;
	MPMoviePlayerController *movie;
	TiColor *backgroundColor;
	MPMovieScalingMode scalingMode;
	MPMovieControlMode movieControlMode;
	MPMovieControlStyle movieControlStyle;
	NSTimeInterval initialPlaybackTime;
	BOOL playing;
	NSMutableArray *views;
	TiFile *tempFile;
#ifdef IPAD
	KrollCallback *thumbnailCallback;
#endif
}

@property(nonatomic,readwrite,assign) id url;
@property(nonatomic,readwrite,assign) TiColor* backgroundColor;
@property(nonatomic,readwrite,assign) NSNumber* scalingMode;
@property(nonatomic,readwrite,assign) NSNumber* initialPlaybackTime;
@property(nonatomic,readonly) NSNumber* playing;

-(void)add:(id)proxy;
-(void)remove:(id)proxy;


// this was deprecated in 3.2 but kept around for older devices
@property(nonatomic,readwrite,assign) NSNumber* movieControlMode;

// introduced in 3.2
@property(nonatomic,readwrite,assign) NSNumber* movieControlStyle;


@end
