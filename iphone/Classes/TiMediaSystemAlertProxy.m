/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2018 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIASYSTEMALERT

#import "TiMediaSystemAlertProxy.h"
#import <TitaniumKit/TiBlob.h>
#import <TitaniumKit/TiFile.h>
#import <TitaniumKit/TiUtils.h>

@implementation TiMediaSystemAlertProxy

#pragma mark Proxy Lifecycle

- (id)_initWithPageContext:(id<TiEvaluator>)context
{
  if (self = [super _initWithPageContext:context]) {
    DebugLog(@"[WARN] The iOS-only SystemAlert API has been deprecated and moved to an external module in 8.0.0.");
    DebugLog(@"[WARN] It will be removed from the core in the future, please migrate!");
  }

  return self;
}

- (void)_destroy
{
  AudioServicesDisposeSystemSoundID(sound);
  RELEASE_TO_NIL(url);

  [super _destroy];
}

#pragma mark Public APIs

- (id)url
{
  return [url absoluteString];
}

- (void)setUrl:(id)url_
{
  RELEASE_TO_NIL(url);

  // Handle string url
  if ([url_ isKindOfClass:[NSString class]]) {
    url = [[TiUtils toURL:url_ proxy:self] retain];

    if (![url isFileURL]) {
#ifndef __clang_analyzer__
      // we need to download it and save it off into temp file
      NSData *data = [NSData dataWithContentsOfURL:url];
      NSString *ext = [[[url path] lastPathComponent] pathExtension];
      //ignore this on static analyzer, as commented, it'll be auto-deleted on release
      TiFile *tempFile = [[TiFile createTempFile:ext] retain]; // file auto-deleted on release
      [data writeToFile:[tempFile path] atomically:YES];
      RELEASE_TO_NIL(url);
      url = [[NSURL fileURLWithPath:[tempFile path]] retain];
#endif
    }

    // Handle file blob
  } else if ([url_ isKindOfClass:[TiBlob class]]) {
    TiBlob *blob = (TiBlob *)url_;
    if ([blob type] == TiBlobTypeFile) {
      url = [[NSURL fileURLWithPath:[blob path]] retain];
    }

    // Handle file object
  } else if ([url_ isKindOfClass:[TiFile class]]) {
    url = [[NSURL fileURLWithPath:[(TiFile *)url_ path]] retain];
  }

  // Dispose sound before re-referencing
  AudioServicesDisposeSystemSoundID(sound);
  AudioServicesCreateSystemSoundID((CFURLRef)url, &sound);
}

- (void)play:(id)unused
{
  if (url == nil) {
    NSLog(@"[ERROR] Trying to play a system alert without having specified the `url` property. Skipping playback.");
    return;
  }

  AudioServicesPlayAlertSound(sound);
}

@end
#endif
