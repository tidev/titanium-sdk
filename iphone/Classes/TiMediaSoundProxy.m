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

-(id)_initWithPageContext:(id<TiEvaluator>)context_ args:(NSArray*)args
{
	if (self = [super _initWithPageContext:context_ args:args])
	{
		[[TiMediaAudioSession sharedSession] startAudioSession];
		
		id arg = args!=nil && [args count] > 0 ? [args objectAtIndex:0] : nil;
		if (arg!=nil)
		{
			if ([arg isKindOfClass:[NSDictionary class]])
			{
				NSString *urlStr = [TiUtils stringValue:@"url" properties:arg];
				if (urlStr!=nil)
				{
					url = [[TiUtils toURL:urlStr proxy:self] retain];
					
					if ([url isFileURL]==NO)
					{
						// we need to download it and save it off into temp file
						NSData *data = [NSData dataWithContentsOfURL:url];
						NSString *ext = [[[url path] lastPathComponent] pathExtension];
						tempFile = [[TiFile createTempFile:ext] retain]; // file auto-deleted on release
						[data writeToFile:[tempFile path] atomically:YES];
						RELEASE_TO_NIL(url);
						url = [[NSURL fileURLWithPath:[tempFile path]] retain];
					}
				}
				if (url==nil)
				{
					id obj = [arg objectForKey:@"sound"];
					if (obj!=nil)
					{
						if ([obj isKindOfClass:[TiBlob class]])
						{
							TiBlob *blob = (TiBlob*)obj;
							//TODO: for now we're only supporting File-type blobs
							if ([blob type]==TiBlobTypeFile)
							{
								url = [[NSURL fileURLWithPath:[blob path]] retain];
							}
						}
						else if ([obj isKindOfClass:[TiFile class]])
						{
							url = [[NSURL fileURLWithPath:[(TiFile*)obj path]] retain];
						}
					}
				}
                int initialMode = [TiUtils intValue:@"audioSessionMode" 
                                         properties:arg
                                                def:[[TiMediaAudioSession sharedSession] defaultSessionMode]];
                [self setAudioSessionMode:[NSNumber numberWithInt:initialMode]];
			}
			if (url==nil)
			{
				[self throwException:@"no 'url' or 'sound' specified or invalid value" subreason:nil location:CODELOCATION];
			}
		}
		volume = 1.0;
		resumeTime = 0;

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0		
		if ([TiUtils isIOS4OrGreater])
		{
			[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(remoteControlEvent:) name:kTiRemoteControlNotification object:nil];
		}
#endif
	}
	return self;
}

-(void)configurationSet
{
	if (url!=nil)
	{
		// attempt to preload if set so that the audio file
		// is ready to play and doesn't cause any delays
		id preload = [self valueForKey:@"preload"];
		if ([TiUtils boolValue:preload])
		{
			[self performSelectorOnMainThread:@selector(_prepare) withObject:nil waitUntilDone:NO];
		}
	}
}

-(void)_destroy
{
	if (player!=nil)
	{
		[player stop];
		[player setDelegate:nil];
	}
	
	[[TiMediaAudioSession sharedSession] stopAudioSession];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0	
	if ([TiUtils isIOS4OrGreater])
	{
		[[NSNotificationCenter defaultCenter] removeObserver:self];
	}
#endif	
	
	RELEASE_TO_NIL(player);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(tempFile);
	
	[super _destroy];
}

-(AVAudioPlayer*)player
{
	if (player==nil)
	{
		NSError *error = nil;
		player = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:(NSError **)&error];
		if (error != nil)
		{
			[self throwException:[error description] subreason:[NSString stringWithFormat:@"error loading sound url: %@",url] location:CODELOCATION];
			return nil;
		}
		[player setDelegate:self];
		[player prepareToPlay];
		[player setVolume:volume];
		[player setNumberOfLoops:(looping?-1:0)];
		[player setCurrentTime:resumeTime];
	}
	return player;
}

-(void)_prepare
{
	[[self player] prepareToPlay];
}

#pragma mark Public APIs

-(void)play:(id)args
{
	// indicate we're going to start playing
	[[TiMediaAudioSession sharedSession] playback:sessionMode];
	
	paused = NO;
	[[self player] play];
}

-(void)stop:(id)args
{
	if (player!=nil)
	{
		[player stop];
		[player setCurrentTime:0];
	}
	resumeTime = 0;
	paused = NO;
}

