//
//  AudioStreamer.m
//  StreamingAudioPlayer
//
//  Created by Matt Gallagher on 27/09/08.
//  Copyright 2008 Matt Gallagher. All rights reserved.
//
//  Permission is given to use this source code file, free of charge, in any
//  project, commercial or otherwise, entirely at your risk, with the condition
//  that any redistribution (in part or whole) of source code must retain
//  this copyright and permission notice. Attribution in compiled projects is
//  appreciated but not required.
//
#ifdef USE_TI_MEDIA

#import "AudioStreamerBC.h"
#ifdef TARGET_OS_IPHONE			
#import <CFNetwork/CFNetwork.h>
#endif

@interface AudioStreamerBC ()
@property (readwrite) TI_AudioStreamerState state;

- (void)handlePropertyChangeForFileStream:(AudioFileStreamID)inAudioFileStream
	fileStreamPropertyID:(AudioFileStreamPropertyID)inPropertyID
	ioFlags:(UInt32 *)ioFlags;
- (void)handleAudioPackets:(const void *)inInputData
	numberBytes:(UInt32)inNumberBytes
	numberPackets:(UInt32)inNumberPackets
	packetDescriptions:(AudioStreamPacketDescription *)inPacketDescriptions;
- (void)handleBufferCompleteForQueue:(AudioQueueRef)inAQ
	buffer:(AudioQueueBufferRef)inBuffer;
- (void)handlePropertyChangeForQueue:(AudioQueueRef)inAQ
	propertyID:(AudioQueuePropertyID)inID;

#ifdef TARGET_OS_IPHONE
- (void)handleInterruptionChangeToState:(AudioQueuePropertyID)inInterruptionState;
#endif

- (void)enqueueBuffer;
- (void)handleReadFromStream:(CFReadStreamRef)aStream
	eventType:(CFStreamEventType)eventType;

@end

#pragma mark Audio Callback Function Prototypes

void MyAudioQueueOutputCallbackBC(void* inClientData, AudioQueueRef inAQ, AudioQueueBufferRef inBuffer);
void MyAudioQueueIsRunningCallbackBC(void *inUserData, AudioQueueRef inAQ, AudioQueuePropertyID inID);
void MyPropertyListenerProcBC(	void *							inClientData,
								AudioFileStreamID				inAudioFileStream,
								AudioFileStreamPropertyID		inPropertyID,
								UInt32 *						ioFlags);
void MyPacketsProcBC(				void *							inClientData,
								UInt32							inNumberBytes,
								UInt32							inNumberPackets,
								const void *					inInputData,
								AudioStreamPacketDescription	*inPacketDescriptions);
OSStatus MyEnqueueBufferBC(AudioStreamerBC* myData);

#ifdef TARGET_OS_IPHONE			
void MyAudioSessionInterruptionListenerBC(void *inClientData, UInt32 inInterruptionState);
#endif

#pragma mark Audio Callback Function Implementations

//
// MyPropertyListenerProc
//
// Receives notification when the AudioFileStream has audio packets to be
// played. In response, this function creates the AudioQueue, getting it
// ready to begin playback (playback won't begin until audio packets are
// sent to the queue in MyEnqueueBuffer).
//
// This function is adapted from Apple's example in AudioFileStreamExample with
// kAudioQueueProperty_IsRunning listening added.
//
void MyPropertyListenerProcBC(	void *							inClientData,
								AudioFileStreamID				inAudioFileStream,
								AudioFileStreamPropertyID		inPropertyID,
								UInt32 *						ioFlags)
{	
	// this is called by audio file stream when it finds property values
	AudioStreamerBC* streamer = (AudioStreamerBC *)inClientData;
	[streamer
		handlePropertyChangeForFileStream:inAudioFileStream
		fileStreamPropertyID:inPropertyID
		ioFlags:ioFlags];
}

//
// MyPacketsProc
//
// When the AudioStream has packets to be played, this function gets an
// idle audio buffer and copies the audio packets into it. The calls to
// MyEnqueueBuffer won't return until there are buffers available (or the
// playback has been stopped).
//
// This function is adapted from Apple's example in AudioFileStreamExample with
// CBR functionality added.
//
void MyPacketsProcBC(				void *							inClientData,
								UInt32							inNumberBytes,
								UInt32							inNumberPackets,
								const void *					inInputData,
								AudioStreamPacketDescription	*inPacketDescriptions)
{
	// this is called by audio file stream when it finds packets of audio
	AudioStreamerBC* streamer = (AudioStreamerBC *)inClientData;
	[streamer
		handleAudioPackets:inInputData
		numberBytes:inNumberBytes
		numberPackets:inNumberPackets
		packetDescriptions:inPacketDescriptions];
}

//
// MyAudioQueueOutputCallback
//
// Called from the AudioQueue when playback of specific buffers completes. This
// function signals from the AudioQueue thread to the AudioStream thread that
// the buffer is idle and available for copying data.
//
// This function is unchanged from Apple's example in AudioFileStreamExample.
//
void MyAudioQueueOutputCallbackBC(	void*					inClientData, 
									AudioQueueRef			inAQ, 
									AudioQueueBufferRef		inBuffer)
{
	// this is called by the audio queue when it has finished decoding our data. 
	// The buffer is now free to be reused.
	AudioStreamerBC* streamer = (AudioStreamerBC*)inClientData;
	[streamer handleBufferCompleteForQueue:inAQ buffer:inBuffer];
}

