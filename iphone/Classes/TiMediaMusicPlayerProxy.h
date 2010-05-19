/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import <Foundation/Foundation.h>
#import <MediaPlayer/MediaPlayer.h>
#import "TiProxy.h"
#import "TiMediaItem.h"

@interface TiMediaMusicPlayerProxy : TiProxy {
	MPMusicPlayerController* player;
	BOOL configured; // Prevent changing the player
}

-(void)play:(id)unused;
-(void)pause:(id)unused;
-(void)stop:(id)unused;

-(void)seekForward:(id)unused;
-(void)seekBackward:(id)unusued;
-(void)stopSeeking:(id)unused;

-(void)skipToNext:(id)unused;
-(void)skipToBeginning:(id)unused;
-(void)skipToPrevious:(id)unused;

-(void)setQueue:(id)arg;

@property(nonatomic,assign) NSNumber* currentPlaybackTime;
@property(nonatomic,readonly) NSNumber* playbackState;
@property(nonatomic,assign) NSNumber* repeatMode;
@property(nonatomic,assign) NSNumber* shuffleMode;
@property(nonatomic,assign) NSNumber* volume;
@property(nonatomic,readonly) TiMediaItem* nowPlaying;

@end

#endif