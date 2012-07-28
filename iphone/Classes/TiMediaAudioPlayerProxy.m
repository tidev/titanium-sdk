/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import "TiMediaAudioPlayerProxy.h"
#import "TiUtils.h"
#import "TiMediaAudioSession.h"
#include <AudioToolbox/AudioToolbox.h>

@implementation TiMediaAudioPlayerProxy

#pragma mark Internal

-(void)_initWithProperties:(NSDictionary *)properties
{
	volume = [TiUtils doubleValue:@"volume" properties:properties def:1.0];
	url = [[TiUtils toURL:[properties objectForKey:@"url"] proxy:self] retain];
    int initialMode = [TiUtils intValue:@"audioSessionMode" 
                             properties:properties
                                    def:0];
	if (initialMode) {
		[self setAudioSessionMode:[NSNumber numberWithInt:initialMode]];
	}
}

-(void)_destroy
{
	if (timer!=nil)
	{
		[timer invalidate];
		RELEASE_TO_NIL(timer);
	}
	if (player!=nil)
	{
		if ([player isPlaying] || [player isPaused] || [player isWaiting]) {
			[player stop];
			[[TiMediaAudioSession sharedSession] stopAudioSession];
		}
	}
	[player setDelegate:nil];
	RELEASE_TO_NIL(player);
	RELEASE_TO_NIL(timer);
    [super _destroy];
}

-(void)_listenerAdded:(NSString *)type count:(int)count
{
	if (count == 1 && [type isEqualToString:@"progress"])
	{
		progress = YES;
	}
}

-(void)_listenerRemoved:(NSString *)type count:(int)count
{
	if (count == 0 && [type isEqualToString:@"progress"])
	{
		progress = NO;
	}
}

-(AudioStreamer*)player
{
	if (player==nil)
	{
		if (url==nil)
		{
			[self throwException:@"invalid url" subreason:@"url has not been set" location:CODELOCATION];
		}
		player = [[AudioStreamer alloc] initWithURL:url];
		[player setDelegate:self];
        [player setBufferSize:bufferSize];
		[player setVolume:volume];
		
		if (progress)
		{
			// create progress callback timer that fires once per second. we might want to eventually make this
			// more configurable but for now that's sufficient for most apps that want to display progress updates on the stream
			timer = [[NSTimer scheduledTimerWithTimeInterval:1 target:self selector:@selector(updateProgress:) userInfo:nil repeats:YES] retain];
		}
	}
	return player;
}

-(void)destroyPlayer
{
	if (timer!=nil)
	{
		[timer invalidate];
		RELEASE_TO_NIL(timer);
	}
	if (player!=nil)
	{
		if ([player isPlaying] || [player isPaused] || [player isWaiting])
		{
			[player stop];
			[[TiMediaAudioSession sharedSession] stopAudioSession];
		}
		[player setDelegate:nil];
		RELEASE_TO_NIL(player);
	}
}

-(void)restart:(id)args
{
	BOOL playing = [player isPlaying] || [player isPaused] || [player isWaiting];
	[self destroyPlayer];
	
	if (playing)
	{
		[[self player] start];
	}
	else 
	{
		// just create it
		[self player];
	}
}


#pragma mark Public APIs

-(void)setPaused:(NSNumber *)paused
{
	if (player!=nil)
	{
		if ([TiUtils boolValue:paused])
		{
			[player pause];
		}
		else
		{
			[player start];
		}
	}
}

#define PLAYER_PROP_BOOL(name,func) \
-(NSNumber*)name\
{\
	if (player==nil)\
	{\
		return NUMBOOL(NO);\
	}\
	return NUMBOOL([player func]);\
}

#define PLAYER_PROP_DOUBLE(name,func) \
-(NSNumber*)name\
{\
if (player==nil)\
{\
return NUMDOUBLE(0);\
}\
return NUMDOUBLE([player func]);\
}

PLAYER_PROP_BOOL(waiting,isWaiting);
PLAYER_PROP_BOOL(idle,isIdle);
PLAYER_PROP_BOOL(playing,isPlaying);
PLAYER_PROP_BOOL(paused,isPaused);

PLAYER_PROP_DOUBLE(bitRate,bitRate);
PLAYER_PROP_DOUBLE(progress,progress);
PLAYER_PROP_DOUBLE(state,state);

-(NSNumber *)volume
{
	if (player != nil){
		volume = [player volume];
	}
	return NUMDOUBLE(volume);
}

-(void)setVolume:(NSNumber *)newVolume
{
	volume = [TiUtils doubleValue:newVolume def:volume];
	if (player != nil) {
		[player setVolume:volume];
	}
}

-(void)setBufferSize:(NSNumber*)bufferSize_
{
    bufferSize = [bufferSize_ unsignedIntegerValue];
    if (player != nil) {
        [player setBufferSize:bufferSize];
    }
}

-(NSNumber*)bufferSize
{
    return [NSNumber numberWithUnsignedInteger:((bufferSize) ? bufferSize : kAQDefaultBufSize)];
}

-(void)setUrl:(id)args
{
	if (![NSThread isMainThread]) {
		TiThreadPerformOnMainThread(^{[self setUrl:args];}, YES);
		return;
	}
	RELEASE_TO_NIL(url);
	ENSURE_SINGLE_ARG(args,NSString);
	url = [[TiUtils toURL:args proxy:self] retain];
	if (player!=nil)
	{
		[self restart:nil];
	}
}

