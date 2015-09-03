/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2014 by Appcelerator, Inc. All Rights Reserved.
 * Licensed under the terms of the Apache Public License
 * Please see the LICENSE included with this distribution for details.
 */
#ifdef USE_TI_MEDIA


#import <AudioToolbox/AudioToolbox.h>
#import <QuartzCore/QuartzCore.h>

#import "TiMediaVideoPlayerProxy.h"
#import "TiMediaVideoPlayer.h"
#import "TiUtils.h"
#import "Webcolor.h"
#import "TiFile.h"
#import "TiViewProxy.h"
#import "TiBlob.h"
#import "TiMediaAudioSession.h"
#import "TiApp.h"

/** 
 * Design Notes:
 *
 * Normally we'd use a ViewProxy/View pattern here ...but...
 *
 * Before 3.2, the player was always fullscreen and we were just a Proxy
 *
 * In 3.2, the player went to a different API with iPad where you could now
 * embedded the video in any view
 *
 * So, this class reflects the ability to work with both the older release
 * for older devices/apps and the newer style
 *
 */

#define RETURN_FROM_LOAD_PROPERTIES(property,default) \
{\
	id temp = [loadProperties valueForKey:property];\
	return temp ? temp : default; \
}


@interface TiMediaVideoPlayerProxy ()
@property(nonatomic,readwrite,copy)	NSNumber*	movieControlStyle;
@property(nonatomic,readwrite,copy)	NSNumber*	mediaControlStyle;
@end

NSArray* moviePlayerKeys = nil;

@implementation TiMediaVideoPlayerProxy

#pragma mark Internal

-(NSArray*)keySequence
{
	if (moviePlayerKeys == nil) {
		moviePlayerKeys = [[NSArray alloc] initWithObjects:@"url",nil];
	}
	return moviePlayerKeys;
}

-(void)_initWithProperties:(NSDictionary *)properties
{	
	loadProperties = [[NSMutableDictionary alloc] init];
	playerLock = [[NSRecursiveLock alloc] init];
	[super _initWithProperties:properties];
}


-(void)_destroy
{
	if (playing) {
		[movie.player pause];
		movie.player = nil;
	}
	
    TiThreadPerformOnMainThread(^{
        [[NSNotificationCenter defaultCenter] removeObserver:self];
        RELEASE_TO_NIL(movie);
    }, YES);

	RELEASE_TO_NIL(thumbnailCallback);
	RELEASE_TO_NIL(tempFile);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(loadProperties);
	RELEASE_TO_NIL(playerLock);
	[super _destroy];
}

-(NSString*)apiName
{
    return @"Ti.Media.VideoPlayer";
}

-(void)configureNotifications
{
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
	
	[nc addObserver:self selector:@selector(handlePlayerNotification:) 
			   name: MPMoviePlayerPlaybackDidFinishNotification
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleThumbnailImageRequestFinishNotification:) 
			   name:MPMoviePlayerThumbnailImageRequestDidFinishNotification
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleFullscreenEnterNotification:) 
			   name:MPMoviePlayerWillEnterFullscreenNotification
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleFullscreenExitNotification:)
			   name:MPMoviePlayerWillExitFullscreenNotification
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleSourceTypeNotification:) 
			   name:MPMovieSourceTypeAvailableNotification
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleDurationAvailableNotification:) 
			   name:MPMovieDurationAvailableNotification 
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleMediaTypesNotification:) 
			   name:MPMovieMediaTypesAvailableNotification 
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleNaturalSizeAvailableNotification:)
			   name:MPMovieNaturalSizeAvailableNotification 
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleLoadStateChangeNotification:)
			   name:MPMoviePlayerLoadStateDidChangeNotification 
			 object:movie];
	
	[nc addObserver:self selector:@selector(handleNowPlayingNotification:)
			   name:MPMoviePlayerNowPlayingMovieDidChangeNotification 
			 object:movie];
	
	[nc addObserver:self selector:@selector(handlePlaybackStateChangeNotification:)
			   name:MPMoviePlayerPlaybackStateDidChangeNotification 
			 object:movie];
	
		//FIXME: add to replace preload for 3.2
		//MPMediaPlaybackIsPreparedToPlayDidChangeNotification
}

