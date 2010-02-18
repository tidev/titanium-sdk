/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

extern NSString * const kTiMediaAudioSessionInterruptionBegin;
extern NSString * const kTiMediaAudioSessionInterruptionEnd;
extern NSString * const kTiMediaAudioSessionRouteChange;
extern NSString * const kTiMediaAudioSessionVolumeChange;

typedef enum
{
	TiMediaAudioSessionInputHeadsetInOut,
	TiMediaAudioSessionInputReceiverAndMicrophone,
	TiMediaAudioSessionInputHeadphonesAndMicrophone,
	TiMediaAudioSessionInputLineOut,
	TiMediaAudioSessionInputSpeaker,
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
}

+(TiMediaAudioSession*)sharedSession;

-(void)startAudioSession;
-(void)stopAudioSession;
-(void)record;
-(void)playback;
-(BOOL)isActive;
-(TiMediaAudioSessionInputType)inputType;
-(CGFloat)volume;
-(BOOL)isAudioPlaying;

@end
