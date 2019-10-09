/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_MEDIA) || (defined(USE_TI_MEDIAAUDIOPLAYER) || defined(USE_TI_MEDIAVIDEOPLAYER) || defined(USE_TI_MEDIASOUND) || defined(USE_TI_MEDIAAUDIORECORDER))

extern NSString *const kTiMediaAudioSessionInterruptionBegin;
extern NSString *const kTiMediaAudioSessionInterruptionEnd;
extern NSString *const kTiMediaAudioSessionRouteChange;
extern NSString *const kTiMediaAudioSessionVolumeChange;
extern NSString *const kTiMediaAudioSessionInputChange;

@interface TiMediaAudioSession : NSObject {
  @private
  NSInteger count;
  NSLock *lock;
}

@property (readwrite, assign) NSString *sessionMode;

+ (TiMediaAudioSession *)sharedSession;

- (void)startAudioSession;
- (void)stopAudioSession;
- (BOOL)canRecord;
- (BOOL)canPlayback;
- (BOOL)isActive;
- (NSDictionary *)currentRoute;
- (CGFloat)volume;
- (BOOL)isAudioPlaying;
- (BOOL)hasInput;
- (void)setRouteOverride:(UInt32)mode;

@end

#endif