//
// MyAudioQueueIsRunningCallback
//
// Called from the AudioQueue when playback is started or stopped. This
// information is used to toggle the observable "isPlaying" property and
// set the "finished" flag.
//
void MyAudioQueueIsRunningCallbackBC(void *inUserData, AudioQueueRef inAQ, AudioQueuePropertyID inID)
{
	AudioStreamerBC* streamer = (AudioStreamerBC *)inUserData;
	[streamer handlePropertyChangeForQueue:inAQ propertyID:inID];
}

#ifdef TARGET_OS_IPHONE			
//
// MyAudioSessionInterruptionListener
//
// Invoked if the audio session is interrupted (like when the phone rings)
//
void MyAudioSessionInterruptionListenerBC(void *inClientData, UInt32 inInterruptionState)
{
	AudioStreamerBC* streamer = (AudioStreamerBC *)inClientData;
	[streamer handleInterruptionChangeToState:inInterruptionState];
}
#endif

#pragma mark CFReadStream Callback Function Implementations

//
// ReadStreamCallBack
//
// This is the callback for the CFReadStream from the network connection. This
// is where all network data is passed to the AudioFileStream.
//
// Invoked when an error occurs, the stream ends or we have data to read.
//
void ASReadStreamCallBackBC
(
   CFReadStreamRef aStream,
   CFStreamEventType eventType,
   void* inClientInfo
)
{
	AudioStreamerBC* streamer = (AudioStreamerBC *)inClientInfo;
	[streamer handleReadFromStream:aStream eventType:eventType];
}

@implementation AudioStreamerBC

@synthesize errorCode;
@synthesize state;
@synthesize bitRate;
@dynamic progress;
@synthesize delegate;

//
// initWithURL
//
// Init method for the object.
//
- (id)initWithURL:(NSURL *)aURL
{
	self = [super init];
	if (self != nil)
	{
		url = [aURL retain];
	}
	return self;
}

//
// dealloc
//
// Releases instance memory.
//
- (void)dealloc
{
	[self stop];
	[url release];
	[super dealloc];
}

//
// isFinishing
//
// returns YES if the audio has reached a stopping condition.
//
- (BOOL)isFinishing
{
	@synchronized (self)
	{
		if ((errorCode != AS_NO_ERROR && state != AS_INITIALIZED) ||
			((state == AS_STOPPING || state == AS_STOPPED) &&
				stopReason != AS_STOPPING_TEMPORARILY))
		{
			return YES;
		}
	}
	
	return NO;
}

//
// runLoopShouldExit
//
// returns YES if the run loop should exit.
//
- (BOOL)runLoopShouldExit
{
	@synchronized(self)
	{
		if (errorCode != AS_NO_ERROR ||
			(state == AS_STOPPED &&
			stopReason != AS_STOPPING_TEMPORARILY))
		{
			return YES;
		}
	}
	
	return NO;
}

//
// failWithErrorCode:
//
// Sets the playback state to failed and logs the error.
//
// Parameters:
//    anErrorCode - the error condition
//
- (void)failWithErrorCode:(TI_AudioStreamerErrorCode)anErrorCode
{
	@synchronized(self)
	{
		if (errorCode != AS_NO_ERROR)
		{
			// Only set the error once.
			return;
		}
		
		errorCode = anErrorCode;

		if (err)
		{
			char *errChars = (char *)&err;
			NSLog(@"%@ err: %c%c%c%c %d\n",
				[AudioStreamer stringForErrorCode:anErrorCode],
				errChars[3], errChars[2], errChars[1], errChars[0],
				(int)err);
		}
		else
		{
			NSLog(@"%@", [AudioStreamer stringForErrorCode:anErrorCode]);
		}

		if (state == AS_PLAYING ||
			state == AS_PAUSED ||
			state == AS_BUFFERING)
		{
			self.state = AS_STOPPING;
			stopReason = AS_STOPPING_ERROR;
			AudioQueueStop(audioQueue, true);
		}

#ifdef TARGET_OS_IPHONE			
		UIAlertView *alert =
			[[[UIAlertView alloc]
				initWithTitle:NSLocalizedStringFromTable(@"Audio Error", @"Errors", nil)
				message:NSLocalizedStringFromTable([AudioStreamer stringForErrorCode:self.errorCode], @"Errors", nil)
				delegate:self
				cancelButtonTitle:@"OK"
				otherButtonTitles: nil]
			autorelease];
		[alert 
			performSelector:@selector(show)
			onThread:[NSThread mainThread]
			withObject:nil
			waitUntilDone:NO];
#else
		NSAlert *alert =
			[NSAlert
				alertWithMessageText:NSLocalizedString(@"Audio Error", @"")
				defaultButton:NSLocalizedString(@"OK", @"")
				alternateButton:nil
				otherButton:nil
				informativeTextWithFormat:[AudioStreamer stringForErrorCode:self.errorCode]];
		[alert
			performSelector:@selector(runModal)
			onThread:[NSThread mainThread]
			withObject:nil
			waitUntilDone:NO];
#endif
	}
}

//
// setState:
//
// Sets the state and sends a notification that the state has changed.
//
// This method
//
// Parameters:
//    anErrorCode - the error condition
//
- (void)setState:(TI_AudioStreamerState)aStatus
{
	@synchronized(self)
	{
		if (state != aStatus)
		{
			state = aStatus;
			[delegate playbackStateChanged:self];
		}
	}
}

