/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_MEDIAAUDIOPLAYER

#import <AVKit/AVKit.h>

#import "TiMediaAudioPlayerProxy.h"
#import "TiMediaAudioSession.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiMediaAudioPlayerProxy

#pragma mark Internal

- (void)_initWithProperties:(NSDictionary *)properties
{
  [super _initWithProperties:properties];
  _url = [TiUtils toURL:[properties objectForKey:@"url"] proxy:self];
}

- (void)_destroy
{
  if (_state == TiAudioPlayerStatePlaying || _state == TiAudioPlayerStatePaused) {
    [self stop:nil];
  }

  [self removeNotificationObserver];
  [[NSNotificationCenter defaultCenter] removeObserver:self];

  _player = nil;
  [super _destroy];
}

- (NSString *)apiName
{
  return @"Ti.Media.AudioPlayer";
}

- (void)_listenerAdded:(NSString *)type count:(int)count
{
  if (count == 1 && [type isEqualToString:@"progress"]) {
    __weak TiMediaAudioPlayerProxy *weakSelf = self;
    _timeObserver = [[self player] addPeriodicTimeObserverForInterval:CMTimeMakeWithSeconds(1.0, NSEC_PER_SEC)
                                                                queue:nil
                                                           usingBlock:^(CMTime time) {
                                                             TiMediaAudioPlayerProxy *strongSelf = weakSelf;
                                                             [strongSelf fireEvent:@"progress"
                                                                        withObject:@{
                                                                          @"progress" : NUMINT(CMTimeGetSeconds(time) * 1000)
                                                                        }];
                                                           }];
  }
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  if (count == 0 && [type isEqualToString:@"progress"]) {
    [[self player] removeTimeObserver:_timeObserver];
    _timeObserver = nil;
  }
}

- (AVPlayer *)player
{
  if (_player == nil) {
    _player = [AVPlayer playerWithURL:_url];
    [self addNotificationObserver];
    _state = TiAudioPlayerStateInitialized;
  }
  return _player;
}

#pragma mark Deprecated APIs

- (void)setPaused:(NSNumber *)paused
{
  DEPRECATED_REPLACED(@"Media.AudioPlayer.setPaused", @"7.3.0", @"Media.AudioPlayer.pause");

  if ([TiUtils boolValue:paused]) {
    [[self player] pause];
  } else {
    [[self player] play];
  }
}

- (void)play:(id)unused
{
  DEPRECATED_REPLACED(@"Media.AudioPlayer.play", @"7.3.0", @"Media.AudioPlayer.start");
  [self start:unused];
}

#pragma mark Public APIs

- (NSNumber *)waiting
{
  return NUMBOOL(_state == TiAudioPlayerStateWaitingForQueueToStart || _state == TiAudioPlayerStateBuffering);
}

- (NSNumber *)idle
{
  return NUMBOOL(_state == TiAudioPlayerStateInitialized);
}

- (NSNumber *)playing
{
  return NUMBOOL(_state == TiAudioPlayerStatePlaying);
}

- (NSNumber *)buffering
{
  return NUMBOOL(_state == TiAudioPlayerStateBuffering);
}

- (NSNumber *)bitRate
{
  return NUMFLOAT([[self player] rate]);
}

- (NSNumber *)progress
{
  return NUMDOUBLE(CMTimeGetSeconds([[self player] currentTime]) * 1000);
}

- (NSNumber *)state
{
  return NUMDOUBLE(_state);
}

- (NSNumber *)duration
{
  if (CMTimeGetSeconds([[[self player] currentItem] duration]) == CMTimeGetSeconds(kCMTimeIndefinite)) {
    _duration = 0.0;
  } else {
    // Convert duration to milliseconds (parity with progress/Android)
    _duration = (int)(CMTimeGetSeconds([[[self player] currentItem] duration]) * 1000);
  }

  return NUMDOUBLE(_duration);
}

- (NSNumber *)paused
{
  return NUMBOOL(_state == TiAudioPlayerStatePaused);
}

- (NSNumber *)volume
{
  return NUMFLOAT([[self player] volume]);
}

- (void)setVolume:(NSNumber *)volume
{
  [[self player] setVolume:[TiUtils floatValue:volume def:1.0]];
}

- (void)setBufferSize:(NSNumber *)bufferSize
{
  [[[self player] currentItem] setPreferredForwardBufferDuration:[bufferSize doubleValue] * 1000];
}

- (void)setAllowsExternalPlayback:(NSNumber *)allowsExternalPlayback
{
  [[self player] setAllowsExternalPlayback:[TiUtils boolValue:allowsExternalPlayback]];
}

