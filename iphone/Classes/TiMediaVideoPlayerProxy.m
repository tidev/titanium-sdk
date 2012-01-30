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
	[returnCache setValue:(temp ? temp : default) forKey:@"" #property];\
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
		moviePlayerKeys = [[NSArray alloc] initWithObjects:@"url",@"contentURL",nil];
	}
	return moviePlayerKeys;
}

-(void)_initWithProperties:(NSDictionary *)properties
{	
	loadProperties = [[NSMutableDictionary alloc] init];
	returnCache = [[NSMutableDictionary alloc] init];
	playerLock = [[NSRecursiveLock alloc] init];
	[super _initWithProperties:properties];
}

-(void)_destroy
{
	if (playing) {
		[movie stop];
	}
	
	WARN_IF_BACKGROUND_THREAD;	//NSNotificationCenter is not threadsafe!
	NSNotificationCenter *nc = [NSNotificationCenter defaultCenter];
	[nc removeObserver:self];

	RELEASE_TO_NIL(thumbnailCallback);
	RELEASE_TO_NIL(tempFile);
	RELEASE_TO_NIL(movie);
	RELEASE_TO_NIL(url);
	RELEASE_TO_NIL(loadProperties);
	RELEASE_TO_NIL(returnCache);
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
	
	[nc addObserver:self selector:@selector(handleRotationNotification:)
			   name:UIApplicationDidChangeStatusBarOrientationNotification
			 object:nil];
		
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

-(MPMoviePlayerController*)player
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
		[self configurePlayer];
	}
	[playerLock unlock];
	return movie;
}