//
// isPlaying
//
// returns YES if the audio currently playing.
//
- (BOOL)isPlaying
{
	if (state == AS_PLAYING)
	{
		return YES;
	}
	
	return NO;
}

//
// isPaused
//
// returns YES if the audio currently playing.
//
- (BOOL)isPaused
{
	if (state == AS_PAUSED)
	{
		return YES;
	}
	
	return NO;
}

//
// isWaiting
//
// returns YES if the AudioStreamer is waiting for a state transition of some
// kind.
//
- (BOOL)isWaiting
{
	@synchronized(self)
	{
		if ([self isFinishing] ||
			state == AS_STARTING_FILE_THREAD||
			state == AS_WAITING_FOR_DATA ||
			state == AS_WAITING_FOR_QUEUE_TO_START ||
			state == AS_BUFFERING)
		{
			return YES;
		}
	}
	
	return NO;
}

//
// isIdle
//
// returns YES if the AudioStream is in the AS_INITIALIZED state (i.e.
// isn't doing anything).
//
- (BOOL)isIdle
{
	if (state == AS_INITIALIZED)
	{
		return YES;
	}
	
	return NO;
}

//
// openFileStream
//
// Open the audioFileStream to parse data and the fileHandle as the data
// source.
//
- (BOOL)openFileStream
{
	@synchronized(self)
	{
		NSAssert(stream == nil && audioFileStream == nil,
			@"audioFileStream already initialized");
		
		//
		// Attempt to guess the file type from the URL. Reading the MIME type
		// from the CFReadStream would be a better approach since lots of
		// URL's don't have the right extension.
		//
		// If you have a fixed file-type, you may want to hardcode this.
		//
		AudioFileTypeID fileTypeHint = kAudioFileMP3Type;
		NSString *fileExtension = [[url path] pathExtension];
		if ([fileExtension isEqual:@"mp3"])
		{
			fileTypeHint = kAudioFileMP3Type;
		}
		else if ([fileExtension isEqual:@"wav"])
		{
			fileTypeHint = kAudioFileWAVEType;
		}
		else if ([fileExtension isEqual:@"aifc"])
		{
			fileTypeHint = kAudioFileAIFCType;
		}
		else if ([fileExtension isEqual:@"aiff"])
		{
			fileTypeHint = kAudioFileAIFFType;
		}
		else if ([fileExtension isEqual:@"m4a"])
		{
			fileTypeHint = kAudioFileM4AType;
		}
		else if ([fileExtension isEqual:@"mp4"])
		{
			fileTypeHint = kAudioFileMPEG4Type;
		}
		else if ([fileExtension isEqual:@"caf"])
		{
			fileTypeHint = kAudioFileCAFType;
		}
		else if ([fileExtension isEqual:@"aac"])
		{
			fileTypeHint = kAudioFileAAC_ADTSType;
		}

		// create an audio file stream parser
		err = AudioFileStreamOpen(self, MyPropertyListenerProcBC, MyPacketsProcBC, 
								fileTypeHint, &audioFileStream);
		if (err)
		{
			[self failWithErrorCode:AS_FILE_STREAM_OPEN_FAILED];
			return NO;
		}
		
		//
		// Create the GET request
		//
		CFHTTPMessageRef message= CFHTTPMessageCreateRequest(NULL, (CFStringRef)@"GET", (CFURLRef)url, kCFHTTPVersion1_1);
		stream = CFReadStreamCreateForHTTPRequest(NULL, message);
		CFRelease(message);
		
		//
		// Enable stream redirection
		//
		if (CFReadStreamSetProperty(
			stream,
			kCFStreamPropertyHTTPShouldAutoredirect,
			kCFBooleanTrue) == false)
		{
#ifdef TARGET_OS_IPHONE
			UIAlertView *alert =
				[[UIAlertView alloc]
					initWithTitle:NSLocalizedStringFromTable(@"File Error", @"Errors", nil)
					message:NSLocalizedStringFromTable(@"Unable to configure network read stream.", @"Errors", nil)
					delegate:self
					cancelButtonTitle:@"OK"
					otherButtonTitles: nil];
			[alert
				performSelector:@selector(show)
				onThread:[NSThread mainThread]
				withObject:nil
				waitUntilDone:YES];
			[alert release];
#else
		NSAlert *alert =
			[NSAlert
				alertWithMessageText:NSLocalizedStringFromTable(@"File Error", @"Errors", nil)
				defaultButton:NSLocalizedString(@"OK", @"")
				alternateButton:nil
				otherButton:nil
				informativeTextWithFormat:NSLocalizedStringFromTable(@"Unable to configure network read stream.", @"Errors", nil)];
		[alert
			performSelector:@selector(runModal)
			onThread:[NSThread mainThread]
			withObject:nil
			waitUntilDone:NO];
#endif
			return NO;
		}
		
		//
		// Handle SSL connections
		//
		if( [[url absoluteString] rangeOfString:@"https"].location != NSNotFound )
		{
			NSDictionary *sslSettings =
				[NSDictionary dictionaryWithObjectsAndKeys:
					(NSString *)kCFStreamSocketSecurityLevelNegotiatedSSL, kCFStreamSSLLevel,
					[NSNumber numberWithBool:YES], kCFStreamSSLAllowsExpiredCertificates,
					[NSNumber numberWithBool:YES], kCFStreamSSLAllowsExpiredRoots,
					[NSNumber numberWithBool:YES], kCFStreamSSLAllowsAnyRoot,
					[NSNumber numberWithBool:NO], kCFStreamSSLValidatesCertificateChain,
					[NSNull null], kCFStreamSSLPeerName,
				nil];

			CFReadStreamSetProperty(stream, kCFStreamPropertySSLSettings, sslSettings);
		}
		
		//
		// Open the stream
		//
		if (!CFReadStreamOpen(stream))
		{
			CFRelease(stream);
#ifdef TARGET_OS_IPHONE
			UIAlertView *alert =
				[[UIAlertView alloc]
					initWithTitle:NSLocalizedStringFromTable(@"File Error", @"Errors", nil)
					message:NSLocalizedStringFromTable(@"Unable to configure network read stream.", @"Errors", nil)
					delegate:self
					cancelButtonTitle:@"OK"
					otherButtonTitles: nil];
			[alert
				performSelector:@selector(show)
				onThread:[NSThread mainThread]
				withObject:nil
				waitUntilDone:YES];
			[alert release];
#else
		NSAlert *alert =
			[NSAlert
				alertWithMessageText:NSLocalizedStringFromTable(@"File Error", @"Errors", nil)
				defaultButton:NSLocalizedString(@"OK", @"")
				alternateButton:nil
				otherButton:nil
				informativeTextWithFormat:NSLocalizedStringFromTable(@"Unable to configure network read stream.", @"Errors", nil)];
		[alert
			performSelector:@selector(runModal)
			onThread:[NSThread mainThread]
			withObject:nil
			waitUntilDone:NO];
#endif
			return NO;
		}
		
		//
		// Set our callback function to receive the data
		//
		CFStreamClientContext context = {0, self, NULL, NULL, NULL};
		CFReadStreamSetClient(
			stream,
			kCFStreamEventHasBytesAvailable | kCFStreamEventErrorOccurred | kCFStreamEventEndEncountered,
			ASReadStreamCallBackBC,
			&context);
		CFReadStreamScheduleWithRunLoop(stream, CFRunLoopGetCurrent(), kCFRunLoopCommonModes);
	}
	
	return YES;
}

