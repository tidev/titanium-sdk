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
#endif //TARGET_OS_IPHONE			

#import "AudioStreamer.h"
#include <pthread.h>
#include <AudioToolbox/AudioToolbox.h>
								
@interface AudioStreamerCUR : NSObject<AudioStreamerProtocol>
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
	AudioStreamBasicDescription asbd;	// description of the audio
	NSThread *internalThread;			// the thread where the download and
										// audio file stream parsing occurs
	
	AudioQueueBufferRef audioQueueBuffer[kNumAQBufs];		// audio queue buffers
	AudioStreamPacketDescription packetDescs[kAQMaxPacketDescs];	// packet descriptions for enqueuing audio
	unsigned int fillBufferIndex;	// the index of the audioQueueBuffer that is being filled
	UInt32 packetBufferSize;
	size_t bytesFilled;				// how many bytes have been filled
	size_t packetsFilled;			// how many packets have been filled
	bool inuse[kNumAQBufs];			// flags to indicate that a buffer is still in use
	NSInteger buffersUsed;
	NSDictionary *httpHeaders;
	
	AudioStreamerState state;
	AudioStreamerStopReason stopReason;
	AudioStreamerErrorCode errorCode;
	OSStatus err;
	
	bool discontinuous;			// flag to indicate middle of the stream
	
	pthread_mutex_t queueBuffersMutex;			// a mutex to protect the inuse flags
	pthread_cond_t queueBufferReadyCondition;	// a condition varable for handling the inuse flags

	CFReadStreamRef stream;
	
	UInt32 bitRate;				// Bits per second in the file
	NSInteger dataOffset;		// Offset of the first audio packet in the stream
	NSInteger fileLength;		// Length of the file in bytes
	NSInteger seekByteOffset;	// Seek offset within the file in bytes
	UInt64 audioDataByteCount;  // Used when the actual number of audio bytes in
								// the file is known (more accurate than assuming
								// the whole file is audio)
    NSUInteger bufferSize;      // Dynamic size of the buffer (buffer is default size of 2k if unspec'd)

	UInt64 processedPacketsCount;		// number of packets accumulated for bitrate estimation
	UInt64 processedPacketsSizeTotal;	// byte size of accumulated estimation packets

	double volume;
	double seekTime;
	BOOL seekWasRequested;
	double requestedSeekTime;
	double sampleRate;			// Sample rate of the file (used to compare with
								// samples played by the queue for current playback
								// time)
	double packetDuration;		// sample rate times frames per packet
	double lastProgress;		// last calculated progress point
}

@property AudioStreamerErrorCode errorCode;
@property (nonatomic, readonly) AudioStreamerState state;
@property (readonly) double progress;
@property (readonly) double duration;
@property (readwrite) UInt32 bitRate;
@property (readonly) NSDictionary *httpHeaders;
@property (nonatomic,readwrite,assign) NSUInteger bufferSize;

- (id)initWithURL:(NSURL *)aURL;
- (void)start;
- (void)stop;
- (void)pause;
- (BOOL)isPlaying;
- (BOOL)isPaused;
- (BOOL)isWaiting;
- (BOOL)isIdle;
- (void)seekToTime:(double)newSeekTime;
- (double)calculatedBitRate;

@end

#endif