// Used to avoid duplicate code in Brightcove module; makes things easier to maintain.
-(void)configurePlayer
{
	[self configureNotifications];
	[self setValuesForKeysWithDictionary:loadProperties];
	// we need this code below since the player can be realized before loading
	// properties in certain cases and when we go to create it again after setting
	// url we will need to set the new controller to the already created view
	if ([self viewAttached]) {
		TiMediaVideoPlayer *vp = (TiMediaVideoPlayer*)[self view];
		[vp setMovie:movie];
	}
}

-(AVPlayerViewController *)player
{
    return movie;
}

-(AVPlayerViewController *)ensurePlayer
{
	[playerLock lock];
	if (movie == nil)
	{
		if (url==nil)
		{
			[playerLock unlock];
			// this is OK - we just need to delay creation of the 
			// player until after the url is set 
			return nil;
		}
		movie = [[AVPlayerViewController alloc] init];
        movie.player = [AVPlayer playerWithURL:url];
		[self configurePlayer];
	}
	[playerLock unlock];
    return movie;
}

-(TiUIView*)newView
{
	if (reallyAttached) {
		// override since we're constructing ourselfs
		TiUIView *v = [[TiMediaVideoPlayer alloc] initWithPlayer:[self ensurePlayer] proxy:self loaded:loaded];
		return v;
	}
	return nil;
}

-(void)viewWillAttach
{
	reallyAttached = YES;
}

-(void)viewDidDetach
{
	[movie.player pause];
    movie.player = nil;
    [[NSNotificationCenter defaultCenter] removeObserver:self];
	RELEASE_TO_NIL(movie);
	reallyAttached = NO;
}

-(void)windowWillClose
{
    [super windowWillClose];
    [movie.player pause];
    movie.player = nil;
    [(TiMediaVideoPlayer*)self.view setMovie:nil];
}

#pragma mark Public APIs

-(void)setBackgroundView:(id)proxy
{
	if (movie != nil) {
		UIView *background = [movie view];
		for (UIView *view_ in [background subviews])
		{
			[view_ removeFromSuperview];
		}
		[background addSubview:[proxy view]];
	}
	else {
		[loadProperties setValue:proxy forKey:@"backgroundView"];
	}
}

-(NSNumber*)playing
{
	return NUMBOOL(playing);
}

-(void)updateScalingMode:(id)value
{
	[movie setVideoGravity:[TiUtils stringValue:value properties:nil def:AVLayerVideoGravityResize]];
}

-(void)setScalingMode:(NSNumber *)value
{
	if (movie != nil) {
		TiThreadPerformOnMainThread(^{[self updateScalingMode:value];}, NO);
	}
	else {
		[loadProperties setValue:value forKey:@"scalingMode"];
	}
}

-(NSString*)scalingMode
{
    // TODO: Introduce new constants - https://developer.apple.com/library//ios/documentation/AVFoundation/Reference/AVPlayerLayer_Class/index.html#//apple_ref/occ/instp/AVPlayerLayer/videoGravity
	if (movie != nil) {
		return [movie videoGravity];
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"scalingMode", AVLayerVideoGravityResize);
	}
}

-(void)setAllowsAirPlay:(id)value
{
    if (movie != nil) {
        if ([movie.player respondsToSelector:@selector(allowsExternalPlayback:)]) {
            movie.player.allowsExternalPlayback = [TiUtils boolValue:value];
        }
        else {
            NSLog(@"[WARN] Canot use airplay; using pre-4.3 iOS");
        }
    }
    else {
        [loadProperties setValue:value forKey:@"allowsAirPlay"];
    }
}

-(BOOL)allowsAirPlay
{
    if (movie != nil) {
        if ([movie.player respondsToSelector:@selector(allowsExternalPlayback)]) {
            return movie.player.allowsExternalPlayback;
        }
        else {
            return NO;
        }
    }
    else {
        RETURN_FROM_LOAD_PROPERTIES(@"allowsAirPlay", NUMBOOL(NO));
    }
}

// < 3.2 functions for controls - deprecated
-(void)setMovieControlMode:(NSNumber *)value
{
    DEPRECATED_REPLACED(@"Media.VideoPlayer.movieControlMode", @"1.8.0", @"Ti.Media.VideoPlayer.mediaControlStyle");    
	[self setMediaControlStyle:value];
}