//
// startInternal
//
// This is the start method for the AudioStream thread. This thread is created
// because it will be blocked when there are no audio buffers idle (and ready
// to receive audio data).
//
// Activity in this thread:
//	- Creation and cleanup of all AudioFileStream and AudioQueue objects
//	- Receives data from the CFReadStream
//	- AudioFileStream processing
//	- Copying of data from AudioFileStream into audio buffers
//  - Stopping of the thread because of end-of-file
//	- Stopping due to error or failure
//
// Activity *not* in this thread:
//	- AudioQueue playback and notifications (happens in AudioQueue thread)
//  - Actual download of NSURLConnection data (NSURLConnection's thread)
//	- Creation of the AudioStreamer (other, likely "main" thread)
//	- Invocation of -start method (other, likely "main" thread)
//	- User/manual invocation of -stop (other, likely "main" thread)
//
// This method contains bits of the "main" function from Apple's example in
// AudioFileStreamExample.
//
- (void)startInternal
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];

	@synchronized(self)
	{
		if (state != AS_STARTING_FILE_THREAD)
		{
			if (state != AS_STOPPING &&
				state != AS_STOPPED)
			{
				NSLog(@"### Not starting audio thread. State code is: %ld", state);
			}
			self.state = AS_INITIALIZED;
			[pool release];
			return;
		}
					
		self.state = AS_WAITING_FOR_DATA;
		
		// initialize a mutex and condition so that we can block on buffers in use.
		pthread_mutex_init(&queueBuffersMutex, NULL);
		pthread_cond_init(&queueBufferReadyCondition, NULL);
		
		if (![self openFileStream])
		{
			goto cleanup;
		}
	}
	
	//
	// Process the run loop until playback is finished or failed.
	//
	BOOL isRunning = YES;
	do
	{
		isRunning = [[NSRunLoop currentRunLoop]
			runMode:NSDefaultRunLoopMode
			beforeDate:[NSDate dateWithTimeIntervalSinceNow:0.25]];
		
		//
		// If there are no queued buffers, we need to check here since the
		// handleBufferCompleteForQueue:buffer: should not change the state
		// (may not enter the synchronized section).
		//
		if (buffersUsed == 0 && self.state == AS_PLAYING)
		{
			err = AudioQueuePause(audioQueue);
			if (err)
			{
				[self failWithErrorCode:AS_AUDIO_QUEUE_PAUSE_FAILED];
				return;
			}
			self.state = AS_BUFFERING;
		}
	} while (isRunning && ![self runLoopShouldExit]);
	
cleanup:

	@synchronized(self)
	{
		//
		// Cleanup the read stream if it is still open
		//
		if (stream)
		{
			CFReadStreamClose(stream);
			CFRelease(stream);
			stream = nil;
		}
		
		//
		// Close the audio file strea,
		//
		if (audioFileStream)
		{
			err = AudioFileStreamClose(audioFileStream);
			audioFileStream = nil;
			if (err)
			{
				[self failWithErrorCode:AS_FILE_STREAM_CLOSE_FAILED];
			}
		}
		
		//
		// Dispose of the Audio Queue
		//
		if (audioQueue)
		{
			err = AudioQueueDispose(audioQueue, true);
			audioQueue = nil;
			if (err)
			{
				[self failWithErrorCode:AS_AUDIO_QUEUE_DISPOSE_FAILED];
			}
		}

		pthread_mutex_destroy(&queueBuffersMutex);
		pthread_cond_destroy(&queueBufferReadyCondition);

		bytesFilled = 0;
		packetsFilled = 0;
		seekTime = 0;
		seekNeeded = NO;
		self.state = AS_INITIALIZED;
	}

	[pool release];
}

