/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVAudioPlayer.h>
#import <AVFoundation/AVAudioSession.h>

#import "TiMediaSoundProxy.h"
#import "TiUtils.h"
#import "TiBlob.h"
#import "TiFile.h"
#import "TiMediaAudioSession.h"

@implementation TiMediaSoundProxy

#pragma mark Internal

-(AVAudioPlayer*)player
{
	if (player==nil && url != nil) {
        NSError* error = nil;
        player = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:(NSError **)&error];
        if (error == nil) {
            [player setDelegate:self];
            [player prepareToPlay];
            [player setVolume:volume];
            [player setNumberOfLoops:(looping?-1:0)];
            [player setCurrentTime:resumeTime];
        } else {
            [self throwException:[error description] subreason:[NSString stringWithFormat:@"error loading sound url: %@",url] location:CODELOCATION];
        }
	}
	return player;
}

-(void)_configure
{
	volume = 1.0;
	resumeTime = 0;
	
    dispatch_async(dispatch_get_main_queue(), ^{
		[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(remoteControlEvent:) name:kTiRemoteControlNotification object:nil];
    });
}

-(void)_destroy
{
	if (player != nil) {
		if ([player isPlaying] || paused) {
			[player stop];
			[[TiMediaAudioSession sharedSession] stopAudioSession];
		}
		[player setDelegate:nil];
	}
    dispatch_sync(dispatch_get_main_queue(), ^{
		[[NSNotificationCenter defaultCenter] removeObserver:self];
    });
	
	RELEASE_TO_NIL(player);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(tempFile);
	
	[super _destroy];
}

#pragma mark Public APIs

-(void)play:(id)args
{
    [self rememberSelf];
    dispatch_sync(dispatch_get_main_queue(), ^{
        // indicate we're going to start playback
        if (![[TiMediaAudioSession sharedSession] canPlayback]) {
            [self throwException:@"Improper audio session mode for playback"
                       subreason:[[NSNumber numberWithUnsignedInt:[[TiMediaAudioSession sharedSession] sessionMode]] description]
                        location:CODELOCATION];
        }
        
        if (player == nil || !([player isPlaying] || paused)) {
            [[TiMediaAudioSession sharedSession] startAudioSession];
        }
        [[self player] play];
        paused = NO;
    });
}

-(void)stop:(id)args
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (player != nil) {
            if ([player isPlaying] || paused) {
                [player stop];
                [player setCurrentTime:0];
                [[TiMediaAudioSession sharedSession] stopAudioSession];
            }
        }
        resumeTime = 0;
        paused = NO;
    });
}

-(void)pause:(id)args
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (player != nil) {
            if ([player isPlaying]) {
                [player pause];
                paused = YES;
            }
        }
    });
}

-(void)reset:(id)args
{
    dispatch_async(dispatch_get_main_queue(), ^{
        if (player != nil) {
            if (!([player isPlaying] || paused)) {
                [[TiMediaAudioSession sharedSession] startAudioSession];
            }
            
            [player stop];
            [player setCurrentTime:0];
            [player play];
        }
        resumeTime = 0;
        paused = NO;
    });
}

-(void)release:(id)args
{
    if (player != nil) {
        resumeTime = 0;
        paused = NO;
        dispatch_sync(dispatch_get_main_queue(), ^{
            [player stop];
            RELEASE_TO_NIL(player);
        });
    }
    [self forgetSelf];
    [self _destroy];
}

-(NSNumber*)volume
{
	if (player != nil) {
		return NUMFLOAT(player.volume);
	}
	return NUMFLOAT(0);
}

-(void)setVolume:(id)value
{
	volume = [TiUtils floatValue:value];
	if (player != nil) {
		[player setVolume:volume];
	}
}

-(NSNumber*)duration
{
	if (player != nil) {
		return NUMDOUBLE([player duration]);
	}
	return NUMDOUBLE(0);
}

-(NSNumber*)time
{
	if (player != nil) {
		return NUMDOUBLE([player currentTime] * 1000.0);
	}
	return NUMDOUBLE(resumeTime * 1000.0);
}

-(void)setTime:(NSNumber*)value
{
	if (player != nil) {
		[player setCurrentTime:([TiUtils doubleValue:(value)] / 1000.0)];
	} else {
		resumeTime = [TiUtils doubleValue:value] / 1000.0;
	}
}

-(NSNumber*)isPaused:(id)args
{
	return NUMBOOL(paused);
}

-(void)setPaused:(id)value
{
	if ([TiUtils boolValue:value]) {
		paused = YES;
	} else {
		paused = NO;
	}
	if (player != nil) {
		if (paused) {
			[player pause];
		} else {
			[player play];
		}

	}
}