-(void)pause:(id)args
{
	if (player!=nil)
	{
		[player pause];
		paused = YES;
	}
}

-(void)reset:(id)args
{
	if (player!=nil)
	{
		[player stop];
		[player setCurrentTime:0];
		[player play];
	}
	resumeTime = 0;
	paused = NO;
}

-(void)release:(id)args
{
	if (player!=nil)
	{
		resumeTime = 0;
		paused = NO;
		[player stop];
		RELEASE_TO_NIL(player);
	}
	[self _destroy];
}

-(NSNumber*)volume
{
	if (player!=nil)
	{
		return NUMFLOAT(player.volume);
	}
	return NUMFLOAT(0);
}

-(void)setVolume:(id)value
{
	volume = [TiUtils floatValue:value];
	if (player!=nil)
	{
		[player setVolume:volume];
	}
}

-(NSNumber*)duration
{
	if (player!=nil)
	{
		return NUMDOUBLE([player duration]);
	}
	return NUMDOUBLE(0);
}

-(NSNumber*)time
{
	if (player!=nil)
	{
		return NUMDOUBLE([player currentTime]);
	}
	return NUMDOUBLE(0);
}

-(void)setTime:(NSNumber*)value
{
	if (player!=nil)
	{
		[player setCurrentTime:[TiUtils doubleValue:value]];
	}
	else 
	{
		resumeTime = [TiUtils doubleValue:value];
	}
}

-(NSNumber*)isPaused:(id)args
{
	return NUMBOOL(paused);
}

-(void)setPaused:(id)value
{
	if ([TiUtils boolValue:value])
	{
		paused = YES;
	}
	else
	{
		paused = NO;
	}
	if (player!=nil)
	{
		if (paused)
		{
			[player pause];
		}
		else 
		{
			[player play];
		}

	}
}

-(NSNumber*)isLooping:(id)args
{
	if (player!=nil)
	{
		return NUMBOOL(player.numberOfLoops!=0);
	}
	return NUMBOOL(NO);
}

-(void)setLooping:(id)value
{
	looping = [TiUtils boolValue:value];
	if (player!=nil)
	{
		player.numberOfLoops = looping ? -1 : 0;
	}
}

-(NSNumber*)isPlaying:(id)args
{
	if (player!=nil)
	{
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

-(NSURL*)url
{
	return url;
}

-(void)setAudioSessionMode:(NSNumber*)mode
{
    UInt32 newMode = [mode unsignedIntegerValue]; // Close as we can get to UInt32
    if (newMode == kAudioSessionCategory_RecordAudio) {
        NSLog(@"[WARN] Invalid mode for audio player... setting to default.");
        newMode = kAudioSessionCategory_SoloAmbientSound;
    }
    sessionMode = newMode;
}

-(NSNumber*)audioSessionMode
{
    return [NSNumber numberWithUnsignedInteger:sessionMode];
}

#pragma mark Delegate

- (void)audioPlayerDidFinishPlaying:(AVAudioPlayer *)player successfully:(BOOL)flag
{
	if ([self _hasListeners:@"complete"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(flag),@"success",nil];
		[self fireEvent:@"complete" withObject:event];
	}
}

- (void)audioPlayerBeginInterruption:(AVAudioPlayer *)player
{	
	if ([self _hasListeners:@"interrupted"])
	{
		[self fireEvent:@"interrupted" withObject:nil];
	}
}

- (void)audioPlayerEndInterruption:(AVAudioPlayer *)player
{
	if ([self _hasListeners:@"resume"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES),@"interruption",nil];
		[self fireEvent:@"resume" withObject:event];
	}
}

- (void)audioPlayerDecodeErrorDidOccur:(AVAudioPlayer *)player error:(NSError *)error
{
	if ([self _hasListeners:@"error"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:[error description],@"message",nil];
		[self fireEvent:@"error" withObject:event];
	}
}

#if __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_4_0

- (void)audioPlayerEndInterruption:(AVAudioPlayer *)player withFlags:(NSUInteger)flags
{
	if (flags != AVAudioSessionInterruptionFlags_ShouldResume)
	{
		[self stop:nil];
	}
	
	if ([self _hasListeners:@"resume"])
	{
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
			if (paused)
			{ 
				[self play:nil];
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
			[self play:nil];
			break;
		}
	}
}
#endif

@end


#endif