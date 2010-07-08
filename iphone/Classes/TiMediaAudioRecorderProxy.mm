/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import "TiMediaAudioRecorderProxy.h"
#import "TiUtils.h"
#import "TiFile.h"
#import "TiMediaAudioSession.h"

@implementation TiMediaAudioRecorderProxy

@synthesize format, compression;

#pragma mark Internal 

-(void)dealloc
{
	RELEASE_TO_NIL(format);
	RELEASE_TO_NIL(compression);
	[[TiMediaAudioSession sharedSession] stopAudioSession];
	[super dealloc];
}

-(void)_configure
{
    sessionMode = kAudioSessionCategory_RecordAudio; // Doesn't fit into the 'default' mode paradigm.. but I guess that's OK?
	recorder = NULL;
	format = [[NSNumber numberWithUnsignedInt:kAudioFileCAFType] retain];
	compression = [[NSNumber numberWithUnsignedInt:kAudioFormatLinearPCM] retain];
	
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
	[[TiMediaAudioSession sharedSession] stopAudioSession];
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
		
		NSString *extension = nil;
		
		UInt32 fmt = [format unsignedIntValue];
		UInt32 comp = [compression unsignedIntValue];
		
		switch(fmt)
		{
			case kAudioFileCAFType:
				extension = @"caf";
				break;
			case kAudioFileWAVEType:
				extension = @"wav";
				break;
			case kAudioFileAIFFType:
				extension = @"aiff";
				break;
			case kAudioFileMP3Type:
				extension = @"mp3";
				break;
			case kAudioFileMPEG4Type:
				extension = @"mp4";
				break;
			case kAudioFileM4AType:
				extension = @"m4a";
				break;
			case kAudioFile3GPType:
				extension = @"3gpp";
				break;
			case kAudioFile3GP2Type:
				extension = @"3gp2";
				break;
			case kAudioFileAMRType:
				extension = @"amr";
				break;
			default:
			{
				NSLog(@"[WARN] unsupported recording audio format: %d",fmt);
			}
		}
		
		// indicate we're going to start recording
		[[TiMediaAudioSession sharedSession] record:sessionMode];
		
		// set our audio file
		recorder->SetupAudioFormat(comp);
		
		// create a temporary file
		file = [[TiUtils createTempFile:extension] retain];
		
		// Start the recorder
		recorder->StartRecord((CFStringRef)[file path], fmt);
	}
}

-(id)stop:(id)args
{
	if (recorder!=NULL)
	{
		recorder->StopRecord();
		
		// place the session back in playback mode; reset to default category
		[[TiMediaAudioSession sharedSession] playback:kAudioSessionCategory_SoloAmbientSound];
		
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

-(void)setAudioSessionMode:(NSNumber*)mode
{
    UInt32 newMode = [mode unsignedIntegerValue]; // Close as we can get to UInt32
    if (newMode != kAudioSessionCategory_RecordAudio && newMode != kAudioSessionCategory_PlayAndRecord) {
        NSLog(@"Invalid mode for audio recorder... setting to default.");
        newMode = kAudioSessionCategory_RecordAudio;
    }
    sessionMode = newMode;
}

-(NSNumber*)audioSessionMode
{
    return [NSNumber numberWithUnsignedInteger:sessionMode];
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

#endif