- (NSNumber *)allowsExternalPlayback
{
  return NUMBOOL([[self player] allowsExternalPlayback]);
}

- (void)setRate:(NSNumber *)rate
{
  [[self player] setRate:[TiUtils floatValue:rate]];
}

- (NSNumber *)rate
{
  return NUMFLOAT([[self player] rate]);
}

- (void)setMuted:(NSNumber *)muted
{
  [[self player] setMuted:[TiUtils boolValue:muted]];
}

- (NSNumber *)muted
{
  return NUMBOOL([[self player] isMuted]);
}

- (void)externalPlaybackActive
{
  return NUMBOOL([[self player] isExternalPlaybackActive]);
}

- (NSNumber *)bufferSize
{
  return NUMDOUBLE([[[self player] currentItem] preferredForwardBufferDuration]);
}

- (void)setUrl:(id)url
{
  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(^{
      [self setUrl:url];
    },
        YES);
    return;
  }

  ENSURE_SINGLE_ARG(url, NSString);
  _url = [TiUtils toURL:url proxy:self];

  // Properly clean up old observer before changing player item
  if (_player != nil) {
    // Remove old KVO-observer
    [self removeNotificationObserver];

    // Change player item
    [[self player] replaceCurrentItemWithPlayerItem:[AVPlayerItem playerItemWithURL:_url]];

    // Add new KVO-observer
    [self addNotificationObserver];

    // Restart (stop -> start) player
    [self restart:nil];
  }
}

- (NSString *)url
{
  return [_url absoluteString];
}

- (void)seekToTime:(id)time
{
  ENSURE_SINGLE_ARG(time, NSNumber);

  if (_player == nil) {
    return;
  }

  float formattedTime = [TiUtils floatValue:time] / 1000;
  __weak TiMediaAudioPlayerProxy *weakSelf = self;

  [_player seekToTime:CMTimeMake(formattedTime, 1)
      completionHandler:^(BOOL finished) {
        TiMediaAudioPlayerProxy *strongSelf = weakSelf;

        if ([strongSelf _hasListeners:@"seek"]) {
          [strongSelf fireEvent:@"seek" withObject:@{ @"finished" : NUMBOOL(finished) }];
        }
      }];
}

- (void)start:(id)unused
{
  if (_url == nil) {
    [self throwException:NSLocalizedString(@"Invalid URL passed to the audio-player", nil)
               subreason:NSLocalizedString(@"The \"url\" probably has not been set to a valid value.", nil)
                location:CODELOCATION];
  }

  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(^{
      [self start:unused];
    },
        YES);
    return;
  }

  _state = TiAudioPlayerStateStartingFileThread;

  // indicate we're going to start playing
  if (![[TiMediaAudioSession sharedSession] canPlayback]) {
    _state = TiAudioPlayerStateStopped;
    [self throwException:@"Improper audio session mode for playback"
               subreason:[[TiMediaAudioSession sharedSession] sessionMode]
                location:CODELOCATION];
  }

  if (_player == nil || !(_state == TiAudioPlayerStatePlaying || _state == TiAudioPlayerStatePaused)) {
    [[TiMediaAudioSession sharedSession] startAudioSession];
  }

  [[self player] play];
}

- (void)restart:(id)args
{
  [self stop:nil];
  [self start:nil];
}

- (void)stop:(id)unused
{
  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(^{
      [self stop:unused];
    },
        YES);
    return;
  }

  _state = TiAudioPlayerStateStopping;

  [[self player] pause];
  [[self player] seekToTime:kCMTimeZero];

  if ([[TiMediaAudioSession sharedSession] isActive]) {
    [[TiMediaAudioSession sharedSession] stopAudioSession];
  }
}

- (void)pause:(id)unused
{
  if (![NSThread isMainThread]) {
    TiThreadPerformOnMainThread(^{
      [self pause:unused];
    },
        YES);
    return;
  }

  [[self player] pause];
}

- (void)release:(id)unused
{
  [self stop:nil];
  _player = nil;
}

- (NSString *)stateDescription:(id)state
{
  ENSURE_SINGLE_ARG(state, NSNumber);
  return [TiMediaAudioPlayerProxy _stateToString:[TiUtils intValue:state]];
}

#pragma mark Utilities

