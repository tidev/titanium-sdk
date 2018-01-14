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
  _volume = [TiUtils doubleValue:@"volume" properties:properties def:1.0];
  _url = [[TiUtils toURL:[properties objectForKey:@"url"] proxy:self] retain];
}

- (void)_destroy
{
  if (_player != nil) {
    if (_state == AS_PLAYING || _state == AS_PAUSED) {
      [self stop:nil];
      [[TiMediaAudioSession sharedSession] stopAudioSession];
    }
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
    [_player addPeriodicTimeObserverForInterval:CMTimeMake(1, 1)
                                          queue:nil
                                     usingBlock:^(CMTime time) {
                                       [self fireEvent:@"progress" withObject:@{ @"progress" : NUMINT(CMTimeGetSeconds(time) * 1000) }];
                                     }];
  }
}

- (void)_listenerRemoved:(NSString *)type count:(int)count
{
  if (count == 0 && [type isEqualToString:@"progress"]) {
    [_player removeTimeObserver:_timeObserver];
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
    [_player setVolume:_volume];
    _state = AS_INITIALIZED;

    [self addNotificationObserver];
  }
  return _player;
}

#pragma mark Public APIs

- (void)setPaused:(NSNumber *)paused
{
  if (_player != nil) {
    if ([TiUtils boolValue:paused]) {
      [_player pause];
    } else {
      [_player play];
    }
  }
}

- (NSNumber *)waiting
{
  return NUMBOOL(_state == AS_STARTING_FILE_THREAD || _state == AS_WAITING_FOR_DATA || _state == AS_WAITING_FOR_QUEUE_TO_START || _state == AS_BUFFERING);
}

- (NSNumber *)idle
{
  return NUMBOOL(_state == AS_INITIALIZED);
}

- (NSNumber *)playing
{
  return NUMBOOL(_state == AS_PLAYING);
}

- (NSNumber *)paused
{
  return NUMBOOL(_state == AS_PAUSED);
}

- (NSNumber *)buffering
{
  return NUMBOOL(_state == AS_BUFFERING);
}

- (NSNumber *)bitRate
{
  return NUMFLOAT(_player.rate);
}

- (NSNumber *)progress
{
  return NUMDOUBLE(CMTimeGetSeconds([_player currentTime]) * 1000);
}

- (NSNumber *)state
{
  return NUMDOUBLE(_state);
}

- (NSNumber *)duration
{
  if (_player != nil) {
    if (CMTimeGetSeconds(_player.currentItem.duration) == CMTimeGetSeconds(kCMTimeIndefinite)) {
      _duration = 0.0;
    } else {
      // Convert duration to milliseconds (parity with progress/Android)
      _duration = (int)(CMTimeGetSeconds(_player.currentItem.duration) * 1000);
    }
  }
  return NUMDOUBLE(_duration);
}

- (NSNumber *)volume
{
  return NUMDOUBLE(_volume);
}

- (void)setVolume:(NSNumber *)newVolume
{
  _volume = [TiUtils doubleValue:newVolume def:_volume];
  if (_player != nil) {
    [_player setVolume:_volume];
  }
}

- (void)setBufferSize:(NSNumber *)bufferSize
{
  _bufferSize = [bufferSize doubleValue];
  if (_player != nil) {
    [[_player currentItem] setPreferredForwardBufferDuration:_bufferSize];
  }
}

