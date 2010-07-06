/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

extern NSString * const kTiMediaAudioSessionInterruptionBegin;
extern NSString * const kTiMediaAudioSessionInterruptionEnd;
extern NSString * const kTiMediaAudioSessionRouteChange;
extern NSString * const kTiMediaAudioSessionVolumeChange;
extern NSString * const kTiMediaAudioSessionInputChange;

typedef enum
{
	TiMediaAudioSessionInputHeadsetInOut,
	TiMediaAudioSessionInputReceiverAndMicrophone,
	TiMediaAudioSessionInputHeadphonesAndMicrophone,
	TiMediaAudioSessionInputLineOut,
	TiMediaAudioSessionInputSpeaker,
	TiMediaAudioSessionInputHeadphones,
	TiMediaAudioSessionInputMicrophoneBuiltin,
	TiMediaAudioSessionInputMuted,
	TiMediaAudioSessionInputUnavailable,
	TiMediaAudioSessionInputUnknown
}
TiMediaAudioSessionInputType;


@interface TiMediaAudioSession : NSObject {
@private
	NSInteger count;
	NSLock *lock;
    UInt32 defaultSessionMode;
}

+(TiMediaAudioSession*)sharedSession;

@property (nonatomic,readwrite) UInt32 defaultSessionMode;

-(void)startAudioSession;
-(void)stopAudioSession;
-(void)record:(UInt32)mode;
-(void)playback:(UInt32)mode;
-(BOOL)isActive;
-(TiMediaAudioSessionInputType)inputType;
-(CGFloat)volume;
-(BOOL)isAudioPlaying;
-(BOOL)hasInput;

@end

#endif