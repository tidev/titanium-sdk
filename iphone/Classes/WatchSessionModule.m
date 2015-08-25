/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2015 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#if IS_XCODE_7

#import "WatchSessionModule.h"
#import "TiUtils.h"

@implementation WatchSessionModule
#pragma mark Titanium components

-(NSString*)apiName
{
    return @"Ti.WatchSession";
}

-(WCSession*)watchSession
{
    if (watchSession == nil) {
        if ([WCSession isSupported]) {
            watchSession = [WCSession defaultSession];
            watchSession.delegate = self;
            [watchSession activateSession];
        }
        else {
            DebugLog(@"[ERROR] Target does not support watch connectivity");
        }
    }
    return watchSession;
}

-(void)dealloc
{
    if (watchSession != nil) {
        watchSession.delegate = nil;
    }
    [super dealloc];
}

#pragma mark watch session properties
-(NSNumber*)isSupported
{
    return NUMBOOL([WCSession isSupported]);
}

-(NSNumber*)isPaired
{
    if ([WCSession isSupported] == YES) {
        return NUMBOOL([[self watchSession] isPaired]);
    }
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return NUMBOOL(NO);
}

-(NSNumber*)isWatchAppInstalled
{
    if ([WCSession isSupported] == YES) {
        return NUMBOOL([[self watchSession] isWatchAppInstalled]);
    }
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return NUMBOOL(NO);
}

-(NSNumber*)isComplicationEnabled
{
    if ([WCSession isSupported] == YES) {
        return NUMBOOL([[self watchSession] isComplicationEnabled]);
    }
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return NUMBOOL(NO);
}

-(NSNumber*)isReachable
{
    if ([WCSession isSupported] == YES) {
        return NUMBOOL([[self watchSession] isReachable]);
    }
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return NUMBOOL(NO);
}

//copy of most recent app context sent to watch
-(NSDictionary*)recentAppContext
{
    if ([WCSession isSupported] == YES) {
        return [[self watchSession] applicationContext];
    }
    DebugLog(@"[ERROR] Target does not support watch connectivity");
    return nil;
}

#pragma mark watch session methods
-(void)activate:(id)value
{
    [self watchSession];
}

-(void)sendMessage:(id)value
{
    if ([WCSession isSupported] == NO) {
        DebugLog(@"[ERROR] Target does not support watch connectivity");
        return;
    }
    if ([[self watchSession] isPaired] == NO) {
        DebugLog(@"[ERROR] No watch paired");
        return;
    }
    ENSURE_SINGLE_ARG(value, NSDictionary)
    [[self watchSession] sendMessage:value replyHandler:nil errorHandler:nil];
}
//sent to watch so that it can update its state when it wakes
-(void)updateAppContext:(id)value
{
    if ([WCSession isSupported] == NO) {
        DebugLog(@"[ERROR] Target does not support watch connectivity");
        return;
    }
    if ([[self watchSession] isPaired] == NO) {
        DebugLog(@"[ERROR] No watch paired");
        return;
    }
    ENSURE_SINGLE_ARG(value,NSDictionary)
    NSError *error = nil;
    if (![[self watchSession] updateApplicationContext:value error:&error]) {
        [self throwException:[NSString stringWithFormat:@"Unable to update Application Context: %@",[TiUtils messageFromError:error]]
                   subreason:nil
                    location:CODELOCATION];
    }
}

//sent in background
-(void)transferUserInfo:(id)value
{
    if ([WCSession isSupported] == NO) {
        DebugLog(@"[ERROR] Target does not support watch connectivity");
        return;
    }
    if ([[self watchSession] isPaired] == NO) {
        DebugLog(@"[ERROR] No watch paired");
        return;
    }
    ENSURE_SINGLE_ARG(value,NSDictionary)
    
    [[self watchSession] transferUserInfo:value];
}