+ (NSString *)_stateToString:(NSInteger)state
{
  switch (state) {
  case TiAudioPlayerStateInitialized:
    return NSLocalizedString(@"initialized", nil);
  case TiAudioPlayerStateStartingFileThread:
    return NSLocalizedString(@"starting", nil);
  case TiAudioPlayerStateWaitingForData:
    return NSLocalizedString(@"waiting_for_data", nil);
  case TiAudioPlayerStateWaitingForQueueToStart:
    return NSLocalizedString(@"waiting_for_queue", nil);
  case TiAudioPlayerStatePlaying:
    return NSLocalizedString(@"playing", nil);
  case TiAudioPlayerStateBuffering:
    return NSLocalizedString(@"buffering", nil);
  case TiAudioPlayerStateStopping:
    return NSLocalizedString(@"stopping", nil);
  case TiAudioPlayerStateStopped:
    return NSLocalizedString(@"stopped", nil);
  case TiAudioPlayerStatePaused:
    return NSLocalizedString(@"paused", nil);
  }
  return NSLocalizedString(@"unknown", nil);
}

#pragma mark Observer

- (void)addNotificationObserver
{
  WARN_IF_BACKGROUND_THREAD; //NSNotificationCenter is not threadsafe!
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

  // For playbackState property / playbackstate event
  [[self player] addObserver:self forKeyPath:@"timeControlStatus" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];

  // For "error" event
  [nc addObserver:self selector:@selector(handlePlayerErrorNotification:) name:AVPlayerItemFailedToPlayToEndTimeNotification object:_player.currentItem];

  // For "complete" event
  [nc addObserver:self selector:@selector(handlePlayerCompleteNotification:) name:AVPlayerItemDidPlayToEndTimeNotification object:_player.currentItem];

  // Buffering
  [[[self player] currentItem] addObserver:self forKeyPath:@"playbackBufferEmpty" options:NSKeyValueObservingOptionNew context:nil];
  [[[self player] currentItem] addObserver:self forKeyPath:@"playbackBufferFull" options:NSKeyValueObservingOptionNew context:nil];

  // Timed metadata
  [[[self player] currentItem] addObserver:self forKeyPath:@"timedMetadata" options:NSKeyValueObservingOptionNew context:nil];
}

- (void)removeNotificationObserver
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

  [nc removeObserver:self name:AVPlayerItemFailedToPlayToEndTimeNotification object:nil];
  [nc removeObserver:self name:AVPlayerItemDidPlayToEndTimeNotification object:nil];

  if (_player == nil) {
    return;
  }

  [[self player] removeObserver:self forKeyPath:@"timeControlStatus"];

  [[[self player] currentItem] removeObserver:self forKeyPath:@"playbackBufferEmpty"];
  [[[self player] currentItem] removeObserver:self forKeyPath:@"playbackBufferFull"];
  [[[self player] currentItem] removeObserver:self forKeyPath:@"timedMetadata"];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey, id> *)change context:(void *)context
{
  if (object == _player && [keyPath isEqualToString:@"timeControlStatus"]) {
    [self handleTimeControlStatusNotification:nil];
  }

  if (object == _player.currentItem && [keyPath isEqualToString:@"playbackBufferEmpty"]) {
    _state = TiAudioPlayerStateBuffering;
  }

  if (object == _player.currentItem && [keyPath isEqualToString:@"playbackBufferFull"]) {
    _state = TiAudioPlayerStateWaitingForQueueToStart;
  }

  if (object == _player.currentItem && [keyPath isEqualToString:@"timedMetadata"]) {
    [self handleTimedMetadataNotification:_player.currentItem];
  }
}

// iOS < 10
- (void)handlePlaybackStateChangeNotification:(NSNotification *)note
{
  TiAudioPlayerState oldState = _state;

  switch (_player.status) {
  case AVPlayerStatusUnknown:
  case AVPlayerStatusFailed:
    _state = TiAudioPlayerStateStopped;
    break;
  case AVPlayerStatusReadyToPlay:
    if (_player.rate == 1.0) {
      _state = TiAudioPlayerStatePlaying;
    } else if (_player.currentItem.currentTime.value == 0 || oldState == TiAudioPlayerStateStopping) {
      _state = TiAudioPlayerStateStopped;
    } else {
      _state = TiAudioPlayerStatePaused;
    }
    break;
  }

  if ([self _hasListeners:@"change"] && oldState != _state) {
    [self fireEvent:@"change"
         withObject:@{
           @"state" : NUMINTEGER(_state),
           @"description" : [TiMediaAudioPlayerProxy _stateToString:_state]
         }];
  }
}