-(NSURL*)url
{
	return url;
}

-(void)play:(id)args
{
	[self start:args];
}

// Only need to ensure the UI thread when starting; and we should actually wait until it's finished so
// that execution flow is correct (if we stop/pause immediately after)
-(void)start:(id)args
{
	if (![NSThread isMainThread]) {
		TiThreadPerformOnMainThread(^{[self start:args];}, YES);
		return;
	}
	// indicate we're going to start playing
	if (![[TiMediaAudioSession sharedSession] canPlayback]) {
		[self throwException:@"Improper audio session mode for playback"
				   subreason:[[NSNumber numberWithUnsignedInt:[[TiMediaAudioSession sharedSession] sessionMode]] description]
					location:CODELOCATION];
	}
	
	if (player == nil || !([player isPlaying] || [player isPaused] || [player isWaiting])) {
		[[TiMediaAudioSession sharedSession] startAudioSession];
	}
	[[self player] start];
}

-(void)stop:(id)args
{
	if (![NSThread isMainThread]) {
		TiThreadPerformOnMainThread(^{[self stop:args];}, YES);
		return;
	}
	if (player!=nil)
	{		
		if ([player isPlaying] || [player isPaused] || [player isWaiting])
		{
			[player stop];
			[[TiMediaAudioSession sharedSession] stopAudioSession];
		}
	}
}

-(void)pause:(id)args
{
	if (![NSThread isMainThread]) {
		TiThreadPerformOnMainThread(^{[self pause:args];}, YES);
		return;
	}
	if (player!=nil)
	{
		[player pause];
	}
}

MAKE_SYSTEM_PROP(STATE_INITIALIZED,AS_INITIALIZED);
MAKE_SYSTEM_PROP(STATE_STARTING,AS_STARTING_FILE_THREAD);
MAKE_SYSTEM_PROP(STATE_WAITING_FOR_DATA,AS_WAITING_FOR_DATA);
MAKE_SYSTEM_PROP(STATE_WAITING_FOR_QUEUE,AS_WAITING_FOR_QUEUE_TO_START);
MAKE_SYSTEM_PROP(STATE_PLAYING,AS_PLAYING);
MAKE_SYSTEM_PROP(STATE_BUFFERING,AS_BUFFERING);
MAKE_SYSTEM_PROP(STATE_STOPPING,AS_STOPPING);
MAKE_SYSTEM_PROP(STATE_STOPPED,AS_STOPPED);
MAKE_SYSTEM_PROP(STATE_PAUSED,AS_PAUSED);

-(void)setAudioSessionMode:(NSNumber*)mode
{
    UInt32 newMode = [mode unsignedIntegerValue]; // Close as we can get to UInt32
    if (newMode == kAudioSessionCategory_RecordAudio) {
        DebugLog(@"[WARN] Invalid mode for audio player... setting to default.");
        newMode = kAudioSessionCategory_SoloAmbientSound;
    }
	DebugLog(@"[WARN] 'Ti.Media.AudioPlayer.audioSessionMode' is deprecated; use 'Ti.Media.audioSessionMode'");
	[[TiMediaAudioSession sharedSession] setSessionMode:newMode];
}

-(NSNumber*)audioSessionMode
{
	DebugLog(@"[WARN] 'Ti.Media.AudioPlayer.audioSessionMode' is deprecated; use 'Ti.Media.audioSessionMode'");	
    return [NSNumber numberWithUnsignedInteger:[[TiMediaAudioSession sharedSession] sessionMode]];
}

-(NSString*)stateToString:(int)state
{
	switch(state)
	{
		case AS_INITIALIZED:
			return @"initialized";
		case AS_STARTING_FILE_THREAD:
			return @"starting";
		case AS_WAITING_FOR_DATA:
			return @"waiting_for_data";
		case AS_WAITING_FOR_QUEUE_TO_START:
			return @"waiting_for_queue";
		case AS_PLAYING:
			return @"playing";
		case AS_BUFFERING:
			return @"buffering";
		case AS_STOPPING:
			return @"stopping";
		case AS_STOPPED:
			return @"stopped";
		case AS_PAUSED:
			return @"paused";
	}
	return @"unknown";	
}

-(NSString*)stateDescription:(id)arg
{
	ENSURE_SINGLE_ARG(arg,NSNumber);
	return [self stateToString:[TiUtils intValue:arg]];
}

#pragma mark Delegates

-(void)playbackStateChanged:(id)sender
{
	if ([self _hasListeners:@"change"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[self state],@"state",[self stateToString:player.state],@"description",nil];
		[self fireEvent:@"change" withObject:event];
	}
	if (player.errorCode != AS_NO_ERROR && player.state == AS_STOPPED) {
		[[TiMediaAudioSession sharedSession] stopAudioSession];
	}
}

- (void)updateProgress:(NSTimer *)updatedTimer
{
	if (player!=nil && [player isPlaying])
	{
		double value = 0;
		
		if (player.bitRate != 0.0)
		{
			value = player.progress;
		}
		NSDictionary *event = [NSDictionary dictionaryWithObject:NUMDOUBLE(value) forKey:@"progress"];
		[self fireEvent:@"progress" withObject:event];
	}
}

@end

#endif