//sent in background
-(void)transferFile:(id)value
{
    if ([WCSession isSupported] == NO) {
        DebugLog(@"[ERROR] Target does not support watch connectivity");
        return;
    }
    if ([watchSession isPaired] == NO) {
        DebugLog(@"[ERROR] No watch paired");
        return;
    }
    ENSURE_SINGLE_ARG(value,NSDictionary)
    ENSURE_STRING([value objectForKey:@"fileURL"])
    NSURL *fileURL = [TiUtils toURL:[value objectForKey:@"fileURL"] proxy:self];
    NSDictionary *metaData = [value objectForKey:@"metaData"];
    [[self watchSession] transferFile:fileURL metadata:metaData];
}

-(void)transferCurrentComplication:(id)value
{
    if ([WCSession isSupported] == NO) {
        DebugLog(@"[ERROR] Target does not support watch connectivity");
        return;
    }
    if ([[self watchSession] isPaired] == NO) {
        DebugLog(@"[ERROR] No watch paired");
        return;
    }
    if ([[self watchSession] isComplicationEnabled] == NO) {
        DebugLog(@"[ERROR] Complication not enabled");
        return;
    }
    ENSURE_SINGLE_ARG(value,NSDictionary)
    
    [[self watchSession] transferCurrentComplicationUserInfo:value];
}

-(void)cancelAllUserInfoTransfers:(id)value
{
    if ([WCSession isSupported] == NO) {
        DebugLog(@"[ERROR] Target does not support watch connectivity");
        return;
    }
    if ([[self watchSession] isPaired] == NO) {
        DebugLog(@"[ERROR] No watch paired");
        return;
    }

    NSArray *sessions = [[self watchSession] outstandingUserInfoTransfers];
    for (WCSessionUserInfoTransfer *session in sessions) {
        [session cancel];
    }
}

-(void)cancelAllFileTransfers:(id)value
{
    if ([WCSession isSupported] == NO) {
        DebugLog(@"[ERROR] Target does not support watch connectivity");
        return;
    }
    if ([[self watchSession] isPaired] == NO) {
        DebugLog(@"[ERROR] No watch paired");
        return;
    }
    
    NSArray *sessions = [[self watchSession] outstandingFileTransfers];
    for (WCSessionUserInfoTransfer *session in sessions) {
        [session cancel];
    }
}

-(void)cancelAllTransfers:(id)value
{
    [self cancelAllFileTransfers:nil];
    [self cancelAllUserInfoTransfers:nil];
}

#pragma mark watch session delegates
- (void)session:(nonnull WCSession *)session didReceiveMessage:(nonnull NSDictionary<NSString *,id> *)message
{
    if([self _hasListeners:@"watchSessionReceivedMessage"]){
        NSDictionary *dict = [NSDictionary dictionaryWithObject:message forKey:@"message"];
        [self fireEvent:@"watchSessionReceivedMessage" withObject:dict];
    }
}
//these are context updates received right after [watchSession activate]
- (void)session:(nonnull WCSession *)session didReceiveApplicationContext:(nonnull NSDictionary<NSString *,id> *)applicationContext
{
    if([self _hasListeners:@"watchSessionReceivedAppContext"]){
        NSDictionary *dict = [NSDictionary dictionaryWithObject:applicationContext forKey:@"appContext"];
        [self fireEvent:@"watchSessionReceivedAppContext" withObject:dict];
    }
}

-(void)session:(nonnull WCSession *)session didReceiveUserInfo:(nonnull NSDictionary<NSString *,id> *)userInfo
{
    if([self _hasListeners:@"watchSessionReceivedUserInfo"]){
        NSDictionary *dict = [NSDictionary dictionaryWithObject:userInfo forKey:@"userInfo"];
        [self fireEvent:@"watchSessionReceivedUserInfo" withObject:dict];
    }
}

-(void)sessionWatchStateDidChange:(nonnull WCSession *)session
{
    if([self _hasListeners:@"watchStateChanged"]){
        NSDictionary *dict = [NSDictionary
                              dictionaryWithObjectsAndKeys:NUMBOOL([session isPaired]),@"isPaired",
                              NUMBOOL([session isWatchAppInstalled]),@"isWatchAppInstalled",
                              NUMBOOL([session isComplicationEnabled]),@"isComplicationEnabled",
                              nil];
        [self fireEvent:@"watchStateChanged" withObject:dict];
    }
}

