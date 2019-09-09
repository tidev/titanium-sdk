/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015-Present by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_WATCHSESSION

#import "WatchSessionModule.h"
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiEvaluator.h>
#import <TitaniumKit/TiUtils.h>

@interface WatchMessageCallback : NSObject {
  id<TiEvaluator> context;
  KrollCallback *callback;
}
- (id)initWithCallback:(KrollCallback *)callback context:(id<TiEvaluator>)context;
@end

@implementation WatchMessageCallback

- (id)initWithCallback:(KrollCallback *)callback_ context:(id<TiEvaluator>)context_
{
#ifndef __clang_analyzer__
  // Ignore analyzer warning here. Delegate will call autorelease onLoad or onError.
  if (self = [super init]) {
    callback = [callback_ retain];
    context = [context_ retain];
  }
  return self;
#endif
}
- (void)dealloc
{
  RELEASE_TO_NIL(callback);
  RELEASE_TO_NIL(context);
  [super dealloc];
}

- (void)replySuccess:(NSDictionary *)replyMessage
{
  NSDictionary *event = [NSDictionary dictionaryWithObjectsAndKeys:
                                          replyMessage, @"message",
                                      NUMBOOL(YES), @"success",
                                      NUMINT(0), @"code", nil];
  [context fireEvent:callback withObject:event remove:NO thisObject:nil];
}

- (void)replyError:(NSError *)error
{
  NSDictionary *event = [TiUtils dictionaryWithCode:[error code] message:[TiUtils messageFromError:error]];
  [context fireEvent:callback withObject:event remove:NO thisObject:nil];
}

@end

@implementation WatchSessionModule
#pragma mark Titanium components

- (NSString *)apiName
{
  return @"Ti.WatchSession";
}

- (WCSession *)watchSession
{
  if (watchSession == nil) {
    if ([WCSession isSupported]) {
      watchSession = [WCSession defaultSession];
      [watchSession setDelegate:self];
      [watchSession activateSession];
    } else {
      DebugLog(@"[ERROR] Target does not support watch connectivity");
    }
  }
  return watchSession;
}

- (void)dealloc
{
  if (watchSession != nil) {
    [watchSession setDelegate:nil];
  }
  [super dealloc];
}

#pragma mark watch session properties
- (NSNumber *)isSupported
{
  return NUMBOOL([WCSession isSupported]);
}

- (NSNumber *)isPaired
{
  if ([WCSession isSupported]) {
    return NUMBOOL([[self watchSession] isPaired]);
  }

  return NUMBOOL(NO);
}

- (NSNumber *)isWatchAppInstalled
{
  if ([WCSession isSupported]) {
    return NUMBOOL([[self watchSession] isWatchAppInstalled]);
  }

  return NUMBOOL(NO);
}

- (NSNumber *)isComplicationEnabled
{
  if ([WCSession isSupported]) {
    return NUMBOOL([[self watchSession] isComplicationEnabled]);
  }

  return NUMBOOL(NO);
}

- (NSNumber *)isReachable
{
  if ([WCSession isSupported]) {
    return NUMBOOL([[self watchSession] isReachable]);
  }

  return NUMBOOL(NO);
}

- (NSNumber *)isActivated
{
  if ([TiUtils isIOSVersionOrGreater:@"9.3"] && [WCSession isSupported]) {
    return NUMBOOL([[self watchSession] activationState] == WCSessionActivationStateActivated);
  }
  return NUMBOOL(NO);
}

- (NSNumber *)hasContentPending
{
  if ([TiUtils isIOSVersionOrGreater:@"10.0"] && [WCSession isSupported]) {
    return NUMBOOL([[self watchSession] hasContentPending]);
  }

  return NUMBOOL(NO);
}

- (NSNumber *)remainingComplicationUserInfoTransfers
{
  if ([TiUtils isIOSVersionOrGreater:@"10.0"] && [WCSession isSupported]) {
    return NUMUINTEGER([[self watchSession] remainingComplicationUserInfoTransfers]);
  }

  return NUMBOOL(0);
}

