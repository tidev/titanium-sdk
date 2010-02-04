/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#import "TiProxy.h"
#import <AVFoundation/AVAudioPlayer.h>

@interface TiMediaSoundProxy : TiProxy<AVAudioPlayerDelegate> 
{
@private
	NSURL *url;
	AVAudioPlayer * player;
	BOOL paused;
	BOOL looping;
	CGFloat volume;
	CGFloat resumeTime;
}

@property (nonatomic,readwrite,assign) NSNumber *volume;
@property (nonatomic,readonly) NSURL *url;

@property (nonatomic,readwrite,assign,getter=isLooping) NSNumber *looping;
@property (nonatomic,readwrite,assign,getter=isPaused)  NSNumber *paused;
@property (nonatomic,readonly,getter=isPlaying) NSNumber *playing;

@property (nonatomic,readonly) NSNumber *duration;
@property (nonatomic,readwrite,assign) NSNumber *time;

@end