-(NSNumber*)movieControlMode
{
    DEPRECATED_REPLACED(@"Media.VideoPlayer.movieControlMode", @"1.8.0", @"Ti.Media.VideoPlayer.mediaControlStyle");        
	return [self mediaControlStyle];
}

-(void)setMovieControlStyle:(NSNumber *)value
{
    DEPRECATED_REPLACED(@"Media.VideoPlayer.movieControlStyle", @"1.8.0", @"Ti.Media.VideoPlayer.mediaControlStyle");
    [self setMediaControlStyle:value];
}

-(NSNumber*)movieControlStyle
{
    DEPRECATED_REPLACED(@"Media.VideoPlayer.movieControlStyle", @"1.8.0", @"Ti.Media.VideoPlayer.mediaControlStyle");
    return [self mediaControlStyle];
}

-(void)setMediaControlStyle:(NSNumber *)value
{
    DEPRECATED_REPLACED_REMOVED(@"Media.VideoPlayer.mediaControlStyle",@"4.2.0",@"4.4.0",@"Media.VideoPlayer.scaleMode");
}

-(NSNumber*)mediaControlStyle
{
    DEPRECATED_REPLACED_REMOVED(@"Media.VideoPlayer.mediaControlStyle",@"4.2.0",@"4.4.0",@"Media.VideoPlayer.scaleMode");
}

-(void)setMedia:(id)media_
{
    
	if ([media_ isKindOfClass:[TiFile class]])
	{
        [self setUrl:[media_ absoluteURL]];
	}
	else if ([media_ isKindOfClass:[TiBlob class]])
	{
		TiBlob *blob = (TiBlob*)media_;
		if ([blob type] == TiBlobTypeFile)
		{
            [self setUrl:[blob nativePath]];
		}
		else if ([blob type] == TiBlobTypeData)
		{
			RELEASE_TO_NIL(tempFile);
			tempFile = [[TiUtils createTempFile:@"mov"] retain];
			[blob writeTo:[tempFile path] error:nil];
            
            [self setUrl:[tempFile path]];
		}
		else
		{
			NSLog(@"[ERROR] Unsupported blob for video player: %@",media_);
		}
	}
	else 
	{
		[self setUrl:media_];
	}
}

// Used to avoid duplicate code in Brightcove module; makes things easier to maintain.
-(void)restart
{
	BOOL restart = playing;
	if (playing)
	{
        [movie.player pause];
        movie.player = nil;
		playing = NO;
	}
	
	if ([self viewAttached]) {
		TiMediaVideoPlayer *video = (TiMediaVideoPlayer*)[self view];
        if (movie != nil) {
            [movie.player seekToTime:kCMTimeZero];
        } else {
            [self ensurePlayer];
        }
		[video frameSizeChanged:[video frame] bounds:[video bounds]];
	}
	
	if (restart)
	{ 
		TiThreadPerformOnMainThread(^{[self play:nil];}, NO);
	}
}

-(void)setUrl:(id)url_
{
	ENSURE_UI_THREAD(setUrl,url_);
    NSURL* newUrl = [TiUtils toURL:url_ proxy:self];
    if ([url isEqual:newUrl]) {
        return;
    }
	RELEASE_TO_NIL(url);
    
	url = [newUrl retain];
    loaded = NO;
	sizeSet = NO;
	if (movie!=nil)
	{
        AVPlayerItem *fooVideoItem = [AVPlayerItem playerItemWithURL: self.url];
        AVQueuePlayer *queuePlayer = [AVQueuePlayer queuePlayerWithItems:[NSArray arrayWithObjects:fooVideoItem,nil]];
        
        [queuePlayer play];
        [queuePlayer advanceToNextItem];
	}
	else {
		[self ensurePlayer];
	}

}

-(id)url
{
	return url;
}

-(NSNumber*)autoplay
{	
	if (movie != nil) {
		return NUMBOOL(movie.player.currentItem.playbackLikelyToKeepUp == YES);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"autoplay",NUMBOOL(YES));
	}
}

-(void)setAutoplay:(id)value
{
	if (movie != nil) {
		//[movie.player.currentItem setShouldAutoplay:[TiUtils boolValue:value]];
	}
	else {
		[loadProperties setValue:value forKey:@"autoplay"];
	}
}