//
// start
//
// Calls startInternal in a new thread.
//
- (void)start
{
	@synchronized (self)
	{
		if (state == AS_PAUSED)
		{
			[self pause];
		}
		else if (state == AS_INITIALIZED)
		{
			NSAssert([[NSThread currentThread] isEqual:[NSThread mainThread]],
				@"Playback can only be started from the main thread.");
			self.state = AS_STARTING_FILE_THREAD;
			[NSThread
				detachNewThreadSelector:@selector(startInternal)
				toTarget:self
				withObject:nil];
		}
	}
}

//
// progress
//
// returns the current playback progress. Will return zero if sampleRate has
// not yet been detected.
//
- (double)progress
{
	@synchronized(self)
	{
		if (sampleRate > 0 && ![self isFinishing])
		{
			if (state != AS_PLAYING && state != AS_PAUSED && state != AS_BUFFERING)
			{
				return lastProgress;
			}

			AudioTimeStamp queueTime;
			Boolean discontinuity;
			err = AudioQueueGetCurrentTime(audioQueue, NULL, &queueTime, &discontinuity);
			if (err)
			{
				[self failWithErrorCode:AS_GET_AUDIO_TIME_FAILED];
			}

			double progress = seekTime + queueTime.mSampleTime / sampleRate;
			if (progress < 0.0)
			{
				progress = 0.0;
			}
			
			lastProgress = progress;
			return progress;
		}
	}
	
	return lastProgress;
}

//
// pause
//
// A togglable pause function.
//
- (void)pause
{
	@synchronized(self)
	{
		if (state == AS_PLAYING)
		{
			err = AudioQueuePause(audioQueue);
			if (err)
			{
				[self failWithErrorCode:AS_AUDIO_QUEUE_PAUSE_FAILED];
				return;
			}
			self.state = AS_PAUSED;
		}
		else if (state == AS_PAUSED)
		{
			err = AudioQueueStart(audioQueue, NULL);
			if (err)
			{
				[self failWithErrorCode:AS_AUDIO_QUEUE_START_FAILED];
				return;
			}
			self.state = AS_PLAYING;
		}
	}
}

//
// shouldSeek
//
// Applies the logic to verify if seeking should occur.
//
// returns YES (seeking should occur) or NO (otherwise).
//
- (BOOL)shouldSeek
{
	@synchronized(self)
	{
		if (bitRate != 0 && bitRate != ~0 && seekNeeded &&
			(state == AS_PLAYING || state == AS_PAUSED || state == AS_BUFFERING))
		{
			return YES;
		}
	}
	return NO;
}

//
// stop
//
// This method can be called to stop downloading/playback before it completes.
// It is automatically called when an error occurs.
//
// If playback has not started before this method is called, it will toggle the
// "isPlaying" property so that it is guaranteed to transition to true and
// back to false 
//
- (void)stop
{
	@synchronized(self)
	{
		if (audioQueue &&
			(state == AS_PLAYING || state == AS_PAUSED ||
				state == AS_BUFFERING || state == AS_WAITING_FOR_QUEUE_TO_START))
		{
			self.state = AS_STOPPING;
			stopReason = AS_STOPPING_USER_ACTION;
			err = AudioQueueStop(audioQueue, true);
			if (err)
			{
				[self failWithErrorCode:AS_AUDIO_QUEUE_STOP_FAILED];
				return;
			}
		}
		else if (state != AS_INITIALIZED)
		{
			self.state = AS_STOPPED;
			stopReason = AS_STOPPING_USER_ACTION;
		}
	}
	
	while (state != AS_INITIALIZED)
	{
		[NSThread sleepForTimeInterval:0.1];
	}
}

//
// handleReadFromStream:eventType:data:
//
// Reads data from the network file stream into the AudioFileStream
//
// Parameters:
//    aStream - the network file stream
//    eventType - the event which triggered this method
//
- (void)handleReadFromStream:(CFReadStreamRef)aStream
	eventType:(CFStreamEventType)eventType
{
	if (eventType == kCFStreamEventErrorOccurred)
	{
		[self failWithErrorCode:AS_AUDIO_DATA_NOT_FOUND];
	}
	else if (eventType == kCFStreamEventEndEncountered)
	{
		@synchronized(self)
		{
			if ([self isFinishing])
			{
				return;
			}
		}
		
		//
		// If there is a partially filled buffer, pass it to the AudioQueue for
		// processing
		//
		if (bytesFilled)
		{
			[self enqueueBuffer];
		}

		@synchronized(self)
		{
			if (state == AS_WAITING_FOR_DATA)
			{
				[self failWithErrorCode:AS_AUDIO_DATA_NOT_FOUND];
			}
			
			//
			// We left the synchronized section to enqueue the buffer so we
			// must check that we are !finished again before touching the
			// audioQueue
			//
			else if (![self isFinishing])
			{
				if (audioQueue)
				{
					//
					// Set the progress at the end of the stream
					//
					err = AudioQueueFlush(audioQueue);
					if (err)
					{
						[self failWithErrorCode:AS_AUDIO_QUEUE_FLUSH_FAILED];
						return;
					}

					self.state = AS_STOPPING;
					stopReason = AS_STOPPING_EOF;
					err = AudioQueueStop(audioQueue, false);
					if (err)
					{
						[self failWithErrorCode:AS_AUDIO_QUEUE_FLUSH_FAILED];
						return;
					}
				}
				else
				{
					self.state = AS_STOPPED;
					stopReason = AS_STOPPING_EOF;
				}
			}
		}
	}
	else if (eventType == kCFStreamEventHasBytesAvailable)
	{
		UInt8 bytes[kAQBufSize];
		CFIndex length;
		@synchronized(self)
		{
			if ([self isFinishing])
			{
				return;
			}
			
			//
			// Read the bytes from the stream
			//
			length = CFReadStreamRead(stream, bytes, kAQBufSize);
			
			if (length == -1)
			{
				[self failWithErrorCode:AS_AUDIO_DATA_NOT_FOUND];
				return;
			}
			
			if (length == 0)
			{
				return;
			}
		}

		if (discontinuous)
		{
			err = AudioFileStreamParseBytes(audioFileStream, length, bytes, kAudioFileStreamParseFlag_Discontinuity);
			if (err)
			{
				[self failWithErrorCode:AS_FILE_STREAM_PARSE_BYTES_FAILED];
				return;
			}
		}
		else
		{
			err = AudioFileStreamParseBytes(audioFileStream, length, bytes, 0);
			if (err)
			{
				[self failWithErrorCode:AS_FILE_STREAM_PARSE_BYTES_FAILED];
				return;
			}
		}
	}
}

