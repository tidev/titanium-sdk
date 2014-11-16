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

#import "AudioStreamer.h"
#import "AudioStreamerCUR.h"
#import "TiUtils.h"

NSString * const ASStatusChangedNotification = @"ASStatusChangedNotification";

static NSString * const AS_NO_ERROR_STRING = @"No error.";
static NSString * const AS_FILE_STREAM_GET_PROPERTY_FAILED_STRING = @"File stream get property failed.";
static NSString * const AS_FILE_STREAM_SEEK_FAILED_STRING = @"File stream seek failed.";
static NSString * const AS_FILE_STREAM_PARSE_BYTES_FAILED_STRING = @"Parse bytes failed.";
static NSString * const AS_FILE_STREAM_OPEN_FAILED_STRING = @"Open audio file stream failed.";
static NSString * const AS_FILE_STREAM_CLOSE_FAILED_STRING = @"Close audio file stream failed.";
static NSString * const AS_AUDIO_QUEUE_CREATION_FAILED_STRING = @"Audio queue creation failed.";
static NSString * const AS_AUDIO_QUEUE_BUFFER_ALLOCATION_FAILED_STRING = @"Audio buffer allocation failed.";
static NSString * const AS_AUDIO_QUEUE_ENQUEUE_FAILED_STRING = @"Queueing of audio buffer failed.";
static NSString * const AS_AUDIO_QUEUE_ADD_LISTENER_FAILED_STRING = @"Audio queue add listener failed.";
static NSString * const AS_AUDIO_QUEUE_REMOVE_LISTENER_FAILED_STRING = @"Audio queue remove listener failed.";
static NSString * const AS_AUDIO_QUEUE_START_FAILED_STRING = @"Audio queue start failed.";
static NSString * const AS_AUDIO_QUEUE_BUFFER_MISMATCH_STRING = @"Audio queue buffers don't match.";
static NSString * const AS_AUDIO_QUEUE_DISPOSE_FAILED_STRING = @"Audio queue dispose failed.";
static NSString * const AS_AUDIO_QUEUE_PAUSE_FAILED_STRING = @"Audio queue pause failed.";
static NSString * const AS_AUDIO_QUEUE_STOP_FAILED_STRING = @"Audio queue stop failed.";
static NSString * const AS_AUDIO_DATA_NOT_FOUND_STRING = @"No audio data found.";
static NSString * const AS_AUDIO_QUEUE_FLUSH_FAILED_STRING = @"Audio queue flush failed.";
static NSString * const AS_GET_AUDIO_TIME_FAILED_STRING = @"Audio queue get current time failed.";
static NSString * const AS_AUDIO_STREAMER_FAILED_STRING = @"Audio playback failed";
static NSString * const AS_NETWORK_CONNECTION_FAILED_STRING = @"Network connection failed";
static NSString * const AS_AUDIO_BUFFER_TOO_SMALL_STRING = @"Audio packets are larger than kAQBufSize.";


@implementation AudioStreamer
@synthesize delegate;

- (id)initWithURL:(NSURL *)aURL
{
	self = [super init];
	if (self != nil)
	{
		streamer = [[AudioStreamerCUR alloc] initWithURL:aURL];
		[streamer setDelegate:self];
	}
	return self;
}

- (void)dealloc
{
	[streamer setDelegate:nil];
	RELEASE_TO_NIL(streamer);
	[super dealloc];
}

-(void)playbackStateChanged:(id)sender;
{
	[delegate playbackStateChanged:self];
}