-(NSNumber*)useApplicationAudioSession
{
    DebugLog(@"[WARN] Deprecated property useApplicationAudioSession; Setting this property has no effect'");
    return NUMBOOL(YES);
}

-(void)setUseApplicationAudioSession:(id)value
{
    DebugLog(@"[WARN] Deprecated property useApplicationAudioSession; Setting this property has no effect'");
}

-(NSNumber *)volume
{
	__block float volume = 1.0;
	TiThreadPerformOnMainThread(^{
        volume = [TiUtils volumeFromObject:[MPMusicPlayerController applicationMusicPlayer] default:1.0];
	}, YES);
	
	return NUMFLOAT(volume);
}

-(void)setVolume:(NSNumber *)newVolume
{
	float volume = [TiUtils floatValue:newVolume def:-1.0];
    volume = MAX(0.0, MIN(volume, 1.0));
	TiThreadPerformOnMainThread(^{
        [TiUtils setVolume:volume onObject:[MPMusicPlayerController applicationMusicPlayer]];
	}, YES);
}

-(void)cancelAllThumbnailImageRequests:(id)value
{
    DEPRECATED_REMOVED(@"Media.VideoPlayer.cancelAllThumbnailImageRequests", @"5.1.0", "Not available any more.")

//	TiThreadPerformOnMainThread(^{[movie.player cancelAllThumbnailImageRequests];}, NO);
}

-(void)requestThumbnailImagesAtTimes:(id)args
{

    DEPRECATED_REMOVED(@"Media.VideoPlayer.requestThumbnailImagesAtTimes", @"5.1.0", "Not available any more.")

    /*ENSURE_ARG_COUNT(args, 3);
    
    ENSURE_TYPE([args objectAtIndex:0], NSArray);
    ENSURE_TYPE([args objectAtIndex:1], NSNumber);
    ENSURE_TYPE([args objectAtIndex:2],KrollCallback);
    
    NSArray* array = [args objectAtIndex:0];
    if ([array count] > 0) {
        NSNumber* option = [args objectAtIndex:1];
        TiThreadPerformOnMainThread(^{
            [movie cancelAllThumbnailImageRequests];
            RELEASE_TO_NIL(thumbnailCallback);
            callbackRequestCount = [array count];
            thumbnailCallback = [[args objectAtIndex:2] retain];
            [movie requestThumbnailImagesAtTimes:array timeOption:[option intValue]];
        }, NO);
    }*/
}

-(TiBlob*)thumbnailImageAtTime:(id)args
{
    DEPRECATED_REPLACED_REMOVED(@"Media.VideoPlayer.thumbnailImageAtTime",@"3.4.2",@"3.6.0",@"Media.VideoPlayer.requestThumbnailImagesAtTimes")
    return nil;
}

-(void)setBackgroundColor:(id)color
{
	[self replaceValue:color forKey:@"backgroundColor" notification:NO];
	
	RELEASE_TO_NIL(backgroundColor);
	backgroundColor = [[TiUtils colorValue:color] retain];
	
	if (movie != nil) {
        TiThreadPerformOnMainThread(^{[movie.view setBackgroundColor:[backgroundColor _color]];}, NO);
		return;
	}
	else {
		[loadProperties setValue:color forKey:@"backgroundColor"];
	}
}

-(NSNumber*)playableDuration
{
	if (movie != nil && [movie.player.currentItem.asset isPlayable] == YES) {
        return NUMINT(CMTimeGetSeconds(movie.player.currentItem.asset.duration));
	}
	else {
		return NUMINT(0);
	}
}

-(NSNumber*)duration
{
	if (movie != nil) {
        return NUMFLOAT(CMTimeGetSeconds(movie.player.currentItem.asset.duration));
	}
	else {
		return NUMFLOAT(0);
	}
}

-(NSNumber*)currentPlaybackTime
{
	if (movie != nil) {
		return NUMFLOAT(CMTimeGetSeconds(movie.player.currentItem.currentTime));
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"currentPlaybackTime", NUMINT(0));
	}
}

-(void)setCurrentPlaybackTime:(id)time
{
	if (movie != nil) {
        [movie.player.currentItem seekToTime: CMTimeMake([TiUtils doubleValue:time], 1000)];
	}
	else {
		[loadProperties setValue:time forKey:@"currentPlaybackTime"];
	}
}