-(TiUIView*)newView
{
	if (reallyAttached) {
		// override since we're constructing ourselfs
		TiUIView *v = [[TiMediaVideoPlayer alloc] initWithPlayer:[self player] proxy:self loaded:loaded];
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
	if (playing) {
		[movie stop];
	}
	RELEASE_TO_NIL(movie);
	reallyAttached = NO;
}

#pragma mark Public APIs

-(void)setBackgroundView:(id)proxy
{
	if (movie != nil) {
		UIView *background = [[self player] backgroundView];
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
	if (movie) {
		double ourTime = [TiUtils doubleValue:time];
		if (ourTime > 0 || isnan(ourTime)) { 
            ourTime /= 1000.0f; // convert from milliseconds to seconds
			[[self player] setInitialPlaybackTime:ourTime];
		}
	} else {
		[loadProperties setValue:time forKey:@"initialPlaybackTime"];
	}
}

-(NSNumber*)initialPlaybackTime
{
	if (movie != nil) {
        NSTimeInterval n = [[self player] initialPlaybackTime];
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
	[[self player] setScalingMode:[TiUtils intValue:value def:MPMovieScalingModeNone]];
}

-(void)setScalingMode:(NSNumber *)value
{
	if (movie != nil) {
		[self performSelectorOnMainThread:@selector(updateScalingMode:) withObject:value waitUntilDone:NO];
	}
	else {
		[loadProperties setValue:value forKey:@"scalingMode"];
	}
}

-(NSNumber*)scalingMode
{
	if (movie != nil) {
		return NUMINT([[self player] scalingMode]);
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
    DEPRECATED_REPLACED(@"Ti.Media.VideoPlayer.movieControlMode", @"1.8.0", @"1.9.0", @"Ti.Media.VideoPlayer.mediaControlStyle");    
	[self setMediaControlStyle:value];
}

-(NSNumber*)movieControlMode
{
    DEPRECATED_REPLACED(@"Ti.Media.VideoPlayer.movieControlMode", @"1.8.0", @"1.9.0", @"Ti.Media.VideoPlayer.mediaControlStyle");        
	return [self mediaControlStyle];
}

-(void)setMovieControlStyle:(NSNumber *)value
{
    DEPRECATED_REPLACED(@"Ti.Media.VideoPlayer.movieControlStyle", @"1.8.0", @"1.9.0", @"Ti.Media.VideoPlayer.mediaControlStyle");
    [self setMediaControlStyle:value];
}

-(NSNumber*)movieControlStyle
{
    DEPRECATED_REPLACED(@"Ti.Media.VideoPlayer.movieControlStyle", @"1.8.0", @"1.9.0", @"Ti.Media.VideoPlayer.mediaControlStyle");
    return [self mediaControlStyle];
}

-(void)setMediaControlStyle:(NSNumber *)value
{
	if (movie != nil) {
		dispatch_async(dispatch_get_main_queue(), ^{
			[[self player] setControlStyle:[TiUtils intValue:value def:MPMovieControlStyleDefault]];
		});
	} else {
		[loadProperties setValue:value forKey:@"mediaControlStyle"];
	}
}

-(NSNumber*)mediaControlStyle
{
	return NUMINT([[self player] controlStyle]);
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
			NSLog(@"[ERROR] unsupported blob for video player. %@",media_);
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
	RELEASE_TO_NIL_AUTORELEASE(movie);
	
	if ([self viewAttached]) {
		TiMediaVideoPlayer *video = (TiMediaVideoPlayer*)[self view];
		[video setMovie:[self player]];
		[video frameSizeChanged:[video frame] bounds:[video bounds]];
	}
	
	if (restart)
	{ 
		[self performSelectorOnMainThread:@selector(play:) withObject:nil waitUntilDone:NO];
	}
}

-(void)setUrl:(id)url_
{
	ENSURE_UI_THREAD(setUrl,url_);
	RELEASE_TO_NIL(url);
	url = [[TiUtils toURL:url_ proxy:self] retain];
    loaded = NO;
	
	if (movie!=nil)
	{
		[self restart];
	}
	else {
		[self player];
	}

}

-(void)setContentURL:(id)newUrl
{
	[self setUrl:newUrl];
}

-(id)url
{
	return url;
}

-(id)contentURL
{
	return url;
}

-(NSNumber*)autoplay
{	
	if (movie != nil) {
		return NUMBOOL([[self player] shouldAutoplay]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"autoplay",NUMBOOL(YES));
	}
}

-(void)setAutoplay:(id)value
{
	if (movie != nil) {
		[[self player] setShouldAutoplay:[TiUtils boolValue:value]];
	}
	else {
		[loadProperties setValue:value forKey:@"autoplay"];
	}
}

-(NSNumber*)useApplicationAudioSession
{
	if (movie != nil) {
		return NUMBOOL([[self player] useApplicationAudioSession]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"useApplicationAudioSession",NUMBOOL(YES));
	}
}

-(void)setUseApplicationAudioSession:(id)value
{
	if (movie != nil) {
		[[self player] setUseApplicationAudioSession:[TiUtils boolValue:value]];
	}
	else {
		[loadProperties setValue:value forKey:@"useApplicationAudioSession"];
	}
}

-(void)cancelAllThumbnailImageRequests:(id)value
{
	[[self player] performSelectorOnMainThread:@selector(cancelAllThumbnailImageRequests) withObject:nil waitUntilDone:NO];
}

-(void)requestThumbnailImagesAtTimes:(id)args
{
	ENSURE_UI_THREAD(requestThumbnailImagesAtTimes,args);
	RELEASE_TO_NIL(thumbnailCallback);
	
	NSArray* array = [args objectAtIndex:0];
	NSNumber* option = [args objectAtIndex:1];
	thumbnailCallback = [[args objectAtIndex:2] retain];
	
	[[self player] requestThumbnailImagesAtTimes:array timeOption:[option intValue]];
}

-(void)generateThumbnail:(id)args
{
	NSNumber *time = [args objectAtIndex:0];
	NSNumber *options = [args objectAtIndex:1];
	TiBlob *blob = [args objectAtIndex:2];
	UIImage *image = [[self player] thumbnailImageAtTime:[time doubleValue] timeOption:[options intValue]];
	[blob setImage:image];
}

-(TiBlob*)thumbnailImageAtTime:(id)args
{
	NSMutableArray *array = [NSMutableArray arrayWithArray:args];
	TiBlob *blob = [[[TiBlob alloc] init] autorelease];
	[array addObject:blob];
	[self performSelectorOnMainThread:@selector(generateThumbnail:) withObject:array waitUntilDone:YES];
	return blob;
}

-(void)setBackgroundColor:(id)color
{
	[self replaceValue:color forKey:@"backgroundColor" notification:NO];
	
	RELEASE_TO_NIL(backgroundColor);
	backgroundColor = [[TiUtils colorValue:color] retain];
	
	if (movie != nil) {
		UIView *background = [[self player] backgroundView];
		if (background!=nil)
		{
			[background performSelectorOnMainThread:@selector(setBackgroundColor:) withObject:[backgroundColor _color] waitUntilDone:NO];
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
		return NUMDOUBLE(1000.0f * [[self player] playableDuration]);
	}
	else {
		return NUMINT(0);
	}
}

-(NSNumber*)duration
{
	if (movie != nil) {
		return NUMDOUBLE(1000.0f * [[self player] duration]);
	}
	else {
		return NUMINT(0);
	}
}

-(NSNumber*)currentPlaybackTime
{
	if (movie != nil) {
		return NUMDOUBLE(1000.0f * [[self player] currentPlaybackTime]);
	}
	else {
		return NUMINT(0);
	}
}

-(NSNumber*)endPlaybackTime
{
	if (movie != nil) {
        NSTimeInterval n = [[self player] endPlaybackTime];
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
		[self performSelectorOnMainThread:@selector(fullscreen) withObject:nil waitUntilDone:YES];
		return [returnCache valueForKey:@"fullscreen"];
	}
	
	if (movie != nil) {
		NSNumber* result = NUMBOOL([[self player] isFullscreen]);
		[returnCache setValue:result forKey:@"fullscreen"];
		return result;
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"fullscreen",NUMBOOL(NO));
	}
}

-(NSNumber*)loadState
{
	if (movie != nil) {
		return NUMINT([[self player] loadState]);
	}
	else {
		return NUMINT(MPMovieLoadStateUnknown);
	}
}

-(NSNumber*)mediaTypes
{
	if (movie != nil) {
		return NUMINT([[self player] movieMediaTypes]);
	}
	else {
		return NUMINT(MPMovieMediaTypeMaskNone);
	}
}

-(NSNumber*)sourceType
{
	if (movie != nil) {
		return NUMINT([[self player] movieSourceType]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"sourceType",NUMINT(MPMovieSourceTypeUnknown));
	}
}

-(void)setSourceType:(id)type
{
	ENSURE_SINGLE_ARG(type,NSObject);
	if (movie != nil) {
		[self player].movieSourceType = [TiUtils intValue:type];
	}
	else {
		[loadProperties setValue:type forKey:@"sourceType"];
	}
}

-(NSNumber*)playbackState
{
	if (movie != nil) {
		return NUMINT([[self player] playbackState]);
	}
    return NUMINT(MPMoviePlaybackStateStopped);
}

-(void)setRepeatMode:(id)value
{
	if (movie != nil) {
		[[self player] setRepeatMode:[TiUtils intValue:value]];
	}
	else {
		[loadProperties setValue:value forKey:@"repeatMode"];
	}
}

-(NSNumber*)repeatMode
{
	if (movie != nil) {
		return NUMINT([[self player] repeatMode]);
	}
	else {
		RETURN_FROM_LOAD_PROPERTIES(@"repeatMode",NUMINT(MPMovieRepeatModeNone));
	}
}

-(id)naturalSize
{
	if (movie != nil) {
		NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
		CGSize size = [[self player] naturalSize];
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
	ENSURE_UI_THREAD(setFullscreen,value);
	if (movie != nil) {
		BOOL fs = [TiUtils boolValue:value];
		[[self player] setFullscreen:fs];
	}
	
	if ([value isEqual:[loadProperties valueForKey:@"fullscreen"]])
	{
		//This is to stop mutating loadProperties while configurePlayer.
		return;
	}
	
	// Movie players are picky.  You can't set the fullscreen value until
	// the movie's size has been determined, so we always have to cache the value - just in case
	// it's set before then.
	if (!sizeDetermined || movie == nil) {
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
	RELEASE_TO_NIL_AUTORELEASE(movie);
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
				subreason:@"Tried to play movie player without a valid url, media, or contentURL property"
				location:CODELOCATION];
	}
	
	playing = YES;
	[[self player] play];
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
	
	if ([[self player] respondsToSelector:@selector(pause)]) {
		playing = NO;
		[[self player] performSelector:@selector(pause)];
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
	ENSURE_UI_THREAD(add,viewProxy);
	ENSURE_SINGLE_ARG(viewProxy,TiViewProxy);
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
		// Release memory
		playing = NO;
		RELEASE_TO_NIL_AUTORELEASE(movie);
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

		RELEASE_TO_NIL(thumbnailCallback);
	}
}

-(void)handleRotationNotification:(NSNotification*)note
{
	// Only track if we're fullscreen
	if (movie != nil) {
		hasRotated = [[self player] isFullscreen];
	}
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
	hasRotated = NO;
    statusBarWasHidden = [[UIApplication sharedApplication] isStatusBarHidden];
}

-(void)handleFullscreenExitNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"fullscreen"])
	{
		NSDictionary *userinfo = [note userInfo];
		NSMutableDictionary *event = [NSMutableDictionary dictionary];
		[event setObject:[userinfo valueForKey:MPMoviePlayerFullscreenAnimationDurationUserInfoKey] forKey:@"duration"];
		[event setObject:NUMBOOL(NO) forKey:@"entering"];
		[self fireEvent:@"fullscreen" withObject:event];
	}	
	if (hasRotated) {
        // Because of the way that status bar visibility could be toggled by going in/out of fullscreen mode in video player,
        // (and depends on whether or not DONE is clicked as well) we have to manually calculate and set the root controller's
        // frame based on whether or not the status bar was visible when we entered fullscreen mode.
        [[[TiApp app] controller] resizeViewForStatusBarHidden:statusBarWasHidden];
		[[[TiApp app] controller] repositionSubviews];
	}
	hasRotated = NO;
}

-(void)handleSourceTypeNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"sourceChange"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self sourceType] forKey:@"sourceType"];
		[self fireEvent:@"sourceChange" withObject:event];
	}
}

