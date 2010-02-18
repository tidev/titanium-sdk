/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMediaAudioRecorderProxy.h"
#import "TiUtils.h"
#import "TiFile.h"
#import "TiMediaAudioSession.h"

@implementation TiMediaAudioRecorderProxy

#pragma mark Internal 

-(void)dealloc
{
	[[TiMediaAudioSession sharedSession] stopAudioSession];
	[super dealloc];
}

-(void)_configure
{
	recorder = NULL;
	[[TiMediaAudioSession sharedSession] startAudioSession];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioInterruptionBegin:) name:kTiMediaAudioSessionInterruptionBegin object:[TiMediaAudioSession sharedSession]];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioInterruptionEnd:) name:kTiMediaAudioSessionInterruptionEnd object:[TiMediaAudioSession sharedSession]];
	[super _configure];
}

-(void)_destroy
{
	if (recorder!=NULL)
	{
		if (recorder->IsRunning())
		{
			recorder->StopRecord();
		}
		delete recorder;
		recorder = NULL;
	}
	RELEASE_TO_NIL(file);
	[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiMediaAudioSessionInterruptionBegin object:[TiMediaAudioSession sharedSession]];
	[[NSNotificationCenter defaultCenter] removeObserver:self name:kTiMediaAudioSessionInterruptionEnd object:[TiMediaAudioSession sharedSession]];
	[super _destroy];
}

-(AQRecorder*)recorder
{
	if (recorder==NULL)
	{
		recorder = new AQRecorder();
	}
	return recorder;
}

#pragma mark Public APIs 

-(void)start:(id)args
{
	AQRecorder *rec = [self recorder];
	
	// If we are currently recording, stop and save the file.
	if (rec->IsRunning()) 
	{
		[self throwException:@"invalid state" subreason:@"already recording" location:CODELOCATION];
		return;
	}
	else
	{
		RELEASE_TO_NIL(file);
		
		// create a temporary file
		file = [[TiUtils createTempFile:@"caf"] retain];
		
		// indicate we're going to start recording
		[[TiMediaAudioSession sharedSession] record];
		
		// Start the recorder
		recorder->StartRecord((CFStringRef)[file path]);
	}
}

-(id)stop:(id)args
{
	if (recorder!=NULL)
	{
		recorder->StopRecord();
		
		// place the session back in playback mode
		[[TiMediaAudioSession sharedSession] playback];
		
		return file;
	}
	
	return nil;
}

-(void)pause:(id)args
{
	if (recorder!=NULL)
	{
		recorder->PauseRecord();
	}
}

-(void)resume:(id)args
{
	if (recorder!=NULL)
	{
		recorder->ResumeRecord();
	}
}

-(BOOL)paused
{
	if (recorder!=NULL)
	{
		return recorder->IsPaused();
	}
	return NO;
}

-(BOOL)recording
{
	if (recorder!=NULL)
	{
		return recorder->IsRunning();
	}
	return NO;
}

-(BOOL)stopped
{
	if (recorder!=NULL)
	{
		return !recorder->IsRunning();
	}
	return YES;
}

#pragma mark Delegates 

-(void)audioInterruptionBegin:(NSNotification*)note
{
	if ([self recording]) 
	{
		[self pause:nil];
	}
}

-(void)audioInterruptionEnd:(NSNotification*)note
{
	if ([self paused])
	{
		[self resume:nil];
	}
}

@end
