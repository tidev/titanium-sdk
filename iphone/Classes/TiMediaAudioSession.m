/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMediaAudioSession.h"
#import "TiUtils.h"
#include <AudioToolbox/AudioToolbox.h>

NSString * const kTiMediaAudioSessionInterruptionBegin = @"TiMediaAudioSessionInterruptionBegin";
NSString * const kTiMediaAudioSessionInterruptionEnd = @"TiMediaAudioSessionInterruptionEnd";
NSString * const kTiMediaAudioSessionRouteChange = @"TiMediaAudioSessionRouteChange";
NSString * const kTiMediaAudioSessionVolumeChange = @"TiMediaAudioSessionVolumeChange";

void TiAudioSessionInterruptionCallback(void *inUserData,UInt32 interruptionState)
{
	TiMediaAudioSession* session = (TiMediaAudioSession*)inUserData;
	if ([session isActive])
	{
		if (interruptionState == kAudioSessionBeginInterruption)
		{
			[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionInterruptionBegin object:session];
		}
		else if (interruptionState == kAudioSessionEndInterruption)
		{
			[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionInterruptionEnd object:session];
		}
	}
}

void TiAudioSessionAudioVolumeCallback(void *inUserData, AudioSessionPropertyID prop, UInt32 size, const void *inData)
{
	TiMediaAudioSession* session = (TiMediaAudioSession*)inUserData;
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionVolumeChange object:session];
}

void TiAudioSessionAudioRouteChangeCallback(void *inUserData, AudioSessionPropertyID prop, UInt32 size, const void *inData)
{
	TiMediaAudioSession* session = (TiMediaAudioSession*)inUserData;
	NSDictionary *dict = (NSDictionary*)inData;
	NSMutableDictionary *event = [NSMutableDictionary dictionary];
	id reasonValue = [dict objectForKey:@"OutputDeviceDidChange_Reason"];
	int reasonint = [TiUtils intValue:reasonValue];
	id reason;
	switch(reasonint)
	{
		case kAudioSessionRouteChangeReason_Unknown:
		{
			reason = @"unknown";
			break;
		}
		case kAudioSessionRouteChangeReason_NewDeviceAvailable:
		{
			reason = @"newdevice_available";
			break;
		}
		case kAudioSessionRouteChangeReason_OldDeviceUnavailable:
		{
			reason = @"olddevice_unvailable";
			break;
		}
		case kAudioSessionRouteChangeReason_CategoryChange:
		{
			reason = @"category_changed";
			break;
		}
		case kAudioSessionRouteChangeReason_Override:
		{
			reason = @"override";
			break;
		}
		case kAudioSessionRouteChangeReason_WakeFromSleep:
		{
			reason = @"wake_from_sleep";
			break;
		}
		case kAudioSessionRouteChangeReason_NoSuitableRouteForCategory:
		{
			reason = @"no_route_for_category";
			break;
		}
		default:
		{
			// seems like 5 is a mute switch
			reason = @"silence_change";
			break;
		}
	}
	[event setObject:[dict objectForKey:@"OutputDeviceDidChange_OldRoute"] forKey:@"oldRoute"];
	[event setObject:reason forKey:@"reason"];
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionRouteChange object:session userInfo:event];
}

@implementation TiMediaAudioSession

-(id)init
{
	if (self = [super init])
	{
		count = 0;
		lock = [[NSLock alloc] init];
	}
	return self;
}

+(TiMediaAudioSession*)sharedSession
{
	static TiMediaAudioSession *session = nil;
	if (session == nil)
	{
		session = [[TiMediaAudioSession alloc] init];
	}
	return session;
}

-(BOOL)isActive
{
	BOOL active;
	[lock lock];
	active = count > 0;
	[lock unlock];
	return active;
}

-(BOOL)isAudioPlaying
{
	// returns YES if audio is currently playing
	UInt32 size, playing;
	size = sizeof(UInt32);
	AudioSessionGetProperty(kAudioSessionProperty_OtherAudioIsPlaying, &size, &playing);
	return playing;
}

