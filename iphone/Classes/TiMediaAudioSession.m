/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if defined(USE_TI_MEDIA) || (defined(USE_TI_MEDIAAUDIOPLAYER) || defined(USE_TI_MEDIAVIDEOPLAYER) || defined(USE_TI_MEDIASOUND) || defined(USE_TI_MEDIAAUDIORECORDER))

#import "TiMediaAudioSession.h"
#import <TitaniumKit/TiUtils.h>

#import <AVFoundation/AVFAudio.h>

NSString *const kTiMediaAudioSessionInterruptionBegin = @"TiMediaAudioSessionInterruptionBegin";
NSString *const kTiMediaAudioSessionInterruptionEnd = @"TiMediaAudioSessionInterruptionEnd";
NSString *const kTiMediaAudioSessionRouteChange = @"TiMediaAudioSessionRouteChange";
NSString *const kTiMediaAudioSessionVolumeChange = @"TiMediaAudioSessionVolumeChange";
NSString *const kTiMediaAudioSessionInputChange = @"TiMediaAudioSessionInputChange";

@implementation TiMediaAudioSession

- (void)deactivateSession
{
  [[AVAudioSession sharedInstance] removeObserver:self forKeyPath:@"outputVolume"];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
  [[AVAudioSession sharedInstance] setActive:NO error:nil];
}

- (void)activateSession
{
  NSError *error = nil;

  // TIMOB-19633
  BOOL shouldActivate = ![[AVAudioSession sharedInstance] isOtherAudioPlaying];
  [[AVAudioSession sharedInstance] setActive:shouldActivate error:&error];

  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(routeChangeCallback:) name:AVAudioSessionRouteChangeNotification object:[AVAudioSession sharedInstance]];
  [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(interruptionCallback:) name:AVAudioSessionInterruptionNotification object:[AVAudioSession sharedInstance]];
  [[AVAudioSession sharedInstance] addObserver:self forKeyPath:@"outputVolume" options:NSKeyValueObservingOptionNew context:NULL];

  if (error != nil) {
    DebugLog(@"Could not activate session: %@ (%ld)", [error localizedDescription], [error code]);
  }
}

