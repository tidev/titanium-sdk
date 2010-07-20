/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA

#import <MediaPlayer/MediaPlayer.h>
#import "TiViewProxy.h"
#import "TiColor.h"
#import "TiFile.h"

@interface TiMediaVideoPlayerProxy : TiViewProxy {
@private
	NSURL *url;
	MPMoviePlayerController *movie;
	TiColor* backgroundColor;
	BOOL playing;
	NSMutableArray *views;
	TiFile *tempFile;
	KrollCallback *thumbnailCallback;
	
	NSMutableDictionary* loadProperties; // Used to set properties when the player is created
	NSMutableDictionary* returnCache; // Return values from UI thread functions
	
	NSRecursiveLock* playerLock;
}

@property(nonatomic,readwrite,assign) id url;
@property(nonatomic,readwrite,assign) TiColor* backgroundColor;
@property(nonatomic,readonly) NSNumber* playing;

-(void)add:(id)proxy;
-(void)remove:(id)proxy;
-(void)deliverEventOnBackgroundThread:(NSString*)event withObject:(id)object;


@end

#endif