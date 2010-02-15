/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiMediaAudioRecorderProxy.h"
#import "TiUtils.h"
#import "TiFile.h"

#pragma mark AudioSession listeners

void TiAudioSessionInterruptionListener(void * inClientData,
						  UInt32 inInterruptionState)
{
	TiMediaAudioRecorderProxy *proxy = (TiMediaAudioRecorderProxy*)inClientData;
	if (inInterruptionState == kAudioSessionBeginInterruption)
	{
		if ([proxy recording]) 
		{
			[proxy pause:nil];
		}
	}
	else if (inInterruptionState == kAudioSessionEndInterruption)
	{
		if ([proxy paused])
		{
			[proxy resume:nil];
		}
	}
}

void TiAudioSessionPropertyChangeLisetner( void * inClientData,
				  AudioSessionPropertyID	inID,
				  UInt32                  inDataSize,
				  const void *            inData)
{
//	SpeakHereController *THIS = (SpeakHereController*)inClientData;
//	if (inID == kAudioSessionProperty_AudioRouteChange)
//	{
//		CFDictionaryRef routeDictionary = (CFDictionaryRef)inData;			
//		//CFShow(routeDictionary);
//		CFNumberRef reason = (CFNumberRef)CFDictionaryGetValue(routeDictionary, CFSTR(kAudioSession_AudioRouteChangeKey_Reason));
//		SInt32 reasonVal;
//		CFNumberGetValue(reason, kCFNumberSInt32Type, &reasonVal);
//		if (reasonVal != kAudioSessionRouteChangeReason_CategoryChange)
//		{
//			/*CFStringRef oldRoute = (CFStringRef)CFDictionaryGetValue(routeDictionary, CFSTR(kAudioSession_AudioRouteChangeKey_OldRoute));
//			 if (oldRoute)	
//			 {
//			 printf("old route:\n");
//			 CFShow(oldRoute);
//			 }
//			 else 
//			 printf("ERROR GETTING OLD AUDIO ROUTE!\n");
//			 
//			 CFStringRef newRoute;
//			 UInt32 size; size = sizeof(CFStringRef);
//			 OSStatus error = AudioSessionGetProperty(kAudioSessionProperty_AudioRoute, &size, &newRoute);
//			 if (error) printf("ERROR GETTING NEW AUDIO ROUTE! %d\n", error);
//			 else
//			 {
//			 printf("new route:\n");
//			 CFShow(newRoute);
//			 }*/
//			
//			if (reasonVal == kAudioSessionRouteChangeReason_OldDeviceUnavailable)
//			{			
//				if (THIS->player->IsRunning()) {
//					[THIS pausePlayQueue];
//					[[NSNotificationCenter defaultCenter] postNotificationName:@"playbackQueueStopped" object:THIS];
//				}		
//			}
//			
//			// stop the queue if we had a non-policy route change
//			if (THIS->recorder->IsRunning()) {
//				[THIS stopRecord];
//			}
//		}	
//	}
//	else if (inID == kAudioSessionProperty_AudioInputAvailable)
//	{
//		if (inDataSize == sizeof(UInt32)) {
//			UInt32 isAvailable = *(UInt32*)inData;
//			// disable recording if input is not available
//			THIS->btn_record.enabled = (isAvailable > 0) ? YES : NO;
//		}
//	}
}



@implementation TiMediaAudioRecorderProxy

#pragma mark Internal 

-(void)_configure
{
	recorder = NULL;
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
	[super _destroy];
}

-(AQRecorder*)recorder
{
	if (recorder==NULL)
	{
		recorder = new AQRecorder();
		OSStatus error = AudioSessionInitialize(NULL, NULL, TiAudioSessionInterruptionListener, self);
		if (error)
		{
			//TODO:
		}
		else 
		{
			//TODO: check error return codes
			
			UInt32 category = kAudioSessionCategory_PlayAndRecord;	
			error = AudioSessionSetProperty(kAudioSessionProperty_AudioCategory, sizeof(category), &category);
			
			error = AudioSessionAddPropertyListener(kAudioSessionProperty_AudioRouteChange, TiAudioSessionPropertyChangeLisetner, self);
			UInt32 inputAvailable = 0;
			UInt32 size = sizeof(inputAvailable);
			
			// we do not want to allow recording if input is not available
			error = AudioSessionGetProperty(kAudioSessionProperty_AudioInputAvailable, &size, &inputAvailable);
			
			// we also need to listen to see if input availability changes
			error = AudioSessionAddPropertyListener(kAudioSessionProperty_AudioInputAvailable, TiAudioSessionPropertyChangeLisetner, self);
			
			error = AudioSessionSetActive(true); 
		}
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
		
		// Start the recorder
		recorder->StartRecord((CFStringRef)[file path]);
	}
}

-(id)stop:(id)args
{
	if (recorder!=NULL)
	{
		recorder->StopRecord();
		
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

@end
