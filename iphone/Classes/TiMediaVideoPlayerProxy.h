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
@protected
	MPMoviePlayerController *movie;
	NSRecursiveLock* playerLock;
	BOOL playing;
@private
	UIView * legacyWindowView;

	NSURL *url;
	TiColor* backgroundColor;
	NSMutableArray *views;
	TiFile *tempFile;
	KrollCallback *thumbnailCallback;
	int callbackRequestCount;
	
	NSMutableDictionary* loadProperties; // Used to set properties when the player is created
	BOOL sizeSet;
	
	// OK, this is ridiculous.  Sometimes (always?) views which are made invisible and removed are relayed.
	// This means their views are recreated.  For movie players, this means the movie is reloaded and plays.
	// We need some internal way whether or not to check if it's OK to create a view - this is it.
	BOOL reallyAttached;
	
    // Need to preserve status bar frame information when entering/exiting fullscreen to properly re-render
    // views when exiting it.
    BOOL statusBarWasHidden;
    
    // Have to track loading in the proxy in addition to the view, in case we load before the view should be rendered
    BOOL loaded;
}

@property(nonatomic,readwrite,assign) id url;
@property(nonatomic,readwrite,assign) TiColor* backgroundColor;
@property(nonatomic,readonly) NSNumber* playing;
@property(nonatomic,copy)	NSNumber *volume;

-(void)add:(id)proxy;
-(void)remove:(id)proxy;

// INTERNAL: Used by subclasses
-(void)configurePlayer;
-(void)restart;
-(void)stop:(id)args;
-(void)play:(id)args;
@end

#endif