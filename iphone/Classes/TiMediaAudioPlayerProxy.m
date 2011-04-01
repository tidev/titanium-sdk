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
	url = [[TiUtils toURL:[properties objectForKey:@"url"] proxy:self] retain];
    int initialMode = [TiUtils intValue:@"audioSessionMode" 
                             properties:properties
                                    def:0];
	if (initialMode) {
		[self setAudioSessionMode:[NSNumber numberWithInt:initialMode]];
	}
    
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0		
    if ([TiUtils isIOS4OrGreater])
    {
        WARN_IF_BACKGROUND_THREAD_OBJ;	//NSNotificationCenter is not threadsafe!
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(remoteControlEvent:) name:kTiRemoteControlNotification object:nil];
    }
#endif
}

-(void)_destroy
{
	if (timer!=nil)
	{
		[timer invalidate];
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

-(void)createProgressTimer
{
    ENSURE_UI_THREAD_0_ARGS;
    
    // create progress callback timer that fires once per second. we might want to eventually make this
    // more configurable but for now that's sufficient for most apps that want to display progress updates on the stream
    timer = [[NSTimer scheduledTimerWithTimeInterval:1 target:self selector:@selector(updateProgress:) userInfo:nil repeats:YES] retain];
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
		
		if (progress)
		{
			[self createProgressTimer];
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

-(void)startPlayer
{
    ENSURE_UI_THREAD_0_ARGS;
    
    [[self player] start];
}

-(void)restart:(id)args
{
	BOOL playing = [player isPlaying] || [player isPaused] || [player isWaiting];
	[self destroyPlayer];
	
	if (playing)
	{
		[self startPlayer];
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
			[self startPlayer];
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
PLAYER_PROP_DOUBLE(duration,duration);

-(void)setUrl:(id)args
{
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

-(void)setTime:(id)args
{
    ENSURE_SINGLE_ARG(args,NSNumber);
    double time = [TiUtils doubleValue:args];
    
    [[self player] seekToTime:time];
}

-(NSNumber*)time
{
    return self.progress;
}

// Only need to ensure the UI thread when starting; and we should actually wait until it's finished so
// that execution flow is correct (if we stop/pause immediately after)
-(void)start:(id)args
{
	if (![NSThread isMainThread]) {
		[self performSelectorOnMainThread:@selector(start:) withObject:args waitUntilDone:YES];
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
        NSLog(@"[WARN] Invalid mode for audio player... setting to default.");
        newMode = kAudioSessionCategory_SoloAmbientSound;
    }
	NSLog(@"[WARN] 'Titanium.Media.AudioPlayer.audioSessionMode' is deprecated; use 'Titanium.Media.audioSessionMode'");
	[[TiMediaAudioSession sharedSession] setSessionMode:newMode];
}

-(NSNumber*)audioSessionMode
{
	NSLog(@"[WARN] 'Titanium.Media.AudioPlayer.audioSessionMode' is deprecated; use 'Titanium.Media.audioSessionMode'");	
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
    if (!player){
        return;
    }
    
    // need to keep firing progress updates for the last few seconds of the reported duration
    // even if player has stopped streaming audio
    if (player.state == AS_STOPPING || player.state == AS_STOPPED)
    {
        afterStopProgress = YES;
        previousDuration = player.duration;
    }
    
	if ([player isPlaying] || afterStopProgress)
	{
		if (afterStopProgress){
            NSUInteger playerProgressInt = round(playerProgress);
            NSUInteger previousDurationInt = round(previousDuration);
            
            // (1) stop firing progress updates if the player was stopped significantly before the end
            // (most likely a manual stop versus the player ending a bit before its reported duration)
            // (2) stop firing progress updates when the progress has reached the reported duration
            if (playerProgressInt + 3 < previousDurationInt || playerProgressInt >= previousDurationInt){
                afterStopProgress = false;
                playerProgress = 0.0;
            }
            else
            {
                // simulate progress
                playerProgress += 1.0;
            }
        }
        else
        {
            if (player.bitRate != 0.0)
            {
                playerProgress = player.progress;
            }
            else
            {
                playerProgress = 0.0;
            }
        }
        
        NSDictionary *event = [NSDictionary dictionaryWithObject:NUMDOUBLE(playerProgress) forKey:@"progress"];
		[self fireEvent:@"progress" withObject:event];
	}
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0

- (void)remoteControlEvent:(NSNotification*)note
{
	UIEvent *event = [[note userInfo] objectForKey:@"event"];
	switch(event.subtype)
	{
		case UIEventSubtypeRemoteControlTogglePlayPause:
		{
			if (player.isPaused)
			{
				[self start:nil];
			}
			else 
			{
				[self pause:nil];
			}
			break;
		}
		case UIEventSubtypeRemoteControlPause:
		{
			[self pause:nil];
			break;
		}
		case UIEventSubtypeRemoteControlStop:
		{
			[self stop:nil];
			break;
		}
		case UIEventSubtypeRemoteControlPlay:
		{
			[self start:nil];
			break;
		}
	}
}
#endif

@end

#endif