/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA
#import "TiMediaItem.h"


@implementation TiMediaItem

#pragma mark Internal

-(id)_initWithPageContext:(id<TiEvaluator>)context item:(MPMediaItem*)item_
{
	if (self = [super _initWithPageContext:context]) {
		item = [item_ retain];
		itemProperties = 
			[[NSDictionary alloc] initWithObjectsAndKeys:MPMediaItemPropertyMediaType, @"mediaType",
																MPMediaItemPropertyTitle, @"title",
																MPMediaItemPropertyAlbumTitle, @"albumTitle",
																MPMediaItemPropertyArtist, @"artist",
																MPMediaItemPropertyAlbumArtist, @"albumArtist",
																MPMediaItemPropertyGenre, @"genre",
																MPMediaItemPropertyComposer, @"composer",
																MPMediaItemPropertyPlaybackDuration, @"playbackDuration",
																MPMediaItemPropertyAlbumTrackNumber, @"albumTrackNumber",
																MPMediaItemPropertyAlbumTrackCount, @"albumTrackCount",
																MPMediaItemPropertyDiscNumber, @"discNumber",
																MPMediaItemPropertyDiscCount, @"discCount",
																MPMediaItemPropertyLyrics, @"lyrics",
																MPMediaItemPropertyIsCompilation, @"isCompilation",
																MPMediaItemPropertyPodcastTitle, @"podcastTitle",
																MPMediaItemPropertyPlayCount, @"playCount",
																MPMediaItemPropertySkipCount, @"skipCount",
																MPMediaItemPropertyRating, @"rating",
																nil	];
	}
	return self;
}

-(void)dealloc
{
	RELEASE_TO_NIL(item);
	RELEASE_TO_NIL(itemProperties);
	[super dealloc];
}

-(MPMediaItem*)item
{
	return item;
}

#pragma mark Properties

-(TiBlob*)artwork
{
	MPMediaItemArtwork* artwork = [item valueForProperty:MPMediaItemPropertyArtwork];
	if (artwork != nil) {
		return [[[TiBlob alloc] initWithImage:[artwork imageWithSize:[artwork imageCropRect].size]] autorelease];
	}
	return nil;
}

// This is a sleazy way of getting properties so that I don't have to write 15 functions.
-(id)valueForUndefinedKey:(NSString *)key
{
	id propertyName = [itemProperties objectForKey:key];
	if (propertyName == nil) {
		return [super valueForUndefinedKey:key];
	}
	return [item valueForProperty:propertyName];
}

@end

#endif