-(CGFloat)volume
{
	UInt32 size;
	CGFloat volume;
	size = sizeof(CGFloat);
	AudioSessionGetProperty(kAudioSessionProperty_CurrentHardwareOutputVolume, &size, &volume);
	return volume;
}

-(TiMediaAudioSessionInputType)inputType
{
	CFStringRef newRoute = NULL;
	UInt32 size = sizeof(CFStringRef);
	[self startAudioSession];
	AudioSessionGetProperty(kAudioSessionProperty_AudioRoute, &size, &newRoute);
	[self stopAudioSession];
	if (newRoute)
	{	
		if (CFStringGetLength(newRoute) == 0)
		{
			return TiMediaAudioSessionInputMuted;
		}
		else if (CFStringCompare(newRoute, CFSTR("Speaker"), 0) == kCFCompareEqualTo) 
		{
			return TiMediaAudioSessionInputSpeaker;	
		}	
		else if (CFStringCompare(newRoute, CFSTR("Headphone"), 0) == kCFCompareEqualTo) 
		{
			return TiMediaAudioSessionInputHeadphones;
		}	
		else if (CFStringCompare(newRoute, CFSTR("MicrophoneBuiltIn"), 0) == kCFCompareEqualTo) 
		{
			return TiMediaAudioSessionInputMicrophoneBuiltin;	
		}	
		if (CFStringCompare(newRoute, CFSTR("HeadsetInOut"), 0) == kCFCompareEqualTo) 
		{
			return TiMediaAudioSessionInputHeadsetInOut;	
		}
		else if (CFStringCompare(newRoute, CFSTR("ReceiverAndMicrophone"), 0) == kCFCompareEqualTo) 
		{
			return TiMediaAudioSessionInputReceiverAndMicrophone;	
		}	
		else if (CFStringCompare(newRoute, CFSTR("HeadphonesAndMicrophone"), 0) == kCFCompareEqualTo) 
		{
			return TiMediaAudioSessionInputHeadphonesAndMicrophone;	
		}	
		else if (CFStringCompare(newRoute, CFSTR("LineOut"), 0) == kCFCompareEqualTo) 
		{
			return TiMediaAudioSessionInputLineOut;	
		}	
		else
		{
			return TiMediaAudioSessionInputUnknown;
		}
	}
	return TiMediaAudioSessionInputUnavailable;
}

-(void)record
{
	// ensure we're in record mode
	UInt32 sessionCategory = kAudioSessionCategory_RecordAudio;
	AudioSessionSetProperty(kAudioSessionProperty_AudioCategory, sizeof (sessionCategory), &sessionCategory);
}

-(void)playback
{
	// ensure we're in playback mode
	UInt32 sessionCategory = kAudioSessionCategory_MediaPlayback;
	AudioSessionSetProperty(kAudioSessionProperty_AudioCategory, sizeof(sessionCategory), &sessionCategory);
	
	// NOTE: this code will ensure that the SILENCE switch is respected when media plays
	sessionCategory = kAudioSessionCategory_SoloAmbientSound;
	AudioSessionSetProperty(kAudioSessionProperty_AudioCategory, sizeof(sessionCategory), &sessionCategory);
}

-(void)startAudioSession
{
	static BOOL init = NO;
	[lock lock];
	count++;
	if (count == 1)
	{
		// only init once, but activate each time
		if (init == NO)
		{
			init = YES;
			AudioSessionInitialize (NULL, NULL, TiAudioSessionInterruptionCallback, self);

			// register for audio route changes
			AudioSessionAddPropertyListener(kAudioSessionProperty_AudioRouteChange, TiAudioSessionAudioRouteChangeCallback, self); 
			
			// register for audio volume changes
			AudioSessionAddPropertyListener(kAudioSessionProperty_CurrentHardwareOutputVolume, TiAudioSessionAudioVolumeCallback, self);
		}

		// make our audio session active
		AudioSessionSetActive(true);
	}
	[lock unlock];
}

-(void)stopAudioSession
{
	[lock lock];
	count--;
	if (count == 0)
	{
		AudioSessionSetActive(false);
	}
#ifdef DEBUG	
	NSAssert(count >= 0, @"stopAudioSession called too many times");
#endif
	[lock unlock];
}

@end
