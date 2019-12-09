/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */

#ifdef USE_TI_UIWEBVIEW

#import "TiUIiOSWebViewConfigurationProxy.h"
#import "TiUIiOSWebViewProcessPoolProxy.h"
#import <TitaniumKit/TiUtils.h>

@implementation TiUIiOSWebViewConfigurationProxy

- (WKWebViewConfiguration *)configuration
{
  if (_configuration == nil) {
    _configuration = [[WKWebViewConfiguration alloc] init];

    id processPool = [self valueForKey:@"processPool"];

    if ([self valueForKey:@"processPool"]) {
      ENSURE_TYPE(processPool, TiUIiOSWebViewProcessPoolProxy);
      [_configuration setProcessPool:[(TiUIiOSWebViewProcessPoolProxy *)processPool pool]];
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
  [[self configuration] setMediaTypesRequiringUserActionForPlayback:[TiUtils intValue:value def:WKAudiovisualMediaTypeNone]];
}

- (void)setSuppressesIncrementalRendering:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setSuppressesIncrementalRendering:[TiUtils boolValue:value def:NO]];
}

- (void)setAllowsInlineMediaPlayback:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setAllowsInlineMediaPlayback:[TiUtils boolValue:value]];
}

- (void)setAllowsAirPlayMediaPlayback:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setAllowsAirPlayForMediaPlayback:[TiUtils boolValue:value def:YES]];
}

- (void)setAllowsPictureInPictureMediaPlayback:(id)value
{
  ENSURE_TYPE(value, NSNumber);

  [[self configuration] setAllowsPictureInPictureMediaPlayback:[TiUtils boolValue:value]];
}

@end

#endif
