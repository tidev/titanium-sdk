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
#import "TiUtils.h"

@implementation TiMediaAudioPlayerProxy

#pragma mark Internal

- (void)_initWithProperties:(NSDictionary *)properties
{
  [super _initWithProperties:properties];
  _url = [[TiUtils toURL:[properties objectForKey:@"url"] proxy:self] retain];
}

- (void)_destroy
{
    if (_state == TiAudioPlayerStatePlaying || _state == TiAudioPlayerStatePaused) {
      [self stop:nil];
      [[TiMediaAudioSession sharedSession] stopAudioSession];
    }

  [self removeNotificationObserver];

  RELEASE_TO_NIL(_player);
  [super _destroy];
}

- (NSString *)apiName
{
  return @"Ti.Media.AudioPlayer";
}

- (void)_listenerAdded:(NSString *)type count:(int)count
{
  if (count == 1 && [type isEqualToString:@"progress"]) {
    [[self player] addPeriodicTimeObserverForInterval:CMTimeMake(1, 1)
                                          queue:nil
                                     usingBlock:^(CMTime time) {
                                       [self fireEvent:@"progress" withObject:@{ @"progress" : NUMINT(CMTimeGetSeconds(time) * 1000) }];
                                     }];
  }
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  if (count == 0 && [type isEqualToString:@"progress"]) {
    [[self player] removeTimeObserver:_timeObserver];
    RELEASE_TO_NIL(_timeObserver);
  }
}

- (AVPlayer *)player
{
  if (_player == nil) {
    if (_url == nil) {
      [self throwException:NSLocalizedString(@"invalid url", nil) subreason:NSLocalizedString(@"url has not been set", nil) location:CODELOCATION];
    }
    _player = [AVPlayer playerWithURL:_url];
    [self addNotificationObserver];
    _state = TiAudioPlayerStateInitialized;
  }
  return _player;
}

#pragma mark Deprecated APIs

- (void)setPaused:(NSNumber *)paused
{
  DEPRECATED_REPLACED(@"Media.AudioPlayer.setPaused", @"7.1.0", @"Media.AudioPlayer.pause");
  
  if ([TiUtils boolValue:paused]) {
    [[self player] pause];
  } else {
    [[self player] play];
  }
}

- (void)play:(id)unused
{
  DEPRECATED_REPLACED(@"Media.AudioPlayer.play", @"7.1.0", @"Media.AudioPlayer.start");
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

  RELEASE_TO_NIL(_url);
  ENSURE_SINGLE_ARG(url, NSString);
  _url = [[TiUtils toURL:url proxy:self] retain];

  if (_player != nil) {
    [self restart:nil];
  }
}

- (NSURL *)url
{
  return _url;
}

- (void)seekToTime:(id)time
{
  ENSURE_SINGLE_ARG(time, NSNumber);
  
  if (_player == nil) {
    return;
  }
  
  float formattedTime = [TiUtils floatValue:time] / 1000;
  
  [_player seekToTime:CMTimeMake(formattedTime, 1) completionHandler:^(BOOL finished) {
    if ([self _hasListeners:@"seek"]) {
      [self fireEvent:@"seek" withObject:@{ @"finished": NUMBOOL(finished) }];
    }
  }];
}