- (NSNumber *)activationState
{
  if ([TiUtils isIOSVersionOrGreater:@"9.3"] && [WCSession isSupported]) {
    return [NSNumber numberWithInteger:[[self watchSession] activationState]];
  }

  DebugLog(@"[ERROR] Target does not support watch connectivity");
  return nil;
}

//copy of most recent app context sent to watch
- (NSDictionary *)recentApplicationContext
{
  if ([WCSession isSupported]) {
    return [[self watchSession] applicationContext];
  }
  DebugLog(@"[ERROR] Target does not support watch connectivity");
  return nil;
}

#pragma mark watch session methods
- (void)activateSession:(id)unused
{
  [self watchSession];
}

- (void)sendMessage:(id)args
{
  if (![WCSession isSupported]) {
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return;
  }
  if (![[self watchSession] isPaired]) {
    DebugLog(@"[ERROR] No watch paired");
    return;
  }
  ENSURE_SINGLE_ARG(args, NSDictionary)
  NSDictionary *value = args;
  KrollCallback *replyHandler = [value objectForKey:@"reply"];
  if (replyHandler == nil) {
    [[self watchSession] sendMessage:[value objectForKey:@"message"] replyHandler:nil errorHandler:nil];
    return;
  }
  [[self watchSession] sendMessage:[value objectForKey:@"message"]
      replyHandler:^(NSDictionary<NSString *, id> *_Nonnull replyMessage) {
#ifndef __clang_analyzer__
        // Ignore static analyzer here. Delegate will call autorelease onLoad or onError.
        WatchMessageCallback *wmc = [[WatchMessageCallback alloc] initWithCallback:replyHandler context:[self executionContext]];
        [wmc replySuccess:replyMessage];
      }
      errorHandler:^(NSError *_Nonnull error) {
        WatchMessageCallback *wmc = [[WatchMessageCallback alloc] initWithCallback:replyHandler context:[self executionContext]];
        [wmc replyError:error];
#endif
      }];
}
//sent to watch so that it can update its state when it wakes
- (void)updateApplicationContext:(id)value
{
  if (![WCSession isSupported]) {
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return;
  }
  if (![[self watchSession] isPaired]) {
    DebugLog(@"[ERROR] No watch paired");
    return;
  }
  ENSURE_SINGLE_ARG(value, NSDictionary)
  NSError *error = nil;
  if (![[self watchSession] updateApplicationContext:value error:&error]) {
    [self throwException:[NSString stringWithFormat:@"Unable to update Application Context: %@", [TiUtils messageFromError:error]]
               subreason:nil
                location:CODELOCATION];
  }
}

//sent in background
- (void)transferUserInfo:(id)value
{
  if (![WCSession isSupported]) {
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return;
  }
  if (![[self watchSession] isPaired]) {
    DebugLog(@"[ERROR] No watch paired");
    return;
  }
  ENSURE_SINGLE_ARG(value, NSDictionary)

      [[self watchSession] transferUserInfo:value];
}

//sent in background
- (void)transferFile:(id)value
{
  if (![WCSession isSupported]) {
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return;
  }
  if (![watchSession isPaired]) {
    DebugLog(@"[ERROR] No watch paired");
    return;
  }
  ENSURE_SINGLE_ARG(value, NSDictionary)
  ENSURE_STRING([value objectForKey:@"fileURL"])
  NSURL *fileURL = [TiUtils toURL:[value objectForKey:@"fileURL"] proxy:self];
  NSDictionary *metaData = [value objectForKey:@"metaData"];
  [[self watchSession] transferFile:fileURL metadata:metaData];
}

- (void)transferCurrentComplication:(id)value
{
  if (![WCSession isSupported]) {
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return;
  }
  if (![[self watchSession] isPaired]) {
    DebugLog(@"[ERROR] No watch paired");
    return;
  }
  if (![[self watchSession] isComplicationEnabled]) {
    DebugLog(@"[ERROR] Complication not enabled");
    return;
  }
  ENSURE_SINGLE_ARG(value, NSDictionary)

      [[self watchSession] transferCurrentComplicationUserInfo:value];
}

