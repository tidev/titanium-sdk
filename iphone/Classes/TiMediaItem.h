/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2016 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import "TiBlob.h"
#import "TiProxy.h"
#import <Foundation/Foundation.h>
#import <MediaPlayer/MediaPlayer.h>

// Not 'officially' a proxy since we don't want users being able to create these; they're
// generated internally only for the media player.
@interface TiMediaItem : TiProxy {
  MPMediaItem *item;
}

#pragma mark Properties

@property (nonatomic, readonly) TiBlob *artwork;

#pragma mark Internal

- (id)_initWithPageContext:(id<TiEvaluator>)context item:(MPMediaItem *)item_;
- (MPMediaItem *)item;

@end

#endif