//
// enqueueBuffer
//
// Called from MyPacketsProc and connectionDidFinishLoading to pass filled audio
// bufffers (filled by MyPacketsProc) to the AudioQueue for playback. This
// function does not return until a buffer is idle for further filling or
// the AudioQueue is stopped.
//
// This function is adapted from Apple's example in AudioFileStreamExample with
// CBR functionality added.
//
- (void)enqueueBuffer
{
	@synchronized(self)
	{
		if ([self isFinishing])
		{
			return;
		}
		
		inuse[fillBufferIndex] = true;		// set in use flag
		buffersUsed++;

		// enqueue buffer
		AudioQueueBufferRef fillBuf = audioQueueBuffer[fillBufferIndex];
		fillBuf->mAudioDataByteSize = bytesFilled;
		
		if (packetsFilled)
		{
			err = AudioQueueEnqueueBuffer(audioQueue, fillBuf, packetsFilled, packetDescs);
		}
		else
		{
			err = AudioQueueEnqueueBuffer(audioQueue, fillBuf, 0, NULL);
		}
		
		if (err)
		{
			[self failWithErrorCode:AS_AUDIO_QUEUE_ENQUEUE_FAILED];
			return;
		}

		
		if (state == AS_BUFFERING ||
			state == AS_WAITING_FOR_DATA ||
			(state == AS_STOPPED && stopReason == AS_STOPPING_TEMPORARILY))
		{
			//
			// Fill all the buffers before starting. This ensures that the
			// AudioFileStream stays a small amount ahead of the AudioQueue to
			// avoid an audio glitch playing streaming files on iPhone SDKs < 3.0
			//
			if (buffersUsed == kNumAQBufs - 1)
			{
				if (self.state == AS_BUFFERING)
				{
					err = AudioQueueStart(audioQueue, NULL);
					if (err)
					{
						[self failWithErrorCode:AS_AUDIO_QUEUE_START_FAILED];
						return;
					}
					self.state = AS_PLAYING;
				}
				else
				{
					self.state = AS_WAITING_FOR_QUEUE_TO_START;

					err = AudioQueueStart(audioQueue, NULL);
					if (err)
					{
						[self failWithErrorCode:AS_AUDIO_QUEUE_START_FAILED];
						return;
					}
				}
			}
		}

		// go to next buffer
		if (++fillBufferIndex >= kNumAQBufs) fillBufferIndex = 0;
		bytesFilled = 0;		// reset bytes filled
		packetsFilled = 0;		// reset packets filled
	}

	// wait until next buffer is not in use
	pthread_mutex_lock(&queueBuffersMutex); 
	while (inuse[fillBufferIndex])
	{
		pthread_cond_wait(&queueBufferReadyCondition, &queueBuffersMutex);
	}
	pthread_mutex_unlock(&queueBuffersMutex);
}

