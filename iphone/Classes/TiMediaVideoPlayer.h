/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiUIView.h"
#import <MediaPlayer/MediaPlayer.h>

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_3_2

@interface TiMediaVideoPlayer : TiUIView {
@private
	MPMoviePlayerController *controller;
}

-(id)initWithPlayer:(MPMoviePlayerController*)controller;

@end

#endif