//
// stringForErrorCode:
//
// Converts an error code to a string that can be localized or presented
// to the user.
//
// Parameters:
//    anErrorCode - the error code to convert
//
// returns the string representation of the error code
//
+ (NSString *)stringForErrorCode:(AudioStreamerErrorCode)anErrorCode
{
	switch (anErrorCode)
	{
		case AS_NO_ERROR:
			return AS_NO_ERROR_STRING;
		case AS_FILE_STREAM_GET_PROPERTY_FAILED:
			return AS_FILE_STREAM_GET_PROPERTY_FAILED_STRING;
		case AS_FILE_STREAM_SEEK_FAILED:
			return AS_FILE_STREAM_SEEK_FAILED_STRING;
		case AS_FILE_STREAM_PARSE_BYTES_FAILED:
			return AS_FILE_STREAM_PARSE_BYTES_FAILED_STRING;
		case AS_AUDIO_QUEUE_CREATION_FAILED:
			return AS_AUDIO_QUEUE_CREATION_FAILED_STRING;
		case AS_AUDIO_QUEUE_BUFFER_ALLOCATION_FAILED:
			return AS_AUDIO_QUEUE_BUFFER_ALLOCATION_FAILED_STRING;
		case AS_AUDIO_QUEUE_ENQUEUE_FAILED:
			return AS_AUDIO_QUEUE_ENQUEUE_FAILED_STRING;
		case AS_AUDIO_QUEUE_ADD_LISTENER_FAILED:
			return AS_AUDIO_QUEUE_ADD_LISTENER_FAILED_STRING;
		case AS_AUDIO_QUEUE_REMOVE_LISTENER_FAILED:
			return AS_AUDIO_QUEUE_REMOVE_LISTENER_FAILED_STRING;
		case AS_AUDIO_QUEUE_START_FAILED:
			return AS_AUDIO_QUEUE_START_FAILED_STRING;
		case AS_AUDIO_QUEUE_BUFFER_MISMATCH:
			return AS_AUDIO_QUEUE_BUFFER_MISMATCH_STRING;
		case AS_FILE_STREAM_OPEN_FAILED:
			return AS_FILE_STREAM_OPEN_FAILED_STRING;
		case AS_FILE_STREAM_CLOSE_FAILED:
			return AS_FILE_STREAM_CLOSE_FAILED_STRING;
		case AS_AUDIO_QUEUE_DISPOSE_FAILED:
			return AS_AUDIO_QUEUE_DISPOSE_FAILED_STRING;
		case AS_AUDIO_QUEUE_PAUSE_FAILED:
			return AS_AUDIO_QUEUE_DISPOSE_FAILED_STRING;
		case AS_AUDIO_QUEUE_FLUSH_FAILED:
			return AS_AUDIO_QUEUE_FLUSH_FAILED_STRING;
		case AS_AUDIO_DATA_NOT_FOUND:
			return AS_AUDIO_DATA_NOT_FOUND_STRING;
		case AS_GET_AUDIO_TIME_FAILED:
			return AS_GET_AUDIO_TIME_FAILED_STRING;
		case AS_NETWORK_CONNECTION_FAILED:
			return AS_NETWORK_CONNECTION_FAILED_STRING;
		case AS_AUDIO_QUEUE_STOP_FAILED:
			return AS_AUDIO_QUEUE_STOP_FAILED_STRING;
		case AS_AUDIO_STREAMER_FAILED:
			return AS_AUDIO_STREAMER_FAILED_STRING;
		case AS_AUDIO_BUFFER_TOO_SMALL:
			return AS_AUDIO_BUFFER_TOO_SMALL_STRING;
		default:
			return AS_AUDIO_STREAMER_FAILED_STRING;
	}
	
	return AS_AUDIO_STREAMER_FAILED_STRING;
}

#define RUN_ON_STREAMER_SET(func, type) \
-(void)func:(type)arg \
{\
	[streamer func:arg];\
}

#define RUN_ON_STREAMER_RETURN(func, type) \
-(type)func\
{\
	return [streamer func];\
}

#define RUN_ON_STREAMER(func)\
-(void)func\
{\
	[streamer func];\
}

// Properties
RUN_ON_STREAMER_SET(setErrorCode,AudioStreamerErrorCode)
RUN_ON_STREAMER_SET(setBitRate,UInt32)
RUN_ON_STREAMER_SET(setBufferSize, UInt32)
RUN_ON_STREAMER_SET(setVolume, double)

RUN_ON_STREAMER_RETURN(errorCode, AudioStreamerErrorCode)
RUN_ON_STREAMER_RETURN(bitRate, UInt32)
RUN_ON_STREAMER_RETURN(state, AudioStreamerState)
RUN_ON_STREAMER_RETURN(progress, double)
RUN_ON_STREAMER_RETURN(bufferSize, UInt32)
RUN_ON_STREAMER_RETURN(volume, double)
RUN_ON_STREAMER_RETURN(duration, NSTimeInterval);

// Functions
RUN_ON_STREAMER_RETURN(isPlaying, BOOL)
RUN_ON_STREAMER_RETURN(isPaused, BOOL)
RUN_ON_STREAMER_RETURN(isWaiting, BOOL)
RUN_ON_STREAMER_RETURN(isIdle, BOOL)

RUN_ON_STREAMER(start)
RUN_ON_STREAMER(pause)
RUN_ON_STREAMER(stop)
@end


#endif