//
// handlePropertyChangeForFileStream:fileStreamPropertyID:ioFlags:
//
// Object method which handles implementation of MyPropertyListenerProc
//
// Parameters:
//    inAudioFileStream - should be the same as self->audioFileStream
//    inPropertyID - the property that changed
//    ioFlags - the ioFlags passed in
//
- (void)handlePropertyChangeForFileStream:(AudioFileStreamID)inAudioFileStream
	fileStreamPropertyID:(AudioFileStreamPropertyID)inPropertyID
	ioFlags:(UInt32 *)ioFlags
{
	@synchronized(self)
	{
		if ([self isFinishing])
		{
			return;
		}
		
		if (inPropertyID == kAudioFileStreamProperty_ReadyToProducePackets)
		{
			discontinuous = true;
			
			AudioStreamBasicDescription asbd;
			UInt32 asbdSize = sizeof(asbd);
			
			// get the stream format.
			err = AudioFileStreamGetProperty(inAudioFileStream, kAudioFileStreamProperty_DataFormat, &asbdSize, &asbd);
			if (err)
			{
				[self failWithErrorCode:AS_FILE_STREAM_GET_PROPERTY_FAILED];
				return;
			}
			
			sampleRate = asbd.mSampleRate;
			
			// create the audio queue
			err = AudioQueueNewOutput(&asbd, MyAudioQueueOutputCallbackBC, self, NULL, NULL, 0, &audioQueue);
			if (err)
			{
				[self failWithErrorCode:AS_AUDIO_QUEUE_CREATION_FAILED];
				return;
			}
			
			// start the queue if it has not been started already
			// listen to the "isRunning" property
			err = AudioQueueAddPropertyListener(audioQueue, kAudioQueueProperty_IsRunning, MyAudioQueueIsRunningCallbackBC, self);
			if (err)
			{
				[self failWithErrorCode:AS_AUDIO_QUEUE_ADD_LISTENER_FAILED];
				return;
			}
			
			// allocate audio queue buffers
			for (unsigned int i = 0; i < kNumAQBufs; ++i)
			{
				err = AudioQueueAllocateBuffer(audioQueue, kAQBufSize, &audioQueueBuffer[i]);
				if (err)
				{
					[self failWithErrorCode:AS_AUDIO_QUEUE_BUFFER_ALLOCATION_FAILED];
					return;
				}
			}

			// get the cookie size
			UInt32 cookieSize;
			Boolean writable;
			OSStatus ignorableError;
			ignorableError = AudioFileStreamGetPropertyInfo(inAudioFileStream, kAudioFileStreamProperty_MagicCookieData, &cookieSize, &writable);
			if (ignorableError)
			{
				return;
			}

			// get the cookie data
			void* cookieData = calloc(1, cookieSize);
			ignorableError = AudioFileStreamGetProperty(inAudioFileStream, kAudioFileStreamProperty_MagicCookieData, &cookieSize, cookieData);
			if (ignorableError)
			{
				return;
			}

			// set the cookie on the queue.
			ignorableError = AudioQueueSetProperty(audioQueue, kAudioQueueProperty_MagicCookie, cookieData, cookieSize);
			free(cookieData);
			if (ignorableError)
			{
				return;
			}
		}
		else if (inPropertyID == kAudioFileStreamProperty_DataOffset)
		{
			SInt64 offset;
			UInt32 offsetSize = sizeof(offset);
			err = AudioFileStreamGetProperty(inAudioFileStream, kAudioFileStreamProperty_DataOffset, &offsetSize, &offset);
			dataOffset = offset;
			if (err)
			{
				[self failWithErrorCode:AS_FILE_STREAM_GET_PROPERTY_FAILED];
				return;
			}
		}
	}
}

//
// handleAudioPackets:numberBytes:numberPackets:packetDescriptions:
//
// Object method which handles the implementation of MyPacketsProc
//
// Parameters:
//    inInputData - the packet data
//    inNumberBytes - byte size of the data
//    inNumberPackets - number of packets in the data
//    inPacketDescriptions - packet descriptions
//
- (void)handleAudioPackets:(const void *)inInputData
	numberBytes:(UInt32)inNumberBytes
	numberPackets:(UInt32)inNumberPackets
	packetDescriptions:(AudioStreamPacketDescription *)inPacketDescriptions;
{
	@synchronized(self)
	{
		if ([self isFinishing])
		{
			return;
		}
		
		if (bitRate == 0)
		{
			UInt32 dataRateDataSize = sizeof(UInt32);
			err = AudioFileStreamGetProperty(
				audioFileStream,
				kAudioFileStreamProperty_BitRate,
				&dataRateDataSize,
				&bitRate);
			if (err)
			{
				//
				// m4a and a few other formats refuse to parse the bitrate so
				// we need to set an "unparseable" condition here. If you know
				// the bitrate (parsed it another way) you can set it on the
				// class if needed.
				//
				bitRate = ~0;
			}
		}
		
		// we have successfully read the first packests from the audio stream, so
		// clear the "discontinuous" flag
		discontinuous = false;
	}

	// the following code assumes we're streaming VBR data. for CBR data, the second branch is used.
	if (inPacketDescriptions)
	{
		for (int i = 0; i < inNumberPackets; ++i)
		{
			SInt64 packetOffset = inPacketDescriptions[i].mStartOffset;
			SInt64 packetSize   = inPacketDescriptions[i].mDataByteSize;
			size_t bufSpaceRemaining;
			
			@synchronized(self)
			{
				// If the audio was terminated before this point, then
				// exit.
				if ([self isFinishing])
				{
					return;
				}
				
				//
				// If we need to seek then unroll the stack back to the
				// appropriate point
				//
				if ([self shouldSeek])
				{
					return;
				}
				
				if (packetSize > kAQBufSize)
				{
					[self failWithErrorCode:AS_AUDIO_BUFFER_TOO_SMALL];
				}

				bufSpaceRemaining = kAQBufSize - bytesFilled;
			}

			// if the space remaining in the buffer is not enough for this packet, then enqueue the buffer.
			if (bufSpaceRemaining < packetSize)
			{
				[self enqueueBuffer];
			}
			
			@synchronized(self)
			{
				// If the audio was terminated while waiting for a buffer, then
				// exit.
				if ([self isFinishing])
				{
					return;
				}
				
				//
				// If we need to seek then unroll the stack back to the
				// appropriate point
				//
				if ([self shouldSeek])
				{
					return;
				}
				 
				// copy data to the audio queue buffer
				AudioQueueBufferRef fillBuf = audioQueueBuffer[fillBufferIndex];
				memcpy((char*)fillBuf->mAudioData + bytesFilled, (const char*)inInputData + packetOffset, packetSize);

				// fill out packet description
				packetDescs[packetsFilled] = inPacketDescriptions[i];
				packetDescs[packetsFilled].mStartOffset = bytesFilled;
				// keep track of bytes filled and packets filled
				bytesFilled += packetSize;
				packetsFilled += 1;
			}
			
			// if that was the last free packet description, then enqueue the buffer.
			size_t packetsDescsRemaining = kAQMaxPacketDescs - packetsFilled;
			if (packetsDescsRemaining == 0) {
				[self enqueueBuffer];
			}
		}	
	}
	else
	{
		size_t offset = 0;
		while (inNumberBytes)
		{
			// if the space remaining in the buffer is not enough for this packet, then enqueue the buffer.
			size_t bufSpaceRemaining = kAQBufSize - bytesFilled;
			if (bufSpaceRemaining < inNumberBytes)
			{
				[self enqueueBuffer];
			}
			
			@synchronized(self)
			{
				// If the audio was terminated while waiting for a buffer, then
				// exit.
				if ([self isFinishing])
				{
					return;
				}
				
				//
				// If we need to seek then unroll the stack back to the
				// appropriate point
				//
				if ([self shouldSeek])
				{
					return;
				}
				
				// copy data to the audio queue buffer
				AudioQueueBufferRef fillBuf = audioQueueBuffer[fillBufferIndex];
				bufSpaceRemaining = kAQBufSize - bytesFilled;
				size_t copySize;
				if (bufSpaceRemaining < inNumberBytes)
				{
					copySize = bufSpaceRemaining;
				}
				else
				{
					copySize = inNumberBytes;
				}
				memcpy((char*)fillBuf->mAudioData + bytesFilled, (const char*)(inInputData + offset), copySize);


				// keep track of bytes filled and packets filled
				bytesFilled += copySize;
				packetsFilled = 0;
				inNumberBytes -= copySize;
				offset += copySize;
			}
		}
	}
}