-(void)handleDurationAvailableNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"durationAvailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self duration] forKey:@"duration"];
		[self fireEvent:@"durationAvailable" withObject:event];
	}
}

-(void)handleMediaTypesNotification:(NSNotification*)note
{
	if ([self _hasListeners:@"mediaTypesAvailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self mediaTypes] forKey:@"mediaTypes"];
		[self fireEvent:@"mediaTypesAvailable" withObject:event];
	}
}

-(void)handleNaturalSizeAvailableNotification:(NSNotification*)note
{
	[self setFullscreen:[loadProperties valueForKey:@"fullscreen"]];
	if ([self _hasListeners:@"naturalSizeAvailable"])
	{
		NSDictionary *event = [NSDictionary dictionaryWithObject:[self naturalSize] forKey:@"naturalSize"];
		[self fireEvent:@"naturalSizeAvailable" withObject:event];
	}
	sizeDetermined = YES;
}

-(void)handleLoadStateChangeNotification:(NSNotification*)note
{
	MPMoviePlayerController *player = [self player];
	
	if (((player.loadState & MPMovieLoadStatePlayable)==MPMovieLoadStatePlayable) || 
		 ((player.loadState & MPMovieLoadStatePlaythroughOK)==MPMovieLoadStatePlaythroughOK)
		&&
		(player.playbackState == MPMoviePlaybackStateStopped||
		player.playbackState == MPMoviePlaybackStatePlaying)) 
	{
		if ([self viewAttached]) {
			TiMediaVideoPlayer *vp = (TiMediaVideoPlayer*)[self view];
			[vp movieLoaded];
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