- (NSNumber *)bufferSize
{
  // TODO: Validate that the default (0.0) matches the old behavior
  return NUMDOUBLE(_player.currentItem.preferredForwardBufferDuration);
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

- (void)play:(id)unused
{
  DEPRECATED_REPLACED(@"Media.AudioPlayer.play", @"7.1.0", @"Media.AudioPlayer.start");
  [self start:unused];
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
  // indicate we're going to start playing
  if (![[TiMediaAudioSession sharedSession] canPlayback]) {
    [self throwException:@"Improper audio session mode for playback"
               subreason:[[TiMediaAudioSession sharedSession] sessionMode]
                location:CODELOCATION];
  }

  if (_player == nil || !(_state == AS_PLAYING || _state == AS_PAUSED)) {
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
  if (_player != nil) {
    [_player pause];
    [_player seekToTime:kCMTimeZero];
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
  if (_player != nil) {
    [_player pause];
  }
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
  case AS_INITIALIZED:
    return NSLocalizedString(@"initialized", nil);
  case AS_STARTING_FILE_THREAD:
    return NSLocalizedString(@"starting", nil);
  case AS_WAITING_FOR_DATA:
    return NSLocalizedString(@"waiting_for_data", nil);
  case AS_WAITING_FOR_QUEUE_TO_START:
    return NSLocalizedString(@"waiting_for_queue", nil);
  case AS_PLAYING:
    return NSLocalizedString(@"playing", nil);
  case AS_BUFFERING:
    return NSLocalizedString(@"buffering", nil);
  case AS_STOPPING:
    return NSLocalizedString(@"stopping", nil);
  case AS_STOPPED:
    return NSLocalizedString(@"stopped", nil);
  case AS_PAUSED:
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
    [_player addObserver:self forKeyPath:@"timeControlStatus" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:self];
  } else {
    // iOS < 10: For playbackstate event
    [_player addObserver:self forKeyPath:@"rate" options:NSKeyValueObservingOptionNew | NSKeyValueObservingOptionOld context:nil];
  }

  // For "error" event
  [nc addObserver:self selector:@selector(handlePlayerErrorNotification:) name:AVPlayerItemFailedToPlayToEndTimeNotification object:_player.currentItem];

  // For "complete" event
  [nc addObserver:self selector:@selector(handlePlayerCompleteNotification:) name:AVPlayerItemDidPlayToEndTimeNotification object:_player.currentItem];

  // Buffering
  [_player.currentItem addObserver:self forKeyPath:@"playbackBufferEmpty" options:NSKeyValueObservingOptionNew context:nil];
  [_player.currentItem addObserver:self forKeyPath:@"playbackLikelyToKeepUp" options:NSKeyValueObservingOptionNew context:nil];
  [_player.currentItem addObserver:self forKeyPath:@"playbackBufferFull" options:NSKeyValueObservingOptionNew context:nil];
}

- (void)removeNotificationObserver
{
  NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];

  if ([TiUtils isIOS10OrGreater]) {
    [_player removeObserver:self forKeyPath:@"timeControlStatus"];
  } else {
    [_player removeObserver:self forKeyPath:@"rate"];
  }

  [nc removeObserver:self name:AVPlayerItemFailedToPlayToEndTimeNotification object:nil];
  [nc removeObserver:self name:AVPlayerItemDidPlayToEndTimeNotification object:nil];

  [_player removeObserver:self forKeyPath:@"playbackBufferEmpty"];
  [_player removeObserver:self forKeyPath:@"playbackLikelyToKeepUp"];
  [_player removeObserver:self forKeyPath:@"playbackBufferFull"];
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary<NSKeyValueChangeKey, id> *)change context:(void *)context
{
  if (object != _player.currentItem) {
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
    _state = AS_BUFFERING;
  }

  if ([keyPath isEqualToString:@"playbackBufferFull"] || [keyPath isEqualToString:@"playbackBufferFull"]) {
    _state = AS_WAITING_FOR_QUEUE_TO_START;
  }
}

// iOS < 10
- (void)handlePlaybackStateChangeNotification:(NSNotification *)note
{
  AudioStreamerState oldState = _state;

  switch (_player.status) {
  case AVPlayerStatusUnknown:
  case AVPlayerStatusFailed:
    _state = AS_STOPPED;
    break;
  case AVPlayerStatusReadyToPlay:
    if (_player.rate == 1.0) {
      _state = AS_PLAYING;
    } else if (_player.currentItem.duration.value == _player.currentItem.currentTime.value || !_player.currentItem.canStepBackward) {
      _state = AS_STOPPED;
    } else {
      _state = AS_PAUSED;
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
  AudioStreamerState oldState = _state;

  if (_player.timeControlStatus == AVPlayerTimeControlStatusPlaying) {
    _state = AS_PLAYING;
  } else if (_player.timeControlStatus == AVPlayerTimeControlStatusPaused) {
    if (_player.currentItem.duration.value == _player.currentItem.currentTime.value) {
      _state = AS_STOPPED;
    } else {
      _state = AS_PAUSED;
    }
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
  _state = AS_STOPPED;

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

MAKE_SYSTEM_PROP(STATE_INITIALIZED, AS_INITIALIZED);
MAKE_SYSTEM_PROP(STATE_STARTING, AS_STARTING_FILE_THREAD);
MAKE_SYSTEM_PROP(STATE_WAITING_FOR_DATA, AS_WAITING_FOR_DATA);
MAKE_SYSTEM_PROP(STATE_WAITING_FOR_QUEUE, AS_WAITING_FOR_QUEUE_TO_START);
MAKE_SYSTEM_PROP(STATE_PLAYING, AS_PLAYING);
MAKE_SYSTEM_PROP(STATE_BUFFERING, AS_BUFFERING);
MAKE_SYSTEM_PROP(STATE_STOPPING, AS_STOPPING);
MAKE_SYSTEM_PROP(STATE_STOPPED, AS_STOPPED);
MAKE_SYSTEM_PROP(STATE_PAUSED, AS_PAUSED);

@end

#endif