-(NSNumber*)endPlaybackTime
{
	if (movie != nil) {
        NSTimeInterval n = CMTimeGetSeconds(movie.player.currentItem.asset.duration);
        if (n == -1) {
            n = NAN;
        }
		return NUMDOUBLE(1000.0f * n);
	} else {
		return NUMINT(0);
	}
}

-(NSNumber*)fullscreen
{
	if (movie != nil) {
        CGRect movieBounds = movie.videoBounds;
        CGRect deviceBounds = [[UIScreen mainScreen] bounds];

        return NUMBOOL(movieBounds.size.width == deviceBounds.size.width && movieBounds.size.height == deviceBounds.size.height);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"fullscreen",NUMBOOL(NO));
	}
}

-(NSNumber*)loadState
{
    DEPRECATED_REPLACED(@"Media.VideoPlayer.loadState", @"5.1.0", @"Please use Ti.Media.playbackState");
    return [self playbackState];
}

-(NSString*)mediaTypes
{
    // Available media types: https://developer.apple.com/library/prerelease/ios/documentation/AVFoundation/Reference/AVFoundation_Constants/index.html#//apple_ref/doc/constant_group/Media_Types
    // TODO: Not always use the first asset track
	if (movie != nil) {
		return [movie.player.currentItem.asset.tracks[0] mediaType];
	}
	else {
		return AVMediaTypeVideo;
	}
}

-(NSNumber*)sourceType
{
    DEPRECATED_REMOVED(@"Media.VideoPlayer.sourceType", @"5.1.0", @"5.1.0");
    return NUMINT(-1);
}

-(void)setSourceType:(id)type
{
    DEPRECATED_REMOVED(@"Media.VideoPlayer.sourceType", @"5.1.0", @"5.1.0");
}

-(NSNumber*)playbackState
{
	if (movie.player != nil) {
		return NUMINT(movie.player.status);
	}
    return NUMINT(AVPlayerStatusUnknown);
}

-(void)setRepeatMode:(id)value
{
    DEPRECATED_REMOVED(@"Media.VideoPlayer.repeatMode", @"5.1.0", @"5.1.0");
}

-(NSNumber*)repeatMode
{
    DEPRECATED_REMOVED(@"Media.VideoPlayer.repeatMode", @"5.1.0", @"5.1.0");
    return NUMINT(-1);
}

-(id)naturalSize
{
	if (movie != nil) {
		NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
		CGRect size = [movie videoBounds];
		[dictionary setObject:NUMDOUBLE(size.size.width) forKey:@"width"];
		[dictionary setObject:NUMDOUBLE(size.size.height) forKey:@"height"];
		return dictionary;
	}
	else {
		return [NSDictionary dictionaryWithObjectsAndKeys:
                                NUMDOUBLE(0),@"width",
                                NUMDOUBLE(0),@"height",nil];
	}
}

-(TiColor*)backgroundColor
{
	if (movie != nil) {
		return backgroundColor;
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"backgroundColor",nil);
	}
}

-(void)stop:(id)args
{
    ENSURE_UI_THREAD(stop, args);
	playing = NO;
	[movie.player pause];
    movie.player = nil;
}

-(void)play:(id)args
{
    ENSURE_UI_THREAD(play, args);
	if (playing) {
		return;
	}
	
	if (url == nil)
	{
		[self throwException:TiExceptionInvalidType
				subreason:@"Tried to play movie player without a valid url or media property"
				location:CODELOCATION];
	}
	
	playing = YES;
    AVPlayer *player = [self ensurePlayer].player;
    
    if (seekToZeroBeforePlay == YES)
    {
        seekToZeroBeforePlay = NO;
        [player seekToTime:kCMTimeZero];
    }
    
    [player play];
}

// Synonym for 'play' from the docs
-(void)start:(id)args
{
    [self play:args];
}

-(void)pause:(id)args
{
    ENSURE_UI_THREAD(pause,args)
	if (!playing) {
		return;
	}
	
	if ([movie respondsToSelector:@selector(pause)]) {
		playing = NO;
		[movie performSelector:@selector(pause)];
	}
}

-(void)release:(id)args
{
	ENSURE_UI_THREAD(release,args);
	[self stop:nil];
	[self detachView];
	[self _destroy];
}