//
// handleBufferCompleteForQueue:buffer:
//
// Handles the buffer completetion notification from the audio queue
//
// Parameters:
//    inAQ - the queue
//    inBuffer - the buffer
//
- (void)handleBufferCompleteForQueue:(AudioQueueRef)inAQ
	buffer:(AudioQueueBufferRef)inBuffer
{
	unsigned int bufIndex = -1;
	for (unsigned int i = 0; i < kNumAQBufs; ++i)
	{
		if (inBuffer == audioQueueBuffer[i])
		{
			bufIndex = i;
			break;
		}
	}
	
	if (bufIndex == -1)
	{
		[self failWithErrorCode:AS_AUDIO_QUEUE_BUFFER_MISMATCH];
		pthread_mutex_lock(&queueBuffersMutex);
		pthread_cond_signal(&queueBufferReadyCondition);
		pthread_mutex_unlock(&queueBuffersMutex);
		return;
	}
	
	// signal waiting thread that the buffer is free.
	pthread_mutex_lock(&queueBuffersMutex);
	inuse[bufIndex] = false;
	buffersUsed--;

//
//  Enable this logging to measure how many buffers are queued at any time.
//
#if LOG_QUEUED_BUFFERS
	NSLog(@"Queued buffers: %ld", buffersUsed);
#endif
	
	pthread_cond_signal(&queueBufferReadyCondition);
	pthread_mutex_unlock(&queueBuffersMutex);
}

//
// handlePropertyChangeForQueue:propertyID:
//
// Implementation for MyAudioQueueIsRunningCallback
//
// Parameters:
//    inAQ - the audio queue
//    inID - the property ID
//
- (void)handlePropertyChangeForQueue:(AudioQueueRef)inAQ
	propertyID:(AudioQueuePropertyID)inID
{
	NSAutoreleasePool *pool = [[NSAutoreleasePool alloc] init];
	
	@synchronized(self)
	{
		if (inID == kAudioQueueProperty_IsRunning)
		{
			if (state == AS_STOPPING)
			{
				self.state = AS_STOPPED;
			}
			else if (state == AS_WAITING_FOR_QUEUE_TO_START)
			{
				//
				// Note about this bug avoidance quirk:
				//
				// On cleanup of the AudioQueue thread, on rare occasions, there would
				// be a crash in CFSetContainsValue as a CFRunLoopObserver was getting
				// removed from the CFRunLoop.
				//
				// After lots of testing, it appeared that the audio thread was
				// attempting to remove CFRunLoop observers from the CFRunLoop after the
				// thread had already deallocated the run loop.
				//
				// By creating an NSRunLoop for the AudioQueue thread, it changes the
				// thread destruction order and seems to avoid this crash bug -- or
				// at least I haven't had it since (nasty hard to reproduce error!)
				//
				[NSRunLoop currentRunLoop];

				self.state = AS_PLAYING;
			}
			else
			{
				NSLog(@"AudioQueue changed state in unexpected way.");
			}
		}
	}
	
	[pool release];
}

#ifdef TARGET_OS_IPHONE
//
// handleInterruptionChangeForQueue:propertyID:
//
// Implementation for MyAudioQueueInterruptionListener
//
// Parameters:
//    inAQ - the audio queue
//    inID - the property ID
//
- (void)handleInterruptionChangeToState:(AudioQueuePropertyID)inInterruptionState
{
	if (inInterruptionState == kAudioSessionBeginInterruption)
	{
		[self pause];
	}
	else if (inInterruptionState == kAudioSessionEndInterruption)
	{
		[self pause];
	}
}
#endif

@end


#endif