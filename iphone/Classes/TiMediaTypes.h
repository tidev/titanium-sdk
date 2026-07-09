/**
 * Titanium SDK
 * Copyright TiDev, Inc. 04/07/2022-Present. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifndef TiMediaTypes_h
#define TiMediaTypes_h

#pragma mark VideoPlayer

typedef NS_ENUM(NSInteger, VideoTimeOption) {
  VideoTimeOptionNearestKeyFrame = 0,
  VideoTimeOptionExact,
};

typedef NS_ENUM(NSInteger, VideoRepeatMode) {
  VideoRepeatModeNone = 0,
  VideoRepeatModeOne,
};

typedef NS_ENUM(NSInteger, TiVideoPlayerPlaybackState) {
  TiVideoPlayerPlaybackStateUnknown = -1,
  TiVideoPlayerPlaybackStateStopped,
  TiVideoPlayerPlaybackStatePlaying,
  TiVideoPlayerPlaybackStatePaused,
  TiVideoPlayerPlaybackStateInterrupted,
  TiVideoPlayerPlaybackStateSeekingForward, // Not supported so far
  TiVideoPlayerPlaybackStateSeekingBackward, // Not supported so far
};

#pragma mark AudioRecorder

typedef enum {
  RecordStarted = 0,
  RecordStopped = 1,
  RecordPaused = 2
} RecorderState;

#pragma mark AudioPlayer

typedef NS_ENUM(NSInteger, TiAudioPlayerState) {
  TiAudioPlayerStateBuffering = 0,
  TiAudioPlayerStateInitialized,
  TiAudioPlayerStatePaused,
  TiAudioPlayerStatePlaying,
  TiAudioPlayerStateStartingFileThread,
  TiAudioPlayerStateStopped,
  TiAudioPlayerStateStopping,
  TiAudioPlayerStateWaitingForData, // Unused
  TiAudioPlayerStateWaitingForQueueToStart,
  TiAudioPlayerStateFlushingEOF, // Unused
};

#endif /* TiMediaTypes_h */
