/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMediaSoundProxy.h"
#import "TiUtils.h"
#import <AudioToolbox/AudioToolbox.h>
#import <AVFoundation/AVAudioPlayer.h>


@implementation TiMediaSoundProxy

#pragma mark Internal

-(id)_initWithPageContext:(id<TiEvaluator>)context_ args:(NSArray*)args
{
	if (self = [super _initWithPageContext:context_ args:args])
	{
		id arg = args!=nil && [args count] > 0 ? [args objectAtIndex:0] : nil;
		if (arg!=nil)
		{
			if ([arg isKindOfClass:[NSDictionary class]])
			{
				arg = [TiUtils stringValue:@"url" properties:arg];
			}
			if (arg!=nil)
			{
				url = [[TiUtils toURL:arg proxy:self] retain];
				if (url==nil)
				{
					[self throwException:@"invalid url" subreason:nil location:CODELOCATION];
				}
			}
		}
		volume = 1.0;
		resumeTime = 0;
	}
	return self;
}

-(void)_destroy
{
	if (player!=nil)
	{
		[player stop];
	}
	RELEASE_TO_NIL(player);
	RELEASE_TO_NIL(url);
}


-(AVAudioPlayer*)player
{
	if (player==nil)
	{
		NSError *error = nil;
		player = [[AVAudioPlayer alloc] initWithContentsOfURL:url error:(NSError **)&error];
		if (error != nil)
		{
			//TODO:
		}
		[player setDelegate:self];
		[player prepareToPlay];
		[player setVolume:volume];
		[player setNumberOfLoops:(looping?-1:0)];
		[player setCurrentTime:resumeTime];
	}
	return player;
}

#pragma mark Public APIs

-(void)play:(id)args
{
	//NOTE: this code will ensure that the SILENCE switch is respected when movie plays
	UInt32 sessionCategory = kAudioSessionCategory_SoloAmbientSound;
	AudioSessionSetProperty(kAudioSessionProperty_AudioCategory, sizeof(sessionCategory), &sessionCategory);
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
}

-(void)pause:(id)args
{
	if (player!=nil)
	{
		[player pause];
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
}

-(void)release:(id)args
{
	if (player!=nil)
	{
		resumeTime = 0;
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

-(NSNumber*)isPaused
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

-(NSNumber*)isLooping
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

-(NSNumber*)isPlaying
{
	if (player!=nil)
	{
		return NUMBOOL([player isPlaying]);
	}
	return NUMBOOL(NO);
}

-(NSURL*)url
{
	return url;
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


@end


