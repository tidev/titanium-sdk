/**
 * Appcelerator Titanium Mobile
 * Copyright (c) 2009-2010 by Appcelerator, Inc. All Rights Reserved.
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
		[movie stop];
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

-(void)configureNotifications
{
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
	
	[nc addObserver:self selector:@selector(handlePlayerNotification:) 
			   name:MPMoviePlayerPlaybackDidFinishNotification
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

-(MPMoviePlayerController *)player
{
    return movie;
}

-(MPMoviePlayerController *)ensurePlayer
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
		movie = [[MPMoviePlayerController alloc] initWithContentURL:url];
        [movie prepareToPlay];
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
	[movie stop];
    [[NSNotificationCenter defaultCenter] removeObserver:self];
	RELEASE_TO_NIL(movie);
	reallyAttached = NO;
}

-(void)windowWillClose
{
    [super windowWillClose];
    [movie stop];
    [(TiMediaVideoPlayer*)self.view setMovie:nil];
}

#pragma mark Public APIs

-(void)setBackgroundView:(id)proxy
{
	if (movie != nil) {
		UIView *background = [movie backgroundView];
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

-(void)setInitialPlaybackTime:(id)time
{
    ENSURE_UI_THREAD_1_ARG(time);
	if (movie != nil) {
		double ourTime = [TiUtils doubleValue:time];
		if (ourTime > 0 || isnan(ourTime)) { 
            ourTime /= 1000.0f; // convert from milliseconds to seconds
			[movie setInitialPlaybackTime:ourTime];
		}
	} else {
		[loadProperties setValue:time forKey:@"initialPlaybackTime"];
	}
}

-(NSNumber*)initialPlaybackTime
{
	if (movie != nil) {
        NSTimeInterval n = [movie initialPlaybackTime];
        if (n == -1) {
            n = NAN;
        }
		return NUMDOUBLE(1000.0f * n);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"initialPlaybackTime", NUMINT(0));
	}
}

-(NSNumber*)playing
{
	return NUMBOOL(playing);
}

-(void)updateScalingMode:(id)value
{
	[movie setScalingMode:[TiUtils intValue:value def:MPMovieScalingModeNone]];
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

-(NSNumber*)scalingMode
{
	if (movie != nil) {
		return NUMINT([movie scalingMode]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"scalingMode", NUMINT(MPMovieScalingModeNone));
	}
}

-(void)setAllowsAirPlay:(NSNumber*)value
{
    if (movie != nil) {
        if ([movie respondsToSelector:@selector(setAllowsAirPlay:)]) {
            [movie setAllowsAirPlay:[value boolValue]];
        }
        else {
            NSLog(@"[WARN] Canot use airplay; using pre-4.3 iOS");
        }
    }
    else {
        [loadProperties setValue:value forKey:@"allowsAirPlay"];
    }
}

-(NSNumber*)allowsAirPlay
{
    if (movie != nil) {
        if ([movie respondsToSelector:@selector(allowsAirPlay)]) {
            return NUMBOOL([movie allowsAirPlay]);
        }
        else {
            return NUMBOOL(NO);
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
	if (movie != nil) {
		dispatch_async(dispatch_get_main_queue(), ^{
			[movie setControlStyle:[TiUtils intValue:value def:MPMovieControlStyleDefault]];
		});
	} else {
		[loadProperties setValue:value forKey:@"mediaControlStyle"];
	}
}

-(NSNumber*)mediaControlStyle
{
    if (movie != nil) {
        return NUMINT([movie controlStyle]);
    } else {
        RETURN_FROM_LOAD_PROPERTIES(@"mediaControlStyle",NUMINT(MPMovieControlStyleDefault));
    }
}

-(void)setMedia:(id)media_
{
	if ([media_ isKindOfClass:[TiFile class]])
	{
		[self setUrl:[NSURL fileURLWithPath:[media_ path]]];
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
			[self setUrl:[NSURL fileURLWithPath:[tempFile path]]];
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
		[movie stop];
		playing = NO;
	}
	
	if ([self viewAttached]) {
		TiMediaVideoPlayer *video = (TiMediaVideoPlayer*)[self view];
        if (movie != nil) {
            [movie setContentURL:url];
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
		[self restart];
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
		return NUMBOOL([movie shouldAutoplay]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"autoplay",NUMBOOL(YES));
	}
}

-(void)setAutoplay:(id)value
{
	if (movie != nil) {
		[movie setShouldAutoplay:[TiUtils boolValue:value]];
	}
	else {
		[loadProperties setValue:value forKey:@"autoplay"];
	}
}

-(NSNumber*)useApplicationAudioSession
{
	if (movie != nil) {
		return NUMBOOL([movie useApplicationAudioSession]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"useApplicationAudioSession",NUMBOOL(YES));
	}
}

-(void)setUseApplicationAudioSession:(id)value
{
	if (movie != nil) {
		[movie setUseApplicationAudioSession:[TiUtils boolValue:value]];
	}
	else {
		[loadProperties setValue:value forKey:@"useApplicationAudioSession"];
	}
}

-(NSNumber *)volume
{
	__block double volume = 1.0;
	TiThreadPerformOnMainThread(^{
		volume = (double)[[MPMusicPlayerController applicationMusicPlayer] volume];
	}, YES);
	
	return NUMDOUBLE(volume);
}

-(void)setVolume:(NSNumber *)newVolume
{
	double volume = [TiUtils doubleValue:newVolume def:-1.0];
	ENSURE_VALUE_RANGE(volume, 0.0, 1.0);

	TiThreadPerformOnMainThread(^{
		[[MPMusicPlayerController applicationMusicPlayer] setVolume:volume];
	}, NO);
}

-(void)cancelAllThumbnailImageRequests:(id)value
{
	TiThreadPerformOnMainThread(^{[movie cancelAllThumbnailImageRequests];}, NO);
}

-(void)requestThumbnailImagesAtTimes:(id)args
{
    ENSURE_ARG_COUNT(args, 3);
    
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
    }
}

-(TiBlob*)thumbnailImageAtTime:(id)args
{
	NSNumber *time = [args objectAtIndex:0];
	NSNumber *options = [args objectAtIndex:1];
	TiBlob *blob = [[[TiBlob alloc] init] autorelease];
	TiThreadPerformOnMainThread(^{
		UIImage *image = [movie thumbnailImageAtTime:[time doubleValue] timeOption:[options intValue]];
		[blob setImage:image];
	}, YES);
	return blob;
}

-(void)setBackgroundColor:(id)color
{
	[self replaceValue:color forKey:@"backgroundColor" notification:NO];
	
	RELEASE_TO_NIL(backgroundColor);
	backgroundColor = [[TiUtils colorValue:color] retain];
	
	if (movie != nil) {
		UIView *background = [movie backgroundView];
		if (background!=nil)
		{
			TiThreadPerformOnMainThread(^{[background setBackgroundColor:[backgroundColor _color]];}, NO);
			return;
		}
	}
	else {
		[loadProperties setValue:color forKey:@"backgroundColor"];
	}
}

-(NSNumber*)playableDuration
{
	if (movie != nil) {
		return NUMDOUBLE(1000.0f * [movie playableDuration]);
	}
	else {
		return NUMINT(0);
	}
}

-(NSNumber*)duration
{
	if (movie != nil) {
		return NUMDOUBLE(1000.0f * [movie duration]);
	}
	else {
		return NUMINT(0);
	}
}

-(NSNumber*)currentPlaybackTime
{
	if (movie != nil) {
		return NUMDOUBLE(1000.0f * [movie currentPlaybackTime]);
	}
	else {
		return NUMINT(0);
	}
}

-(NSNumber*)endPlaybackTime
{
	if (movie != nil) {
        NSTimeInterval n = [movie endPlaybackTime];
        if (n == -1) {
            n = NAN;
        }
		return NUMDOUBLE(1000.0f * n);
	} else {
		return NUMINT(0);
	}
}

// Note that if we set the value on the UI thread, we have to return the value from the UI thread -
// otherwise the request for the value may come in before it's set.  The alternative is to r/w lock
// when reading properties - maybe we should do that instead.
-(NSNumber*)fullscreen
{
	if (![NSThread isMainThread]) {
		__block id result;
		TiThreadPerformOnMainThread(^{result = [[self fullscreen] retain];}, YES);
		return [result autorelease];
	}
	
	if (movie != nil) {
		NSNumber* result = NUMBOOL([movie isFullscreen]);
		return result;
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"fullscreen",NUMBOOL(NO));
	}
}

-(NSNumber*)loadState
{
	if (movie != nil) {
		return NUMINT([movie loadState]);
	}
	else {
		return NUMINT(MPMovieLoadStateUnknown);
	}
}

-(NSNumber*)mediaTypes
{
	if (movie != nil) {
		return NUMINT([movie movieMediaTypes]);
	}
	else {
		return NUMINT(MPMovieMediaTypeMaskNone);
	}
}

-(NSNumber*)sourceType
{
	if (movie != nil) {
		return NUMINT([movie movieSourceType]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"sourceType",NUMINT(MPMovieSourceTypeUnknown));
	}
}

-(void)setSourceType:(id)type
{
	ENSURE_SINGLE_ARG(type,NSObject);
	if (movie != nil) {
		movie.movieSourceType = [TiUtils intValue:type];
	}
	else {
		[loadProperties setValue:type forKey:@"sourceType"];
	}
}

-(NSNumber*)playbackState
{
	if (movie != nil) {
		return NUMINT([movie playbackState]);
	}
    return NUMINT(MPMoviePlaybackStateStopped);
}

-(void)setRepeatMode:(id)value
{
	if (movie != nil) {
		[movie setRepeatMode:[TiUtils intValue:value]];
	}
	else {
		[loadProperties setValue:value forKey:@"repeatMode"];
	}
}

-(NSNumber*)repeatMode
{
	if (movie != nil) {
		return NUMINT([movie repeatMode]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"repeatMode",NUMINT(MPMovieRepeatModeNone));
	}
}

-(id)naturalSize
{
	if (movie != nil) {
		NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
		CGSize size = [movie naturalSize];
		[dictionary setObject:NUMDOUBLE(size.width) forKey:@"width"];
		[dictionary setObject:NUMDOUBLE(size.height) forKey:@"height"];
		return dictionary;
	}
	else {
		return [NSDictionary dictionaryWithObjectsAndKeys:NUMDOUBLE(0),@"width",NUMDOUBLE(0),@"height",nil];
	}
}

-(void)setFullscreen:(id)value
{
    if (movie != nil && loaded) {
        BOOL fs = [TiUtils boolValue:value];
        sizeSet = YES;
        TiThreadPerformOnMainThread(^{[movie setFullscreen:fs];}, NO);
    }
	
	if ([value isEqual:[loadProperties valueForKey:@"fullscreen"]])
	{
		//This is to stop mutating loadProperties while configurePlayer.
		return;
	}
	
	// Movie players are picky.  You can't set the fullscreen value until
	// the movie's size has been determined, so we always have to cache the value - just in case
	// it's set before then.
	if (!loaded || movie == nil) {
		[loadProperties setValue:value forKey:@"fullscreen"];
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
	[movie stop];
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
	[[self ensurePlayer] play];
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
			NSMutableDictionary *event = [NSMutableDictionary dictionary];
			NSNumber *reason = [[notification userInfo] objectForKey:MPMoviePlayerPlaybackDidFinishReasonUserInfoKey];
			if (reason!=nil)
			{
				[event setObject:reason forKey:@"reason"];
			}
			[self fireEvent:@"complete" withObject:event];
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
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		NSError* value = [userinfo objectForKey:MPMoviePlayerThumbnailErrorKey];
		if (value!=nil)
		{
			[event setObject:NUMBOOL(NO) forKey:@"success"];
			[event setObject:[value description] forKey:@"error"];
		}
		else 
		{
			[event setObject:NUMBOOL(YES) forKey:@"success"];
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
        [[[TiApp app] controller] resizeViewForStatusBarHidden];
        [[[TiApp app] controller] repositionSubviews];
    }, NO);
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
			if (!sizeSet) {
				[self setFullscreen:[loadProperties valueForKey:@"fullscreen"]];
			}
			if (player.loadState == MPMovieLoadStatePlayable) {
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
	switch ([movie playbackState]) {
		case MPMoviePlaybackStatePaused:
		case MPMoviePlaybackStateStopped:
			playing = NO;
			break;
		case MPMoviePlaybackStatePlaying:
			playing = YES;
			break;
	}
}

@end

#endif