-(void)sessionReachabilityDidChange:(nonnull WCSession *)session
{
    if([self _hasListeners:@"watchReachabilityChanged"]){
        NSDictionary *dict = [NSDictionary
                          dictionaryWithObjectsAndKeys:NUMBOOL([session isReachable]),@"isReachable",
                          nil];
        [self fireEvent:@"watchReachabilityChanged" withObject:dict];
    }
}

-(void)session:(WCSession * _Nonnull)session didFinishUserInfoTransfer:(nonnull WCSessionUserInfoTransfer *)userInfoTransfer error:(nullable NSError *)error
{
    if([self _hasListeners:@"watchSessionFinishedUserInfoTransfer"]){
        NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                     [userInfoTransfer userInfo], @"userInfo",
                                     nil];
        if (error) {
            NSDictionary * errorinfo = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO), @"success",
                                        NUMINTEGER([error code]), @"errorCode",
                                        [error localizedDescription], @"message",
                                        nil];
            [dict addEntriesFromDictionary:errorinfo];
        } else {
            NSDictionary * success = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES), @"success",
                                      NUMINT(0), @"errorCode",
                                      @"", @"message",
                                      nil];
            [dict addEntriesFromDictionary:success];
        }
        [self fireEvent:@"watchSessionFinishedUserInfoTransfer" withObject:dict];
    }
}

-(void)session:(nonnull WCSession *)session didReceiveFile:(nonnull WCSessionFile *)file
{
    if([self _hasListeners:@"watchSessionReceivedFile"]){
        NSError *error;
        NSFileManager *fileManager = [NSFileManager defaultManager];
        NSString *destinationFilename = [[file fileURL] lastPathComponent];
        NSURL *destinationURL = [[NSURL fileURLWithPath:NSTemporaryDirectory()] URLByAppendingPathComponent:destinationFilename];
        if ([fileManager fileExistsAtPath:[destinationURL path]]) {
            [fileManager removeItemAtURL:destinationURL error:nil];
        }
        BOOL success = [fileManager copyItemAtURL:[file fileURL] toURL:destinationURL error:&error];
        TiBlob* downloadedData = nil;
        
        NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                     [file metadata], @"metaData",
                                     nil];
        if (success == NO) {
            DebugLog(@"Unable to copy temp file. Error: %@", [error localizedDescription]);
            downloadedData = nil;
            NSDictionary * errorinfo = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO), @"success",
                                        NUMINTEGER([error code]), @"errorCode",
                                        [error localizedDescription], @"message",
                                        downloadedData,@"data",
                                        nil];
            [dict addEntriesFromDictionary:errorinfo];
        }
        else {
            downloadedData = [[[TiBlob alloc] initWithFile:[destinationURL path]] autorelease];
            NSDictionary * success = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES), @"success",
                                      NUMINT(0), @"errorCode",
                                      @"", @"message",
                                      downloadedData,@"data",
                                      nil];
            [dict addEntriesFromDictionary:success];
        }
        [self fireEvent:@"watchSessionReceivedFile" withObject:dict];
    }
}

-(void)session:(nonnull WCSession *)session didFinishFileTransfer:(nonnull WCSessionFileTransfer *)fileTransfer error:(nullable NSError *)error
{
    if([self _hasListeners:@"watchSessionFinishedFileTransfer"]){
        WCSessionFile *file = [fileTransfer file];
        NSMutableDictionary *dict = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                     [file fileURL], @"fileURL",
                                     [file metadata], @"metaData",
                                     nil];
        if (error) {
            NSDictionary * errorinfo = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(NO), @"success",
                                        NUMINTEGER([error code]), @"errorCode",
                                        [error localizedDescription], @"message",
                                        nil];
            [dict addEntriesFromDictionary:errorinfo];
        } else {
            NSDictionary * success = [NSDictionary dictionaryWithObjectsAndKeys:NUMBOOL(YES), @"success",
                                      NUMINT(0), @"errorCode",
                                      @"", @"message",
                                      nil];
            [dict addEntriesFromDictionary:success];
        }
        [self fireEvent:@"watchSessionFinishedFileTransfer" withObject:dict];
    }
}

@end

#endif
