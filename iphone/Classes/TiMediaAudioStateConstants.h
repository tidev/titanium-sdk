/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import <Foundation/Foundation.h>

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
