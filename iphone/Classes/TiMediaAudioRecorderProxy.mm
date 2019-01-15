/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIAAUDIORECORDER

#import "TiMediaAudioRecorderProxy.h"
#import "TiMediaAudioSession.h"
#import <AudioToolbox/AudioFile.h>
#import <TitaniumKit/TiFile.h>
#import <TitaniumKit/TiFilesystemFileProxy.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiMediaAudioRecorderProxy

@synthesize format, compression;

#pragma mark Internal

- (void)dealloc
{
  RELEASE_TO_NIL(format);
  RELEASE_TO_NIL(compression);
  [super dealloc];
}

- (void)_configure
{
  recorder = nil;
  format = [[NSNumber numberWithUnsignedInt:kAudioFileCAFType] retain];
  compression = [[NSNumber numberWithUnsignedInt:kAudioFormatLinearPCM] retain];
  curState = RecordStopped;
  [super _configure];
}

- (void)_destroy
{
  [self stop:nil];
  RELEASE_TO_NIL(file);
  [super _destroy];
}

#pragma mark Public APIs
- (NSString *)apiName
{
  return @"Ti.Media.AudioRecorder";
}

- (void)start:(id)args
{
  if (![[TiMediaAudioSession sharedSession] canRecord]) {
    [self throwException:@"Improper audio session mode for recording"
               subreason:[[TiMediaAudioSession sharedSession] sessionMode]
                location:CODELOCATION];
    return;
  }

  if (curState != RecordStopped) {
    [self throwException:@"Invalid State" subreason:@"Recorder already initialized. Please stop the current recording." location:CODELOCATION];
    return;
  }
  RELEASE_TO_NIL(file);
  TiThreadPerformOnMainThread(^{
    [self configureRecorder];
    if (recorder != nil) {
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioInterruptionBegin:) name:kTiMediaAudioSessionInterruptionBegin object:[TiMediaAudioSession sharedSession]];
      [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(audioInterruptionEnd:) name:kTiMediaAudioSessionInterruptionEnd object:[TiMediaAudioSession sharedSession]];
      [[TiMediaAudioSession sharedSession] startAudioSession];
      [recorder record];
      curState = RecordStarted;
    }
  },
      YES);
}

- (id)stop:(id)args
{
  if (curState == RecordStopped) {
    return;
  }
  __block TiFilesystemFileProxy *theProxy = nil;
  TiThreadPerformOnMainThread(^{
    if (recorder != nil) {
      [recorder stop];
      [[TiMediaAudioSession sharedSession] stopAudioSession];
    }
    curState = RecordStopped;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
    theProxy = [[[TiFilesystemFileProxy alloc] initWithFile:[file path]] retain];
    RELEASE_TO_NIL_AUTORELEASE(recorder);
  },
      YES);
  return [theProxy autorelease];
}

- (void)pause:(id)args
{
  if (curState != RecordStarted) {
    return;
  }
  TiThreadPerformOnMainThread(^{
    if (recorder != nil) {
      [recorder pause];
      curState = RecordPaused;
    }
  },
      YES);
}

- (void)resume:(id)args
{
  if (curState != RecordPaused) {
    return;
  }
  TiThreadPerformOnMainThread(^{
    if (recorder != nil) {
      [recorder record];
      curState = RecordStarted;
    }
  },
      YES);
}

- (NSNumber *)paused
{
  return NUMBOOL(curState == RecordPaused);
}

- (NSNumber *)recording
{
  return NUMBOOL(curState == RecordStarted);
}

- (NSNumber *)stopped
{
  return NUMBOOL(curState == RecordStopped);
}

#pragma mark Internal methods

