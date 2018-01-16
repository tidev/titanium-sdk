//
// SCListener 1.0.1
// http://github.com/stephencelis/sc_listener
//
// (c) 2009-* Stephen Celis, <stephen@stephencelis.com>.
// Released under the MIT License.
//

#if defined(USE_TI_MEDIASTARTMICROPHONEMONITOR) || defined(USE_TI_MEDIASTOPMICROPHONEMONITOR) || defined(USE_TI_MEDIAPEAKMICROPHONEPOWER) || defined(USE_TI_MEDIAGETPEAKMICROPHONEPOWER) || defined(USE_TI_MEDIAAVERAGEMICROPHONEPOWER) || defined(USE_TI_MEDIAGETAVERAGEMICROPHONEPOWER)

#import <AudioToolbox/AudioQueue.h>
#import <AudioToolbox/AudioServices.h>
#import <Foundation/Foundation.h>

@interface SCListener : NSObject {
  AudioQueueLevelMeterState *levels;

  AudioQueueRef queue;
  AudioStreamBasicDescription format;
  Float64 sampleRate;
}

+ (SCListener *)sharedListener;

- (void)listen;
- (BOOL)isListening;
- (void)pause;
- (void)stop;

- (Float32)averagePower;
- (Float32)peakPower;
- (AudioQueueLevelMeterState *)levels;

@end

#endif