-(NSNumber*)isLooping:(id)args
{
	if (player != nil) {
		return NUMBOOL(player.numberOfLoops!=0);
	}
	return NUMBOOL(NO);
}

-(void)setLooping:(id)value
{
	looping = [TiUtils boolValue:value];
	if (player != nil) {
		player.numberOfLoops = looping ? -1 : 0;
	}
}

-(NSNumber*)isPlaying:(id)args
{
	if (player != nil) {
		return NUMBOOL([player isPlaying]);
	}
	return NUMBOOL(NO);
}

-(NSNumber*)playing
{
	return [self isPlaying:nil];
}

-(NSNumber*)paused
{
	return [self isPaused:nil];
}

-(NSNumber*)looping
{
	return [self isLooping:nil];
}

-(void)setUrl:(id)url_
{
	if ([url_ isKindOfClass:[NSString class]]) {
		url = [[TiUtils toURL:url_ proxy:self] retain];
		if ([url isFileURL]==NO) {
			// we need to download it and save it off into temp file
			NSData *data = [NSData dataWithContentsOfURL:url];
			NSString *ext = [[[url path] lastPathComponent] pathExtension];
			tempFile = [[TiFile createTempFile:ext] retain]; // file auto-deleted on release
			[data writeToFile:[tempFile path] atomically:YES];
			RELEASE_TO_NIL(url);
			url = [[NSURL fileURLWithPath:[tempFile path]] retain];
		}
	} else if ([url_ isKindOfClass:[TiBlob class]]) {
		TiBlob *blob = (TiBlob*)url_;
		//TODO: for now we're only supporting File-type blobs
		if ([blob type]==TiBlobTypeFile) {
			url = [[NSURL fileURLWithPath:[blob path]] retain];
		}
	} else if ([url_ isKindOfClass:[TiFile class]]) {
		url = [[NSURL fileURLWithPath:[(TiFile*)url_ path]] retain];
	}
    dispatch_sync(dispatch_get_main_queue(), ^{
        [self player];  // instantiate the player
    });
}

-(NSURL*)url
{
	return url;
}

-(void)setAudioSessionMode:(NSNumber*)mode
{
    UInt32 newMode = [mode unsignedIntegerValue]; // Close as we can get to UInt32
    if (newMode == kAudioSessionCategory_RecordAudio) {
        DebugLog(@"[WARN] Invalid mode for audio player... setting to default.");
        newMode = kAudioSessionCategory_SoloAmbientSound;
    }
	DebugLog(@"[WARN] 'Ti.Media.Sound.audioSessionMode' is deprecated; use 'Ti.Media.audioSessionMode'");
	[[TiMediaAudioSession sharedSession] setSessionMode:newMode];
}

-(NSNumber*)audioSessionMode
{
	DebugLog(@"[WARN] 'Ti.Media.Sound.audioSessionMode' is deprecated; use 'Ti.Media.audioSessionMode'");
    return [NSNumber numberWithUnsignedInteger:[[TiMediaAudioSession sharedSession] sessionMode]];
}

#pragma mark Delegate

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag
{
	if ([self _hasListeners:@"complete"]) {
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(flag),@"success",nil];
		[self fireEvent:@"complete" withObject:event];
	}
	if (flag) {
		[[TiMediaAudioSession sharedSession] stopAudioSession];
	}
    [self forgetSelf];
}

- (void)audioPlayerBeginInterruption:(AVAudioPlayer *)player
{	
	if ([self _hasListeners:@"interrupted"]) {
		[self fireEvent:@"interrupted" withObject:nil];
	}
}

- (void)audioPlayerEndInterruption:(AVAudioPlayer *)player
{
	if ([self _hasListeners:@"resume"]) {
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES),@"interruption",nil];
		[self fireEvent:@"resume" withObject:event];
	}
}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error
{
	if ([self _hasListeners:@"error"]) {
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"message",nil];
		[self fireEvent:@"error" withObject:event];
	}
    [self forgetSelf];
}

- (void)audioPlayerEndInterruption:(AVAudioPlayer *)player withFlags:(NSUInteger)flags
{
	if (flags != AVAudioSessionInterruptionFlags_ShouldResume) {
		[self stop:nil];
	}
	
	if ([self _hasListeners:@"resume"]) {
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES),@"interruption",nil];
		[self fireEvent:@"resume" withObject:event];
	}
}

- (void)remoteControlEvent:(NSNotification*)note
{
	UIEvent *event = [[note userInfo]objectForKey:@"event"];
	switch(event.subtype)
	{
		case UIEventSubtypeRemoteControlTogglePlayPause:
		{
			if (paused) { 
				[self play:nil];
			} else {
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
			[self play:nil];
			break;
		}
        default:
        {
            break;
        }
	}
}

@end


#endif