- (void)routeChangeCallback:(NSNotification *)note
{
  NSDictionary *userInfo = [note userInfo];
  NSMutableDictionary *event = [NSMutableDictionary dictionary];
  NSNumber *reason = [userInfo objectForKey:AVAudioSessionRouteChangeReasonKey];
  switch (reason.unsignedIntValue) {
  case AVAudioSessionRouteChangeReasonUnknown:
    [event setObject:@"unknown" forKey:@"reason"];
    break;
  case AVAudioSessionRouteChangeReasonNewDeviceAvailable:
    [event setObject:@"newdevice_available" forKey:@"reason"];
    break;
  case AVAudioSessionRouteChangeReasonOldDeviceUnavailable:
    [event setObject:@"olddevice_unvailable" forKey:@"reason"];
    break;
  case AVAudioSessionRouteChangeReasonCategoryChange:
    [event setObject:@"category_changed" forKey:@"reason"];
    break;
  case AVAudioSessionRouteChangeReasonOverride:
    [event setObject:@"override" forKey:@"reason"];
    break;
  case AVAudioSessionRouteChangeReasonWakeFromSleep:
    [event setObject:@"wake_from_sleep" forKey:@"reason"];
    break;
  case AVAudioSessionRouteChangeReasonNoSuitableRouteForCategory:
    [event setObject:@"no_route_for_category" forKey:@"reason"];
    break;
  case AVAudioSessionRouteChangeReasonRouteConfigurationChange:
    [event setObject:@"route_config_change" forKey:@"reason"];
    break;
  default:
    [event setObject:@"silence_change" forKey:@"reason"];
    break;
  }

  AVAudioSessionRouteDescription *oldRoute = [userInfo objectForKey:AVAudioSessionRouteChangePreviousRouteKey];
  [event setObject:[self routeDescriptionToDictionary:oldRoute] forKey:@"oldRoute"];
  [event setObject:[self routeDescriptionToDictionary:[[AVAudioSession sharedInstance] currentRoute]] forKey:@"currentRoute"];
  [[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionRouteChange object:self userInfo:event];
}

- (void)interruptionCallback:(NSNotification *)note
{
  NSDictionary *userInfo = [note userInfo];
  NSNumber *interruptionType = [userInfo objectForKey:AVAudioSessionInterruptionTypeKey];
  if (interruptionType.unsignedIntValue == AVAudioSessionInterruptionTypeBegan) {
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionInterruptionBegin object:self];
  } else if (interruptionType.unsignedIntValue == AVAudioSessionInterruptionTypeEnded) {
    NSNumber *interruptionOption = [userInfo objectForKey:AVAudioSessionInterruptionOptionKey];
    BOOL shouldResume = (interruptionOption.unsignedIntValue == AVAudioSessionInterruptionOptionShouldResume);
    [[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionInterruptionEnd object:self userInfo:[NSDictionary dictionaryWithObject:NUMBOOL(shouldResume) forKey:@"resume"]];
  } else {
    DebugLog(@"Unknown interruptionType");
  }
}

- (void)observeValueForKeyPath:(NSString *)keyPath ofObject:(id)object change:(NSDictionary *)change context:(void *)context
{
  if ([keyPath isEqualToString:@"outputVolume"]) {
    id newVal = [change objectForKey:NSKeyValueChangeNewKey];
    if (newVal != nil && [newVal isKindOfClass:[NSNumber class]]) {
      [[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionVolumeChange object:self userInfo:[NSDictionary dictionaryWithObject:newVal forKey:@"volume"]];
    } else {
      [[NSNotificationCenter defaultCenter] postNotificationName:kTiMediaAudioSessionVolumeChange object:self];
    }
  } else {
    DebugLog(@"Unknown keypath %@", keyPath);
  }
}

- (NSDictionary *)routeDescriptionToDictionary:(AVAudioSessionRouteDescription *)theRoute
{
  if (IS_NULL_OR_NIL(theRoute) || ![theRoute isKindOfClass:[AVAudioSessionRouteDescription class]]) {
    return [NSDictionary dictionaryWithObjectsAndKeys:[NSArray array], @"inputs", [NSArray array], @"outputs", nil];
  }

  NSMutableArray *inputArray = [NSMutableArray array];
  NSMutableArray *outputArray = [NSMutableArray array];

  NSArray *inputs = [theRoute inputs];

  if ([inputs count] > 0) {
    for (AVAudioSessionPortDescription *port in inputs) {
      [inputArray addObject:[port portType]];
    }
  }

  NSArray *outputs = [theRoute outputs];

  if ([outputs count] > 0) {
    for (AVAudioSessionPortDescription *port in outputs) {
      [outputArray addObject:[port portType]];
    }
  }

  return [NSDictionary dictionaryWithObjectsAndKeys:inputArray, @"inputs", outputArray, @"outputs", nil];
}

- (void)dealloc
{
  if ([self isActive]) {
    DeveloperLog(@"[WARN] AudioSession being deallocated is still active");
    [self deactivateSession];
  }
  RELEASE_TO_NIL(lock);
  [super dealloc];
}

- (id)init
{
  if (self = [super init]) {
    count = 0;
    lock = [[NSLock alloc] init];
  }
  return self;
}

+ (TiMediaAudioSession *)sharedSession
{
  static TiMediaAudioSession *session = nil;
  @synchronized(self) {
    if (session == nil) {
      session = [[TiMediaAudioSession alloc] init];
    }
  }
  return session;
}

- (BOOL)isActive
{
  BOOL active;
  [lock lock];
  active = count > 0;
  [lock unlock];
  return active;
}

- (BOOL)isAudioPlaying
{
  [self startAudioSession];
  BOOL isOtherAudioPlaying = [[AVAudioSession sharedInstance] isOtherAudioPlaying];
  [self stopAudioSession];
  return isOtherAudioPlaying;
}

- (CGFloat)volume
{
  [self startAudioSession];
  CGFloat volume = [[AVAudioSession sharedInstance] outputVolume];
  [self stopAudioSession];
  return volume;
}

- (BOOL)hasInput
{
  [self startAudioSession];
  BOOL hasInput = [[AVAudioSession sharedInstance] isInputAvailable];
  [self stopAudioSession];
  return hasInput;
}

- (NSDictionary *)currentRoute
{
  [self startAudioSession];
  AVAudioSessionRouteDescription *curRoute = [[[AVAudioSession sharedInstance] currentRoute] retain];
  [self stopAudioSession];
  NSDictionary *result = [self routeDescriptionToDictionary:curRoute];
  [curRoute autorelease];
  return result;
}

- (BOOL)canRecord
{
  NSString *category = [self sessionMode];
  if ([category isEqualToString:AVAudioSessionCategoryRecord] || [category isEqualToString:AVAudioSessionCategoryPlayAndRecord]) {
    return YES;
  }
  return NO;
}

- (BOOL)canPlayback
{
  NSString *category = [self sessionMode];
  if ([category isEqualToString:AVAudioSessionCategoryRecord]) {
    return NO;
  }
  return YES;
}

- (NSString *)sessionMode
{
  NSString *category = nil;
  [self startAudioSession];
  category = [[AVAudioSession sharedInstance] category];
  [self stopAudioSession];
  return [[category copy] autorelease];
}

- (void)setSessionMode:(NSString *)mode
{
  if ([mode isEqualToString:AVAudioSessionCategoryRecord] || [mode isEqualToString:AVAudioSessionCategoryPlayAndRecord]
      || [mode isEqualToString:AVAudioSessionCategoryPlayback] || [mode isEqualToString:AVAudioSessionCategoryAmbient]
      || [mode isEqualToString:AVAudioSessionCategorySoloAmbient]) {

    [self startAudioSession];
    NSError *error = nil;
    [[AVAudioSession sharedInstance] setCategory:mode error:&error];
    [self stopAudioSession];
    if (error != nil) {
      DebugLog(@"Error while setting category");
    }
  } else {
    DebugLog(@"Unsupported sessionMode specified (%@). Ignoring", mode);
  }
}

- (void)setRouteOverride:(UInt32)mode
{
  NSError *error = nil;
  if (mode == AVAudioSessionPortOverrideNone || mode == AVAudioSessionPortOverrideSpeaker) {
    [[AVAudioSession sharedInstance] overrideOutputAudioPort:mode error:&error];
    if (error != nil) {
      DebugLog(@"Error while overriding port %@", [error localizedDescription]);
    }
  } else {
    DebugLog(@"Invalid mode specified for override");
  }
}

- (void)startAudioSession
{
  [lock lock];
  count++;
  if (count == 1) {
    [self activateSession];
  }
  [lock unlock];
}

- (void)stopAudioSession
{
  [lock lock];
  count--;
  if (count == 0) {
    [self deactivateSession];
  }
#ifdef DEBUG
  NSAssert(count >= 0, @"stopAudioSession called too many times");
#endif
  [lock unlock];
}

@end

#endif
