/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import "TiMediaAudioSession.h"
#import "TiUtils.h"
#include <AudioToolbox/AudioToolbox.h>

NSString * const kTiMediaAudioSessionInterruptionBegin = @"TiMediaAudioSessionInterruptionBegin";
NSString * const kTiMediaAudioSessionInterruptionEnd = @"TiMediaAudioSessionInterruptionEnd";
NSString * const kTiMediaAudioSessionRouteChange = @"TiMediaAudioSessionRouteChange";
NSString * const kTiMediaAudioSessionVolumeChange = @"TiMediaAudioSessionVolumeChange";
NSString * const kTiMediaAudioSessionInputChange = @"TiMediaAudioSessionInputChange";

void TiAudioSessionInterruptionCallback(void *inUserData,UInt32 interruptionState)
{
	TiMediaAudioSession* session = (TiMediaAudioSession*)inUserData;
	if ([session isActive])
	{
		if (interruptionState == kAudioSessionBeginInterruption)
		{
			WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
			[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionInterruptionBegin object:session];
		}
		else if (interruptionState == kAudioSessionEndInterruption)
		{
			WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
			[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionInterruptionEnd object:session];
		}
	}
}

void TiAudioSessionAudioVolumeCallback(void *inUserData, AudioSessionPropertyID prop, UInt32 size, const void *inData)
{
	TiMediaAudioSession* session = (TiMediaAudioSession*)inUserData;
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
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
    id oldRouteObject = [dict objectForKey:@"OutputDeviceDidChange_OldRoute"];
    if (oldRouteObject == nil) {
        [event setObject:[NSNull null] forKey:@"oldRoute"];
    }
    else {
        [event setObject:oldRouteObject forKey:@"oldRoute"];
    }
	
	[event setObject:reason forKey:@"reason"];
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionRouteChange object:session userInfo:event];
}

void TiAudioSessionInputAvailableCallback(void* inUserData, AudioSessionPropertyID inID, UInt32 dataSize, const void* inData)
{
	TiMediaAudioSession* session = (TiMediaAudioSession*)inUserData;
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	[[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionInputChange object:session];
}

@implementation TiMediaAudioSession

-(void)deactivateSession
{
    // deregister from audio route changes
    AudioSessionRemovePropertyListenerWithUserData(kAudioSessionProperty_AudioRouteChange, TiAudioSessionAudioRouteChangeCallback, self);
    //deregister from audio volume changes
    AudioSessionRemovePropertyListenerWithUserData(kAudioSessionProperty_CurrentHardwareOutputVolume,TiAudioSessionAudioVolumeCallback,self);
    //deregister from input availability changes
    AudioSessionRemovePropertyListenerWithUserData(kAudioSessionProperty_AudioInputAvailable,TiAudioSessionInputAvailableCallback,self);
    AudioSessionSetActive(false);
}

- (void)dealloc {
    if ([self isActive]) {
        NSLog(@"[WARN] AudioSession being deallocated is still active");
        [self deactivateSession];
    }
    RELEASE_TO_NIL(lock);
    [super dealloc];
}

-(id)init
{
	if (self = [super init])
	{
		count = 0;
		lock = [[NSLock alloc] init];
		
		AudioSessionInitialize (NULL, NULL, TiAudioSessionInterruptionCallback, self);
	}
	return self;
}

+(TiMediaAudioSession*)sharedSession
{
	static TiMediaAudioSession *session = nil;
	@synchronized(self) {
		if (session == nil)
		{
			session = [[TiMediaAudioSession alloc] init];
		}
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
	if (![self isActive]) {
		return NO;
	}
	
	[self startAudioSession];
	UInt32 size, playing;
	size = sizeof(UInt32);
	AudioSessionGetProperty(kAudioSessionProperty_OtherAudioIsPlaying, &size, &playing);
	[self stopAudioSession];
	return playing;
}

-(CGFloat)volume
{
	[self startAudioSession];
	UInt32 size;
	CGFloat volume;
	size = sizeof(CGFloat);
	AudioSessionGetProperty(kAudioSessionProperty_CurrentHardwareOutputVolume, &size, &volume);
	[self stopAudioSession];
	return volume;
}

-(BOOL)hasInput
{
	[self startAudioSession];
	UInt32 hasInput;
	UInt32 size = sizeof(hasInput);
	AudioSessionGetProperty(kAudioSessionProperty_AudioInputAvailable, &size, &hasInput);
	[self stopAudioSession];
	return hasInput;
}

-(TiMediaAudioSessionInputType)inputType
{
	[self startAudioSession];
	CFStringRef newRoute = NULL;
	UInt32 size = sizeof(CFStringRef);
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

-(BOOL)canRecord
{
	UInt32 mode;
	UInt32 size = sizeof(mode);
	[self startAudioSession];
	AudioSessionGetProperty(kAudioSessionProperty_AudioCategory, &size, &mode);
	[self stopAudioSession];
    if (mode != kAudioSessionCategory_RecordAudio && mode != kAudioSessionCategory_PlayAndRecord) {
		return false;
    }
	return true;
}

-(BOOL)canPlayback
{
	UInt32 mode;
	UInt32 size = sizeof(mode);
	[self startAudioSession];
	AudioSessionGetProperty(kAudioSessionProperty_AudioCategory, &size, &mode);
	[self stopAudioSession];
    if (mode == kAudioSessionCategory_RecordAudio) {
		return false;
    }
	return true;
}

-(void)setSessionMode:(UInt32)mode
{
	if ([self isActive]) {
		NSLog(@"[WARN] Setting audio mode while playing audio... changes will not take effect until audio is restarted.");
	}
	AudioSessionSetProperty(kAudioSessionProperty_AudioCategory, sizeof(mode), &mode);
}

-(UInt32)sessionMode
{
	UInt32 mode;
	UInt32 size = sizeof(mode);
	[self startAudioSession];
	AudioSessionGetProperty(kAudioSessionProperty_AudioCategory, &size, &mode);
	[self stopAudioSession];
	return mode;
}

-(void)startAudioSession
{
	[lock lock];
	count++;
	if (count == 1)
	{
		// Registration must be done with each new audio session activation
		
		// register for audio route changes
		AudioSessionAddPropertyListener(kAudioSessionProperty_AudioRouteChange, TiAudioSessionAudioRouteChangeCallback, self); 
		
		// register for audio volume changes
		AudioSessionAddPropertyListener(kAudioSessionProperty_CurrentHardwareOutputVolume, TiAudioSessionAudioVolumeCallback, self);
		
		// register for input availability changes
		AudioSessionAddPropertyListener(kAudioSessionProperty_AudioInputAvailable, TiAudioSessionInputAvailableCallback, self);
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
        [self deactivateSession];
	}
#ifdef DEBUG	
	NSAssert(count >= 0, @"stopAudioSession called too many times");
#endif
	[lock unlock];
}

@end

#endif