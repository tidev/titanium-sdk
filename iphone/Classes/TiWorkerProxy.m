/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#import "TiWorkerProxy.h"

@implementation TiWorkerProxy

#pragma mark Public APIs

- (void)terminate:(id)unused
{
  dispatch_async(_serialQueue, ^{
    if (_bridge) {
      _booted = NO;
      [_bridge enqueueEvent:@"terminated" forProxy:_selfProxy withObject:unused];

      // we need to give time to process the terminated event
      dispatch_after(dispatch_time(DISPATCH_TIME_NOW, 0.5 * NSEC_PER_SEC), dispatch_get_main_queue(), ^{
        [self contextShutdown:nil];
      });

      [self fireEvent:@"terminated"];
    }
  });
}

- (void)postMessage:(id)message
{
  ENSURE_SINGLE_ARG(message, NSObject);

  dispatch_async(_serialQueue, ^{
    if (_booted) {
      [_bridge enqueueEvent:@"message" forProxy:_selfProxy withObject:@{ @"data" : message }];
    } else {
      dispatch_queue_t queue = dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0);
      dispatch_async(queue, ^{
        [self postMessage:message];
      });
    }
  });
}

- (void)setOnerror:(id)onErrorCallback
{
  _onErrorCallback = onErrorCallback;
}

- (void)setOnmessage:(id)onMessageCallback
{
  _onMessageCallback = onMessageCallback;
}

- (void)setOnmessageerror:(id)onMessageErrorCallback
{
  _onMessageErrorCallback = onMessageErrorCallback;
}

#pragma mark Private APIs

- (NSString *)writeWorkerFile:(NSData *)data
{
  NSString *tempDir = NSTemporaryDirectory();
  NSError *error = nil;

  if (![[NSFileManager defaultManager] fileExistsAtPath:tempDir]) {
    [[NSFileManager defaultManager] createDirectoryAtPath:tempDir withIntermediateDirectories:YES attributes:nil error:&error];
    if (error != nil) {
      [_onErrorCallback call:@[ [self dictionaryFromError:kTiWorkerErrorInvalidTemporaryDirectory] ] thisObject:self];
      return nil;
    }
  }

  int timestamp = (int)(time(NULL) & 0xFFFFL);
  NSString *resultPath;
  do {
    resultPath = [tempDir stringByAppendingPathComponent:[NSString stringWithFormat:@"%X", timestamp]];
    timestamp++;
  } while ([[NSFileManager defaultManager] fileExistsAtPath:resultPath]);

  [data writeToFile:resultPath options:NSDataWritingFileProtectionComplete error:&error];

  if (error != nil) {
    [_onErrorCallback call:@[ [self dictionaryFromError:kTiWorkerErrorInvalidTemporaryDirectory] ] thisObject:self];
    return nil;
  }
  return resultPath;
}

- (id)initWithPath:(NSString *)path host:(id)host pageContext:(id<TiEvaluator>)_pageContext
{
  if ((self = [super _initWithPageContext:_pageContext])) {
    if (path == nil || [path isEqualToString:@""]) {
      [_onErrorCallback call:@[ [self dictionaryFromError:kTiWorkerErrorInvalidPath] ] thisObject:self];
      return;
    }

    if (host == nil) {
      [_onErrorCallback call:@[ [self dictionaryFromError:kTiWorkerErrorInvalidHost] ] thisObject:self];
      return;
    }

    if (_pageContext == nil) {
      [_onErrorCallback call:@[ [self dictionaryFromError:kTiWorkerErrorInvalidContext] ] thisObject:self];
      return;
    }

    // The kroll bridge is effectively our JS thread environment
    _bridge = [[KrollBridge alloc] initWithHost:host];
    NSURL *_url = [TiUtils toURL:path proxy:self];

    _serialQueue = dispatch_queue_create("ti.worker", DISPATCH_QUEUE_SERIAL);
    _selfProxy = [[TiWorkerSelfProxy alloc] initWithParent:self url:path pageContext:_bridge];

    NSData *data = [TiUtils loadAppResource:_url];
    if (data == nil) {
      data = [NSData dataWithContentsOfURL:_url];
    }

    NSString *source = nil;
    NSError *error = nil;
    if (data == nil) {
      source = [NSString stringWithContentsOfFile:[_url path] encoding:NSUTF8StringEncoding error:&error];
    } else {
      source = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
    }

    // pull it in to some wrapper code so we can provide a start function and pre-define some variables/functions
    NSString *wrapper = [NSString stringWithFormat:@" \
                          function TiWorkerStart__() { \
                            var worker =  Ti.App.currentWorker; \
                            \
                            function postMessage(message) { \
                              Ti.App.currentWorker.postMessage(message); \
                            } \
                            \
                            function nextTick(t) { \
                              setTimeout(t,0); \
                            } \
                            \
                            %@ \
                          }; \
                        ",
                                  source];

    // we delete file below when booted
    _tempFile = [self writeWorkerFile:[wrapper dataUsingEncoding:NSUTF8StringEncoding]];
    NSURL *tempurl = [NSURL fileURLWithPath:_tempFile isDirectory:NO];

    // start the boot which will run on its own thread automatically
    [_bridge boot:self url:tempurl preload:@{@"App" : @{ @"currentWorker" : _selfProxy }}];
  }
  return self;
}

- (KrollBridge *)_bridge
{
  return _bridge;
}

- (void)booted:(id)bridge
{
  // this callback is called when the thread is up and running
  dispatch_async(_serialQueue, ^{
    _booted = YES;
    [_selfProxy setExecutionContext:_bridge];
    NSError *error = nil;
    [[NSFileManager defaultManager] removeItemAtPath:_tempFile error:&error];
    if (error != nil) {
      DebugLog(@"[DEBUG] Cannot remove temporary worker file");
    }
  });

  // start our JS processing
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
    [_bridge evalJSWithoutResult:@"TiWorkerStart__();"];
  });
}

- (void)fireMessageCallback:(NSDictionary *)messageEvent error:(NSError *)error
{
  if (_onMessageCallback == nil) {
    [self throwException:@"Missing \"onmessage\" callback!" subreason:@"The required \"onmessage\" callback is missing in your worker instance" location:CODELOCATION];
    return;
  }

  if (_onErrorCallback == nil) {
    [self throwException:@"Missing \"onerror\" callback!" subreason:@"The required \"onerror\" callback is missing in your worker instance" location:CODELOCATION];
    return;
  }

  dispatch_async(_serialQueue, ^{
    if (_booted) {
      if (error != nil) {
        [_onMessageErrorCallback call:@[ [self dictionaryFromError:kTiWorkerErrorCannotSerialize] ] thisObject:self];
      } else {
        [_onMessageCallback call:@[ @{ @"data" : messageEvent } ] thisObject:self];
      }
    }
  });
}

- (NSDictionary *)dictionaryFromError:(NSString *)error
{
  return @{
    @"message" : error,
    @"filename" : NULL_IF_NIL(_selfProxy.url),
    @"lineno" : @0 // FIXME: Can we determine the line number in the JavaScript context?
  };
}

@end
