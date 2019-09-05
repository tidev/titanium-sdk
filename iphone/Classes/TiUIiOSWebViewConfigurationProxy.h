/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2017 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_UIWEBVIEW

#import <TitaniumKit/TiProxy.h>
#import <WebKit/WebKit.h>

@interface TiUIiOSWebViewConfigurationProxy : TiProxy {
  @private
  WKWebViewConfiguration *_configuration;
}

- (WKWebViewConfiguration *)configuration;

- (void)setPreferences:(id)args;

- (void)setSelectionGranularity:(id)value;

- (void)setMediaTypesRequiringUserActionForPlayback:(id)value;

- (void)setSuppressesIncrementalRendering:(id)value;

- (void)setAllowsInlineMediaPlayback:(id)value;

- (void)setAllowsAirPlayMediaPlayback:(id)value;

- (void)setAllowsPictureInPictureMediaPlayback:(id)value;

@end

#endif