-(void)add:(id)viewProxy
{
	ENSURE_SINGLE_ARG(viewProxy,TiViewProxy);
    ENSURE_UI_THREAD(add,viewProxy);
	if (views==nil)
	{
		views = TiCreateNonRetainingArray();
	}
	[views addObject:viewProxy];
	[super add:viewProxy];
}

-(void)remove:(id)viewProxy
{
	ENSURE_SINGLE_ARG(viewProxy,TiViewProxy);
	[views removeObject:viewProxy];
	if ([self viewAttached]) {
		[super remove:viewProxy];
	}
}

#pragma mark Delegate Callbacks

- (void) handlePlayerNotification: (NSNotification *) notification
{
	if ([notification object] != movie) 
	{
		return;
	}
	
	NSString * name = [notification name];
	
	if ([name isEqualToString:MPMoviePlayerPlaybackDidFinishNotification])
	{
		if ([self _hasListeners:@"complete"])
		{
			NSNumber *reason = [[notification userInfo] objectForKey:MPMoviePlayerPlaybackDidFinishReasonUserInfoKey];

			NSString * errorMessage;
			int errorCode;
			if ([reason intValue] == MPMovieFinishReasonPlaybackError)
			{
				errorMessage = @"Video Playback encountered an error";
				errorCode = -1;
			}
			else
			{
				errorMessage = nil;
				errorCode = 0;
			}

			NSMutableDictionary *event;
			if (reason!=nil)
			{
				event = [NSMutableDictionary dictionaryWithObject:reason forKey:@"reason"];
			}
			else
			{
				event = nil;
			}
			[self fireEvent:@"complete" withObject:event errorCode:errorCode message:errorMessage];
		}
		playing = NO;
	}
	else if ([name isEqualToString:MPMoviePlayerScalingModeDidChangeNotification] && [self _hasListeners:@"resize"])
	{
		[self fireEvent:@"resize" withObject:nil];
	}
}

-(void)handleKeyWindowChanged:(NSNotification*)note
{
	if (playing)
	{
		if ([self _hasListeners:@"load"])
		{
			[self fireEvent:@"load" withObject:nil];
		}
	}
}

-(void)handleThumbnailImageRequestFinishNotification:(NSNotification*)note
{
	if (thumbnailCallback!=nil)
	{
		NSDictionary *userinfo = [note userInfo];
		NSError* value = [userinfo objectForKey:MPMoviePlayerThumbnailErrorKey];
		NSMutableDictionary *event = [TiUtils dictionaryWithCode:[value code] message:[TiUtils messageFromError:value]];
		if (value==nil)
		{
			UIImage *image = [userinfo valueForKey:MPMoviePlayerThumbnailImageKey];
			TiBlob *blob = [[[TiBlob alloc] initWithImage:image] autorelease];
			[event setObject:blob forKey:@"image"];
		}
		[event setObject:[userinfo valueForKey:MPMoviePlayerThumbnailTimeKey] forKey:@"time"];
		
		[self _fireEventToListener:@"thumbnail" withObject:event listener:thumbnailCallback thisObject:nil];
        
		if (--callbackRequestCount <= 0) {
			RELEASE_TO_NIL(thumbnailCallback);
		}
	}
}

-(void)resizeRootView
{
    TiThreadPerformOnMainThread(^{
        [[[TiApp app] controller] resizeView];
        [[[TiApp app] controller] repositionSubviews];
    }, NO);
}

/* Called when the player item has played to its end time. */
- (void)playerItemDidReachEnd:(NSNotification *)notification
{
    seekToZeroBeforePlay = YES;
}


-(void)handleFullscreenEnterNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"fullscreen"])
	{
		NSDictionary *userinfo = [note userInfo];
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		[event setObject:[userinfo valueForKey:MPMoviePlayerFullscreenAnimationDurationUserInfoKey] forKey:@"duration"];
		[event setObject:NUMBOOL(YES) forKey:@"entering"];
		[self fireEvent:@"fullscreen" withObject:event];
	}	
    statusBarWasHidden = [[UIApplication sharedApplication] isStatusBarHidden];
}

