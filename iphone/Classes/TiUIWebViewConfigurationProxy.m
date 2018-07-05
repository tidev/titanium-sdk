/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIWEBVIEW

#import <WebKit/WebKit.h>

#import "TiUIWebViewConfigurationProxy.h"
#import "TiUIWebViewProcessPoolProxy.h"
#import "TiUtils.h"

@implementation TiUIWebViewConfigurationProxy

- (WKWebViewConfiguration *)configuration
{
  if (_configuration == nil) {
    _configuration = [[WKWebViewConfiguration alloc] init];

    id processPool = [self valueForKey:@"processPool"];

    if ([self valueForKey:@"processPool"]) {
      ENSURE_TYPE(processPool, TiUIWebViewProcessPoolProxy);
      [_configuration setProcessPool:[(TiUIWebViewProcessPoolProxy *)processPool pool]];
    }
  }

  return _configuration;
}

- (void)setPreferences:(id)args
{
  WKPreferences *prefs = [WKPreferences new];

  id minimumFontSize = [args valueForKey:@"minimumFontSize"];
  id javaScriptEnabled = [args valueForKey:@"javaScriptEnabled"];
  id javaScriptCanOpenWindowsAutomatically = [args valueForKey:@"javaScriptCanOpenWindowsAutomatically"];

  [prefs setMinimumFontSize:[TiUtils floatValue:minimumFontSize def:0]];
  [prefs setJavaScriptEnabled:[TiUtils boolValue:javaScriptEnabled def:YES]];
  [prefs setJavaScriptCanOpenWindowsAutomatically:[TiUtils boolValue:javaScriptCanOpenWindowsAutomatically def:NO]];

  [[self configuration] setPreferences:prefs];
}

- (void)setSelectionGranularity:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setSelectionGranularity:[TiUtils intValue:value def:WKSelectionGranularityDynamic]];
}

- (void)setMediaTypesRequiringUserActionForPlayback:(id)value
{
  ENSURE_TYPE(value, NSNumber);
  if ([TiUtils isIOSVersionOrGreater:@"10.0"]) {
    [[self configuration] setMediaTypesRequiringUserActionForPlayback:[TiUtils intValue:value def:WKAudiovisualMediaTypeNone]];
  } else {
    DebugLog(@"[ERROR] The \"mediaTypesRequiringUserActionForPlayback\" property is only available on iOS 10 and later.");
  }
}

- (void)setSuppressesIncrementalRendering:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setSuppressesIncrementalRendering:[TiUtils boolValue:value]];
}

- (void)setAllowsInlineMediaPlayback:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setAllowsInlineMediaPlayback:[TiUtils boolValue:value]];
}

- (void)setAllowsAirPlayMediaPlayback:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setAllowsAirPlayForMediaPlayback:[TiUtils boolValue:value]];
}

- (void)setAllowsPictureInPictureMediaPlayback:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setAllowsPictureInPictureMediaPlayback:[TiUtils boolValue:value]];
}

@end

#endif