- (void)cancelAllUserInfoTransfers:(id)value
{
  if (![WCSession isSupported]) {
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return;
  }
  if (![[self watchSession] isPaired]) {
    DebugLog(@"[ERROR] No watch paired");
    return;
  }

  NSArray *sessions = [[self watchSession] outstandingUserInfoTransfers];
  for (WCSessionUserInfoTransfer *session in sessions) {
    [session cancel];
  }
}

- (void)cancelAllFileTransfers:(id)value
{
  if (![WCSession isSupported]) {
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return;
  }
  if (![[self watchSession] isPaired]) {
    DebugLog(@"[ERROR] No watch paired");
    return;
  }

  NSArray *sessions = [[self watchSession] outstandingFileTransfers];
  for (WCSessionUserInfoTransfer *session in sessions) {
    [session cancel];
  }
}

- (void)cancelAllTransfers:(id)value
{
  [self cancelAllFileTransfers:nil];
  [self cancelAllUserInfoTransfers:nil];
}

#pragma mark watch session delegates
- (void)session:(nonnull WCSession *)session didReceiveMessage:(nonnull NSDictionary<NSString *, id> *)message
{
  if ([self _hasListeners:@"receivemessage"]) {
    [self fireEvent:@"receivemessage" withObject:@{ @"message" : message }];
  }
}
//these are context updates received right after [watchSession activateSession]
- (void)session:(nonnull WCSession *)session didReceiveApplicationContext:(nonnull NSDictionary<NSString *, id> *)applicationContext
{
  if ([self _hasListeners:@"receiveapplicationcontext"]) {
    [self fireEvent:@"receiveapplicationcontext" withObject:@{ @"applicationContext" : applicationContext }];
  }
}

- (void)session:(nonnull WCSession *)session didReceiveUserInfo:(nonnull NSDictionary<NSString *, id> *)userInfo
{
  if ([self _hasListeners:@"receiveuserinfo"]) {
    [self fireEvent:@"receiveuserinfo" withObject:@{ @"userInfo" : userInfo }];
  }
}

- (void)sessionWatchStateDidChange:(nonnull WCSession *)session
{
  if ([self _hasListeners:@"watchstatechanged"]) {
    [self fireEvent:@"watchstatechanged" withObject:[self dictionaryFromWatchSession:session]];
  }
}

- (void)sessionReachabilityDidChange:(nonnull WCSession *)session
{
  if ([self _hasListeners:@"reachabilitychanged"]) {
    [self fireEvent:@"reachabilitychanged" withObject:[self dictionaryFromWatchSession:session]];
  }
}

- (void)session:(WCSession *_Nonnull)session didFinishUserInfoTransfer:(nonnull WCSessionUserInfoTransfer *)userInfoTransfer error:(nullable NSError *)error
{
  if ([self _hasListeners:@"finishuserinfotransfer"]) {
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:@{ @"userInfo" : [userInfoTransfer userInfo] }];
    [dict addEntriesFromDictionary:[self dictionaryFromError:error]];

    [self fireEvent:@"finishuserinfotransfer" withObject:dict];
  }
}

- (void)session:(nonnull WCSession *)session didReceiveFile:(nonnull WCSessionFile *)file
{
  if ([self _hasListeners:@"receivefile"]) {
    NSError *error;
    NSFileManager *fileManager = [NSFileManager defaultManager];
    NSString *destinationFilename = [[file fileURL] lastPathComponent];
    NSURL *destinationURL = [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:destinationFilename];
    if ([fileManager fileExistsAtPath:[destinationURL path]]) {
      [fileManager removeItemAtURL:destinationURL error:nil];
    }
    BOOL success = [fileManager copyItemAtURL:[file fileURL] toURL:destinationURL error:&error];
    TiBlob *downloadedData = nil;

    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                                         [file metadata], @"metaData",
                                                     nil];
    if (!success) {
      DebugLog(@"Unable to copy temp file. Error: %@", [error localizedDescription]);
      downloadedData = nil;
      NSDictionary *errorinfo = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO), @"success",
                                              NUMINTEGER([error code]), @"errorCode",
                                              [error localizedDescription], @"message",
                                              downloadedData, @"data",
                                              nil];
      [dict addEntriesFromDictionary:errorinfo];
    } else {
      downloadedData = [[[TiBlob alloc] initWithFile:[destinationURL path]] autorelease];
      NSDictionary *success = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES), @"success",
                                            NUMINT(0), @"errorCode",
                                            @"", @"message",
                                            downloadedData, @"data",
                                            nil];
      [dict addEntriesFromDictionary:success];
    }
    [self fireEvent:@"receivefile" withObject:dict];
  }
}