- (void)start:(id)unused
{
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

  [[self player] pause];
  [[self player] seekToTime:kCMTimeZero];
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

  // The AVPlayer does not properly support state management on iOS < 10.
  // Remove this once we bump the minimum iOS version to 10+.
  if ([TiUtils isIOS10OrGreater]) {
    // iOS 10+: For playbackState property / playbackstate event
    [[self player] addObserver:self forKeyPath:@"timeControlStatus" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:self];
  } else {
    // iOS < 10: For playbackstate event
    [[self player] addObserver:self forKeyPath:@"rate" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
  }

  // For "error" event
  [nc addObserver:self selector:@selector(handlePlayerErrorNotification:) name:AVPlayerItemFailedToPlayToEndTimeNotification object:_player.currentItem];

  // For "complete" event
  [nc addObserver:self selector:@selector(handlePlayerCompleteNotification:) name:AVPlayerItemDidPlayToEndTimeNotification object:_player.currentItem];

  // Buffering
  [[[self player] currentItem] addObserver:self forKeyPath:@"playbackBufferEmpty" options:NSKeyValueObservingOptionNew context:nil];
  [[[self player] currentItem] addObserver:self forKeyPath:@"playbackLikelyToKeepUp" options:NSKeyValueObservingOptionNew context:nil];
  [[[self player] currentItem] addObserver:self forKeyPath:@"playbackBufferFull" options:NSKeyValueObservingOptionNew context:nil];
}

- (void)removeNotificationObserver
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

  if ([TiUtils isIOS10OrGreater]) {
    [[self player] removeObserver:self forKeyPath:@"timeControlStatus"];
  } else {
    [[self player] removeObserver:self forKeyPath:@"rate"];
  }

  [nc removeObserver:self name:AVPlayerItemFailedToPlayToEndTimeNotification object:nil];
  [nc removeObserver:self name:AVPlayerItemDidPlayToEndTimeNotification object:nil];

  [[self player] removeObserver:self forKeyPath:@"playbackBufferEmpty"];
  [[self player] removeObserver:self forKeyPath:@"playbackLikelyToKeepUp"];
  [[self player] removeObserver:self forKeyPath:@"playbackBufferFull"];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey, id> *)change context:(void *)context
{
  if (object != [[self player] currentItem]) {
    return;
  }

  if ([TiUtils isIOS10OrGreater]) {
    if ([keyPath isEqualToString:@"player.timeControlStatus"]) {
      [self handleTimeControlStatusNotification:nil];
    }
  } else {
    if ([keyPath isEqualToString:@"player.rate"]) {
      [self handlePlaybackStateChangeNotification:nil];
    }
  }

  if ([keyPath isEqualToString:@"playbackBufferEmpty"]) {
    _state = TiAudioPlayerStateBuffering;
  }

  if ([keyPath isEqualToString:@"playbackBufferFull"] || [keyPath isEqualToString:@"playbackBufferFull"]) {
    _state = TiAudioPlayerStateWaitingForQueueToStart;
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
    } else if (_player.currentItem.duration.value == _player.currentItem.currentTime.value || !_player.currentItem.canStepBackward) {
      _state = TiAudioPlayerStateStopped;
    } else {
      _state = TiAudioPlayerStatePaused;
    }
    break;
  }

  if ([self _hasListeners:@"change"] && oldState != _state) {
    [self fireEvent:@"playbackstate"
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
    if (_player.currentItem.duration.value == _player.currentItem.currentTime.value) {
      _state = TiAudioPlayerStateStopped;
    } else {
      _state = TiAudioPlayerStatePaused;
    }
  } else if (_player.timeControlStatus == AVPlayerTimeControlStatusWaitingToPlayAtSpecifiedRate) {
    _state = TiAudioPlayerStateWaitingForQueueToStart;
  }

  if ([self _hasListeners:@"change"] && oldState != _state) {
    [self fireEvent:@"playbackstate"
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

MAKE_SYSTEM_PROP(STATE_INITIALIZED, TiAudioPlayerStateInitialized);
MAKE_SYSTEM_PROP(STATE_STARTING, TiAudioPlayerStateStartingFileThread);
MAKE_SYSTEM_PROP(STATE_WAITING_FOR_DATA, TiAudioPlayerStateWaitingForData);
MAKE_SYSTEM_PROP(STATE_WAITING_FOR_QUEUE, TiAudioPlayerStateWaitingForQueueToStart);
MAKE_SYSTEM_PROP(STATE_PLAYING, TiAudioPlayerStatePlaying);
MAKE_SYSTEM_PROP(STATE_BUFFERING, TiAudioPlayerStateBuffering);
MAKE_SYSTEM_PROP(STATE_STOPPING, TiAudioPlayerStateStopping);
MAKE_SYSTEM_PROP(STATE_STOPPED, TiAudioPlayerStateStopped);
MAKE_SYSTEM_PROP(STATE_PAUSED, TiAudioPlayerStatePaused);

@end

#endif
