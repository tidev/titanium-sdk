/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIAVIDEOPLAYER

#import <AVFoundation/AVFoundation.h>
#import <AVKit/AVKit.h>
#import <TitaniumKit/TiUIView.h>

@interface TiMediaVideoPlayer : TiUIView {
  @private
  AVPlayerViewController *controller;
  UIActivityIndicatorView *spinner;

  BOOL loaded;
}

- (id)initWithPlayer:(AVPlayerViewController *)controller proxy:(TiProxy *)proxy loaded:(BOOL)loaded_;
- (void)setMovie:(AVPlayerViewController *)controller;
- (void)movieLoaded;

@end

#endif