-(void)handleFullscreenExitNotification:(NSNotification*)note
{
	NSDictionary *userinfo = [note userInfo];
    if ([self _hasListeners:@"fullscreen"])
	{
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		[event setObject:[userinfo valueForKey:MPMoviePlayerFullscreenAnimationDurationUserInfoKey] forKey:@"duration"];
		[event setObject:NUMBOOL(NO) forKey:@"entering"];
		[self fireEvent:@"fullscreen" withObject:event];
	}	
	[[UIApplication sharedApplication] setStatusBarHidden:statusBarWasHidden];
    //Wait untill the movie player animation is over before calculating the size of the movie player frame.
    [self performSelector:@selector(resizeRootView) withObject:nil afterDelay:[TiUtils doubleValue:[userinfo valueForKey:MPMoviePlayerFullscreenAnimationDurationUserInfoKey]]];
}

-(void)handleSourceTypeNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"sourceChange"])
	{	//TODO: Deprecate old event.
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self sourceType] forKey:@"sourceType"];
		[self fireEvent:@"sourceChange" withObject:event];
	}
	if ([self _hasListeners:@"sourcechange"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self sourceType] forKey:@"sourceType"];
		[self fireEvent:@"sourcechange" withObject:event];
	}
}

-(void)handleDurationAvailableNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"durationAvailable"])
	{	//TODO: Deprecate old event.
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self duration] forKey:@"duration"];
		[self fireEvent:@"durationAvailable" withObject:event];
	}
	if ([self _hasListeners:@"durationavailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self duration] forKey:@"duration"];
		[self fireEvent:@"durationavailable" withObject:event];
	}
}

-(void)handleMediaTypesNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"mediaTypesAvailable"])
	{	//TODO: Deprecate old event.
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self mediaTypes] forKey:@"mediaTypes"];
		[self fireEvent:@"mediaTypesAvailable" withObject:event];
	}
	if ([self _hasListeners:@"mediatypesavailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self mediaTypes] forKey:@"mediaTypes"];
		[self fireEvent:@"mediatypesavailable" withObject:event];
	}
}

-(void)handleNaturalSizeAvailableNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"naturalSizeAvailable"])
	{	//TODO: Deprecate old event.
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self naturalSize] forKey:@"naturalSize"];
		[self fireEvent:@"naturalSizeAvailable" withObject:event];
	}
	if ([self _hasListeners:@"naturalsizeavailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self naturalSize] forKey:@"naturalSize"];
		[self fireEvent:@"naturalsizeavailable" withObject:event];
	}
}

-(void)handleLoadStateChangeNotification:(NSNotification*)note
{
	MPMoviePlayerController *player = (MPMoviePlayerController *)note.object;
	
	if (((player.loadState & MPMovieLoadStatePlayable)==MPMovieLoadStatePlayable) || 
		 ((player.loadState & MPMovieLoadStatePlaythroughOK)==MPMovieLoadStatePlaythroughOK)
		&&
		(player.playbackState == MPMoviePlaybackStateStopped||
		player.playbackState == MPMoviePlaybackStatePlaying)) 
	{
		if ([self viewAttached]) {
			TiMediaVideoPlayer *vp = (TiMediaVideoPlayer*)[self view];
			loaded = YES;
			[vp movieLoaded];
			if ((player.loadState & MPMovieLoadStatePlayable)==MPMovieLoadStatePlayable) {
				if ([self _hasListeners:@"load"]) {
					[self fireEvent:@"load" withObject:nil];
				}
			}
		} else {
            loaded = YES;
        }
	}
	if ([self _hasListeners:@"loadstate"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self loadState] forKey:@"loadState"];
		[self fireEvent:@"loadstate" withObject:event];
	}
}

-(void)handleNowPlayingNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"playing"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self url] forKey:@"url"];
		[self fireEvent:@"playing" withObject:event];
	}
}

-(void)handlePlaybackStateChangeNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"playbackState"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self playbackState] forKey:@"playbackState"];
		[self fireEvent:@"playbackState" withObject:event];
	}
	if ([self _hasListeners:@"playbackstate"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self playbackState] forKey:@"playbackState"];
		[self fireEvent:@"playbackstate" withObject:event];
	}
	switch (movie.player.status) {
		case AVPlayerStatusUnknown:
		case AVPlayerStatusFailed:
			playing = NO;
			break;
		case AVPlayerStatusReadyToPlay:
			playing = YES;
			break;
	}
}

@end

#endif
