/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIAAUDIOPLAYER

#import "TiMediaTypes.h"
#import <TitaniumKit/TiProxy.h>

@class AVPlayer;

@interface TiMediaAudioPlayerProxy : TiProxy {
  @private
  AVPlayer *_player;
  NSURL *_url;
  double _duration;
  id _timeObserver;
  TiAudioPlayerState _state;
}

- (void)setPaused:(NSNumber *)paused __deprecated_msg("Deprecated in favor of pause()");

- (void)play:(id)unused __deprecated_msg("Deprecated in favor of start()");

- (NSNumber *)waiting;

- (NSNumber *)idle;

- (NSNumber *)playing;

- (NSNumber *)paused;

- (NSNumber *)buffering;

- (NSNumber *)bitRate;

- (NSNumber *)progress;

- (NSNumber *)state;

- (NSNumber *)duration;

- (NSNumber *)volume;

- (void)setVolume:(NSNumber *)volume;

- (void)setBufferSize:(NSNumber *)bufferSize;

- (void)setAllowsExternalPlayback:(NSNumber *)allowsExternalPlayback;

- (NSNumber *)allowsExternalPlayback;

- (void)setRate:(NSNumber *)rate;

- (NSNumber *)rate;

- (void)setMuted:(NSNumber *)muted;

- (NSNumber *)muted;

- (void)externalPlaybackActive;

- (NSNumber *)bufferSize;

- (void)setUrl:(id)url;

- (NSString *)url;

- (void)seekToTime:(id)time;

- (void)start:(id)unused;

- (void)restart:(id)args;

- (void)stop:(id)unused;

- (void)pause:(id)unused;

- (void)release:(id)unused;

- (NSString *)stateDescription:(id)state;

@end

#endif