- (void)session:(nonnull WCSession *)session didFinishFileTransfer:(nonnull WCSessionFileTransfer *)fileTransfer error:(nullable NSError *)error
{
  if ([self _hasListeners:@"finishfiletransfer"]) {
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:@{
      @"fileURL" : [[fileTransfer file] fileURL],
      @"metaData" : [[fileTransfer file] metadata]
    }];

    [dict addEntriesFromDictionary:[self dictionaryFromError:error]];
    [self fireEvent:@"finishfiletransfer" withObject:dict];
  }
}

- (void)sessionDidBecomeInactive:(WCSession *)session
{
  if ([self _hasListeners:@"inactive"]) {
    [self fireEvent:@"inactive" withObject:[self dictionaryFromWatchSession:session]];
  }
}

- (void)sessionDidDeactivate:(WCSession *)session
{
  if ([self _hasListeners:@"deactivate"]) {
    [self fireEvent:@"deactivate" withObject:[self dictionaryFromWatchSession:session]];
  }
}

- (void)session:(WCSession *)session activationDidCompleteWithState:(WCSessionActivationState)activationState error:(NSError *)error
{
  if ([self _hasListeners:@"activationCompleted"]) {
    NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:[self dictionaryFromWatchSession:session]];
    [dict addEntriesFromDictionary:[self dictionaryFromError:error]];

    [self fireEvent:@"activationCompleted" withObject:dict];
  }
}

#pragma mark WatchSession activation states

- (NSNumber *)ACTIVATION_STATE_NOT_ACTIVATED
{
  if (![TiUtils isIOSVersionOrGreater:@"9.3"]) {
    return nil;
  }
  return NUMINTEGER(WCSessionActivationStateNotActivated);
}

- (NSNumber *)ACTIVATION_STATE_INACTIVE
{
  if (![TiUtils isIOSVersionOrGreater:@"9.3"]) {
    return nil;
  }
  return NUMINTEGER(WCSessionActivationStateInactive);
}

- (NSNumber *)ACTIVATION_STATE_ACTIVATED
{
  if (![TiUtils isIOSVersionOrGreater:@"9.3"]) {
    return nil;
  }
  return NUMINTEGER(WCSessionActivationStateActivated);
}

#pragma mark Helper

- (NSDictionary *)dictionaryFromWatchSession:(WCSession *)session
{
  NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithDictionary:@{
    @"isPaired" : [self isPaired],
    @"isReachable" : [self isReachable],
    @"isWatchAppInstalled" : [self isWatchAppInstalled],
    @"isComplicationEnabled" : [self isComplicationEnabled]
  }];

  if ([TiUtils isIOSVersionOrGreater:@"9.3"]) {
    [dict setObject:[self isActivated] forKey:@"isActivated"];
    [dict setObject:[self activationState] forKey:@"activationState"];
  }

  if ([TiUtils isIOSVersionOrGreater:@"10.0"]) {
    [dict setObject:[self hasContentPending] forKey:@"hasContentPending"];
    [dict setObject:[self remainingComplicationUserInfoTransfers] forKey:@"remainingComplicationUserInfoTransfers"];
  }

  return dict;
}

- (NSDictionary *)dictionaryFromError:(NSError *)error
{
  return @{
    @"success" : NUMBOOL(!error),
    @"errorCode" : NUMINTEGER(error ? [error code] : 0),
    @"message" : error ? [error localizedDescription] : @""
  };
}

@end

#endif