- (void)configureRecorder
{
  if (recorder == nil) {
    NSString *extension = nil;
    switch (format.unsignedIntValue) {
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
    default: {
      DebugLog(@"[WARN] Unsupported recording audio format: %d. Defaulting to %d", format.unsignedIntValue, kAudioFileCAFType);
      extension = @"caf";
    }
    }

    file = [[TiUtils createTempFile:extension] retain];

    // Grant temporary permission on the specified file
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSDictionary *attributes = [NSDictionary dictionaryWithObject:NSFileProtectionNone
                                                           forKey:NSFileProtectionKey];
    [fileManager setAttributes:attributes ofItemAtPath:[file path] error:nil];

    NSURL *url = [NSURL URLWithString:[file path]];

    NSMutableDictionary *recordSettings = [[NSMutableDictionary alloc] initWithCapacity:6];
    switch (compression.unsignedIntValue) {
    case kAudioFormatAppleIMA4:
    case kAudioFormatMPEG4AAC:
    case kAudioFormatAppleLossless:
      [recordSettings setObject:compression forKey:AVFormatIDKey];
      [recordSettings setObject:[NSNumber numberWithFloat:44100.0] forKey:AVSampleRateKey];
      [recordSettings setObject:[NSNumber numberWithInt:2] forKey:AVNumberOfChannelsKey];
      [recordSettings setObject:[NSNumber numberWithInt:AVAudioQualityHigh] forKey:AVEncoderAudioQualityKey];
      break;
    case kAudioFormatiLBC:
    case kAudioFormatULaw:
    case kAudioFormatALaw:
      [recordSettings setObject:compression forKey:AVFormatIDKey];
      [recordSettings setObject:[NSNumber numberWithFloat:8000.0] forKey:AVSampleRateKey];
      [recordSettings setObject:[NSNumber numberWithInt:1] forKey:AVNumberOfChannelsKey];
      [recordSettings setObject:[NSNumber numberWithInt:AVAudioQualityMedium] forKey:AVEncoderAudioQualityKey];
      break;
    default:
      [recordSettings setObject:[NSNumber numberWithUnsignedInt:kAudioFormatLinearPCM] forKey:AVFormatIDKey];
      [recordSettings setObject:[NSNumber numberWithFloat:44100.0] forKey:AVSampleRateKey];
      [recordSettings setObject:[NSNumber numberWithInt:2] forKey:AVNumberOfChannelsKey];
      [recordSettings setObject:[NSNumber numberWithInt:AVAudioQualityHigh] forKey:AVEncoderAudioQualityKey];
      [recordSettings setObject:[NSNumber numberWithInt:32] forKey:AVLinearPCMBitDepthKey];
      [recordSettings setObject:[NSNumber numberWithBool:NO] forKey:AVLinearPCMIsBigEndianKey];
      [recordSettings setObject:[NSNumber numberWithBool:NO] forKey:AVLinearPCMIsFloatKey];
      break;
    }

    NSError *error = nil;
    recorder = [[[AVAudioRecorder alloc] initWithURL:url settings:recordSettings error:&error] retain];
    RELEASE_TO_NIL(recordSettings);
    if (error != nil) {
      DebugLog(@"Error initializing Recorder. Error %@", [error description]);
      RELEASE_TO_NIL(recorder);
    } else {
      recorder.delegate = self;
      [recorder prepareToRecord];
    }
  }
}

#pragma mark Delegates

/* audioRecorderDidFinishRecording:successfully: is called when a recording has been finished or stopped. This method is NOT called if the recorder is stopped due to an interruption. */
- (void)audioRecorderDidFinishRecording:(AVAudioRecorder *)recorder successfully:(BOOL)flag
{
  DebugLog(@"Audio Recorder Finished Recording SUCCESS = %d", flag);
}

/* if an error occurs while encoding it will be reported to the delegate. */
- (void)audioRecorderEncodeErrorDidOccur:(AVAudioRecorder *)recorder error:(NSError *)error
{
  DebugLog(@"Audio Recorder Encode Error");
  if (error != nil) {
    DebugLog(@"Error %@", [error description]);
  }
}

- (void)audioInterruptionBegin:(NSNotification *)note
{
  [self pause:nil];
}

- (void)audioInterruptionEnd:(NSNotification *)note
{
  if (curState == RecordPaused) {
    NSDictionary *userInfo = [note userInfo];
    id resumeVal = [userInfo objectForKey:@"resume"];
    if ([TiUtils boolValue:resumeVal]) {
      [self resume:nil];
    } else {
      [self stop:nil];
    }
  }
}

@end

#endif
