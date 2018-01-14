/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIAAUDIOPLAYER

#import "TiProxy.h"

typedef NS_ENUM(NSInteger, AudioStreamerState) {
  AS_INITIALIZED = 0,
  AS_STARTING_FILE_THREAD,
  AS_WAITING_FOR_DATA,
  AS_FLUSHING_EOF,
  AS_WAITING_FOR_QUEUE_TO_START,
  AS_PLAYING,
  AS_BUFFERING,
  AS_STOPPING,
  AS_STOPPED,
  AS_PAUSED
};

@class AVPlayer;

@interface TiMediaAudioPlayerProxy : TiProxy {
  @private
  AVPlayer *_player;
  NSURL *_url;
  double _bufferSize;
  double _volume;
  double _duration;
  BOOL _progress;
  id _timeObserver;
  AudioStreamerState _state;
}

@end

#endif
