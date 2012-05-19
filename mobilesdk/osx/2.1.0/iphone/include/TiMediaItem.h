/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import <Foundation/Foundation.h>
#import <MediaPlayer/MediaPlayer.h>
#import "TiBlob.h"
#import "TiProxy.h"

// Not 'officially' a proxy since we don't want users being able to create these; they're
// generated internally only for the media player.
@interface TiMediaItem : TiProxy {
	MPMediaItem* item;
}

#pragma mark Properties

/*
 These are all handled by key management but for artwork (it's special!).  Documented here for posterity.
 
@property(nonatomic,readonly) NSNumber* mediaType;
@property(nonatomic,readonly) NSString* title;
@property(nonatomic,readonly) NSString* albumTitle;
@property(nonatomic,readonly) NSString* artist;
@property(nonatomic,readonly) NSString* albumArtist;
@property(nonatomic,readonly) NSString* genre;
@property(nonatomic,readonly) NSString* composer;
@property(nonatomic,readonly) NSNumber* playbackDuration;
@property(nonatomic,readonly) NSNumber* albumTrackNumber;
@property(nonatomic,readonly) NSNumber* albumTrackCount;
@property(nonatomic,readonly) NSNumber* discNumber;
@property(nonatomic,readonly) NSNumber* discCount;
@property(nonatomic,readonly) NSString* lyrics;
@property(nonatomic,readonly) NSNumber* isCompilation;
@property(nonatomic,readonly) NSString* podcastTitle;
@property(nonatomic,readonly) NSNumber* playCount;
@property(nonatomic,readonly) NSNumber* skipCount;
@property(nonatomic,readonly) NSNumber* rating;
 */

@property(nonatomic,readonly) TiBlob* artwork;

#pragma mark Internal

-(id)_initWithPageContext:(id<TiEvaluator>)context item:(MPMediaItem*)item_;
-(MPMediaItem*)item;

@end

#endif
