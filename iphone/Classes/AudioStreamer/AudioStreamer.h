//
//  AudioStreamer.h
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

// This file is meant to be a repository for common defintions between AudioStreamerBC (backcompat, 3.1.x)
// and AudioStreamerCUR (iOS 3.2+), as well as a proxy which shunts messages to the appropriate AudioStreamer.
// - SPT

// Also note that we've had to change enumeration and class names here - this is because
// some modules may require the use of AudioStreamer in external libraries and the
// symbols cannot be changed on that end.  The use of common symbols in Titanium without
// namespaces is a recurring problem, and we can thank Objective-C for it.
// - SPT

#ifdef USE_TI_MEDIA

#define LOG_QUEUED_BUFFERS 0

#define kNumAQBufs 16			// Number of audio queue buffers we allocate.
								// Needs to be big enough to keep audio pipeline
								// busy (non-zero number of queued buffers) but
								// not so big that audio takes too long to begin
								// (kNumAQBufs * kAQBufSize of data must be
								// loaded before playback will start).
								// Set LOG_QUEUED_BUFFERS to 1 to log how many
								// buffers are queued at any time -- if it drops
								// to zero too often, this value may need to
								// increase. Min 3, typical 8-24.

#define kAQMaxPacketDescs 512	// Number of packet descriptions in our array
#define kAQDefaultBufSize 2048	// Number of bytes in each audio queue buffer
                                // Needs to be big enough to hold a packet of
                                // audio from the audio file. If number is too
                                // large, queuing of audio before playback starts
                                // will take too long.
                                // Highly compressed files can use smaller
                                // numbers (512 or less). 2048 should hold all
                                // but the largest packets. A buffer size error
                                // will occur if this number is too small.


typedef enum
{
	AS_INITIALIZED = 0,
	AS_STARTING_FILE_THREAD,
	AS_WAITING_FOR_DATA,
	AS_WAITING_FOR_QUEUE_TO_START,
	AS_PLAYING,
	AS_BUFFERING,
	AS_STOPPING,
	AS_STOPPED,
	AS_PAUSED,
	AS_FLUSHING_EOF
} AudioStreamerState;

typedef enum
{
	AS_NO_STOP = 0,
	AS_STOPPING_EOF,
	AS_STOPPING_USER_ACTION,
	AS_STOPPING_ERROR,
	AS_STOPPING_TEMPORARILY
} AudioStreamerStopReason;

typedef enum
{
	AS_NO_ERROR = 0,
	AS_NETWORK_CONNECTION_FAILED,
	AS_FILE_STREAM_GET_PROPERTY_FAILED,
	AS_FILE_STREAM_SEEK_FAILED,
	AS_FILE_STREAM_PARSE_BYTES_FAILED,
	AS_FILE_STREAM_OPEN_FAILED,
	AS_FILE_STREAM_CLOSE_FAILED,
	AS_AUDIO_DATA_NOT_FOUND,
	AS_AUDIO_QUEUE_CREATION_FAILED,
	AS_AUDIO_QUEUE_BUFFER_ALLOCATION_FAILED,
	AS_AUDIO_QUEUE_ENQUEUE_FAILED,
	AS_AUDIO_QUEUE_ADD_LISTENER_FAILED,
	AS_AUDIO_QUEUE_REMOVE_LISTENER_FAILED,
	AS_AUDIO_QUEUE_START_FAILED,
	AS_AUDIO_QUEUE_PAUSE_FAILED,
	AS_AUDIO_QUEUE_BUFFER_MISMATCH,
	AS_AUDIO_QUEUE_DISPOSE_FAILED,
	AS_AUDIO_QUEUE_STOP_FAILED,
	AS_AUDIO_QUEUE_FLUSH_FAILED,
	AS_AUDIO_STREAMER_FAILED,
	AS_GET_AUDIO_TIME_FAILED,
	AS_AUDIO_BUFFER_TOO_SMALL
} AudioStreamerErrorCode;

extern NSString * const ASStatusChangedNotification;

@protocol AudioStreamerDelegate<NSObject>
-(void)playbackStateChanged:(id)sender;
@end


@protocol AudioStreamerProtocol<NSObject>
@property AudioStreamerErrorCode errorCode;
@property (nonatomic, readonly) AudioStreamerState state;
@property (readonly) double progress;
@property (readwrite) UInt32 bitRate;
@property (readwrite) double volume;
@property (readwrite,assign) id<AudioStreamerDelegate> delegate;
@property (nonatomic,readwrite,assign) NSUInteger bufferSize;

- (void)start;
- (void)stop;
- (void)pause;
- (BOOL)isPlaying;
- (BOOL)isPaused;
- (BOOL)isWaiting;
- (BOOL)isIdle;
@end

@interface AudioStreamer : NSObject<AudioStreamerProtocol,AudioStreamerDelegate>
{
	id<AudioStreamerProtocol> streamer;
	id<AudioStreamerDelegate> delegate;
}

- (id)initWithURL:(NSURL *)aURL;
+ (NSString*)stringForErrorCode:(AudioStreamerErrorCode)code;

@end

#endif
