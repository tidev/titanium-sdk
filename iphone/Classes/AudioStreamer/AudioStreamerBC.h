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
#ifdef USE_TI_MEDIA

#ifdef TARGET_OS_IPHONE			
#import <UIKit/UIKit.h>
#else
#import <Cocoa/Cocoa.h>
#endif 			

#import "AudioStreamer.h"
#include <pthread.h>
#include <AudioToolbox/AudioToolbox.h>
								
#define kAQBufSize 2048			// Number of bytes in each audio queue buffer
								// Needs to be big enough to hold a packet of
								// audio from the audio file. If number is too
								// large, queuing of audio before playback starts
								// will take too long.
								// Highly compressed files can use smaller
								// numbers (512 or less). 2048 should hold all
								// but the largest packets. A buffer size error
								// will occur if this number is too small.

@interface AudioStreamerBC : NSObject<AudioStreamerProtocol>
{
	NSURL *url;
	id<AudioStreamerDelegate> delegate;

	//
	// Special threading consideration:
	//	The audioQueue property should only ever be accessed inside a
	//	synchronized(self) block and only *after* checking that ![self isFinishing]
	//
	AudioQueueRef audioQueue;
	AudioFileStreamID audioFileStream;	// the audio file stream parser
	
	AudioQueueBufferRef audioQueueBuffer[kNumAQBufs];		// audio queue buffers
	AudioStreamPacketDescription packetDescs[kAQMaxPacketDescs];	// packet descriptions for enqueuing audio
	unsigned int fillBufferIndex;	// the index of the audioQueueBuffer that is being filled
	size_t bytesFilled;				// how many bytes have been filled
	size_t packetsFilled;			// how many packets have been filled
	bool inuse[kNumAQBufs];			// flags to indicate that a buffer is still in use
	NSInteger buffersUsed;
	
	TI_AudioStreamerState state;
	TI_AudioStreamerStopReason stopReason;
	TI_AudioStreamerErrorCode errorCode;
	OSStatus err;
	
	bool discontinuous;			// flag to indicate middle of the stream
	
	pthread_mutex_t queueBuffersMutex;			// a mutex to protect the inuse flags
	pthread_cond_t queueBufferReadyCondition;	// a condition varable for handling the inuse flags

	CFReadStreamRef stream;
	
	NSUInteger dataOffset;
	UInt32 bitRate;

	bool seekNeeded;
	double seekTime;
	double sampleRate;
	double lastProgress;
}

@property TI_AudioStreamerErrorCode errorCode;
@property (readonly) TI_AudioStreamerState state;
@property (readonly) double progress;
@property (readwrite) UInt32 bitRate;

- (id)initWithURL:(NSURL *)aURL;
- (void)start;
- (void)stop;
- (void)pause;
- (BOOL)isPlaying;
- (BOOL)isPaused;
- (BOOL)isWaiting;
- (BOOL)isIdle;

@end


#endif