// iOS 10+
- (void)handleTimeControlStatusNotification:(NSNotification *)note
{
  TiAudioPlayerState oldState = _state;

  if (_player.timeControlStatus == AVPlayerTimeControlStatusPlaying) {
    _state = TiAudioPlayerStatePlaying;
  } else if (_player.timeControlStatus == AVPlayerTimeControlStatusPaused) {
    if (_player.currentItem.currentTime.value == 0.0 || oldState == TiAudioPlayerStateStopping) {
      _state = TiAudioPlayerStateStopped;
    } else {
      _state = TiAudioPlayerStatePaused;
    }
  } else if (_player.timeControlStatus == AVPlayerTimeControlStatusWaitingToPlayAtSpecifiedRate) {
    _state = TiAudioPlayerStateWaitingForQueueToStart;
  }

  if ([self _hasListeners:@"change"] && oldState != _state) {
    [self fireEvent:@"change"
         withObject:@{
           @"state" : NUMINTEGER(_state),
           @"description" : [TiMediaAudioPlayerProxy _stateToString:_state]
         }];
  }
}

#pragma mark Events

- (void)handlePlayerErrorNotification:(NSNotification *)note
{
  NSError *error = note.userInfo[AVPlayerItemFailedToPlayToEndTimeErrorKey];
  _state = TiAudioPlayerStateStopped;

  if ([self _hasListeners:@"error"]) {
    [self fireEvent:@"error" withObject:@{ @"error" : error.localizedDescription }];
  }
}

- (void)handleTimedMetadataNotification:(AVPlayerItem *)playerItem
{
  if (![self _hasListeners:@"metadata"]) {
    return;
  }

  NSMutableArray *result = [NSMutableArray arrayWithCapacity:playerItem.timedMetadata.count];

  for (AVMetadataItem *metadata in playerItem.timedMetadata) {
    [result addObject:@{
      @"key" : metadata.key,
      @"keySpace" : metadata.keySpace,
      @"value" : metadata.value,
      @"extraAttributes" : metadata.extraAttributes
    }];
  }

  [self fireEvent:@"metadata" withObject:@{ @"items" : result }];
}

- (void)handlePlayerCompleteNotification:(NSNotification *)note
{
  if ([self _hasListeners:@"complete"]) {
    NSMutableDictionary *event = [NSMutableDictionary dictionaryWithObjectsAndKeys:NUMBOOL(_player.error == nil), @"success", nil];
    if (_player.error != nil) {
      [event setObject:_player.error.localizedDescription forKey:@"error"];
      [event setObject:NUMINTEGER(_player.error.code) forKey:@"code"];
    }
    [self fireEvent:@"complete" withObject:event];
  }
}

#pragma mark Constants

MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_INITIALIZED, TiAudioPlayerStateInitialized, @"Media.AudioPlayer.STATE_INITIALIZED", @"7.3.0", @"Media.AUDIO_STATE_INITIALIZED");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_STARTING, TiAudioPlayerStateStartingFileThread, @"Media.AudioPlayer.STATE_STARTING", @"7.3.0", @"Media.STATE_STARTING");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_WAITING_FOR_DATA, TiAudioPlayerStateWaitingForData, @"Media.AudioPlayer.STATE_WAITING_FOR_DATA", @"7.3.0", @"Media.AUDIO_STATE_WAITING_FOR_DATA");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_WAITING_FOR_QUEUE, TiAudioPlayerStateWaitingForQueueToStart, @"Media.AudioPlayer.STATE_WAITING_FOR_QUEUE", @"7.3.0", @"Media.AUDIO_STATE_WAITING_FOR_QUEUE");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_PLAYING, TiAudioPlayerStatePlaying, @"Media.AudioPlayer.STATE_PLAYING", @"7.3.0", @"Media.AUDIO_STATE_PLAYING");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_BUFFERING, TiAudioPlayerStateBuffering, @"Media.AudioPlayer.STATE_BUFFERING", @"7.3.0", @"Media.AUDIO_STATE_BUFFERING");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_STOPPING, TiAudioPlayerStateStopping, @"Media.AudioPlayer.STATE_STOPPING", @"7.3.0", @"Media.AUDIO_STATE_STOPPING");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_STOPPED, TiAudioPlayerStateStopped, @"Media.AudioPlayer.STATE_STOPPED", @"7.3.0", @"Media.AUDIO_STATE_STOPPED");
MAKE_SYSTEM_PROP_DEPRECATED_REPLACED(STATE_PAUSED, TiAudioPlayerStatePaused, @"Media.AudioPlayer.STATE_PAUSED", @"7.3.0", @"Media.AUDIO_STATE_PAUSED");

@end

#endif
